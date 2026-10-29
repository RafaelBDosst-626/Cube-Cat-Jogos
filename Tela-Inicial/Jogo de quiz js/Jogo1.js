const quizzes = {
  jogos: {
    title: "Quiz de Jogos Famosos",
    emoji: "🎮",
    questions: [
      {
        question: "Qual encanador é o herói mais famoso da Nintendo?",
        answers: [
          { id: 1, text: "Luigi", correct: false },
          { id: 2, text: "Mario", correct: true },
          { id: 3, text: "Sonic", correct: false },
          { id: 4, text: "Kirby", correct: false },
        ],
      },
      {
        question: "Em qual jogo os jogadores constroem usando blocos?",
        answers: [
          { id: 1, text: "Minecraft", correct: true },
          { id: 2, text: "FIFA", correct: false },
          { id: 3, text: "Pac-Man", correct: false },
          { id: 4, text: "The Sims", correct: false },
        ],
      },
      {
        question: "Que tipo de animal é Sonic?",
        answers: [
          { id: 1, text: "Uma raposa", correct: false },
          { id: 2, text: "Um ouriço", correct: true },
          { id: 3, text: "Um gato", correct: false },
          { id: 4, text: "Um coelho", correct: false },
        ],
      },
      {
        question: "Qual é o nome do irmão de Mario?",
        answers: [
          { id: 1, text: "Toad", correct: false },
          { id: 2, text: "Wario", correct: false },
          { id: 3, text: "Luigi", correct: true },
          { id: 4, text: "Yoshi", correct: false },
        ],
      },
      {
        question: "Em Pokémon, qual criatura amarela acompanha Ash com frequência?",
        answers: [
          { id: 1, text: "Eevee", correct: false },
          { id: 2, text: "Pikachu", correct: true },
          { id: 3, text: "Psyduck", correct: false },
          { id: 4, text: "Jigglypuff", correct: false },
        ],
      },
      {
        question: "Qual é o nome do herói que vive as aventuras da série The Legend of Zelda?",
        answers: [
          { id: 1, text: "Link", correct: true },
          { id: 2, text: "Zelda", correct: false },
          { id: 3, text: "Ganondorf", correct: false },
          { id: 4, text: "Samus", correct: false },
        ],
      },
      {
        question: "Qual jogo de quebra-cabeça ficou famoso com peças que caem e se encaixam?",
        answers: [
          { id: 1, text: "Tetris", correct: true },
          { id: 2, text: "Pac-Man", correct: false },
          { id: 3, text: "Donkey Kong", correct: false },
          { id: 4, text: "Street Fighter", correct: false },
        ],
      },
      {
        question: "Em Among Us, como é chamado o jogador que tenta sabotar a missão?",
        answers: [
          { id: 1, text: "Capitão", correct: false },
          { id: 2, text: "Impostor", correct: true },
          { id: 3, text: "Construtor", correct: false },
          { id: 4, text: "Viajante", correct: false },
        ],
      },
      {
        question: "Qual personagem amarelo come pontos em um labirinto?",
        answers: [
          { id: 1, text: "Donkey Kong", correct: false },
          { id: 2, text: "Pac-Man", correct: true },
          { id: 3, text: "Mega Man", correct: false },
          { id: 4, text: "Sonic", correct: false },
        ],
      },
      {
        question: "Qual jogo de simulação permite criar pessoas chamadas Sims?",
        answers: [
          { id: 1, text: "The Sims", correct: true },
          { id: 2, text: "Animal Crossing", correct: false },
          { id: 3, text: "Minecraft", correct: false },
          { id: 4, text: "Mario Kart", correct: false },
        ],
      },
    ],
  }
};

