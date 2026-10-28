document.querySelectorAll(".mode-card[data-destination]").forEach((button) => {
  button.addEventListener("click", () => {
    showLoadingScreen(new URL(button.dataset.destination, window.location.href).href);
  });
});

const multiplayerCount = document.getElementById("mp-player-count");
const multiplayerExtendedCount = document.getElementById("mp-player-count-more");
const multiplayerCountLabel = document.getElementById("mp-count-label");
const multiplayerExtendedCountLabel = document.getElementById("mp-count-more-label");
const multiplayerCountTitleNoun = document.getElementById("mp-count-title-noun");
const multiplayerNamesTitleNoun = document.getElementById("mp-names-title-noun");
const multiplayerCountStep = document.getElementById("mp-count-step");
const multiplayerNamesStep = document.getElementById("mp-names-step");
const multiplayerContinue = document.getElementById("mp-continue");
const multiplayerNames = document.getElementById("mp-player-name-fields");
const multiplayerFeedback = document.getElementById("mp-setup-feedback");
const rememberedNames = { players: [], teams: [] };
let selectedParticipantMode = "";

function participantLabel(mode, plural = false) {
  if (mode === "teams") return plural ? "times" : "time";
  return plural ? "jogadores" : "jogador";
}

function saveCurrentNames() {
  if (selectedParticipantMode) {
    rememberedNames[selectedParticipantMode] = [...multiplayerNames.querySelectorAll("input")].map((input) => input.value);
  }
}

function updateParticipantCountLabels(mode) {
  const isExtendedCount = multiplayerCount.value === "more";
  multiplayerCountLabel.textContent = `Quantidade de ${participantLabel(mode, true)}`;
  multiplayerExtendedCountLabel.textContent = `Quantidade de ${participantLabel(mode, true)}`;
  multiplayerCountTitleNoun.textContent = participantLabel(mode, true);
  multiplayerNamesTitleNoun.textContent = participantLabel(mode);
  multiplayerExtendedCountLabel.hidden = !isExtendedCount;
  multiplayerExtendedCount.hidden = !isExtendedCount;
  [...multiplayerCount.options].forEach((option) => {
    if (option.value !== "more") {
      option.textContent = `${option.value} ${participantLabel(mode, true)}`;
    }
  });
  [...multiplayerExtendedCount.options].forEach((option) => {
    option.textContent = `${option.value} ${participantLabel(mode, true)}`;
  });
}

function renderMultiplayerNameFields() {
  const mode = selectedParticipantMode;
  const isExtendedCount = multiplayerCount.value === "more";
  const participantCount = isExtendedCount ? Number(multiplayerExtendedCount.value) : Number(multiplayerCount.value);
  saveCurrentNames();
  multiplayerFeedback.textContent = "";
  multiplayerNames.replaceChildren();
  for (let index = 0; index < participantCount; index += 1) {
    const field = document.createElement("div");
    field.className = "mp-player-field";
    const label = document.createElement("label");
    label.htmlFor = `mp-participant-${index}`;
    label.textContent = `${mode === "teams" ? "Time" : "Jogador"} ${index + 1}`;
    const input = document.createElement("input");
    input.id = `mp-participant-${index}`;
    input.type = "text";
    input.maxLength = 24;
    input.autocomplete = "off";
    input.placeholder = `Nome do ${participantLabel(mode)} ${index + 1}`;
    input.value = rememberedNames[mode][index] || "";
    field.append(label, input);
    multiplayerNames.append(field);
  }
}

const participantModeButtons = document.querySelectorAll(".mp-mode-button");
participantModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveCurrentNames();
    selectedParticipantMode = button.dataset.mode;
    participantModeButtons.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice === button));
    });
    updateParticipantCountLabels(selectedParticipantMode);
    multiplayerCountStep.hidden = false;
    multiplayerNamesStep.hidden = true;
    multiplayerNames.replaceChildren();
    multiplayerFeedback.textContent = "";
  });
});

document.querySelectorAll(".mp-help-button").forEach((button) => {
  button.addEventListener("click", () => {
    const explanation = document.getElementById(button.getAttribute("aria-controls"));
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    explanation.hidden = isExpanded;
  });
});

function resetNamesStep() {
  saveCurrentNames();
  multiplayerNamesStep.hidden = true;
  multiplayerNames.replaceChildren();
}

multiplayerCount.addEventListener("change", () => {
  updateParticipantCountLabels(selectedParticipantMode);
  resetNamesStep();
});
multiplayerExtendedCount.addEventListener("change", resetNamesStep);
multiplayerContinue.addEventListener("click", () => {
  if (!selectedParticipantMode) return;
  renderMultiplayerNameFields();
  multiplayerNamesStep.hidden = false;
});
document.getElementById("start-multiplayer").addEventListener("click", () => {
  const mode = selectedParticipantMode;
  const participant = participantLabel(mode);
  const names = [...multiplayerNames.querySelectorAll("input")].map((input) => input.value.trim());
  if (names.some((name) => !name)) {
    multiplayerFeedback.textContent = `Preencha o nome de todos os ${participantLabel(mode, true)}.`;
    return;
  }
  if (new Set(names.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== names.length) {
    multiplayerFeedback.textContent = `Use um nome diferente para cada ${participant}.`;
    return;
  }
  const destination = new URL("../multiplayer/multiplayer.html", window.location.href);
  try {
    sessionStorage.setItem("sayMyNameMultiplayerPlayers", JSON.stringify(names));
    sessionStorage.setItem("sayMyNameMultiplayerMode", mode);
  } catch {
    destination.searchParams.set("players", JSON.stringify(names));
    destination.searchParams.set("mode", mode);
  }
  showLoadingScreen(destination.href);
});

