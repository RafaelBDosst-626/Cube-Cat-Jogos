(() => {
  const products = window.sayMyNameProducts || [];
  const panel = document.getElementById("fast-panel");
  const form = document.getElementById("answer-form");
  const productInput = document.getElementById("product-answer");
  const brandInput = document.getElementById("brand-answer");
  const productPhoto = document.getElementById("product-photo");
  const productVisual = document.getElementById("product-visual");
  const brandPhoto = document.getElementById("brand-photo");
  const brandVisual = document.getElementById("brand-visual");
  const brandCard = document.getElementById("brand-card");
  const image = document.getElementById("product-image");
  const timerDisplay = document.getElementById("timer");
  const timerBar = document.getElementById("timer-bar");
  const timerTrack = document.querySelector(".timer-track");
  const bonusPopup = document.getElementById("bonus-popup");
  const correctDisplay = document.getElementById("correct-count");
  const roundInfo = document.getElementById("round-info");
  const feedback = document.getElementById("feedback");
  const submitButton = document.getElementById("submit-answer");
  const gameOver = document.getElementById("game-over");
  const endMessage = document.getElementById("end-message");
  const intro = document.getElementById("intro");
  const startButton = document.getElementById("start-game");
  const restartButton = document.getElementById("restart-game");

  let currentIndex = 0;
  let correctCount = 0;
  let secondsLeft = 120;
  let acceptingAnswer = false;
  let gameEnded = false;
  let timerId;
  let bonusTimeout;
  let advanceTimeout;

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

  function canonical(value, ignoreAccents = false) {
    return normalize(value, ignoreAccents).normalize("NFC").split(" ").map(singularizeWord).join(" ");
  }

  function isCorrect(input, expected) { return canonical(input) === canonical(expected); }
  function isAccentOnly(input, expected) {
    return canonical(input, true) === canonical(expected, true) && canonical(input) !== canonical(expected);
  }

  function loadImage(img, fallback, path, alt) {
    img.hidden = true;
    fallback.hidden = false;
    img.onload = () => { img.hidden = false; fallback.hidden = true; };
    img.onerror = () => { img.hidden = true; fallback.hidden = false; };
    if (path) { img.src = path; img.alt = alt; }
    else { img.removeAttribute("src"); img.alt = ""; }
  }

  function renderProduct() {
    const item = products[currentIndex % products.length];
    loadImage(productPhoto, productVisual, item.image, item.imageAlt || `Imagem de ${item.product}`);
    loadImage(brandPhoto, brandVisual, item.brandImage, `Marca ${item.brand}`);
    image.setAttribute("aria-label", item.imageAlt || "Imagem do produto");
    roundInfo.textContent = `Produto ${currentIndex + 1}`;
    productInput.value = "";
    brandInput.value = "";
    productInput.className = "";
    brandInput.className = "";
    feedback.textContent = "";
    feedback.className = "feedback";
    submitButton.hidden = false;
    submitButton.disabled = false;
    acceptingAnswer = true;
    productInput.focus();
  }

  function updateTimer() {
    timerDisplay.textContent = String(secondsLeft);
    timerBar.style.width = `${Math.min(100, (secondsLeft / 120) * 100)}%`;
    timerTrack.setAttribute("aria-valuenow", String(Math.min(120, secondsLeft)));
    panel.classList.remove("time-cyan", "time-yellow", "time-red");
    panel.classList.add(secondsLeft >= 60 ? "time-cyan" : secondsLeft >= 30 ? "time-yellow" : "time-red");
  }

  function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    acceptingAnswer = false;
    window.clearInterval(timerId);
    window.clearTimeout(advanceTimeout);
    form.reset();
    panel.hidden = true;
    gameOver.hidden = false;
    endMessage.textContent = `Você acertou ${correctCount} ${correctCount === 1 ? "produto" : "produtos"}.`;
  }

  function revealBrand(item) {
    brandCard.querySelector(".image-window").setAttribute("aria-label", `Marca: ${item.brand}`);
    acceptingAnswer = false;
    submitButton.disabled = true;
    submitButton.hidden = true;
    advanceTimeout = window.setTimeout(() => {
      currentIndex += 1;
      renderProduct();
    }, 700);
  }

  function showBonus() {
    window.clearTimeout(bonusTimeout);
    bonusPopup.hidden = false;
    bonusPopup.classList.remove("is-visible");
    void bonusPopup.offsetWidth;
    bonusPopup.classList.add("is-visible");
    bonusTimeout = window.setTimeout(() => {
      bonusPopup.classList.remove("is-visible");
      bonusPopup.hidden = true;
    }, 1100);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!acceptingAnswer) return;
    if (!productInput.value.trim() || !brandInput.value.trim()) {
      feedback.textContent = "Preencha o nome do produto e o nome da marca.";
      feedback.className = "feedback is-wrong";
      return;
    }

    const item = products[currentIndex % products.length];
    productInput.className = "";
    brandInput.className = "";
    const productCorrect = isCorrect(productInput.value, item.product);
    const brandCorrect = isCorrect(brandInput.value, item.brand);
    const productAccent = isAccentOnly(productInput.value, item.product);
    const brandAccent = isAccentOnly(brandInput.value, item.brand);

    if (productCorrect && brandCorrect) {
      productInput.classList.add("is-correct");
      brandInput.classList.add("is-correct");
      correctCount += 1;
      secondsLeft += 3;
      correctDisplay.textContent = String(correctCount);
      updateTimer();
      showBonus();
      feedback.textContent = "Correto! +3 segundos. Próximo produto…";
      feedback.className = "feedback is-correct";
      revealBrand(item);
      return;
    }

    productInput.classList.add(productCorrect ? "is-correct" : productAccent ? "is-accent" : "is-wrong");
    brandInput.classList.add(brandCorrect ? "is-correct" : brandAccent ? "is-accent" : "is-wrong");
    feedback.textContent = productAccent || brandAccent
      ? "Confira os acentos e tente de novo."
      : "Resposta incorreta. Tente novamente.";
    feedback.className = productAccent || brandAccent ? "feedback is-accent" : "feedback is-wrong";
  });

  function startRun() {
    currentIndex = 0;
    correctCount = 0;
    secondsLeft = 120;
    acceptingAnswer = true;
    gameEnded = false;
    correctDisplay.textContent = "0";
    panel.hidden = false;
    panel.inert = false;
    panel.setAttribute("aria-hidden", "false");
    panel.classList.add("is-started");
    gameOver.hidden = true;
    renderProduct();
    updateTimer();
    window.clearInterval(timerId);
    timerId = window.setInterval(() => {
      secondsLeft -= 1;
      updateTimer();
      if (secondsLeft <= 0) endGame();
    }, 1000);
  }

  startButton.addEventListener("click", () => {
    intro.classList.add("is-closing");
    window.setTimeout(() => { intro.hidden = true; }, 250);
    startRun();
  });
  restartButton.addEventListener("click", startRun);

  if (!products.length) {
    startButton.disabled = true;
    restartButton.disabled = true;
    intro.hidden = true;
    panel.hidden = true;
    gameOver.hidden = false;
    endMessage.textContent = "Não foi possível carregar os produtos do jogo.";
    return;
  }
  updateTimer();
})();