const params = new URLSearchParams(window.location.search);
const requestedQuiz = params.get("quiz") || "animacoes";
const selectedQuiz = { espaco: "planetas", animacoes: "conhecimento" }[requestedQuiz] || requestedQuiz;
const difficultyLabels = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
const requestedDifficulty = params.get("difficulty");
const activeDifficulty = Object.hasOwn(difficultyLabels, requestedDifficulty) ? requestedDifficulty : "easy";
const spaceQuiz = window.spaceQuizData?.[selectedQuiz];
const animationQuiz = window.animationQuizData?.[selectedQuiz];
const thematicQuiz = spaceQuiz || animationQuiz;
const activeQuiz = thematicQuiz
  ? { title: thematicQuiz.title, emoji: thematicQuiz.emoji }
  : quizzes[selectedQuiz] || quizzes.jogos;
const questions = thematicQuiz
  ? thematicQuiz.levels[activeDifficulty].map((item) => ({
      question: item.question,
      explanation: item.explanation,
      answers: item.answers.map((text, index) => ({ id: index + 1, text, correct: index === item.correct })),
    }))
  : activeQuiz.questions;
const quizTitle = document.getElementById("quiz-title");
quizTitle.textContent = `${activeQuiz.emoji} ${activeQuiz.title}`;
document.title = `${activeQuiz.title} | Cube Cat Jogos`;

const difficultyBadge = document.getElementById("difficulty-badge");
const resultPanel = document.getElementById("quiz-result");
const scoreSummary = document.getElementById("score-summary");
const scorePoints = document.getElementById("score-points");
const scoreAward = document.getElementById("score-award");
const perfectRunStatus = document.getElementById("perfect-run-status");
const personalRecord = document.getElementById("personal-record");
const attemptHistory = document.getElementById("attempt-history");
const savedHistory = document.getElementById("saved-history");
const restartButton = document.getElementById("restart-quiz");
const continueButton = document.getElementById("continue-harder");
const chooseTopicLink = document.getElementById("choose-topic");
const quizBackLink = document.getElementById("quiz-back-link");
if (thematicQuiz) {
  difficultyBadge.textContent = `Nível ${difficultyLabels[activeDifficulty]}`;
  difficultyBadge.dataset.level = activeDifficulty;
  difficultyBadge.hidden = false;
  document.title = `${activeQuiz.title} — ${difficultyLabels[activeDifficulty]} | Cube Cat Jogos`;
  const topicsPath = animationQuiz ? "../Animacoes/index.html" : "../Universo/index.html";
  const topicsLabel = animationQuiz ? "← Voltar aos temas de animação" : "← Voltar aos temas do universo";
  chooseTopicLink.href = topicsPath;
  quizBackLink.href = topicsPath;
  quizBackLink.textContent = topicsLabel;
  const nextLevel = { easy: "medium", medium: "hard" }[activeDifficulty];
  if (nextLevel) {
    continueButton.href = `Jogo1.html?quiz=${encodeURIComponent(selectedQuiz)}&difficulty=${nextLevel}`;
    continueButton.textContent = `Continuar: nível ${difficultyLabels[nextLevel]}`;
    continueButton.hidden = false;
  }
}

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const answerExplanation = document.getElementById("answer-explanation");
const nextButton = document.getElementById("next-btn");
const questionCounter = document.getElementById("question-counter");
const questionProgress = document.getElementById("question-progress");
let perfectRunToken = "";
let activePerfectRun = false;
if (thematicQuiz && activeDifficulty !== "easy") {
  perfectRunToken = params.get("run") || "";
  activePerfectRun = window.CubeCatQuizProgress.startPerfectRunLevel(selectedQuiz, activeDifficulty, perfectRunToken);
} else {
  window.CubeCatQuizProgress.invalidatePerfectRun();
}

let currentQuestionIndex = 0;
let score = 0;
let hasStartedQuiz = false;
let wrongInRound = false;

function setupProgressBar() {
  questionProgress.style.setProperty("--question-count", questions.length);
  questionProgress.setAttribute("aria-valuemax", questions.length);
  questionProgress.replaceChildren();

  questions.forEach(() => {
    const segment = document.createElement("span");
    segment.classList.add("quiz-progress__segment");
    segment.setAttribute("aria-hidden", "true");
    questionProgress.appendChild(segment);
  });
}

