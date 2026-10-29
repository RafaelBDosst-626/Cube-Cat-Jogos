document.querySelectorAll(".mode-card[data-destination]").forEach((button) => {
  button.addEventListener("click", () => {
    showLoadingScreen(new URL(button.dataset.destination, window.location.href).href);
  });
});

const multiplayerCount = document.getElementById("mp-player-count");
const multiplayerCountLabel = document.getElementById("mp-count-label");
const multiplayerCountTitleNoun = document.getElementById("mp-count-title-noun");
const multiplayerModeStep = document.getElementById("mp-mode-step");
const multiplayerCountStep = document.getElementById("mp-count-step");
const multiplayerNamesStep = document.getElementById("mp-names-step");
const multiplayerModeAnswer = document.getElementById("mp-mode-answer");
const multiplayerCountAnswer = document.getElementById("mp-count-answer");
const multiplayerContinue = document.getElementById("mp-continue");
const multiplayerRoster = document.getElementById("mp-participant-roster");
const multiplayerFeedback = document.getElementById("mp-setup-feedback");
const multiplayerProductCount = document.getElementById("mp-product-count");
const multiplayerFormatSettings = document.getElementById("mp-format-settings");
const multiplayerVersusOption = document.getElementById("mp-versus-option");
const multiplayerVersusUnavailable = document.getElementById("mp-versus-unavailable");
const multiplayerVersusTwoDescription = document.getElementById("mp-versus-two-description");
const multiplayerVersusFourDescription = document.getElementById("mp-versus-four-description");
let selectedParticipantMode = "";
let generatedTeamNames = [];

const multiplayerSetupSteps = [multiplayerModeStep, multiplayerCountStep, multiplayerNamesStep];

function activateSetupStep(activeStep) {
  multiplayerSetupSteps.forEach((step) => {
    const isActive = step === activeStep;
    const isCompleted = !isActive && step.classList.contains("is-complete");
    step.hidden = !isActive && !isCompleted;
    step.open = isActive;
    step.classList.toggle("is-active", isActive);
    if (isActive) step.classList.remove("is-complete");
  });
}

function completeSetupStep(step, answer, description, nextStep) {
  answer.textContent = description;
  step.classList.add("is-complete");
  activateSetupStep(nextStep);
}

multiplayerSetupSteps.forEach((step) => {
  step.addEventListener("toggle", () => {
    if (!step.open) return;
    multiplayerSetupSteps.forEach((otherStep) => {
      if (otherStep !== step) otherStep.open = false;
    });
    step.classList.remove("is-complete");
  });
});

function participantLabel(mode, plural = false) {
  if (mode === "teams") return plural ? "times" : "time";
  return plural ? "jogadores" : "jogador";
}

function createTeamNames(count) {
  const firstParts = ["Zorpa", "Blim", "Teco", "Furbi", "Nanu", "Pipo", "Giga", "Quiru", "Malu", "Trombi"];
  const lastParts = ["fuso", "quark", "bip", "tronha", "lito", "zuca", "plex", "dengo", "mático", "nex"];
  const names = new Set();
  while (names.size < count) {
    const first = firstParts[Math.floor(Math.random() * firstParts.length)];
    const last = lastParts[Math.floor(Math.random() * lastParts.length)];
    names.add(`${first}${last}`);
  }
  return [...names];
}

function updateParticipantCountLabels(mode) {
  multiplayerCountLabel.textContent = `Quantidade de ${participantLabel(mode, true)}`;
  multiplayerCountTitleNoun.textContent = participantLabel(mode, true);
  [...multiplayerCount.options].forEach((option) => {
    option.textContent = `${option.value} ${participantLabel(mode, true)}`;
    option.hidden = false;
  });
}

function updateTeamFormatOptions() {
  const teamCount = Number(multiplayerCount.value);
  const canPlayVersus = selectedParticipantMode === "teams" && (teamCount === 2 || teamCount === 4);
  multiplayerFormatSettings.hidden = selectedParticipantMode !== "teams";
  multiplayerVersusOption.hidden = !canPlayVersus;
  multiplayerVersusUnavailable.hidden = selectedParticipantMode !== "teams" || teamCount !== 3;
  multiplayerVersusTwoDescription.hidden = teamCount !== 2;
  multiplayerVersusFourDescription.hidden = teamCount !== 4;
  if (!canPlayVersus) document.querySelector('input[name="mp-team-format"][value="all-play"]').checked = true;
}

