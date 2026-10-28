(() => {
  const products = (window.sayMyNameProducts || []).filter((item) => item.difficulty <= 3 && item.image && item.brandImage);
  const gamePanel = document.getElementById("game-panel");
  const gameOver = document.getElementById("game-over");
  const matchIntro = document.getElementById("match-intro");
  const matchPlayers = document.getElementById("match-players");
  const beginButton = document.getElementById("begin-match");
  const missingPlayers = document.getElementById("missing-players");
  const playerCards = document.getElementById("player-cards");
  const participantsTitle = document.getElementById("participants-title");
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
  const participantForOneLabel = document.getElementById("participant-for-one-label");
  const participantForTwoLabel = document.getElementById("participant-for-two-label");
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
  let participantMode = "players";
  try {
    const savedNames = sessionStorage.getItem("sayMyNameMultiplayerPlayers");
    participantMode = sessionStorage.getItem("sayMyNameMultiplayerMode") || new URLSearchParams(window.location.search).get("mode") || "players";
    playerNames = JSON.parse(savedNames || new URLSearchParams(window.location.search).get("players") || "[]");
    sessionStorage.removeItem("sayMyNameMultiplayerPlayers");
    sessionStorage.removeItem("sayMyNameMultiplayerMode");
  } catch {
    try {
      const params = new URLSearchParams(window.location.search);
      playerNames = JSON.parse(params.get("players") || "[]");
      participantMode = params.get("mode") || "players";
    }
    catch { playerNames = []; }
  }
  participantMode = participantMode === "teams" ? "teams" : "players";
  const isTeamMode = participantMode === "teams";
  const participant = isTeamMode ? "time" : "jogador";
  const initialTurnPrompt = isTeamMode ? "Selecione o time que respondeu primeiro." : "Selecione o card de quem respondeu primeiro.";
  const formatParticipant = (name) => isTeamMode ? `O time ${name}` : name;
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
  let matchBegun = false;
  const devRules = { startingLives: 3, pointsPerCorrect: 1 };
  const playerNeon = ["#ff3b5c", "#31aaff", "#ffe34d", "#39ef91"];
  const participantColor = (index) => playerNeon[index] || `hsl(${(index * 137.508) % 360} 85% 62%)`;

  playerCards.setAttribute("aria-label", isTeamMode ? "Selecione o time que respondeu primeiro" : "Selecione quem respondeu primeiro");
  participantsTitle.textContent = isTeamMode ? "Times" : "Jogadores";
  participantForOneLabel.firstChild.textContent = isTeamMode ? "Qual time fica com o número 1?" : "Quem fica com o número 1?";
  participantForTwoLabel.firstChild.textContent = isTeamMode ? "Qual time fica com o número 2?" : "Quem fica com o número 2?";

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
      card.style.setProperty("--player-neon", participantColor(index));
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
      lives.setAttribute("aria-label", `${player.lives} ${player.lives === 1 ? "vida" : "vidas"}`);
      for (let heartIndex = 0; heartIndex < devRules.startingLives; heartIndex += 1) {
        const heart = document.createElement("span");
        heart.className = "mp-heart";
        heart.textContent = "♥";
        if (heartIndex >= player.lives) heart.classList.add("is-lost");
        else heart.classList.add(player.lives === devRules.startingLives ? "alive-cyan" : player.lives > Math.ceil(devRules.startingLives / 2) ? "alive-yellow" : "alive-red");
        heart.setAttribute("aria-hidden", "true");
        lives.appendChild(heart);
      }
      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "mp-player-select";
      selectButton.textContent = selectedPlayerIndex === index
        ? (isTeamMode ? "Time selecionado" : "Selecionado para responder")
        : (isTeamMode ? "Selecionar time" : "Selecionar resposta");
      selectButton.disabled = player.lives <= 0 || phase !== "choose" || (forcedWinnerIndex !== null && forcedWinnerIndex !== index);
      selectButton.setAttribute("aria-pressed", String(selectedPlayerIndex === index));
      selectButton.addEventListener("click", () => {
        if (phase !== "choose" || player.lives <= 0 || (forcedWinnerIndex !== null && forcedWinnerIndex !== index)) return;
        firstClaims.clear();
        selectedPlayerIndex = index;
        revealButton.disabled = false;
        turnPrompt.textContent = `${formatParticipant(player.name)} respondeu primeiro. Revele a resposta para conferir.`;
        renderPlayers();
      });

      const claimButton = document.createElement("button");
      claimButton.type = "button";
      claimButton.className = "mp-first-claim";
      claimButton.innerHTML = `<span aria-hidden="true">⚡</span> ${isTeamMode ? "Este time respondeu primeiro" : "Eu primeiro"}`;
      claimButton.disabled = player.lives <= 0 || phase !== "choose" || forcedWinnerIndex !== null;
      claimButton.setAttribute("aria-pressed", String(firstClaims.has(index)));
      claimButton.addEventListener("click", () => {
        if (phase !== "choose" || player.lives <= 0) return;
        if (firstClaims.has(index)) firstClaims.delete(index);
        else firstClaims.add(index);
        if (firstClaims.size === 1) {
          selectedPlayerIndex = index;
          revealButton.disabled = false;
          turnPrompt.textContent = isTeamMode
            ? `${formatParticipant(player.name)} marcou que respondeu primeiro. Se outro time também marcou, faça o desempate.`
            : `${player.name} marcou “Eu primeiro”. Marque outro para desempatar.`;
        } else if (firstClaims.size === 2) {
          openTiebreak([...firstClaims]);
        } else {
          selectedPlayerIndex = null;
          revealButton.disabled = true;
          turnPrompt.textContent = initialTurnPrompt;
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
      select.replaceChildren(new Option(`Escolha ${isTeamMode ? "um time" : "um jogador"}`, ""));
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
      roulette.style.setProperty("--duel-one", participantColor(index));
    } else roulette.style.setProperty("--duel-one", "#3ddbe0");
    if (two !== "") {
      const index = Number(two);
      roulette.style.setProperty("--duel-two", participantColor(index));
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
    loadImage(brandPhoto, brandVisual, currentItem.brandImage, `Logotipo da marca ${currentItem.brand}`);
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
    turnPrompt.textContent = initialTurnPrompt;
    updateProgress();
    renderPlayers();
  }

  function devSetProduct(product) {
    if (!product || !product.image || !product.brandImage || phase === "ended") return false;
    currentItem = product;
    loadImage(productPhoto, productVisual, currentItem.image, currentItem.imageAlt || "Imagem do produto");
    loadImage(brandPhoto, brandVisual, currentItem.brandImage, `Logotipo da marca ${currentItem.brand}`);
    productAnswer.textContent = currentItem.product;
    brandAnswer.textContent = currentItem.brand;
    productTile.classList.add("is-covered");
    brandTile.classList.add("is-covered");
    productAnswer.setAttribute("aria-hidden", "true");
    brandAnswer.setAttribute("aria-hidden", "true");
    return true;
  }

  window.sayMyNameDev = {
    products: window.sayMyNameProducts || [],
    setProduct: devSetProduct,
    setRules(rules) {
      if (Number.isFinite(rules.startingLives)) {
        devRules.startingLives = Math.max(1, Math.min(5, Math.round(rules.startingLives)));
        if (!matchBegun) players.forEach((player) => { player.lives = devRules.startingLives; });
        renderPlayers();
      }
      if (Number.isFinite(rules.pointsPerCorrect)) devRules.pointsPerCorrect = Math.max(1, Math.min(5, Math.round(rules.pointsPerCorrect)));
      return { ...devRules };
    },
    getRules() { return { ...devRules }; }
  };
  window.cubeCatDevGame = {
    getAnswers: () => currentItem
      ? [{ label: "Produto", value: currentItem.product }, { label: "Marca", value: currentItem.brand }]
      : [],
    getProducts: () => products.map((item) => item.product),
    getProgress: () => ({ index: Math.max(0, products.indexOf(currentItem)), total: products.length }),
    goToProduct: (index) => Number.isInteger(index) && index >= 0 && index < products.length
      ? devSetProduct(products[index])
      : false,
    getPlayers: () => players.map((player, index) => ({ index, name: player.name, lives: player.lives })),
    setPlayerLives: (index, value) => {
      const player = players[index];
      if (!player) return null;
      const previousLives = player.lives;
      player.lives = Math.max(0, Math.min(devRules.startingLives, Math.round(Number(value) || 0)));
      renderPlayers();
      if (player.lives < previousLives) {
        const target = playerCards.children[index]?.querySelector(".mp-player-lives");
        window.dispatchEvent(new CustomEvent("cube-cat-reaction", { detail: { type: "life", target } }));
      }
      if (matchBegun && players.every((entry) => entry.lives <= 0)) finishGame("out-of-lives");
      return player.lives;
    }
  };

  function finishGame(reason) {
    window.CubeCatAudio?.playEffect("gameOver");
    phase = "ended";
    gamePanel.hidden = true;
    gameOver.hidden = false;
    if (reason === "complete") {
      endTitle.textContent = "As imagens acabaram!";
      endMessage.textContent = "Todos os produtos foram identificados corretamente.";
    } else {
      endTitle.textContent = "Fim da partida";
      endMessage.textContent = "Todos ficaram sem vidas.";
    }
    finalScoreboard.replaceChildren();
    [...players]
      .sort((a, b) => b.points - a.points || b.lives - a.lives)
      .forEach((player) => {
        const row = document.createElement("li");
        row.textContent = `${player.name}: ${player.points} ${player.points === 1 ? "ponto" : "pontos"} · ${player.lives} ${player.lives === 1 ? "vida restante" : "vidas restantes"}`;
        finalScoreboard.appendChild(row);
      });
  }

  beginButton.addEventListener("click", () => {
    matchBegun = true;
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
    turnPrompt.textContent = `${formatParticipant(players[selectedPlayerIndex].name)} venceu o desempate. Revele a resposta.`;
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
    judgePrompt.textContent = isTeamMode
      ? `A resposta do time ${players[selectedPlayerIndex].name} está correta?`
      : `A resposta de ${players[selectedPlayerIndex].name} está correta?`;
    judgementControls.hidden = false;
    renderPlayers();
  });

  function judgeAnswer(correct) {
    if (phase !== "revealed" || selectedPlayerIndex === null) return;
    phase = "judged";
    const player = players[selectedPlayerIndex];
    if (correct) {
      window.CubeCatAudio?.playEffect("correct");
      player.points += devRules.pointsPerCorrect;
      solvedItems.add(currentItem);
      turnPrompt.textContent = `${formatParticipant(player.name)} acertou e ganhou ${devRules.pointsPerCorrect} ${devRules.pointsPerCorrect === 1 ? "ponto" : "pontos"}.`;
    } else {
      window.CubeCatAudio?.playEffect("lifeLost");
      player.lives -= 1;
      queue.push(currentItem);
      turnPrompt.textContent = `${formatParticipant(player.name)} errou e perdeu uma vida. O produto volta ao fim da fila.`;
    }
    renderPlayers();
    if (!correct) {
      const target = playerCards.children[selectedPlayerIndex]?.querySelector(".mp-player-lives");
      window.dispatchEvent(new CustomEvent("cube-cat-reaction", { detail: { type: "life", target } }));
    }
    updateProgress();
    judgementControls.hidden = true;
    if (solvedItems.size >= products.length) { finishGame("complete"); return; }
    if (players.every((entry) => entry.lives <= 0)) { finishGame("out-of-lives"); return; }
    nextButton.hidden = false;
  }

  correctButton.addEventListener("click", () => judgeAnswer(true));
  wrongButton.addEventListener("click", () => judgeAnswer(false));
  nextButton.addEventListener("click", startNextRound);
  if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 10 || playerNames.some((name) => typeof name !== "string" || !name.trim()) || !products.length) {
    gamePanel.hidden = true;
    matchIntro.hidden = true;
    missingPlayers.hidden = false;
    return;
  }
  players = playerNames.map((name) => ({ name: name.trim(), points: 0, lives: 3 }));
  queue = shuffledProducts(products);
  solvedItems = new Set();
  matchPlayers.textContent = `${isTeamMode ? "Times" : "Jogadores"}: ${players.map((player) => player.name).join(", ")}. Cada ${participant} começa com 3 vidas.`;
  phase = "intro";
  startNextRound();
})();
