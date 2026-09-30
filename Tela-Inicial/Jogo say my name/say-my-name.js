document.getElementById("classic-mode")?.addEventListener("click", () => {
  showLoadingScreen(new URL("classico.html", window.location.href).href);
});

document.getElementById("fast-mode")?.addEventListener("click", () => {
  showLoadingScreen(new URL("rapido.html", window.location.href).href);
});

document.getElementById("inverse-mode")?.addEventListener("click", () => {
  showLoadingScreen(new URL("inverso.html", window.location.href).href);
});

const multiplayerCount = document.getElementById("mp-player-count");
const multiplayerNames = document.getElementById("mp-player-name-fields");
const multiplayerFeedback = document.getElementById("mp-setup-feedback");
let rememberedNames = [];

function renderMultiplayerNameFields() {
  rememberedNames = [...multiplayerNames.querySelectorAll("input")].map((input) => input.value);
  multiplayerNames.replaceChildren();
  for (let index = 0; index < Number(multiplayerCount.value); index += 1) {
    const label = document.createElement("label");
    label.htmlFor = `mp-player-${index}`;
    label.textContent = `Jogador ${index + 1}`;
    const input = document.createElement("input");
    input.id = `mp-player-${index}`;
    input.type = "text";
    input.maxLength = 24;
    input.autocomplete = "off";
    input.placeholder = `Nome do jogador ${index + 1}`;
    input.value = rememberedNames[index] || "";
    multiplayerNames.append(label, input);
  }
}

multiplayerCount.addEventListener("change", renderMultiplayerNameFields);
document.getElementById("start-multiplayer").addEventListener("click", () => {
  const names = [...multiplayerNames.querySelectorAll("input")].map((input) => input.value.trim());
  if (names.some((name) => !name)) {
    multiplayerFeedback.textContent = "Preencha o nome de todos os jogadores.";
    return;
  }
  if (new Set(names.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== names.length) {
    multiplayerFeedback.textContent = "Use um nome diferente para cada jogador.";
    return;
  }
  const destination = new URL("multiplayer.html", window.location.href);
  try {
    sessionStorage.setItem("sayMyNameMultiplayerPlayers", JSON.stringify(names));
  } catch {
    destination.searchParams.set("players", JSON.stringify(names));
  }
  showLoadingScreen(destination.href);
});

renderMultiplayerNameFields();
