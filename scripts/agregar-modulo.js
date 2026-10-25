const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const STORAGE_KEY = "rutaSeguraModules";
const MAX_LESSONS = 6;
const moduleForm = $("#module-form");
const lessonsForm = $("#lessons-form");
const lessonsContainer = $("#lessons-container");
const addLessonButton = $("#add-lesson-button");
const backButton = $("#back-button");
const lessonCount = $("#lesson-count");
const message = $("#form-message");
const pageTitle = $("#page-title");
const pageDescription = $("#page-description");
const stepOne = $("#step-one-indicator");
const stepTwo = $("#step-two-indicator");
const submitLessons = lessonsForm.querySelector('[type="submit"]');

let moduleData = {};
let lessons = [];
let selectedLesson = 0;
let lessonsReady = false;

const questionsView = document.createElement("section");
const summaryView = document.createElement("section");

questionsView.id = "questions-view";
questionsView.className = "mt-[1rem] hidden rounded-[1rem] bg-[#FFFFFF] p-[1.5rem] shadow-lg";
questionsView.innerHTML = `
  <h2 class="text-[1.3rem] font-extrabold">Crear preguntas</h2>
  <p id="lesson-name" class="mt-[0.3rem] font-bold text-[#168653]"></p>
  <form id="question-form" class="mt-[1rem] grid gap-[1rem]">
    <label><span class="text-[0.78rem] font-bold">Enunciado</span>
      <textarea id="statement" required rows="3" class="mt-[0.4rem] w-full rounded-[0.6rem] border-[0.0625rem] border-[#DBE0DC] p-[0.9rem] outline-none focus:border-[#168653]"></textarea>
    </label>
    <fieldset>
      <legend class="text-[0.78rem] font-bold">Opciones</legend>
      <p class="text-[0.72rem] text-[#68747B]">Marca la respuesta correcta.</p>
      <div id="options" class="mt-[0.7rem] grid gap-[0.6rem]"></div>
    </fieldset>
    <label><span class="text-[0.78rem] font-bold">Retroalimentación</span>
      <textarea id="feedback" required rows="3" class="mt-[0.4rem] w-full rounded-[0.6rem] border-[0.0625rem] border-[#DBE0DC] p-[0.9rem] outline-none focus:border-[#168653]"></textarea>
    </label>
    <button class="rounded-[0.65rem] bg-[#168653] px-[1rem] py-[0.75rem] font-bold text-[#FFFFFF]">Guardar pregunta</button>
  </form>
  <button id="another-question" class="mt-[1rem] hidden rounded-[0.65rem] bg-[#F5C518] px-[1rem] py-[0.75rem] font-bold">+ Crear otra pregunta</button>
  <div id="question-cards" class="mt-[1rem] grid gap-[1rem]"></div>
  <button id="back-lessons" class="mt-[1rem] rounded-[0.65rem] border-[0.0625rem] border-[#8A959A] px-[1rem] py-[0.75rem] font-bold text-[#68747B]">← Regresar a lecciones</button>
`;

summaryView.id = "summary-view";
summaryView.className = "mt-[1rem] hidden space-y-[1rem]";
summaryView.innerHTML = `
  <div id="summary" class="space-y-[1rem]"></div>
  <div class="flex justify-between gap-[1rem]">
    <button id="back-summary" class="rounded-[0.65rem] border-[0.0625rem] border-[#8A959A] px-[1rem] py-[0.75rem] font-bold text-[#68747B]">← Regresar</button>
    <button id="create-module" class="rounded-[0.65rem] bg-[#168653] px-[1rem] py-[0.75rem] font-bold text-[#FFFFFF]">Crear módulo</button>
  </div>
`;

lessonsForm.after(questionsView, summaryView);

const questionForm = $("#question-form");
const showMessage = (text, success = false) => {
  message.textContent = text;
  message.className = `mt-[1rem] rounded-[0.7rem] p-[1rem] text-[0.82rem] font-bold ${success ? "bg-[#E0EFE7] text-[#0F6840]" : "bg-[#FDE8E9] text-[#A9242B]"}`;
};
const hideMessage = () => message.classList.add("hidden");
const escapeHTML = text => {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
};