function updateProgress(isFinished = false) {
  const activeQuestion = isFinished ? questions.length : currentQuestionIndex + 1;
  questionCounter.textContent = isFinished
    ? `Quiz concluído — ${questions.length} perguntas`
    : `Pergunta ${activeQuestion} de ${questions.length}`;

  questionProgress.setAttribute("aria-valuenow", activeQuestion);
  questionProgress.setAttribute("aria-valuetext", `${activeQuestion} de ${questions.length} perguntas`);

  Array.from(questionProgress.children).forEach((segment, index) => {
    segment.classList.toggle("is-current", !isFinished && index === currentQuestionIndex);
  });
}

function startQuiz() {
  if (hasStartedQuiz) {
    window.CubeCatQuizProgress.invalidatePerfectRun();
    perfectRunToken = "";
    activePerfectRun = false;
  }
  hasStartedQuiz = true;
  currentQuestionIndex = 0;
  score = 0;
  wrongInRound = false;
  resultPanel.hidden = true;
  Array.from(questionProgress.children).forEach((segment) => {
    segment.classList.remove("is-correct", "is-incorrect", "is-current");
  });
  nextButton.textContent = "Próxima";
  showQuestion();
}

function showQuestion() {
  resetState();
  updateProgress();
  const currentQuestion = questions[currentQuestionIndex];
  const questionNo = currentQuestionIndex + 1;
  questionElement.textContent = `${questionNo}. ${currentQuestion.question}`;

  const shuffledAnswers = [...currentQuestion.answers];
  for (let index = shuffledAnswers.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledAnswers[index], shuffledAnswers[randomIndex]] = [shuffledAnswers[randomIndex], shuffledAnswers[index]];
  }

  shuffledAnswers.forEach((answer) => {
    const button = document.createElement("button");
    button.textContent = answer.text;
    button.classList.add("btn");
    answerButtons.appendChild(button);

    button.dataset.id = answer.id;
    button.dataset.correct = String(answer.correct);

    button.addEventListener("click", selectAnswer);
  });
}

function resetState() {
  nextButton.style.display = "none";
  answerExplanation.hidden = true;
  answerButtons.replaceChildren();
}

function selectAnswer(e) {
  const answers = questions[currentQuestionIndex].answers;
  const correctAnswer = answers.find((answer) => answer.correct);
  const selectedBtn = e.currentTarget;
  const isCorrect = Number(selectedBtn.dataset.id) === correctAnswer.id;
  if (isCorrect) {
    selectedBtn.classList.add("correct");
    score++;
    window.CubeCatAudio?.playEffect("correct");
  } else {
    selectedBtn.classList.add("incorrect");
    window.CubeCatAudio?.playEffect("wrong");
    wrongInRound = true;
    window.CubeCatQuizProgress.invalidatePerfectRun();
    activePerfectRun = false;
    perfectRunToken = "";
  }
  const currentProgressSegment = questionProgress.children[currentQuestionIndex];
  currentProgressSegment.classList.remove("is-current");
  currentProgressSegment.classList.add(isCorrect ? "is-correct" : "is-incorrect");

  Array.from(answerButtons.children).forEach((button) => {
    if (button.dataset.correct === "true") {
      button.classList.add("correct");
    }
    button.disabled = true;
  });
  const explanation = questions[currentQuestionIndex].explanation;
  if (explanation) {
    answerExplanation.textContent = explanation;
    answerExplanation.hidden = false;
  }
  nextButton.style.display = "block";
}

