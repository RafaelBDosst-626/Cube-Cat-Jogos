const TRANSITION_VIDEO_URL = new URL("../assets/carregamentoDeTela.mp4", document.currentScript.src).href;
const GAME_MENU_LOGO_URL = new URL("../assets/cabeca.png", document.currentScript.src).href;
const GAME_REACTION_IMAGE_URL = new URL("../assets/mascote-reacao.svg", document.currentScript.src).href;
const BRAND_LOGO_URL = new URL("../assets/logo.png", document.currentScript.src).href;
const HEADLESS_BRAND_LOGO_URL = new URL("../assets/logo-sem-cabeca.svg", document.currentScript.src).href;
const ASSISTANT_HEAD_URL = GAME_MENU_LOGO_URL;
const ASSISTANT_ACTIVATION_DELAY = 2000;
const TRANSITION_VIDEO_SECONDS = 2;
const NAVIGATION_GUARD_STATE = "cubeCatNavigationGuard";

function installNavigationGuard() {
  const previousState = history.state && typeof history.state === "object" ? history.state : {};
  try {
    history.pushState({ ...previousState, [NAVIGATION_GUARD_STATE]: true }, "");
  } catch {
    // Some file: contexts restrict the History API; game navigation still works.
  }
}

installNavigationGuard();
window.addEventListener("popstate", () => {
  installNavigationGuard();
  document.querySelector(".transition-loader")?.restartAnimation?.();
});

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  document.querySelector(".transition-loader")?.restartAnimation?.();
});

function showLoadingScreen(destination) {
  window.dispatchEvent(new Event("cube-cat-navigation-start"));
  if (document.querySelector(".transition-loader")) return;

  // Place a fresh same-page entry before showing the loader so Back cannot
  // leave the page while the transition is still running.
  installNavigationGuard();

  const loader = document.createElement("div");
  loader.className = "transition-loader";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-live", "polite");
  loader.setAttribute("aria-label", "Carregando página");
  const animation = document.createElement("video");
  animation.className = "transition-loader__video";
  animation.src = TRANSITION_VIDEO_URL;
  animation.autoplay = true;
  animation.muted = true;
  animation.playsInline = true;
  animation.preload = "auto";
  animation.setAttribute("aria-label", "Animação de carregamento Cube Cat");
  loader.appendChild(animation);
  document.body.appendChild(loader);

  let navigationStarted = false;
  let transitionTimer;
  const continueNavigation = () => {
    if (navigationStarted) return;
    navigationStarted = true;
    window.clearTimeout(transitionTimer);
    window.location.assign(destination);
  };

  const restartAnimation = () => {
    navigationStarted = false;
    window.clearTimeout(transitionTimer);
    animation.pause();
    try { animation.currentTime = 0; } catch {}
    animation.play().catch(() => {
      animation.addEventListener("canplay", () => animation.play().catch(() => {}), { once: true });
    });
    transitionTimer = window.setTimeout(continueNavigation, TRANSITION_VIDEO_SECONDS * 1000);
  };
  loader.restartAnimation = restartAnimation;

  animation.addEventListener("timeupdate", () => {
    if (animation.currentTime >= TRANSITION_VIDEO_SECONDS) {
      animation.pause();
      continueNavigation();
    }
  });
  animation.addEventListener("error", continueNavigation, { once: true });
  restartAnimation();
}

function setupGameReactionPopup() {
  const popupsByAnchor = new WeakMap();

  window.addEventListener("cube-cat-reaction", (event) => {
    const requestedTarget = event.detail?.target instanceof Element ? event.detail.target : null;
    let anchor = requestedTarget?.closest(".lives-stat, .mp-player-lives") ||
      document.querySelector(".lives-stat, .mp-player-lives");
    if (!anchor) anchor = requestedTarget?.closest(".stat") || document.querySelector("#timer")?.closest(".stat");
    if (!anchor) return;

    let popup = popupsByAnchor.get(anchor);
    if (!popup) {
      popup = document.createElement("img");
      popup.className = "game-reaction-popup";
      popup.src = GAME_REACTION_IMAGE_URL;
      popup.alt = "Mascote reagindo";
      popup.hidden = true;
      document.body.appendChild(popup);
      popupsByAnchor.set(anchor, popup);
    }

    const bounds = anchor.getBoundingClientRect();
    const popupWidth = Math.min(220, Math.max(120, window.innerWidth - 24));
    const popupHeight = popupWidth * (197 / 1248);
    const left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, bounds.right - popupWidth));
    const preferredTop = bounds.bottom + 6;
    const top = preferredTop + popupHeight > window.innerHeight - 8
      ? Math.max(8, bounds.top - popupHeight - 6)
      : preferredTop;
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.width = `${popupWidth}px`;

    window.clearTimeout(popup.hideTimeout);
    window.clearTimeout(popup.fadeTimeout);
    popup.hidden = false;
    popup.classList.remove("is-visible");
    requestAnimationFrame(() => popup.classList.add("is-visible"));
    popup.hideTimeout = window.setTimeout(() => {
      popup.classList.remove("is-visible");
      popup.fadeTimeout = window.setTimeout(() => { popup.hidden = true; }, 260);
    }, 1900);
  });
}