function showView(step) {
  [moduleForm, lessonsForm, questionsView, summaryView].forEach(view => view.classList.add("hidden"));
  [null, moduleForm, lessonsForm, questionsView, summaryView][step].classList.remove("hidden");

  const data = [
    null,
    ["Agregar módulo", "Primero completa la información general del módulo."],
    ["Agregar lecciones", lessonsReady ? "Agrega preguntas a las seis lecciones." : "Completa obligatoriamente seis lecciones."],
    ["Crear preguntas", "Crea las preguntas de la lección seleccionada."],
    ["Resumen del módulo", "Revisa la información antes de crear el módulo."]
  ][step];

  [pageTitle.textContent, pageDescription.textContent] = data;
  stepOne.className = `grid size-[2rem] place-items-center rounded-full text-[0.75rem] font-extrabold ${step === 1 ? "bg-[#168653] text-[#FFFFFF]" : "bg-[#E0EFE7] text-[#0F6840]"}`;
  stepTwo.className = `grid size-[2rem] place-items-center rounded-full text-[0.75rem] font-extrabold ${step >= 2 ? "bg-[#168653] text-[#FFFFFF]" : "bg-[#252D32] text-[#CBD2D5]"}`;
  hideMessage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateCount() {
  lessonCount.textContent = `${lessonsContainer.children.length} / ${MAX_LESSONS}`;
  addLessonButton.disabled = lessonsContainer.children.length >= MAX_LESSONS;
}

function addLesson() {
  if (lessonsReady || lessonsContainer.children.length >= MAX_LESSONS) return;
  const number = lessonsContainer.children.length + 1;
  const card = document.createElement("section");

  card.className = "lesson-card rounded-[0.8rem] border-[0.0625rem] border-[#DBE0DC] bg-[#F4F6F3] p-[1rem]";
  card.innerHTML = `
    <div class="flex justify-between"><h3 class="font-extrabold">Lección ${number}</h3><button type="button" class="remove text-[0.75rem] font-bold text-[#A9242B]">Eliminar</button></div>
    <label class="mt-[0.8rem] block"><span class="text-[0.78rem] font-bold">Título</span><input required class="title mt-[0.4rem] min-h-[3rem] w-full rounded-[0.6rem] border-[0.0625rem] border-[#DBE0DC] bg-[#FFFFFF] px-[0.9rem]"></label>
    <label class="mt-[0.8rem] block"><span class="text-[0.78rem] font-bold">Descripción</span><textarea required rows="3" class="description mt-[0.4rem] w-full rounded-[0.6rem] border-[0.0625rem] border-[#DBE0DC] bg-[#FFFFFF] p-[0.9rem]"></textarea></label>
    <label class="mt-[0.8rem] block"><span class="text-[0.78rem] font-bold">Intentos máximos</span><input required type="number" min="1" max="10" value="3" class="attempts mt-[0.4rem] min-h-[3rem] w-full rounded-[0.6rem] border-[0.0625rem] border-[#DBE0DC] bg-[#FFFFFF] px-[0.9rem]"></label>
  `;

  card.querySelector(".remove").onclick = () => {
    card.remove();
    $$(".lesson-card h3").forEach((title, index) => title.textContent = `Lección ${index + 1}`);
    updateCount();
  };

  lessonsContainer.append(card);
  updateCount();
}

function renderLessons() {
  lessonsContainer.innerHTML = lessons.map((lesson, index) => `
    <article class="rounded-[0.8rem] border-[0.0625rem] border-[#DBE0DC] bg-[#F4F6F3] p-[1rem]">
      <div class="flex justify-between gap-[1rem]"><h3 class="font-extrabold">Lección ${index + 1}: ${escapeHTML(lesson.title)}</h3><span class="text-[0.72rem] font-bold text-[#0F6840]">${lesson.questions.length} preguntas</span></div>
      <p class="mt-[0.5rem] text-[0.8rem] text-[#68747B]">${escapeHTML(lesson.description)}</p>
      <p class="mt-[0.4rem] text-[0.75rem] font-bold">Intentos máximos: ${lesson.maxAttempts}</p>
      <button type="button" data-lesson="${index}" class="questions mt-[0.8rem] rounded-[0.6rem] bg-[#168653] px-[0.9rem] py-[0.65rem] text-[0.75rem] font-bold text-[#FFFFFF]">${lesson.questions.length ? "Ver o crear preguntas" : "Crear preguntas"}</button>
    </article>
  `).join("");

  $$(".questions").forEach(button => button.onclick = () => openQuestions(Number(button.dataset.lesson)));
  lessonCount.textContent = `${MAX_LESSONS} / ${MAX_LESSONS}`;
}

function resetQuestionForm() {
  questionForm.reset();
  $("#options").innerHTML = Array.from({ length: 4 }, (_, index) => `
    <div class="flex gap-[0.6rem] rounded-[0.6rem] bg-[#F4F6F3] p-[0.6rem]">
      <input type="checkbox" value="${index}" class="correct size-[1.1rem] accent-[#168653]">
      <input required placeholder="Opción ${index + 1}" class="option min-h-[2.7rem] flex-1 rounded-[0.5rem] border-[0.0625rem] border-[#DBE0DC] bg-[#FFFFFF] px-[0.8rem]">
    </div>
  `).join("");

  $$(".correct").forEach(box => box.onchange = () => {
    if (box.checked) $$(".correct").forEach(other => other !== box && (other.checked = false));
  });

  questionForm.classList.remove("hidden");
  $("#another-question").classList.add("hidden");
}

function openQuestions(index) {
  selectedLesson = index;
  $("#lesson-name").textContent = `Lección ${index + 1}: ${lessons[index].title}`;
  renderQuestions();
  resetQuestionForm();
  showView(3);
}

function renderQuestions() {
  $("#question-cards").innerHTML = lessons[selectedLesson].questions.map((question, index) => `
    <article class="rounded-[0.7rem] bg-[#F4F6F3] p-[1rem]">
      <div class="flex justify-between"><h3 class="font-bold">Pregunta ${index + 1}</h3><button data-delete="${index}" class="delete-question text-[0.75rem] font-bold text-[#A9242B]">Eliminar</button></div>
      <p class="mt-[0.5rem]">${escapeHTML(question.statement)}</p>
      ${question.options.map((option, optionIndex) => `<p class="mt-[0.4rem] rounded-[0.5rem] p-[0.5rem] text-[0.78rem] ${optionIndex === question.correctOption ? "bg-[#E0EFE7] font-bold text-[#0F6840]" : "bg-[#FFFFFF]"}">${escapeHTML(option)} ${optionIndex === question.correctOption ? "✓" : ""}</p>`).join("")}
      <p class="mt-[0.6rem] text-[0.75rem] text-[#68747B]">Retroalimentación: ${escapeHTML(question.feedback)}</p>
    </article>
  `).join("");

  $$(".delete-question").forEach(button => button.onclick = () => {
    lessons[selectedLesson].questions.splice(Number(button.dataset.delete), 1);
    renderQuestions();
  });
}

function renderSummary() {
  $("#summary").innerHTML = `
    <article class="rounded-[1rem] bg-[#151A1E] p-[1.5rem] text-[#FFFFFF]"><h2 class="text-[1.4rem] font-extrabold">${escapeHTML(moduleData.title)}</h2><p class="mt-[0.5rem] text-[#CBD2D5]">${escapeHTML(moduleData.description)}</p><p class="mt-[0.5rem]">Nivel: ${moduleData.levelNumber}</p></article>
    ${lessons.map((lesson, index) => `<article class="rounded-[1rem] bg-[#FFFFFF] p-[1.3rem] shadow-lg"><h3 class="font-extrabold">Lección ${index + 1}: ${escapeHTML(lesson.title)}</h3><p class="mt-[0.4rem] text-[#68747B]">${escapeHTML(lesson.description)}</p><p class="mt-[0.4rem] text-[0.78rem]">Intentos: ${lesson.maxAttempts}</p>${lesson.questions.map((question, questionIndex) => `<div class="mt-[0.7rem] rounded-[0.6rem] bg-[#F4F6F3] p-[0.8rem]"><p class="font-bold">${questionIndex + 1}. ${escapeHTML(question.statement)}</p><p class="text-[0.75rem] text-[#0F6840]">Correcta: ${escapeHTML(question.options[question.correctOption])}</p><p class="text-[0.75rem] text-[#68747B]">${escapeHTML(question.feedback)}</p></div>`).join("")}</article>`).join("")}
  `;
}

moduleForm.onsubmit = event => {
  event.preventDefault();
  if (!moduleForm.checkValidity()) return moduleForm.reportValidity();

  moduleData = {
    title: $("#module-name").value.trim(),
    description: $("#module-description").value.trim(),
    levelNumber: Number($("#module-level").value)
  };

  showView(2);
};

lessonsForm.onsubmit = event => {
  event.preventDefault();

  if (!lessonsReady) {
    if ($$(".lesson-card").length !== MAX_LESSONS) return showMessage("Debes crear obligatoriamente seis lecciones.");
    if (!lessonsForm.checkValidity()) return lessonsForm.reportValidity();

    lessons = $$(".lesson-card").map(card => ({
      title: card.querySelector(".title").value.trim(),
      description: card.querySelector(".description").value.trim(),
      maxAttempts: Number(card.querySelector(".attempts").value),
      questions: []
    }));

    lessonsReady = true;
    addLessonButton.classList.add("hidden");
    backButton.classList.add("hidden");
    submitLessons.textContent = "Ver resumen";
    renderLessons();
    return showMessage("Ahora agrega preguntas a cada lección.", true);
  }

  if (lessons.some(lesson => !lesson.questions.length)) return showMessage("Cada lección debe tener al menos una pregunta.");
  renderSummary();
  showView(4);
};

questionForm.onsubmit = event => {
  event.preventDefault();
  if (!questionForm.checkValidity()) return questionForm.reportValidity();

  const correct = $(".correct:checked");
  if (!correct) return showMessage("Selecciona la respuesta correcta.");

  lessons[selectedLesson].questions.push({
    statement: $("#statement").value.trim(),
    options: $$(".option").map(input => input.value.trim()),
    correctOption: Number(correct.value),
    feedback: $("#feedback").value.trim()
  });

  renderQuestions();
  questionForm.classList.add("hidden");
  $("#another-question").classList.remove("hidden");
  showMessage("Pregunta creada correctamente.", true);
};

addLessonButton.onclick = addLesson;
backButton.onclick = () => showView(1);
$("#another-question").onclick = resetQuestionForm;
$("#back-lessons").onclick = () => { renderLessons(); showView(2); };
$("#back-summary").onclick = () => { renderLessons(); showView(2); };

$("#create-module").onclick = () => {
  const modules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  modules.push({ id: Date.now(), ...moduleData, currentLevel: 1, levels: lessons.map(lesson => lesson.title), lessons });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  showMessage("Módulo guardado correctamente.", true);
  setTimeout(() => window.location.href = "./principal.html", 900);
};

addLesson();