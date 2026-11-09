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

function setupColorTheme() {
  const storageKey = "cubeCatColorThemeV1";
  const themes = new Set(["classic", "dark", "kids"]);
  let activeTheme = "classic";
  try {
    const savedTheme = localStorage.getItem(storageKey);
    if (themes.has(savedTheme)) activeTheme = savedTheme;
  } catch {
    // The current page can still change themes if storage is unavailable.
  }
  document.documentElement.dataset.colorTheme = activeTheme;

  window.CubeCatTheme = {
    get() { return activeTheme; },
    set(theme) {
      if (!themes.has(theme)) return activeTheme;
      activeTheme = theme;
      document.documentElement.dataset.colorTheme = activeTheme;
      try {
        localStorage.setItem(storageKey, activeTheme);
      } catch {
        // Keep the selection for this page when storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent("cube-cat:theme-change", { detail: { theme: activeTheme } }));
      return activeTheme;
    },
  };
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
  } else if (document.querySelector("[data-game-timer], .timer-track, .timer-stat, [id*='timer' i], [class*='timer' i]")) {
    destination = new URL("index.html", window.location.href).href;
    gameName = document.title || "Jogo";
    exitLabel = "Sair da partida";
  } else {
    return;
  }

  const menu = document.createElement("div");
  menu.className = "game-quick-menu";

  const backdrop = document.createElement("button");
  backdrop.className = "game-quick-menu__backdrop";
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "Fechar configurações");
  backdrop.hidden = true;

  const toggle = document.createElement("button");
  toggle.className = "game-quick-menu__toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir menu do jogo");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "game-quick-menu-panel");
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
  panel.setAttribute("aria-label", "Configurações do jogo");

  const message = document.createElement("div");
  message.className = "game-quick-menu__message";
  message.id = "game-quick-menu-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.setAttribute("aria-hidden", "true");
  message.hidden = true;

  const heading = document.createElement("p");
  heading.className = "game-quick-menu__heading";
  heading.textContent = "Configurações";

  const gameLabel = document.createElement("p");
  gameLabel.className = "game-quick-menu__game-label";
  gameLabel.textContent = gameName;

  const audioSection = document.createElement("section");
  audioSection.className = "game-quick-menu__section";
  audioSection.setAttribute("aria-labelledby", "game-quick-menu-audio-title");
  const audioTitle = document.createElement("h3");
  audioTitle.className = "game-quick-menu__section-title";
  audioTitle.id = "game-quick-menu-audio-title";
  audioTitle.textContent = "Som";
  const volumeLabel = document.createElement("label");
  volumeLabel.className = "game-quick-menu__volume-label";
  volumeLabel.htmlFor = "game-quick-menu-music-volume";
  const volumeName = document.createElement("span");
  volumeName.textContent = "Música de fundo";
  const volumeValue = document.createElement("output");
  volumeValue.className = "game-quick-menu__volume-value";
  volumeValue.htmlFor = "game-quick-menu-music-volume";
  volumeValue.textContent = "22%";
  volumeLabel.append(volumeName, volumeValue);
  const volumeSlider = document.createElement("input");
  volumeSlider.className = "game-quick-menu__volume-slider";
  volumeSlider.id = "game-quick-menu-music-volume";
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "100";
  volumeSlider.step = "1";
  volumeSlider.value = "22";
  volumeSlider.setAttribute("aria-label", "Volume da música de fundo");
  const muteMusic = document.createElement("button");
  muteMusic.className = "game-quick-menu__mute";
  muteMusic.type = "button";
  muteMusic.textContent = "Mutar música de fundo";
  audioSection.append(audioTitle, volumeLabel, volumeSlider, muteMusic);

  const screenSection = document.createElement("section");
  screenSection.className = "game-quick-menu__section game-quick-menu__screen-section";
  screenSection.setAttribute("aria-labelledby", "game-quick-menu-screen-title");
  const screenTitle = document.createElement("h3");
  screenTitle.className = "game-quick-menu__section-title";
  screenTitle.id = "game-quick-menu-screen-title";
  screenTitle.textContent = "Tela";
  const themeLabel = document.createElement("p");
  themeLabel.className = "game-quick-menu__theme-label";
  themeLabel.textContent = "Tema de cores";
  const themes = document.createElement("div");
  themes.className = "game-quick-menu__themes";
  themes.setAttribute("aria-label", "Prévia de temas de cores");
  [
    { id: "classic", name: "Clássico", colors: ["#3ddbdf", "#101a26", "#e8d94a"] },
    { id: "dark", name: "Escuro", colors: ["#56e9f5", "#090b0f", "#626a78"] },
    { id: "kids", name: "Infantil", colors: ["#35b9f4", "#6836e8", "#ff9425"] },
  ].forEach((theme) => {
    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "game-quick-menu__theme-preview";
    preview.dataset.theme = theme.id;
    preview.setAttribute("aria-pressed", "false");
    const swatches = document.createElement("span");
    swatches.className = "game-quick-menu__swatches";
    theme.colors.forEach((color) => {
      const swatch = document.createElement("span");
      swatch.style.setProperty("--swatch-color", color);
      swatches.appendChild(swatch);
    });
    const name = document.createElement("span");
    name.textContent = theme.name;
    preview.append(swatches, name);
    preview.addEventListener("click", () => window.CubeCatTheme?.set(theme.id));
    themes.appendChild(preview);
  });
  const syncThemeControls = () => {
    const activeTheme = window.CubeCatTheme?.get?.() || "classic";
    themes.querySelectorAll(".game-quick-menu__theme-preview").forEach((preview) => {
      const selected = preview.dataset.theme === activeTheme;
      preview.classList.toggle("is-current", selected);
      preview.setAttribute("aria-pressed", String(selected));
    });
  };
  window.addEventListener("cube-cat:theme-change", syncThemeControls);
  const themeNotice = document.createElement("p");
  themeNotice.className = "game-quick-menu__coming-soon";
  themeNotice.textContent = "A paleta escolhida se aplica à interface do jogo.";
  screenSection.append(screenTitle, themeLabel, themes, themeNotice);

  const exit = document.createElement("button");
  exit.className = "game-quick-menu__exit";
  exit.type = "button";
  exit.textContent = exitLabel;
  panel.append(heading, gameLabel, audioSection, screenSection, exit);
  menu.append(toggle, message, panel);
  document.body.appendChild(backdrop);
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

  const syncMusicControls = () => {
    const settings = window.CubeCatAudio?.getMusicSettings?.();
    if (!settings) return;
    const percent = Math.round(settings.volume * 100);
    volumeSlider.value = String(percent);
    volumeValue.value = `${percent}%`;
    volumeValue.textContent = `${percent}%`;
    muteMusic.textContent = settings.muted ? "Ativar música de fundo" : "Mutar música de fundo";
    muteMusic.setAttribute("aria-pressed", String(settings.muted));
    muteMusic.classList.toggle("is-muted", settings.muted);
  };

  volumeSlider.addEventListener("input", () => {
    const percent = Number(volumeSlider.value);
    volumeValue.value = `${percent}%`;
    volumeValue.textContent = `${percent}%`;
    window.CubeCatAudio?.setMusicVolume?.(percent / 100);
  });
  muteMusic.addEventListener("click", () => {
    const audio = window.CubeCatAudio;
    if (audio?.setMusicMuted && audio?.isMusicMuted) audio.setMusicMuted(!audio.isMusicMuted());
  });
  window.addEventListener("cube-cat:music-settings-change", syncMusicControls);
  window.addEventListener("load", syncMusicControls, { once: true });

  const setOpen = (isOpen) => {
    menu.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu do jogo" : "Abrir menu do jogo");
    panel.setAttribute("aria-hidden", String(!isOpen));
    panel.toggleAttribute("inert", !isOpen);
    backdrop.hidden = !isOpen;
    message.hidden = isOpen;
    message.setAttribute("aria-hidden", "true");
    syncMusicControls();
    syncThemeControls();

    window.clearTimeout(messageTimer);
    window.clearTimeout(messageHideTimer);
  };

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
  backdrop.addEventListener("click", () => setOpen(false));
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
setupColorTheme();
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
