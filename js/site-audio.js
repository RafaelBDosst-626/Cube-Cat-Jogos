(() => {
  const musicPath = "../assets/Efeitos Sonoros/Som_de_fundo.wav";
  const soundPaths = {
    button: "../assets/Efeitos Sonoros/Mobile Game Button 1.wav",
    gameOver: "../assets/Efeitos Sonoros/Game_over.wav",
    correct: "../assets/Efeitos Sonoros/resposta_certa.wav",
    wrong: "../assets/Efeitos Sonoros/Resposta_errada.wav",
    lifeLost: "../assets/Efeitos Sonoros/Perca_de_Vida.mpeg",
    timer: "../assets/Efeitos Sonoros/Timer.wav",
  };
  const MUSIC_MUTED_KEY = "cubeCatBackgroundMusicMutedV1";
  const MUSIC_TIME_KEY = "cubeCatBackgroundMusicTimeV1";
  const scriptUrl = document.currentScript.src;
  const music = new Audio(new URL(musicPath, scriptUrl));
  const button = document.createElement("button");
  const effects = new Map();
  let lastSavedAt = 0;
  let muted = false;

  try {
    muted = localStorage.getItem(MUSIC_MUTED_KEY) === "true";
  } catch {
    // The on-screen control still works when storage is unavailable.
  }

  music.loop = true;
  music.preload = "auto";
  music.volume = 0.22;
  music.muted = muted;

  button.type = "button";
  button.className = "background-music-toggle";
  button.setAttribute("aria-pressed", String(muted));
  button.setAttribute("aria-live", "polite");

  const updateButton = (blocked = false) => {
    const label = muted ? "Ativar música de fundo" : blocked ? "Ativar música de fundo" : "Mutar música de fundo";
    button.setAttribute("aria-label", label);
    button.title = blocked && !muted ? "Clique para iniciar a música de fundo" : label;
    button.textContent = muted ? "♫̸" : blocked ? "♫▶" : "♫";
    button.dataset.state = muted ? "muted" : blocked ? "blocked" : "playing";
    button.setAttribute("aria-pressed", String(muted));
  };

  const savePosition = () => {
    if (!Number.isFinite(music.currentTime)) return;
    try {
      sessionStorage.setItem(MUSIC_TIME_KEY, String(music.currentTime));
    } catch {
      // The music can continue without cross-page position memory.
    }
  };

  const playMusic = () => {
    if (muted) return;
    music.play().then(() => updateButton()).catch(() => updateButton(true));
  };

  button.addEventListener("click", () => {
    if (muted || music.paused) {
      muted = false;
      music.muted = false;
      try {
        localStorage.setItem(MUSIC_MUTED_KEY, "false");
      } catch {
        // Keep the preference for this page even when storage is unavailable.
      }
      playMusic();
      return;
    }

    muted = true;
    music.muted = true;
    try {
      localStorage.setItem(MUSIC_MUTED_KEY, "true");
    } catch {
      // Keep the preference for this page even when storage is unavailable.
    }
    updateButton();
    savePosition();
  });

  music.addEventListener("loadedmetadata", () => {
    try {
      const savedTime = Number(sessionStorage.getItem(MUSIC_TIME_KEY));
      if (Number.isFinite(savedTime) && savedTime >= 0 && savedTime < music.duration) music.currentTime = savedTime;
    } catch {
      // Session storage can be blocked in some file: browser contexts.
    }
  }, { once: true });
  music.addEventListener("timeupdate", () => {
    if (music.currentTime - lastSavedAt < 4) return;
    lastSavedAt = music.currentTime;
    savePosition();
  });
  music.addEventListener("play", () => updateButton());
  music.addEventListener("pause", () => { if (!muted) updateButton(true); });

  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".background-music-toggle")) return;
    if (!muted && music.paused) playMusic();
  }, { once: true, capture: true });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button, .btn-jogo, .difficulty") : null;
    if (!target || target.disabled || target.matches(".background-music-toggle, [data-no-sfx]")) return;
    window.CubeCatAudio.playEffect("button");
  });

  window.addEventListener("pagehide", savePosition);
  document.body.appendChild(button);
  updateButton();
  playMusic();

  window.CubeCatAudio = {
    playEffect(name) {
      const path = soundPaths[name];
      if (!path) return;
      let sound = effects.get(name);
      if (!sound) {
        sound = new Audio(new URL(path, scriptUrl));
        sound.preload = "auto";
        sound.volume = 0.65;
        effects.set(name, sound);
      }
      sound.currentTime = 0;
      sound.play().catch(() => {});
    },
  };
})();
