(() => {
  const products = window.sayMyNameProducts || [];
  const form = document.getElementById("answer-form");
  const productInput = document.getElementById("product-answer");
  const brandInput = document.getElementById("brand-answer");
  const visual = document.getElementById("product-visual");
  const photo = document.getElementById("product-photo");
  const brandVisual = document.getElementById("brand-visual");
  const brandPhoto = document.getElementById("brand-photo");
  const productCard = document.getElementById("inverse-product-card");
  const image = document.getElementById("product-image");
  const timerDisplay = document.getElementById("timer");
  const livesDisplay = document.getElementById("lives");
  const hearts = [...livesDisplay.querySelectorAll(".heart")];
  const roundInfo = document.getElementById("round-info");
  const feedback = document.getElementById("feedback");
  const accentNotice = document.getElementById("accent-notice");
  const submitButton = form.querySelector("button[type='submit']");
  const nextButton = document.getElementById("next-answer");
  const inverseSummary = document.getElementById("inverse-summary");
  const gamePanel = document.getElementById("inverse-game");
  const gameOver = document.getElementById("game-over");
  const endTitle = document.getElementById("end-title");
  const endMessage = document.getElementById("end-message");
  const scoreboardList = document.getElementById("scoreboard-list");
  const restartButton = document.getElementById("restart-game");
  const intro = document.getElementById("intro");
  const startButton = document.getElementById("start-game");

  let currentIndex = 0;
  let gameProducts = products.slice();
  let attempts = [];
  let attemptNumber = 1;
  let mistakes = 0;
  let secondsLeft = 40;
  let acceptingAnswer = false;
  let started = false;
  let gameEnded = false;
  let timerId;
  let transitionId;

  function normalize(value, ignoreAccents = false) {
    let normalized = value.trim().toLocaleLowerCase("pt-BR").normalize("NFD");
    if (ignoreAccents) normalized = normalized.replace(/[\u0300-\u036f]/g, "");
    return normalized.replace(/\s+/g, " ");
  }

  function singularizeWord(word) {
    if (word.endsWith("ões")) return `${word.slice(0, -3)}ão`;
    if (word.endsWith("ães")) return `${word.slice(0, -3)}ão`;
    if (word.endsWith("ais")) return `${word.slice(0, -3)}al`;
    if (word.endsWith("éis")) return `${word.slice(0, -3)}el`;
    if (word.endsWith("eis")) return `${word.slice(0, -3)}el`;
    if (word.endsWith("óis")) return `${word.slice(0, -3)}ol`;
    if (word.endsWith("uis")) return `${word.slice(0, -3)}ul`;
    if (word.endsWith("ns")) return `${word.slice(0, -2)}m`;
    if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
  }
  function pluralCanonical(value, ignoreAccents = false) {
    return normalize(value, ignoreAccents).normalize("NFC").split(" ").map(singularizeWord).join(" ");
  }
  function equivalentAnswer(input, expected) {
    return pluralCanonical(input) === pluralCanonical(expected);
  }
  function accentOnly(input, expected) {
    return pluralCanonical(input, true) === pluralCanonical(expected, true) && pluralCanonical(input) !== pluralCanonical(expected);
  }

  function loadImage(img, fallback, path, alt) {
    img.hidden = true;
    fallback.hidden = false;
    img.onload = () => { img.hidden = false; fallback.hidden = true; };
    img.onerror = () => { img.hidden = true; fallback.hidden = false; };
    if (path) { img.src = path; img.alt = alt; }
    else { img.removeAttribute("src"); img.alt = ""; }
  }

  function shuffledReplaySequence() {
    const levels = new Map();
    products.forEach((item) => {
      if (!levels.has(item.difficulty)) levels.set(item.difficulty, []);
      levels.get(item.difficulty).push(item);
    });
    return [...levels.keys()].sort((a, b) => a - b).flatMap((level) => {
      const items = [...levels.get(level)];
      for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
      }
      return items;
    });
  }

  function renderScoreboard() {
    scoreboardList.replaceChildren();
    [...attempts]
      .sort((a, b) => b.reached - a.reached || a.number - b.number)
      .slice(0, 10)
      .forEach((attempt, index) => {
        const row = document.createElement("li");
        row.textContent = `#${index + 1} — Tentativa ${attempt.number}: chegou ao produto ${attempt.reached} (nível ${attempt.difficulty})`;
        scoreboardList.appendChild(row);
      });
  }

  function renderProduct() {
    const item = gameProducts[currentIndex % gameProducts.length];
    productCard.classList.add("is-resetting");
    productCard.classList.remove("is-revealed");
    loadImage(photo, visual, item.image, "");
    loadImage(brandPhoto, brandVisual, item.brandImage, "Logo de uma marca");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => productCard.classList.remove("is-resetting")));
    inverseSummary.hidden = true;
    inverseSummary.textContent = "";
    nextButton.hidden = true;
    submitButton.hidden = false;
    image.setAttribute("aria-label", "Imagem do produto coberta até a resposta correta");
    roundInfo.textContent = `Produto ${currentIndex + 1}`;
    productInput.value = "";
    brandInput.value = "";
    productInput.className = "";
    brandInput.className = "";
    feedback.textContent = "";
    feedback.className = "feedback";
    accentNotice.hidden = true;
    accentNotice.textContent = "";
    acceptingAnswer = started;
    submitButton.disabled = false;
    if (started) productInput.focus();
  }

  function updateTimer() {
    timerDisplay.textContent = String(secondsLeft);
    timerDisplay.classList.toggle("is-low", secondsLeft <= 10);
    gamePanel.classList.remove("time-cyan", "time-yellow", "time-red");
    gamePanel.classList.add(secondsLeft >= 25 ? "time-cyan" : secondsLeft >= 15 ? "time-yellow" : "time-red");
  }

  function startTimer() {
    window.clearInterval(timerId);
    timerId = window.setInterval(() => {
      secondsLeft -= 1;
      updateTimer();
      if (secondsLeft <= 0) endGame("time");
    }, 1000);
  }

  function endGame(reason) {
    if (gameEnded) return;
    gameEnded = true;
    window.clearInterval(timerId);
    window.clearTimeout(transitionId);
    form.reset();
    gamePanel.hidden = true;
    gameOver.hidden = false;
    const reached = currentIndex + 1;
    const lastItem = gameProducts[Math.min(currentIndex, gameProducts.length - 1)];
    attempts.push({ number: attemptNumber, reached, difficulty: lastItem?.difficulty || 1 });
    renderScoreboard();
    if (reason === "time") {
      endTitle.textContent = "Tempo esgotado";
      endMessage.textContent = `O tempo acabou. Nesta tentativa, você chegou ao produto ${reached}.`;
    } else {
      endTitle.textContent = "Fim de jogo";
      endMessage.textContent = `Suas três vidas acabaram no produto ${reached}.`;
    }
  }

  function revealProduct(item) {
    window.clearInterval(timerId);
    productCard.classList.add("is-revealed");
    photo.alt = item.imageAlt || `Imagem de ${item.product}`;
    brandPhoto.alt = `Marca: ${item.brand}`;
    image.setAttribute("aria-label", `Produto: ${item.product}`);
    inverseSummary.textContent = item.summary;
    inverseSummary.hidden = false;
    acceptingAnswer = false;
    submitButton.disabled = true;
    submitButton.hidden = true;
    nextButton.hidden = false;
    nextButton.focus();
  }

  function registerMistake() {
    mistakes += 1;
    const remainingLives = 3 - mistakes;
    hearts.forEach((heart, index) => {
      heart.classList.remove("alive-cyan", "alive-yellow", "alive-red", "is-lost");
      if (index >= remainingLives) heart.classList.add("is-lost");
      else heart.classList.add(remainingLives === 3 ? "alive-cyan" : remainingLives === 2 ? "alive-yellow" : "alive-red");
    });
    livesDisplay.setAttribute("aria-label", `${remainingLives} vidas restantes`);
    livesDisplay.classList.remove("lives-3", "lives-2", "lives-1", "lives-0");
    livesDisplay.classList.add(`lives-${remainingLives}`);
    if (mistakes >= 3) {
      endGame("mistakes");
      return;
    }
    acceptingAnswer = true;
    submitButton.disabled = false;
    feedback.textContent = "Resposta incorreta. Tente novamente: você perdeu uma vida.";
    feedback.className = "feedback is-wrong";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!acceptingAnswer) return;
    if (!productInput.value.trim() || !brandInput.value.trim()) {
      feedback.textContent = "Preencha o nome do produto e o nome da marca.";
      feedback.className = "feedback is-wrong";
      return;
    }

    const item = gameProducts[currentIndex % gameProducts.length];
    productInput.classList.remove("is-correct", "is-accent", "is-wrong");
    brandInput.classList.remove("is-correct", "is-accent", "is-wrong");
    const productCorrect = equivalentAnswer(productInput.value, item.product);
    const brandCorrect = equivalentAnswer(brandInput.value, item.brand);
    const productAccent = accentOnly(productInput.value, item.product);
    const brandAccent = accentOnly(brandInput.value, item.brand);

    if (productCorrect && brandCorrect) {
      productInput.classList.add("is-correct");
      brandInput.classList.add("is-correct");
      feedback.textContent = "Correto! Veja a marca e o resumo antes de continuar.";
      feedback.className = "feedback is-correct";
      revealProduct(item);
      return;
    }

    const onlyAccentError = (productCorrect || productAccent) && (brandCorrect || brandAccent) && (productAccent || brandAccent);
    if (onlyAccentError) {
      productInput.classList.add(productCorrect ? "is-correct" : "is-accent");
      brandInput.classList.add(brandCorrect ? "is-correct" : "is-accent");
      const fields = [productAccent && "nome do produto", brandAccent && "nome da marca"].filter(Boolean);
      accentNotice.textContent = `Atenção: confira o acento${fields.length > 1 ? "s" : ""} ${fields.join(" e ")}. Foram descontados 2 segundos.`;
      accentNotice.hidden = false;
      feedback.textContent = "Ajuste a acentuação e envie novamente.";
      feedback.className = "feedback is-accent";
      secondsLeft = Math.max(0, secondsLeft - 2);
      updateTimer();
      if (secondsLeft <= 0) endGame("time");
      else registerMistake();
      return;
    }

    productInput.classList.add(productCorrect ? "is-correct" : "is-wrong");
    brandInput.classList.add(brandCorrect ? "is-correct" : "is-wrong");
    feedback.textContent = "Resposta incorreta. Tente novamente.";
    feedback.className = "feedback is-wrong";
    registerMistake();
  });

  nextButton.addEventListener("click", () => {
    if (acceptingAnswer || nextButton.hidden) return;
    window.clearTimeout(transitionId);
    secondsLeft = 40;
    updateTimer();
    currentIndex += 1;
    renderProduct();
    startTimer();
  });

  startButton.addEventListener("click", () => {
    if (started) return;
    started = true;
    gamePanel.inert = false;
    gamePanel.setAttribute("aria-hidden", "false");
    gamePanel.classList.add("is-started");
    intro.classList.add("is-closing");
    window.setTimeout(() => { intro.hidden = true; }, 250);
    acceptingAnswer = true;
    productInput.focus();
    startTimer();
  });

  restartButton.addEventListener("click", () => {
    attemptNumber += 1;
    gameProducts = shuffledReplaySequence();
    currentIndex = 0;
    mistakes = 0;
    secondsLeft = 40;
    gameEnded = false;
    acceptingAnswer = true;
    started = true;
    hearts.forEach((heart) => {
      heart.classList.remove("alive-yellow", "alive-red", "is-lost");
      heart.classList.add("alive-cyan");
    });
    livesDisplay.setAttribute("aria-label", "3 vidas restantes");
    livesDisplay.classList.remove("lives-2", "lives-1", "lives-0");
    livesDisplay.classList.add("lives-3");
    gameOver.hidden = true;
    gamePanel.hidden = false;
    gamePanel.inert = false;
    gamePanel.setAttribute("aria-hidden", "false");
    renderProduct();
    updateTimer();
    startTimer();
  });

  if (!products.length) {
    startButton.disabled = true;
    endTitle.textContent = "Sem produtos";
    endMessage.textContent = "Não foi possível carregar os produtos do jogo.";
    intro.hidden = true;
    gamePanel.hidden = true;
    gameOver.hidden = false;
    return;
  }

  renderProduct();
  updateTimer();
})();
