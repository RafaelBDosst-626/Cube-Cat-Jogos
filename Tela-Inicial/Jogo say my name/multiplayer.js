(() => {
  const products = (window.sayMyNameProducts || []).filter((item) => item.difficulty <= 3 && item.image && item.brandImage);
  const gamePanel = document.getElementById("game-panel");
  const gameOver = document.getElementById("game-over");
  const matchIntro = document.getElementById("match-intro");
  const matchPlayers = document.getElementById("match-players");
  const beginButton = document.getElementById("begin-match");
  const missingPlayers = document.getElementById("missing-players");
  const playerCards = document.getElementById("player-cards");
  const turnPrompt = document.getElementById("turn-prompt");
  const roundNumber = document.getElementById("round-number");
  const solvedCount = document.getElementById("solved-count");
  const productPhoto = document.getElementById("product-photo");
  const productVisual = document.getElementById("product-visual");
  const brandPhoto = document.getElementById("brand-photo");
  const brandVisual = document.getElementById("brand-visual");
  const productTile = document.getElementById("product-tile");
  const brandTile = document.getElementById("brand-tile");
  const productAnswer = document.getElementById("product-answer");
  const brandAnswer = document.getElementById("brand-answer");
  const revealButton = document.getElementById("reveal-answer");
  const judgementControls = document.getElementById("judgement-controls");
  const judgePrompt = document.getElementById("judge-prompt");
  const correctButton = document.getElementById("mark-correct");
  const wrongButton = document.getElementById("mark-wrong");
  const nextButton = document.getElementById("next-round");
  const tiebreakModal = document.getElementById("tiebreaker-modal");
  const playerForOne = document.getElementById("player-for-one");
  const playerForTwo = document.getElementById("player-for-two");
  const roulette = document.getElementById("roulette-wheel");
  const rouletteOne = document.getElementById("roulette-one");
  const rouletteTwo = document.getElementById("roulette-two");
  const spinButton = document.getElementById("spin-roulette");
  const rouletteResult = document.getElementById("roulette-result");
  const acceptTiebreakButton = document.getElementById("accept-tiebreak");
  const endTitle = document.getElementById("end-title");
  const endMessage = document.getElementById("end-message");
  const finalScoreboard = document.getElementById("final-scoreboard");
  let playerNames = [];
  try {
    const savedNames = sessionStorage.getItem("sayMyNameMultiplayerPlayers");
    playerNames = JSON.parse(savedNames || new URLSearchParams(window.location.search).get("players") || "[]");
    sessionStorage.removeItem("sayMyNameMultiplayerPlayers");
  } catch {
    try { playerNames = JSON.parse(new URLSearchParams(window.location.search).get("players") || "[]"); }
    catch { playerNames = []; }
  }
  let players = [];
  let queue = [];
  let solvedItems = new Set();
  let currentItem = null;
  let selectedPlayerIndex = null;
  let forcedWinnerIndex = null;
  let firstClaims = new Set();
  let tiebreakIndices = [];
  let rouletteAngle = 0;
  let rouletteTimeout;
  let phase = "setup";
  const playerNeon = ["#ff3b5c", "#31aaff", "#ffe34d", "#39ef91"];

  function shuffledProducts(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function loadImage(image, fallback, src, alt) {
    image.hidden = true;
    fallback.hidden = false;
    image.onload = () => { image.hidden = false; fallback.hidden = true; };
    image.onerror = () => { image.hidden = true; fallback.hidden = false; };
    image.src = src;
    image.alt = alt;
  }

  function updateProgress() {
    solvedCount.textContent = `${solvedItems.size} / ${products.length}`;
    roundNumber.textContent = `${Math.min(solvedItems.size + 1, products.length)} / ${products.length}`;
  }

  function renderPlayers() {
    playerCards.replaceChildren();
    players.forEach((player, index) => {
      const card = document.createElement("article");
      card.className = `mp-player-card player-color-${index + 1}`;
      card.classList.toggle("is-selected", selectedPlayerIndex === index);
      card.classList.toggle("is-out", player.lives <= 0);
      card.classList.toggle("is-claiming", firstClaims.has(index));

      const name = document.createElement("strong");
      name.className = "mp-player-name";
      name.textContent = player.name;
      const points = document.createElement("span");
      points.className = "mp-player-points";
      points.textContent = `${player.points} ${player.points === 1 ? "ponto" : "pontos"}`;
      const lives = document.createElement("span");
      lives.className = "mp-player-lives";
      lives.setAttribute("aria-label", `${player.lives} vidas`);
      for (let heartIndex = 0; heartIndex < 3; heartIndex += 1) {
        const heart = document.createElement("span");
        heart.className = "mp-heart";
        heart.textContent = "♥";
        if (heartIndex >= player.lives) heart.classList.add("is-lost");
        else heart.classList.add(player.lives === 3 ? "alive-cyan" : player.lives === 2 ? "alive-yellow" : "alive-red");
        heart.setAttribute("aria-hidden", "true");
        lives.appendChild(heart);
      }
      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "mp-player-select";
      selectButton.textContent = selectedPlayerIndex === index ? "Selecionado para responder" : "Selecionar resposta";
      selectButton.disabled = player.lives <= 0 || phase !== "choose" || (forcedWinnerIndex !== null && forcedWinnerIndex !== index);
      selectButton.setAttribute("aria-pressed", String(selectedPlayerIndex === index));
      selectButton.addEventListener("click", () => {
        if (phase !== "choose" || player.lives <= 0 || (forcedWinnerIndex !== null && forcedWinnerIndex !== index)) return;
        firstClaims.clear();
        selectedPlayerIndex = index;
        revealButton.disabled = false;
        turnPrompt.textContent = `${player.name} respondeu primeiro. Revele a resposta para conferir.`;
        renderPlayers();
      });

      const claimButton = document.createElement("button");
      claimButton.type = "button";
      claimButton.className = "mp-first-claim";
      claimButton.innerHTML = '<span aria-hidden="true">⚡</span> Eu primeiro';
      claimButton.disabled = player.lives <= 0 || phase !== "choose" || forcedWinnerIndex !== null;
      claimButton.setAttribute("aria-pressed", String(firstClaims.has(index)));
      claimButton.addEventListener("click", () => {
        if (phase !== "choose" || player.lives <= 0) return;
        if (firstClaims.has(index)) firstClaims.delete(index);
        else firstClaims.add(index);
        if (firstClaims.size === 1) {
          selectedPlayerIndex = index;
          revealButton.disabled = false;
          turnPrompt.textContent = `${player.name} marcou “Eu primeiro”. Marque outro para desempatar.`;
        } else if (firstClaims.size === 2) {
          openTiebreak([...firstClaims]);
        } else {
          selectedPlayerIndex = null;
          revealButton.disabled = true;
          turnPrompt.textContent = "Selecione o card de quem respondeu primeiro.";
        }
        renderPlayers();
      });
      card.append(name, points, lives, selectButton, claimButton);
      playerCards.appendChild(card);
    });
  }

  function openTiebreak(indices) {
    tiebreakIndices = [];
    phase = "tiebreak";
    [playerForOne, playerForTwo].forEach((select) => {
      select.replaceChildren(new Option("Escolha um jogador", ""));
      indices.forEach((index) => select.add(new Option(players[index].name, String(index))));
      select.value = "";
    });
    roulette.style.transition = "none";
    roulette.style.transform = "rotate(0deg)";
    rouletteAngle = 0;
    rouletteOne.textContent = "1";
    rouletteTwo.textContent = "2";
    roulette.style.setProperty("--duel-one", "#3ddbe0");
    roulette.style.setProperty("--duel-two", "#3ddbe0");
    rouletteResult.textContent = "";
    spinButton.disabled = true;
    spinButton.hidden = false;
    acceptTiebreakButton.hidden = true;
    tiebreakModal.hidden = false;
    updateTiebreakPicks();
    renderPlayers();
  }

  function updateTiebreakPicks() {
    const one = playerForOne.value;
    const two = playerForTwo.value;
    [...playerForOne.options].forEach((option) => { option.disabled = Boolean(option.value && option.value === two); });
    [...playerForTwo.options].forEach((option) => { option.disabled = Boolean(option.value && option.value === one); });
    if (one !== "") {
      const index = Number(one);
      roulette.style.setProperty("--duel-one", playerNeon[index]);
    } else roulette.style.setProperty("--duel-one", "#3ddbe0");
    if (two !== "") {
      const index = Number(two);
      roulette.style.setProperty("--duel-two", playerNeon[index]);
    } else roulette.style.setProperty("--duel-two", "#3ddbe0");
    spinButton.disabled = one === "" || two === "" || one === two;
    if (one !== "" && two !== "") {
      tiebreakIndices = [Number(one), Number(two)];
      rouletteResult.textContent = `${players[tiebreakIndices[0]].name} fica com o 1; ${players[tiebreakIndices[1]].name} fica com o 2.`;
    }
  }

  function startNextRound() {
    if (solvedItems.size >= products.length) { finishGame("complete"); return; }
    if (players.every((player) => player.lives <= 0)) { finishGame("out-of-lives"); return; }
    currentItem = queue.shift();
    if (!currentItem) { finishGame("complete"); return; }
    selectedPlayerIndex = null;
    forcedWinnerIndex = null;
    firstClaims.clear();
    phase = "choose";
    loadImage(productPhoto, productVisual, currentItem.image, currentItem.imageAlt || "Imagem do produto");
    loadImage(brandPhoto, brandVisual, currentItem.brandImage, `Logo da marca ${currentItem.brand}`);
    productAnswer.textContent = currentItem.product;
    brandAnswer.textContent = currentItem.brand;
    productTile.classList.add("is-covered");
    brandTile.classList.add("is-covered");
    productAnswer.setAttribute("aria-hidden", "true");
    brandAnswer.setAttribute("aria-hidden", "true");
    revealButton.hidden = false;
    revealButton.disabled = true;
    judgementControls.hidden = true;
    nextButton.hidden = true;
    turnPrompt.textContent = "Selecione o card de quem respondeu primeiro.";
    updateProgress();
    renderPlayers();
  }

  function finishGame(reason) {
    phase = "ended";
    gamePanel.hidden = true;
    gameOver.hidden = false;
    if (reason === "complete") {
      endTitle.textContent = "As imagens acabaram!";
      endMessage.textContent = `Todas as ${products.length} imagens foram respondidas corretamente.`;
    } else {
      endTitle.textContent = "Fim da partida";
      endMessage.textContent = "Todos os jogadores perderam as vidas.";
    }
    finalScoreboard.replaceChildren();
    [...players]
      .sort((a, b) => b.points - a.points || b.lives - a.lives)
      .forEach((player) => {
        const row = document.createElement("li");
        row.textContent = `${player.name}: ${player.points} ${player.points === 1 ? "ponto" : "pontos"} · ${player.lives} vidas restantes`;
        finalScoreboard.appendChild(row);
      });
  }

  beginButton.addEventListener("click", () => {
    matchIntro.hidden = true;
    gamePanel.inert = false;
    gamePanel.setAttribute("aria-hidden", "false");
    gamePanel.classList.add("is-started");
    phase = "choose";
    renderPlayers();
  });

  spinButton.addEventListener("click", () => {
    if (phase !== "tiebreak" || tiebreakIndices.length !== 2) return;
    spinButton.disabled = true;
    const winningSide = Math.random() < 0.5 ? 0 : 1;
    const winnerIndex = tiebreakIndices[winningSide];
    const target = winningSide === 0 ? 0 : 180;
    roulette.classList.add("is-spinning");
    rouletteAngle += 360 * 15 + target - (rouletteAngle % 360);
    roulette.style.transition = "transform 1.25s cubic-bezier(.12,.75,.18,1)";
    roulette.style.transform = `rotate(${rouletteAngle}deg)`;
    window.clearTimeout(rouletteTimeout);
    rouletteTimeout = window.setTimeout(() => {
      selectedPlayerIndex = winnerIndex;
      forcedWinnerIndex = winnerIndex;
      phase = "tiebreak-result";
      firstClaims.clear();
      revealButton.disabled = true;
      rouletteResult.textContent = `${players[winnerIndex].name} responde!`;
      acceptTiebreakButton.hidden = false;
      renderPlayers();
      acceptTiebreakButton.focus();
      roulette.classList.remove("is-spinning");
    }, 1250);
  });

  playerForOne.addEventListener("change", updateTiebreakPicks);
  playerForTwo.addEventListener("change", updateTiebreakPicks);

  acceptTiebreakButton.addEventListener("click", () => {
    if (phase !== "tiebreak-result") return;
    tiebreakModal.hidden = true;
    phase = "choose";
    revealButton.disabled = false;
    turnPrompt.textContent = `${players[selectedPlayerIndex].name} venceu o desempate. Revele a resposta.`;
    renderPlayers();
    revealButton.focus();
  });

  revealButton.addEventListener("click", () => {
    if (phase !== "choose" || selectedPlayerIndex === null) return;
    phase = "revealed";
    productTile.classList.remove("is-covered");
    brandTile.classList.remove("is-covered");
    productAnswer.setAttribute("aria-hidden", "false");
    brandAnswer.setAttribute("aria-hidden", "false");
    revealButton.hidden = true;
    judgePrompt.textContent = `A resposta de ${players[selectedPlayerIndex].name} está correta?`;
    judgementControls.hidden = false;
    renderPlayers();
  });

  function judgeAnswer(correct) {
    if (phase !== "revealed" || selectedPlayerIndex === null) return;
    phase = "judged";
    const player = players[selectedPlayerIndex];
    if (correct) {
      player.points += 1;
      solvedItems.add(currentItem);
      turnPrompt.textContent = `${player.name} acertou e ganhou 1 ponto.`;
    } else {
      player.lives -= 1;
      queue.push(currentItem);
      turnPrompt.textContent = `${player.name} errou e perdeu uma vida. O produto volta ao fim da fila.`;
    }
    renderPlayers();
    updateProgress();
    judgementControls.hidden = true;
    if (solvedItems.size >= products.length) { finishGame("complete"); return; }
    if (players.every((entry) => entry.lives <= 0)) { finishGame("out-of-lives"); return; }
    nextButton.hidden = false;
  }

  correctButton.addEventListener("click", () => judgeAnswer(true));
  wrongButton.addEventListener("click", () => judgeAnswer(false));
  nextButton.addEventListener("click", startNextRound);
  if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 4 || playerNames.some((name) => typeof name !== "string" || !name.trim()) || !products.length) {
    gamePanel.hidden = true;
    matchIntro.hidden = true;
    missingPlayers.hidden = false;
    return;
  }
  players = playerNames.map((name) => ({ name: name.trim(), points: 0, lives: 3 }));
  queue = shuffledProducts(products);
  solvedItems = new Set();
  matchPlayers.textContent = `Jogadores: ${players.map((player) => player.name).join(", ")}. Cada pessoa começa com 3 vidas.`;
  phase = "intro";
  startNextRound();
})();
