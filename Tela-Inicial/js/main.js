const TRANSITION_VIDEO_URL = new URL("../carregamentoDeTela.mp4", document.currentScript.src).href;
const TRANSITION_VIDEO_SECONDS = 4;

function showLoadingScreen(destination) {
  if (document.querySelector(".transition-loader")) return;

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
  const continueNavigation = () => {
    if (navigationStarted) return;
    navigationStarted = true;
    window.location.assign(destination);
  };

  animation.addEventListener("timeupdate", () => {
    if (animation.currentTime >= TRANSITION_VIDEO_SECONDS) {
      animation.pause();
      continueNavigation();
    }
  });
  animation.addEventListener("error", continueNavigation, { once: true });
  window.setTimeout(continueNavigation, TRANSITION_VIDEO_SECONDS * 1000);
  animation.play().catch(() => {
    animation.controls = true;
    animation.addEventListener("loadeddata", () => animation.play().catch(() => {}), { once: true });
  });
}

document.getElementById("btn-jogo1")?.addEventListener("click", () => {
  showLoadingScreen("Jogo%20de%20quiz%20js/Jogo1.html");
});

document.getElementById("btn-jogo2")?.addEventListener("click", () => {
  showLoadingScreen("Jogo%20say%20my%20name/say-my-name.html");
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