function setupGameQuickMenu() {
  let destination;
  let exitLabel;
  let gameName;

  if (document.querySelector(".app")) {
    destination = new URL("index.html", window.location.href).href;
    gameName = "Quiz";
    exitLabel = "Sair para a seleção de quizzes";
  } else if (document.querySelector(".classic-game, .mp-shell")) {
    destination = new URL("../menu/say-my-name.html", window.location.href).href;
    gameName = "Say my name!";
    exitLabel = "Sair para a tela inicial do Say my name!";
  } else {
    return;
  }

  const menu = document.createElement("div");
  menu.className = "game-quick-menu";

  const toggle = document.createElement("button");
  toggle.className = "game-quick-menu__toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir menu do jogo");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "game-quick-menu-panel game-quick-menu-message");
  for (let index = 0; index < 3; index += 1) {
    const line = document.createElement("span");
    line.className = "game-quick-menu__line";
    line.setAttribute("aria-hidden", "true");
    toggle.appendChild(line);
  }
  const logo = document.createElement("img");
  logo.className = "game-quick-menu__logo";
  logo.src = GAME_MENU_LOGO_URL;
  logo.alt = "";
  toggle.appendChild(logo);

  const panel = document.createElement("div");
  panel.className = "game-quick-menu__panel";
  panel.id = "game-quick-menu-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.setAttribute("inert", "");

  const message = document.createElement("div");
  message.className = "game-quick-menu__message";
  message.id = "game-quick-menu-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.setAttribute("aria-hidden", "true");
  message.hidden = true;

  const heading = document.createElement("p");
  heading.className = "game-quick-menu__heading";
  heading.textContent = gameName;
  const exit = document.createElement("button");
  exit.className = "game-quick-menu__exit";
  exit.type = "button";
  exit.textContent = exitLabel;
  panel.append(heading, exit);
  menu.append(toggle, message, panel);
  document.body.appendChild(menu);

  const emojiMessages = [
    "😺✨👋", "🐾😸💙", "😻🎮✨", "🙀❔🐾", "😸💫😺", "😼⚡🐈", "🐱💭✨", "😹🎉🐾",
    "😿💔🐾", "🙀💦😾", "😾💢🐈", "😰⏳🐱", "😵‍💫⌛😿", "😬🔴🐾", "🐈‍⬛💨😱", "😿🫶🐱",
    "😺🌟🎯", "🐾💫😸", "😻💖🐈", "😽✨🌙", "😸🌀🎮", "🐱🎊💙", "😹💫🐾", "😺🧩✨",
    "🙀⚠️⏰", "😿🕒🐾", "😖💥🐱", "😱🔻⌛", "🐱🫣💦", "😾🌪️🐈", "😮‍💨💙🐾", "😺🤞✨",
    "🐾🎮😼", "😸🪄💫", "😻🌈🐱", "😹🛟🐾", "😿🩹🐱", "😰🚨🐈", "😵‍💫💭🐾", "😺💪✨"
  ];
  let lastEmojiMessage = "";
  let messageTimer;
  let messageHideTimer;

  const showMessage = (choices) => {
    window.clearTimeout(messageTimer);
    window.clearTimeout(messageHideTimer);
    message.hidden = false;
    message.setAttribute("aria-hidden", "false");
    message.classList.remove("is-thinking");
    let nextMessage;
    do {
      nextMessage = choices[Math.floor(Math.random() * choices.length)];
    } while (choices.length > 1 && nextMessage === lastEmojiMessage);
    lastEmojiMessage = nextMessage;
    message.textContent = nextMessage;
    requestAnimationFrame(() => message.classList.add("is-visible"));
  };

  const setOpen = (isOpen) => {
    menu.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu do jogo" : "Abrir menu do jogo");
    panel.setAttribute("aria-hidden", String(!isOpen));
    panel.toggleAttribute("inert", !isOpen);

    window.clearTimeout(messageTimer);
    window.clearTimeout(messageHideTimer);
    if (isOpen) {
      message.hidden = false;
      message.setAttribute("aria-hidden", "false");
      message.textContent = "...";
      message.classList.add("is-thinking");
      requestAnimationFrame(() => message.classList.add("is-visible"));
      messageTimer = window.setTimeout(() => {
        if (!menu.classList.contains("is-open")) return;
        showMessage(emojiMessages);
      }, 650);
    } else {
      message.setAttribute("aria-hidden", "true");
      message.classList.remove("is-visible", "is-thinking");
      messageHideTimer = window.setTimeout(() => {
        if (!menu.classList.contains("is-open")) message.hidden = true;
      }, 240);
    }
  };

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
  exit.addEventListener("click", () => showLoadingScreen(destination));
  document.addEventListener("pointerdown", (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

}

function setupBrandAssistant() {
  const logoTriggers = document.querySelectorAll(".topbar-logo, .logo-principal");
  if (!logoTriggers.length) return;

  const assistant = document.createElement("div");
  assistant.className = "brand-assistant";
  assistant.innerHTML = `<div class="brand-assistant__bubble" role="status" aria-live="polite" hidden></div><div class="brand-assistant__toggle" role="img" aria-label="Wifi Cat, assistente virtual"><img src="${ASSISTANT_HEAD_URL}" alt=""></div>`;
  document.body.appendChild(assistant);
  const bubble = assistant.querySelector(".brand-assistant__bubble");
  let activationTimer = null;
  let dialogueTimer = null;
  let dialogueQueue = [];

  const dialogueByPage = () => {
    if (document.querySelector(".app")) {
      return [
        "Quiz identificado. Preparando seus circuitos... 🧠🤖",
        "Cada pergunta é um novo desafio. Boa sorte! 🎮⚡",
        "Processando respostas... sinal estável 📶",
        "WALL-E aprovaria essa missão de exploração 🤖🌱",
        "EVA, confirme: jogador pronto para o próximo nível? 🤖✨"
      ];
    }

    if (document.querySelector(".classic-game, .mp-shell") || window.location.pathname.toLowerCase().includes("say-my-name")) {
      return [
        "Say My Name detectado. Pronto para descobrir? 💬🤖",
        "Memória em teste. Aguardando seu palpite... 🧠📡",
        "Novo nome no radar! Consegue identificar? 🎯",
        "WALL-E enviou uma pista... brincadeira. Boa sorte! 🤖🔎",
        "EVA, registre: jogador em plena investigação 🤖✨"
      ];
    }

    if (document.querySelector(".btn-biblioteca")) {
      return [
        "Biblioteca de jogos localizada. Escolha sua missão! 📚🎮",
        "Quiz ou Say My Name? Meus circuitos recomendam os dois 🤖",
        "Novos jogos podem entrar nesta biblioteca no futuro 🚀",
        "WALL-E também gosta de explorar lugares novos 🤖🌱",
        "EVA, destino confirmado: diversão! 🤖✨"
      ];
    }

    return [
      "Cube Cat Jogos: diversão carregada com sucesso! 🎮⚡",
      "Temos Quiz e Say My Name à sua espera 🤖🎯",
      "Escolha um jogo. Wifi Cat acompanha a missão 📶🐱",
      "Novos jogos podem chegar em futuras atualizações 🚀",
      "WALL-E e EVA seriam uma ótima dupla de jogadores 🤖✨",
      "Conexão com a diversão estabelecida! 📡🎮"
    ];
  };

  const showNextDialogue = () => {
    if (!assistant.classList.contains("is-active")) return;
    if (dialogueQueue.length === 0) {
      dialogueQueue = dialogueByPage();
      for (let index = dialogueQueue.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [dialogueQueue[index], dialogueQueue[swapIndex]] = [dialogueQueue[swapIndex], dialogueQueue[index]];
      }
    }

    bubble.textContent = dialogueQueue.shift();
    assistant.classList.add("is-speaking");
    window.clearTimeout(dialogueTimer);
    dialogueTimer = window.setTimeout(() => {
      assistant.classList.remove("is-speaking");
      dialogueTimer = window.setTimeout(showNextDialogue, 6500);
    }, 3200);
  };

  const unlockLogos = () => {
    logoTriggers.forEach((trigger) => {
      trigger.classList.remove("is-assistant-pending");
      trigger.removeAttribute("aria-disabled");
    });
  };

  const resetAssistant = () => {
    window.clearTimeout(dialogueTimer);
    dialogueQueue = [];
    logoTriggers.forEach((trigger) => {
      const image = trigger.matches("img") ? trigger : trigger.querySelector("img");
      if (image) {
        image.src = BRAND_LOGO_URL;
        image.alt = "Logotipo do Cube Cat Jogos";
      }
    });
    assistant.classList.remove("is-active", "is-speaking");
    bubble.hidden = true;
    document.body.classList.remove("has-brand-assistant");
    unlockLogos();
  };

  const cancelPendingActivation = () => {
    if (activationTimer === null) return;
    window.clearTimeout(activationTimer);
    activationTimer = null;
    resetAssistant();
  };

  const setAssistantActive = (isActive) => {
    document.body.classList.toggle("has-brand-assistant", isActive);
    logoTriggers.forEach((trigger) => {
      const image = trigger.matches("img") ? trigger : trigger.querySelector("img");
      if (image) {
        image.alt = isActive ? "Logotipo do Cube Cat Software" : "Logotipo do Cube Cat Jogos";
      }
    });
    assistant.classList.toggle("is-active", isActive);
    if (isActive) {
      dialogueQueue = [];
      bubble.hidden = false;
      bubble.textContent = "Wifi Cat online. Olá, jogador! 🤖📶";
      assistant.classList.add("is-speaking");
      window.clearTimeout(dialogueTimer);
      dialogueTimer = window.setTimeout(() => {
        assistant.classList.remove("is-speaking");
        dialogueTimer = window.setTimeout(showNextDialogue, 5000);
      }, 2600);
    } else {
      window.clearTimeout(dialogueTimer);
      dialogueQueue = [];
      assistant.classList.remove("is-speaking");
      bubble.hidden = true;
    }
  };

  logoTriggers.forEach((trigger) => trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (activationTimer !== null) return;

    logoTriggers.forEach((logoTrigger) => {
      logoTrigger.classList.add("is-assistant-pending");
      logoTrigger.setAttribute("aria-disabled", "true");
    });

    if (assistant.classList.contains("is-active")) {
      window.clearTimeout(dialogueTimer);
      assistant.classList.add("is-speaking");
      bubble.hidden = false;
      bubble.textContent = "Desconectando... Até a próxima, jogador! 🤖👋📶";
      activationTimer = window.setTimeout(() => {
        activationTimer = null;
        setAssistantActive(false);
        logoTriggers.forEach((logoTrigger) => {
          const image = logoTrigger.matches("img") ? logoTrigger : logoTrigger.querySelector("img");
          if (image) image.src = BRAND_LOGO_URL;
        });
        unlockLogos();
      }, 1800);
      return;
    }

    activationTimer = window.setTimeout(() => {
      activationTimer = null;
      unlockLogos();
      setAssistantActive(true);
      logoTriggers.forEach((logoTrigger) => {
        const image = logoTrigger.matches("img") ? logoTrigger : logoTrigger.querySelector("img");
        if (image) image.src = HEADLESS_BRAND_LOGO_URL;
      });
    }, ASSISTANT_ACTIVATION_DELAY);
  }));

  window.addEventListener("cube-cat-navigation-start", cancelPendingActivation);
  window.addEventListener("beforeunload", cancelPendingActivation, { once: true });
}

setupGameReactionPopup();
setupGameQuickMenu();
setupBrandAssistant();

document.getElementById("btn-jogo1")?.addEventListener("click", () => {
  showLoadingScreen("Jogo%20de%20quiz%20js/index.html");
});

document.getElementById("btn-jogo2")?.addEventListener("click", () => {
  showLoadingScreen("Jogo%20say%20my%20name/menu/say-my-name.html");
});

document.querySelectorAll('a[href]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (link.target && link.target !== "_self") ||
      link.hasAttribute("download")
    ) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.protocol !== window.location.protocol || destination.host !== window.location.host) return;
    if (destination.pathname === window.location.pathname && destination.hash) return;

    event.preventDefault();
    showLoadingScreen(destination.href);
  });
});

// O painel existe somente neste checkout e só roda em ambiente local.
const isLocalEnvironment = window.location.protocol === "file:" ||
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

if (isLocalEnvironment) {
  const devModeScript = document.createElement("script");
  devModeScript.src = new URL("../dev-mode/dev-mode.js", document.currentScript.src).href;
  document.body.appendChild(devModeScript);
}