function configuredParticipants(mode = selectedParticipantMode) {
  const playerNames = ["Java", "Python", "Ruby", "C++"];
  if (mode === "teams") {
    const count = Number(multiplayerCount.value);
    return generatedTeamNames.length === count ? [...generatedTeamNames] : createTeamNames(count);
  }
  return playerNames.slice(0, Number(multiplayerCount.value));
}

function renderParticipantRoster() {
  multiplayerRoster.replaceChildren();
  multiplayerRoster.classList.toggle("is-team-roster", selectedParticipantMode === "teams");
  const participantNames = configuredParticipants();
  const teamColors = ["#ff3b5c", "#31aaff", "#ffe34d", "#39ef91"];
  participantNames.forEach((name, index) => {
    const card = document.createElement("article");
    card.className = "mp-roster-card";
    const avatar = window.CubeCatPixelAvatar.create(index);
    if (selectedParticipantMode === "teams") {
      card.classList.add("mp-roster-card-team");
      card.style.setProperty("--team-neon", teamColors[index]);
      if (participantNames.length === 2) {
        card.classList.add(`team-side-${index === 0 ? "left" : "right"}`);
        const side = document.createElement("span");
        side.className = "mp-roster-side";
        side.textContent = index === 0 ? "Lado esquerdo" : "Lado direito";
        card.append(side);
      }
    }
    const label = document.createElement("strong");
    label.textContent = name;
    card.append(avatar, label);
    multiplayerRoster.append(card);
  });
}

const participantModeButtons = document.querySelectorAll(".mp-mode-button");
participantModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextMode = button.dataset.mode;
    selectedParticipantMode = nextMode;
    if (selectedParticipantMode === "teams") generatedTeamNames = createTeamNames(Number(multiplayerCount.value));
    participantModeButtons.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice === button));
    });
    updateParticipantCountLabels(selectedParticipantMode);
    updateTeamFormatOptions();
    completeSetupStep(
      multiplayerModeStep,
      multiplayerModeAnswer,
      selectedParticipantMode === "teams" ? "Times" : "Jogadores",
      multiplayerCountStep
    );
    multiplayerRoster.replaceChildren();
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

function resetRosterStep() {
  multiplayerRoster.replaceChildren();
  if (selectedParticipantMode) activateSetupStep(multiplayerCountStep);
}

multiplayerCount.addEventListener("change", () => {
  if (selectedParticipantMode === "teams") generatedTeamNames = createTeamNames(Number(multiplayerCount.value));
  updateTeamFormatOptions();
  resetRosterStep();
});
multiplayerContinue.addEventListener("click", () => {
  if (!selectedParticipantMode) return;
  renderParticipantRoster();
  updateTeamFormatOptions();
  multiplayerFeedback.textContent = "";
  const participantCount = configuredParticipants().length;
  completeSetupStep(
    multiplayerCountStep,
    multiplayerCountAnswer,
    `${participantCount} ${participantLabel(selectedParticipantMode, true)}`,
    multiplayerNamesStep
  );
});
document.getElementById("start-multiplayer").addEventListener("click", () => {
  const mode = selectedParticipantMode;
  const names = configuredParticipants(mode);
  const destination = new URL("../multiplayer/multiplayer.html", window.location.href);
  try {
    sessionStorage.setItem("sayMyNameMultiplayerPlayers", JSON.stringify(names));
    sessionStorage.setItem("sayMyNameMultiplayerMode", mode);
    sessionStorage.setItem("sayMyNameMultiplayerProductCount", multiplayerProductCount.value);
    sessionStorage.setItem("sayMyNameMultiplayerCompetition", document.querySelector('input[name="mp-team-format"]:checked')?.value || "all-play");
  } catch {
    destination.searchParams.set("players", JSON.stringify(names));
    destination.searchParams.set("mode", mode);
    destination.searchParams.set("productCount", multiplayerProductCount.value);
    destination.searchParams.set("competition", document.querySelector('input[name="mp-team-format"]:checked')?.value || "all-play");
  }
  showLoadingScreen(destination.href);
});