function showScore() {
  resetState();
  updateProgress(true);
  window.CubeCatAudio?.playEffect("gameOver");
  const result = window.CubeCatQuizProgress.recordAttempt({
    quizId: selectedQuiz,
    level: activeDifficulty,
    correct: score,
  });
  let continuationToken = "";
  let easterEggUnlocked = false;
  if (thematicQuiz && activeDifficulty === "easy") {
    window.CubeCatQuizProgress.invalidatePerfectRun();
    if (score === 10) continuationToken = window.CubeCatQuizProgress.beginPerfectRun(selectedQuiz);
  } else if (thematicQuiz && activePerfectRun) {
    const runResult = window.CubeCatQuizProgress.completePerfectRunLevel(
      selectedQuiz,
      activeDifficulty,
      perfectRunToken,
      score === 10,
    );
    continuationToken = runResult.nextToken;
    easterEggUnlocked = runResult.unlocked;
    activePerfectRun = false;
    if (easterEggUnlocked) result.saved = window.CubeCatQuizProgress.unlockBlackBorder(selectedQuiz) || result.saved;
  } else if (thematicQuiz) {
    window.CubeCatQuizProgress.invalidatePerfectRun();
  }

  if (thematicQuiz && activeDifficulty !== "hard") {
    const nextLevel = activeDifficulty === "easy" ? "medium" : "hard";
    const nextUrl = new URL(`Jogo1.html?quiz=${encodeURIComponent(selectedQuiz)}&difficulty=${nextLevel}`, window.location.href);
    if (continuationToken) nextUrl.searchParams.set("run", continuationToken);
    continueButton.href = nextUrl.href;
  }
  questionElement.textContent = "Rodada concluída!";
  scoreSummary.textContent = `Você acertou ${score} de ${questions.length}!`;
  scorePoints.textContent = `Pontuação: ${result.score} de ${result.maxScore} pontos`;
  scoreAward.className = `score-award${result.medal ? ` is-${result.medal}` : ""}`;
  scoreAward.textContent = result.medal
    ? `${{ bronze: "🥉", silver: "🥈", gold: "🥇" }[result.medal]} Medalha ${result.medalLabel}`
    : `Faltam ${Math.max(6 - score, 0)} acerto(s) para gravar a primeira medalha Bronze.`;
  if (result.record) {
    const recordStatus = !result.medal
      ? "Esta tentativa não alcançou Bronze e não foi salva."
      : result.saved
        ? result.isNewRecord ? "Novo recorde gravado neste dispositivo." : "Tentativa válida registrada neste dispositivo."
        : "O navegador não permitiu gravar este recorde.";
    personalRecord.textContent = `Seu melhor neste nível: ${result.record.bestScore} pontos${result.isNewRecord ? " — novo recorde!" : ""} ${recordStatus}`;
  } else {
    personalRecord.textContent = result.medal && !result.saved
      ? "Você ganhou uma medalha, mas o navegador não permitiu gravar o recorde."
      : "Recorde ainda não salvo. Alcance pelo menos 6 acertos para ganhar Bronze.";
  }
  if (easterEggUnlocked) scoreAward.textContent += " ✦ Recompensa especial desbloqueada!";
  if (thematicQuiz) {
    if (easterEggUnlocked) perfectRunStatus.textContent = "Recompensa especial desbloqueada!";
    else if (score === questions.length) perfectRunStatus.textContent = "Rodada perfeita!";
    else if (wrongInRound) perfectRunStatus.textContent = "Rodada concluída.";
    else perfectRunStatus.textContent = "Boa rodada!";
  } else {
    perfectRunStatus.textContent = "";
  }
  attemptHistory.replaceChildren();
  result.history.slice(-10).reverse().forEach((attempt, index) => {
    const item = document.createElement("li");
    const medal = attempt.medal ? ` — ${window.CubeCatQuizProgress.medalLabels[attempt.medal]}` : "";
    item.textContent = `Tentativa ${result.history.length - index}: ${attempt.correct}/10 — ${attempt.score} pontos${medal}`;
    attemptHistory.append(item);
  });
  savedHistory.replaceChildren();
  (result.record?.history || []).slice(-10).reverse().forEach((attempt) => {
    const item = document.createElement("li");
    item.textContent = `${attempt.correct}/10 — ${attempt.score} pontos — ${new Date(attempt.playedAt).toLocaleDateString("pt-BR")}`;
    savedHistory.append(item);
  });
  resultPanel.hidden = false;
}

function handleNextButton() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showScore();
  }
}

nextButton.addEventListener("click", handleNextButton);
restartButton.addEventListener("click", startQuiz);

setupProgressBar();
startQuiz();
