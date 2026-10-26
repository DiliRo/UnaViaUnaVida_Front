const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "rutaSeguraModules";
const params = new URLSearchParams(location.search);
const moduleId = params.get("module");
const lessonIndex = Number(params.get("lesson") || 0);

let modules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let module = modules.find(item => String(item.id) === String(moduleId));
let lesson;
let questions = [];
let questionIndex = 0;
let lives = 1;
let answered = false;

function normalizeQuestion(question) {
  const oldOptions = Array.isArray(question.options) ? question.options : [];
  const answers = question.answers || question.respuestas || oldOptions.map((option, index) => ({
    text: typeof option === "string" ? option : option.text,
    correct: typeof option === "object"
      ? Boolean(option.correct)
      : index === Number(question.correctOption)
  }));

  return {
    statement: question.statement || question.enunciado || "",
    feedback: question.feedback || question.retroalimentacion || "",
    answers
  };
}

function showError(text) {
  $("#lesson-content").classList.add("hidden");
  $("#error-view").classList.remove("hidden");
  $("#error-text").textContent = text;
}

function renderLives() {
  $("#lives").innerHTML = Array.from({ length: lives }, () =>
    '<span class="text-[1.3rem] text-[#D9363E]">♥</span>'
  ).join("") || '<span class="font-bold text-[#D9363E]">0</span>';
}

function renderQuestion() {
  const question = questions[questionIndex];
  const total = questions.length;
  const percentage = Math.round(questionIndex / total * 100);

  answered = false;
  $("#feedback").classList.add("hidden");
  $("#next-button").classList.add("hidden");
  $("#question-number").textContent = `Pregunta ${questionIndex + 1}`;
  $("#question-progress").textContent = `Pregunta ${questionIndex + 1} de ${total}`;
  $("#progress-percent").textContent = `${percentage}%`;
  $("#progress-bar").style.width = `${percentage}%`;
  $("#question-statement").textContent = question.statement;

  $("#answers").innerHTML = question.answers.map((answer, index) => `
    <button
      type="button"
      data-answer="${index}"
      class="answer rounded-[0.7rem] border-[0.0625rem] border-[#DBE0DC] bg-[#F4F6F3] p-[1rem] text-left font-bold hover:border-[#168653] hover:bg-[#E0EFE7]"
    >
      ${answer.text}
    </button>
  `).join("");

  document.querySelectorAll(".answer").forEach(button => {
    button.addEventListener("click", () => checkAnswer(Number(button.dataset.answer)));
  });
}

function checkAnswer(index) {
  if (answered) return;
  answered = true;

  const question = questions[questionIndex];
  const selected = question.answers[index];
  const correct = question.answers.find(answer => answer.correct);
  const buttons = document.querySelectorAll(".answer");

  buttons.forEach((button, buttonIndex) => {
    button.disabled = true;

    if (question.answers[buttonIndex].correct) {
      button.className = "answer rounded-[0.7rem] border-[0.0625rem] border-[#168653] bg-[#E0EFE7] p-[1rem] text-left font-bold text-[#0F6840]";
    } else if (buttonIndex === index) {
      button.className = "answer rounded-[0.7rem] border-[0.0625rem] border-[#D9363E] bg-[#FDE8E9] p-[1rem] text-left font-bold text-[#A9242B]";
    }
  });

  const feedback = $("#feedback");
  feedback.classList.remove("hidden");

  if (selected.correct) {
    feedback.className = "mt-[1rem] rounded-[0.7rem] bg-[#E0EFE7] p-[1rem] text-[#0F6840]";
    $("#feedback-title").textContent = "¡Bien hecho!";
    $("#feedback-text").textContent = question.feedback || "Seleccionaste la respuesta correcta.";
  } else {
    lives--;
    renderLives();

    feedback.className = "mt-[1rem] rounded-[0.7rem] bg-[#FDE8E9] p-[1rem] text-[#A9242B]";
    $("#feedback-title").textContent = "Respuesta incorrecta";
    $("#feedback-text").textContent =
      `${question.feedback || "Revisa nuevamente el contenido de la lección."} La respuesta correcta es: ${correct?.text || "No definida"}.`;
  }

  if (lives <= 0) {
    $("#next-button").textContent = "Ver resultado";
  } else if (questionIndex === questions.length - 1) {
    $("#next-button").textContent = "Finalizar lección";
  } else {
    $("#next-button").textContent = "Siguiente pregunta →";
  }

  $("#next-button").classList.remove("hidden");
}

function finishLesson(completed) {
  $("#lesson-content").classList.add("hidden");
  $("#result-view").classList.remove("hidden");
  $("#progress-bar").style.width = completed ? "100%" : `${Math.round(questionIndex / questions.length * 100)}%`;
  $("#progress-percent").textContent = completed ? "100%" : $("#progress-percent").textContent;

  const icon = $("#result-icon");

  if (completed) {
    icon.textContent = "✓";
    icon.className = "mx-auto grid size-[4rem] place-items-center rounded-full bg-[#E0EFE7] text-[2rem] font-extrabold text-[#0F6840]";
    $("#result-title").textContent = "¡Lección completada!";
    $("#result-text").textContent = "Bien hecho. Avanzaste al siguiente nivel.";

    module.currentLevel = Math.min(
      Math.max(Number(module.currentLevel) || 1, lessonIndex + 2),
      Math.min(module.lessons.length, 6) + 1
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  } else {
    icon.textContent = "×";
    icon.className = "mx-auto grid size-[4rem] place-items-center rounded-full bg-[#FDE8E9] text-[2rem] font-extrabold text-[#A9242B]";
    $("#result-title").textContent = "Te quedaste sin vidas";
    $("#result-text").textContent = "Puedes regresar a la ruta e intentar nuevamente la lección.";
  }
}

$("#next-button").addEventListener("click", () => {
  if (lives <= 0) return finishLesson(false);
  if (questionIndex >= questions.length - 1) return finishLesson(true);

  questionIndex++;
  renderQuestion();
});

if (!module) {
  showError("No se encontró el módulo solicitado.");
} else if (!Array.isArray(module.lessons) || lessonIndex < 0 || lessonIndex >= Math.min(module.lessons.length, 6)) {
  showError("La lección solicitada no existe.");
} else {
  lesson = module.lessons[lessonIndex];
  questions = (lesson.questions || []).map(normalizeQuestion);
  lives = Math.min(5, Math.max(1, Number(lesson.maxAttempts) || 1));

  $("#module-name").textContent = module.title;
  $("#lesson-title").textContent = lesson.title;
  $("#lesson-description").textContent = lesson.description;
  renderLives();

  if (!questions.length) {
    showError("Esta lección todavía no tiene preguntas.");
  } else if (questions.some(question => !question.answers.length || !question.answers.some(answer => answer.correct))) {
    showError("Una o más preguntas no tienen respuestas válidas.");
  } else {
    renderQuestion();
  }
}