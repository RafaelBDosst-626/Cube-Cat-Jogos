const questions = [
  {
    question: "Qual é o pato mais famoso do mundo?",
    answers: [
      { id: 1, text: "Tio Patinhas", correct: false },
      { id: 2, text: "Pato Donald", correct: true },
      { id: 3, text: "Patolino", correct: false },
      { id: 4, text: "Pato MecDonald", correct: false },
    ],
  },
  {
    question: "Qual é o primeira animação 3D do mundo?",
    answers: [
      { id: 1, text: "Fuga das Galinhas", correct: false },
      { id: 2, text: "Shrek", correct: false },
      { id: 3, text: "Toy Story", correct: true },
      { id: 4, text: "Monstros S.A.", correct: false },
    ],
  },
  {
    question: "Ratagão é um personagem de qual desenho animado?",
    answers: [
      { id: 1, text: "Um conto Americano", correct: false },
      { id: 2, text: "as peripecias de um ratinho detetive", correct: true },
      { id: 3, text: "Bernado e Bianca", correct: false },
      { id: 4, text: "Stuar Litlle", correct: false },
    ],
  },
  {
    question: "Qual é o vilão mais famoso da Disney?",
    answers: [
      { id: 1, text: "Malevola", correct: true },
      { id: 2, text: "Scar", correct: false },
      { id: 3, text: "Hades", correct: false },
      { id: 4, text: "Cruela", correct: false },
    ],
  },
  {
    question: "Qual é o personagem mais fofo da Disney?",
    answers: [
      { id: 1, text: "Olaf", correct: false },
      { id: 2, text: "Simba", correct: false },
      { id: 3, text: "banguela", correct: false },
      { id: 4, text: "Stitch", correct: true },
    ],
  },
  {
    question: "Qual é o vilão mais carismatico da Disney?",
    answers: [
      { id: 1, text: "Rampiti Dampity", correct: false },
      { id: 2, text: "Scar", correct: true },
      { id: 3, text: "Hades", correct: false },
      { id: 4, text: "Ratagão", correct: false },
    ],
  },
  {
    question: "Qual é o vilão mais injustiçado?",
    answers: [
      { id: 1, text: "thay lung", correct: true },
      { id: 2, text: "scar", correct: false },
      { id: 3, text: "Capitão gancho", correct: false },
      { id: 4, text: "Cruela", correct: false },
    ],
  },
  {
    question: "Qual é o vilão mais forte da dreamworks ?",
    answers: [
      { id: 1, text: "Rumpelstiltskin", correct: false },
      { id: 2, text: "Breu", correct: false },
      { id: 3, text: "Lobo (Gato de botas 2)", correct: true },
      { id: 4, text: "General kai", correct: false },
    ],
  },
  {
    question: "Qual é o vilão mais cruel da Disney?",
    answers: [
      { id: 1, text: "Frollo", correct: true },
      { id: 2, text: "Scar", correct: false },
      { id: 3, text: "Urssula", correct: false },
      { id: 4, text: "Jaffar", correct: false },
    ],
  },
  {
    question: "Qual é o melhor vilão de Kung fu panda?",
    answers: [
      { id: 1, text: "Lorde Shen", correct: false },
      { id: 2, text: "Tai lung", correct: false },
      { id: 3, text: "Camaleoa", correct: false },
      { id: 4, text: "General Kai", correct: true },
    ],
  },
];

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");
const questionCounter = document.getElementById("question-counter");
const questionProgress = document.getElementById("question-progress");

let currentQuestionIndex = 0;
let score = 0;

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
  currentQuestionIndex = 0;
  score = 0;
  Array.from(questionProgress.children).forEach((segment) => {
    segment.classList.remove("is-correct", "is-incorrect", "is-current");
  });
  nextButton.innerHTML = "Próxima";
  showQuestion();
}

function showQuestion() {
  resetState();
  updateProgress();
  let currentQuestion = questions[currentQuestionIndex];
  let questionNo = currentQuestionIndex + 1;
  questionElement.innerHTML = questionNo + ". " + currentQuestion.question;

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.innerHTML = answer.text;
    button.classList.add("btn");
    answerButtons.appendChild(button);

    button.dataset.id = answer.id;

    button.addEventListener("click", selectAnswer);
  });
}

function resetState() {
  nextButton.style.display = "none";
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
}

function selectAnswer(e) {
  answers = questions[currentQuestionIndex].answers;
  const correctAnswer = answers.filter((answer) => answer.correct == true)[0];
  const selectedBtn = e.target;
  const isCorrect = selectedBtn.dataset.id == correctAnswer.id;
  if (isCorrect) {
    selectedBtn.classList.add("correct");
    score++;
  } else {
    selectedBtn.classList.add("incorrect");
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
  nextButton.style.display = "block";
}

function showScore() {
  resetState();
  updateProgress(true);
  questionElement.innerHTML = `Você acertou ${score} de ${questions.length}!`;
  nextButton.innerHTML = "Play Again";
  nextButton.style.display = "block";
}

function handleNextButton() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showScore();
  }
}

nextButton.addEventListener("click", () => {
  if (currentQuestionIndex < questions.length) {
    handleNextButton();
  } else {
    startQuiz();
  }
});

setupProgressBar();
startQuiz();
