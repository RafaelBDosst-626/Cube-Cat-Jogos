(() => {
  const allProducts = (window.sayMyNameProducts || []).filter((item) => item.image && item.brandImage);
  const gamePanel = document.getElementById("game-panel");
  const gameOver = document.getElementById("game-over");
  const matchIntro = document.getElementById("match-intro");
  const matchPlayers = document.getElementById("match-players");
  const matchFormat = document.getElementById("match-format");
  const matchLength = document.getElementById("match-length");
  const tournamentRoundStat = document.getElementById("tournament-round-stat");
  const tournamentRoundLabel = document.getElementById("tournament-round-label");
  const suddenDeathStat = document.getElementById("sudden-death-stat");
  const suddenDeathTimer = document.getElementById("sudden-death-timer");
  const beginButton = document.getElementById("begin-match");
  const missingPlayers = document.getElementById("missing-players");
  const playerCards = document.getElementById("player-cards");
  const participantsPanel = document.getElementById("participants-panel");
  const teamSideLeft = document.getElementById("team-side-left");
  const teamSideRight = document.getElementById("team-side-right");
  const teamCardLeft = document.getElementById("team-card-left");
  const teamCardRight = document.getElementById("team-card-right");
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
  let requestedCompetition = "all-play";
  let requestedProductCount = "30";
  try {
    const savedNames = sessionStorage.getItem("sayMyNameMultiplayerPlayers");
    participantMode = sessionStorage.getItem("sayMyNameMultiplayerMode") || new URLSearchParams(window.location.search).get("mode") || "players";
    requestedCompetition = sessionStorage.getItem("sayMyNameMultiplayerCompetition") || new URLSearchParams(window.location.search).get("competition") || "all-play";
    requestedProductCount = sessionStorage.getItem("sayMyNameMultiplayerProductCount") || new URLSearchParams(window.location.search).get("productCount") || "30";
    playerNames = JSON.parse(savedNames || new URLSearchParams(window.location.search).get("players") || "[]");
    sessionStorage.removeItem("sayMyNameMultiplayerPlayers");
    sessionStorage.removeItem("sayMyNameMultiplayerMode");
    sessionStorage.removeItem("sayMyNameMultiplayerCompetition");
    sessionStorage.removeItem("sayMyNameMultiplayerProductCount");
  } catch {
    try {
      const params = new URLSearchParams(window.location.search);
      playerNames = JSON.parse(params.get("players") || "[]");
      participantMode = params.get("mode") || "players";
      requestedCompetition = params.get("competition") || "all-play";
      requestedProductCount = params.get("productCount") || "30";
    }
    catch { playerNames = []; }
  }
  participantMode = participantMode === "teams" ? "teams" : "players";
  const requestedCount = requestedProductCount === "all" ? allProducts.length : Number(requestedProductCount);
  const productCount = Number.isFinite(requestedCount)
    ? Math.max(Math.min(20, allProducts.length), Math.min(allProducts.length, Math.round(requestedCount)))
    : Math.min(30, allProducts.length);
  const products = shuffledProducts(allProducts).slice(0, productCount);
  const isTeamMode = participantMode === "teams";
  const isVersus = isTeamMode && requestedCompetition === "versus" && Array.isArray(playerNames) && [2, 4].includes(playerNames.length);
  let useTeamSideLayout = isTeamMode && Array.isArray(playerNames) && playerNames.length === 2;
  gamePanel.classList.toggle("is-team-mode", isTeamMode);
  gamePanel.classList.toggle("is-team-side-layout", useTeamSideLayout);
  participantsPanel.hidden = useTeamSideLayout;
  teamSideLeft.hidden = !useTeamSideLayout;
  teamSideRight.hidden = !useTeamSideLayout;
  tournamentRoundStat.hidden = !isVersus;
  const participant = isTeamMode ? "time" : "jogador";
  const basicTurnPrompt = isTeamMode ? "Selecione o time que respondeu primeiro." : "Selecione o card de quem respondeu primeiro.";
  const formatParticipant = (name) => isTeamMode ? `O time ${name}` : name;
  let players = [];
  let queue = [];
  let solvedItems = new Set();
  let tournamentStage = 0;
  let semifinalIndex = 0;
  let tournamentScores = [];
  let versusPointsBeforeFinal = [];
  let versusProducts = [...products];
  let tieExpansionUsed = false;
  let suddenDeath = false;
  let suddenDeathScores = [];
  let suddenDeathItemsPlayed = 0;
  let suddenDeathSecondsLeft = 10;
  let suddenDeathTimerId = null;
  let suddenDeathFailedTeams = new Set();
  const suddenDeathBatchSize = 9;
  let activeTeamIndices = [];
  let finalistIndices = [];
  let qualifiedWinners = [];
  let teamSideIndices = [0, 1];
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
  const playerNeon = ["#ffe34d", "#39ef91", "#ff3b5c", "#31aaff"];
  const teamNeon = ["#ff3b5c", "#31aaff", "#ffe34d", "#39ef91"];
  const participantColor = (index) => (isTeamMode ? teamNeon[index] : playerNeon[index]) || `hsl(${(index * 137.508) % 360} 85% 62%)`;

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
    const total = suddenDeath ? suddenDeathBatchSize : versusProducts.length;
    const completed = suddenDeath ? suddenDeathItemsPlayed : solvedItems.size;
    solvedCount.textContent = `${completed} / ${total}`;
    roundNumber.textContent = `${Math.min(completed + 1, total)} / ${total}`;
  }

  function updateVersusLayout() {
    useTeamSideLayout = isTeamMode && (playerNames.length === 2 || (isVersus && tournamentStage === 1));
    gamePanel.classList.toggle("is-team-side-layout", useTeamSideLayout);
    participantsPanel.hidden = useTeamSideLayout;
    teamSideLeft.hidden = !useTeamSideLayout;
    teamSideRight.hidden = !useTeamSideLayout;
    if (useTeamSideLayout && tournamentStage === 1) teamSideIndices = [...finalistIndices];
    teamSideLeft.style.setProperty("--team-neon", participantColor(teamSideIndices[0] ?? 0));
    teamSideRight.style.setProperty("--team-neon", participantColor(teamSideIndices[1] ?? 1));
  }

  function updateTournamentRoundLabel() {
    if (!isVersus) return;
    tournamentRoundLabel.textContent = suddenDeath
      ? "Morte súbita"
      : tournamentStage === 1
      ? "Final · 2 / 2"
      : players.length === 4
        ? `Semifinal ${semifinalIndex + 1} / 2`
        : "Primeira rodada · 1 / 2";
  }

  function turnPromptForStage() {
    if (!isVersus) return basicTurnPrompt;
    const contenders = tournamentStage === 1
      ? finalistIndices.map((index) => players[index].name).join(" × ")
      : players.length === 4
        ? activeTeamIndices.map((index) => players[index].name).join(" × ")
        : players.map((player) => player.name).join(" × ");
    return `${contenders}: selecione quem respondeu primeiro.`;
  }

  function playerCardAt(index) {
    if (!useTeamSideLayout) return playerCards.children[index];
    const sideIndex = teamSideIndices.indexOf(index);
    if (sideIndex < 0) return null;
    return (sideIndex === 0 ? teamCardLeft : teamCardRight).firstElementChild;
  }

  function renderPlayers() {
    playerCards.replaceChildren();
    teamCardLeft.replaceChildren();
    teamCardRight.replaceChildren();
    players.forEach((player, index) => {
      const card = document.createElement("article");
      card.className = `mp-player-card player-color-${index + 1}`;
      card.style.setProperty("--player-neon", participantColor(index));
      const avatar = window.CubeCatPixelAvatar.create(index);
      avatar.classList.add("mp-player-avatar");
      const isActiveForStage = !isVersus || activeTeamIndices.includes(index);
      card.classList.toggle("is-selected", selectedPlayerIndex === index);
      card.classList.toggle("is-out", player.lives <= 0);
      card.classList.toggle("is-claiming", firstClaims.has(index));
      card.classList.toggle("is-eliminated", isVersus && tournamentStage === 1 && !isActiveForStage);

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
      selectButton.disabled = suddenDeath || player.lives <= 0 || !isActiveForStage || phase !== "choose" || (forcedWinnerIndex !== null && forcedWinnerIndex !== index);
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
      claimButton.disabled = player.lives <= 0 || !isActiveForStage || phase !== "choose" || forcedWinnerIndex !== null;
      if (suddenDeath && suddenDeathFailedTeams.has(index)) claimButton.disabled = true;
      claimButton.setAttribute("aria-pressed", String(firstClaims.has(index)));
      claimButton.addEventListener("click", () => {
        if (phase !== "choose" || player.lives <= 0) return;
        if (suddenDeath) {
          if (!isActiveForStage || suddenDeathFailedTeams.has(index)) return;
          selectedPlayerIndex = index;
          firstClaims.clear();
          firstClaims.add(index);
          window.clearInterval(suddenDeathTimerId);
          revealButton.disabled = false;
          turnPrompt.textContent = `${formatParticipant(player.name)} respondeu primeiro. Revele e confira a resposta.`;
          renderPlayers();
          return;
        }
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
          turnPrompt.textContent = turnPromptForStage();
        }
        renderPlayers();
      });
      card.append(avatar, name, points, lives, selectButton, claimButton);
      if (useTeamSideLayout) {
        const sideIndex = teamSideIndices.indexOf(index);
        if (sideIndex === 0) teamCardLeft.appendChild(card);
        if (sideIndex === 1) teamCardRight.appendChild(card);
      } else playerCards.appendChild(card);
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

  function allCurrentContendersOut() {
    const contenders = isVersus ? activeTeamIndices : players.map((_, index) => index);
    return contenders.length > 0 && contenders.every((index) => players[index]?.lives <= 0);
  }

  function startVersusFinal() {
    activeTeamIndices = [...finalistIndices];
    teamSideIndices = [...finalistIndices];
    tournamentStage = 1;
    tournamentScores = players.map(() => 0);
    players.forEach((player, index) => {
      player.lives = finalistIndices.includes(index) ? devRules.startingLives : 0;
    });
    solvedItems = new Set();
    queue = shuffledProducts(versusProducts);
    selectedPlayerIndex = null;
    forcedWinnerIndex = null;
    firstClaims.clear();
    updateVersusLayout();
    updateTournamentRoundLabel();
    renderPlayers();
    startNextRound();
  }

  function completeVersusMatch(winnerIndex) {
    suddenDeath = false;
    window.clearInterval(suddenDeathTimerId);
    suddenDeathStat.hidden = true;
    if (tournamentStage === 0) {
      if (players.length === 4) {
        qualifiedWinners.push(winnerIndex);
        semifinalIndex += 1;
        tieExpansionUsed = false;
        if (semifinalIndex < 2) {
          activeTeamIndices = [2, 3];
          tournamentScores = players.map(() => 0);
          players.forEach((player, index) => { player.lives = activeTeamIndices.includes(index) ? devRules.startingLives : 0; });
          solvedItems = new Set();
          queue = [...versusProducts].sort((a, b) => a.difficulty - b.difficulty);
          updateTournamentRoundLabel();
          renderPlayers();
          startNextRound();
          return;
        }
        finalistIndices = [...qualifiedWinners];
      } else {
        finalistIndices = [0, 1];
        versusPointsBeforeFinal = [...tournamentScores];
      }
      startVersusFinal();
      return;
    }
    finishGame("versus-winner", winnerIndex);
  }

  function startSuddenDeath() {
    suddenDeath = true;
    suddenDeathScores = players.map(() => 0);
    suddenDeathStat.hidden = false;
    updateTournamentRoundLabel();
    suddenDeathItemsPlayed = 0;
    suddenDeathFailedTeams.clear();
    solvedItems = new Set();
    queue = shuffledProducts(allProducts).slice(0, suddenDeathBatchSize);
    turnPrompt.textContent = "Morte súbita: o primeiro time a responder corretamente ganha o ponto.";
    startNextRound();
  }

  function runSuddenDeathClock() {
    window.clearInterval(suddenDeathTimerId);
    suddenDeathTimerId = window.setInterval(() => {
      if (phase !== "choose") return;
      suddenDeathSecondsLeft -= 1;
      suddenDeathTimer.textContent = `${suddenDeathSecondsLeft} s`;
      if (suddenDeathSecondsLeft <= 0) finishSuddenDeathItem();
    }, 1000);
  }

  function finishSuddenDeathItem() {
    window.clearInterval(suddenDeathTimerId);
    suddenDeathTimerId = null;
    suddenDeathItemsPlayed += 1;
    solvedItems.add(currentItem);
    selectedPlayerIndex = null;
    forcedWinnerIndex = null;
    firstClaims.clear();
    judgementControls.hidden = true;
    revealButton.hidden = true;
    nextButton.hidden = false;
    phase = "judged";
    updateProgress();
    renderPlayers();
    if (suddenDeathItemsPlayed >= suddenDeathBatchSize) {
      const scores = activeTeamIndices.map((index) => [index, suddenDeathScores[index] || 0]);
      if (scores[0][1] !== scores[1][1]) {
        completeVersusMatch(scores.sort((a, b) => b[1] - a[1])[0][0]);
      } else {
        suddenDeathItemsPlayed = 0;
        suddenDeathScores = players.map(() => 0);
        queue = shuffledProducts(allProducts).slice(0, suddenDeathBatchSize);
        nextButton.hidden = true;
        startNextRound();
      }
    }
  }

  function finishVersusRound() {
    const totals = activeTeamIndices.map((index) => [index, tournamentScores[index] + (tournamentStage === 1 && players.length === 2 ? versusPointsBeforeFinal[index] : 0)]);
    if (totals[0][1] === totals[1][1]) {
      if (tournamentStage === 0 && players.length === 2) {
        versusProducts = [...allProducts];
        finalistIndices = [0, 1];
        versusPointsBeforeFinal = [...tournamentScores];
        startVersusFinal();
        return;
      }
      if (tournamentStage === 0 && versusProducts.length < allProducts.length && !tieExpansionUsed) {
        tieExpansionUsed = true;
        versusProducts = [...allProducts];
        queue = shuffledProducts(versusProducts.filter((item) => !solvedItems.has(item)));
        turnPrompt.textContent = "Empate! A disputa continua com os objetos que faltavam, em ordem misturada.";
        startNextRound();
        return;
      }
      startSuddenDeath();
      return;
    }
    completeVersusMatch(totals.sort((a, b) => b[1] - a[1])[0][0]);
  }

  function startNextRound() {
    if (suddenDeath && suddenDeathItemsPlayed >= suddenDeathBatchSize) return;
    if (!suddenDeath && solvedItems.size >= versusProducts.length) {
      if (isVersus) finishVersusRound();
      else finishGame("complete");
      return;
    }
    if (!suddenDeath && allCurrentContendersOut()) { finishGame("out-of-lives"); return; }
    currentItem = queue.shift();
    if (!currentItem) {
      if (isVersus) finishVersusRound();
      else finishGame("complete");
      return;
    }
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
    turnPrompt.textContent = turnPromptForStage();
    updateProgress();
    renderPlayers();
    if (suddenDeath) {
      suddenDeathSecondsLeft = 10;
      suddenDeathFailedTeams = new Set();
      suddenDeathTimer.textContent = `${suddenDeathSecondsLeft} s`;
      runSuddenDeathClock();
    }
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
        const target = playerCardAt(index)?.querySelector(".mp-player-lives");
        window.dispatchEvent(new CustomEvent("cube-cat-reaction", { detail: { type: "life", target } }));
      }
      if (matchBegun && allCurrentContendersOut()) finishGame("out-of-lives");
      return player.lives;
    }
  };

  function finishGame(reason, championIndex = null) {
    window.CubeCatAudio?.playEffect("gameOver");
    phase = "ended";
    gamePanel.hidden = true;
    gameOver.hidden = false;
    if (reason === "versus-winner") {
      endTitle.textContent = "Vitória no Versus!";
      endMessage.textContent = `${players[championIndex].name} venceu a final.`;
    } else if (reason === "complete") {
      endTitle.textContent = "As imagens acabaram!";
      endMessage.textContent = isTeamMode
        ? "A disputa Contra todos terminou. Confira a pontuação final."
        : "Todos os produtos foram identificados corretamente.";
    } else {
      endTitle.textContent = "Fim da partida";
      endMessage.textContent = "Todos ficaram sem vidas.";
    }
    finalScoreboard.replaceChildren();
    [...players]
      .sort((a, b) => championIndex !== null && a === players[championIndex]
        ? -1
        : championIndex !== null && b === players[championIndex]
          ? 1
          : b.points - a.points || b.lives - a.lives)
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
    if (suddenDeath) {
      if (correct) {
        window.CubeCatAudio?.playEffect("correct");
        suddenDeathScores[selectedPlayerIndex] += 1;
        player.points += 1;
        tournamentScores[selectedPlayerIndex] += 1;
        turnPrompt.textContent = `${formatParticipant(player.name)} foi o primeiro a acertar e ganhou o ponto!`;
        finishSuddenDeathItem();
        return;
      }
      suddenDeathFailedTeams.add(selectedPlayerIndex);
      const remainingTeams = activeTeamIndices.filter((index) => !suddenDeathFailedTeams.has(index));
      if (!remainingTeams.length || suddenDeathSecondsLeft <= 0) {
        finishSuddenDeathItem();
        return;
      }
      selectedPlayerIndex = null;
      firstClaims.clear();
      phase = "choose";
      productTile.classList.add("is-covered");
      brandTile.classList.add("is-covered");
      productAnswer.setAttribute("aria-hidden", "true");
      brandAnswer.setAttribute("aria-hidden", "true");
      judgementControls.hidden = true;
      revealButton.hidden = false;
      revealButton.disabled = true;
      turnPrompt.textContent = `${formatParticipant(player.name)} errou. O outro time ainda pode responder antes do fim do cronômetro.`;
      renderPlayers();
      runSuddenDeathClock();
      return;
    }
    if (correct) {
      window.CubeCatAudio?.playEffect("correct");
      player.points += devRules.pointsPerCorrect;
      if (isVersus) tournamentScores[selectedPlayerIndex] += devRules.pointsPerCorrect;
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
      const target = playerCardAt(selectedPlayerIndex)?.querySelector(".mp-player-lives");
      window.dispatchEvent(new CustomEvent("cube-cat-reaction", { detail: { type: "life", target } }));
    }
    updateProgress();
    judgementControls.hidden = true;
    if (solvedItems.size >= versusProducts.length) {
      if (isVersus) finishVersusRound();
      else finishGame("complete");
      return;
    }
    if (allCurrentContendersOut()) { finishGame("out-of-lives"); return; }
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
  players = playerNames.map((name) => ({ name: name.trim(), points: 0, lives: devRules.startingLives }));
  activeTeamIndices = isVersus && players.length === 4 ? [0, 1] : players.map((_, index) => index);
  tournamentScores = players.map(() => 0);
  queue = isVersus
    ? [...products].sort((a, b) => a.difficulty - b.difficulty)
    : shuffledProducts(products);
  solvedItems = new Set();
  matchPlayers.textContent = `${isTeamMode ? "Times" : "Jogadores"}: ${players.map((player) => player.name).join(", ")}. Cada ${participant} começa com 3 vidas.`;
  matchFormat.hidden = !isTeamMode;
  if (isTeamMode && isVersus) {
    matchFormat.textContent = players.length === 2
      ? "Versus: os dois times se enfrentam em lados opostos. Se a primeira rodada empatar, a final inclui todos os objetos; se o placar total continuar igual, começa a morte súbita com 9 objetos e relógio compartilhado."
      : "Versus: os quatro times disputam duas semifinais. Um empate inclui os objetos restantes; empate na final é decidido na morte súbita com 9 objetos e relógio compartilhado.";
    if (players.length === 4) {
      matchFormat.textContent = `Versus: ${players[0].name} contra ${players[1].name}; ${players[2].name} contra ${players[3].name}. Os vencedores fazem a final com as dificuldades misturadas. Empates prolongam o duelo com os objetos restantes; empate na final leva à morte súbita de 9 objetos.`;
    }
  } else if (isTeamMode) {
    matchFormat.textContent = "Contra todos: todos os times disputam juntos; o maior placar ao final vence.";
  }
  matchLength.textContent = isVersus
    ? `Cada fase usa ${productCount === allProducts.length ? "todos os objetos" : `os ${productCount} objetos escolhidos`}.`
    : `A partida termina quando todos ficarem sem vidas ou quando ${productCount === allProducts.length ? "todas as imagens" : `as ${productCount} imagens`} forem resolvidas.`;
  updateTournamentRoundLabel();
  phase = "intro";
  startNextRound();
})();
