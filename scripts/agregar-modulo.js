const STORAGE_KEY = "rutaSeguraModules";
const MAX_LESSONS = 6;

const moduleForm =
  document.querySelector("#module-form");

const lessonsForm =
  document.querySelector("#lessons-form");

const lessonsContainer =
  document.querySelector("#lessons-container");

const addLessonButton =
  document.querySelector("#add-lesson-button");

const backButton =
  document.querySelector("#back-button");

const lessonCount =
  document.querySelector("#lesson-count");

const message =
  document.querySelector("#form-message");

const pageTitle =
  document.querySelector("#page-title");

const pageDescription =
  document.querySelector("#page-description");

const stepOne =
  document.querySelector("#step-one-indicator");

const stepTwo =
  document.querySelector("#step-two-indicator");

let moduleData = {};
let lessonTotal = 0;

function showMessage(
  text,
  type = "error"
) {
  message.textContent = text;

  message.className =
    type === "success"
      ? "mt-[1rem] rounded-[0.7rem] bg-[#E0EFE7] p-[1rem] text-[0.82rem] font-bold text-[#0F6840]"
      : "mt-[1rem] rounded-[0.7rem] bg-[#FDE8E9] p-[1rem] text-[0.82rem] font-bold text-[#A9242B]";
}

function hideMessage() {
  message.classList.add("hidden");
}

function updateLessonCount() {
  lessonTotal =
    lessonsContainer.children.length;

  lessonCount.textContent =
    `${lessonTotal} / ${MAX_LESSONS}`;

  addLessonButton.disabled =
    lessonTotal >= MAX_LESSONS;
}

function addLesson() {
  if (
    lessonsContainer.children.length >=
    MAX_LESSONS
  ) {
    return;
  }

  const number =
    lessonsContainer.children.length + 1;

  const lesson =
    document.createElement("section");

  lesson.className =
    "lesson-card rounded-[0.8rem] border-[0.0625rem] border-[#DBE0DC] bg-[#F4F6F3] p-[1rem]";

  lesson.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="font-extrabold">
        Lección ${number}
      </h3>

      <button
        type="button"
        class="remove-lesson text-[0.75rem]
               font-bold text-[#A9242B]
               ${number === 1 ? "hidden" : ""}"
      >
        Eliminar
      </button>
    </div>

    <div
      class="mt-[0.9rem] grid gap-[1rem]
             sm:grid-cols-2"
    >
      <label class="sm:col-span-2">
        <span class="text-[0.78rem] font-bold">
          Título
        </span>

        <input
          type="text"
          maxlength="80"
          required
          class="lesson-title mt-[0.4rem]
                 min-h-[3.1rem] w-full
                 rounded-[0.6rem]
                 border-[0.0625rem]
                 border-[#DBE0DC]
                 bg-[#FFFFFF] px-[0.9rem]
                 outline-none
                 focus:border-[#168653]"
        >
      </label>

      <label class="sm:col-span-2">
        <span class="text-[0.78rem] font-bold">
          Descripción
        </span>

        <textarea
          rows="3"
          maxlength="300"
          required
          class="lesson-description
                 mt-[0.4rem] w-full
                 resize-none rounded-[0.6rem]
                 border-[0.0625rem]
                 border-[#DBE0DC]
                 bg-[#FFFFFF] p-[0.9rem]
                 outline-none
                 focus:border-[#168653]"
        ></textarea>
      </label>

      <label>
        <span class="text-[0.78rem] font-bold">
          Intentos máximos
        </span>

        <input
          type="number"
          min="1"
          max="10"
          value="3"
          required
          class="lesson-attempts mt-[0.4rem]
                 min-h-[3.1rem] w-full
                 rounded-[0.6rem]
                 border-[0.0625rem]
                 border-[#DBE0DC]
                 bg-[#FFFFFF] px-[0.9rem]
                 outline-none
                 focus:border-[#168653]"
        >
      </label>
    </div>
  `;

  const removeButton =
    lesson.querySelector(
      ".remove-lesson"
    );

  removeButton.addEventListener(
    "click",
    () => {
      lesson.remove();
      renumberLessons();
    }
  );

  lessonsContainer.appendChild(lesson);
  updateLessonCount();
}

function renumberLessons() {
  [...lessonsContainer.children]
    .forEach((lesson, index) => {
      lesson.querySelector(
        "h3"
      ).textContent =
        `Lección ${index + 1}`;

      lesson
        .querySelector(".remove-lesson")
        .classList.toggle(
          "hidden",
          index === 0
        );
    });

  updateLessonCount();
}

function showStep(step) {
  const lessonsStep =
    step === 2;

  moduleForm.classList.toggle(
    "hidden",
    lessonsStep
  );

  lessonsForm.classList.toggle(
    "hidden",
    !lessonsStep
  );

  pageTitle.textContent =
    lessonsStep
      ? "Agregar lecciones"
      : "Agregar módulo";

  pageDescription.textContent =
    lessonsStep
      ? "Completa la información de las lecciones que tendrá el módulo."
      : "Primero completa la información general del módulo.";

  stepOne.className = `
    grid size-[2rem] place-items-center
    rounded-full text-[0.75rem]
    font-extrabold
    ${
      lessonsStep
        ? "bg-[#E0EFE7] text-[#0F6840]"
        : "bg-[#168653] text-[#FFFFFF]"
    }
  `;

  stepTwo.className = `
    grid size-[2rem] place-items-center
    rounded-full text-[0.75rem]
    font-extrabold
    ${
      lessonsStep
        ? "bg-[#168653] text-[#FFFFFF]"
        : "bg-[#252D32] text-[#CBD2D5]"
    }
  `;

  hideMessage();
}

moduleForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    if (!moduleForm.checkValidity()) {
      moduleForm.reportValidity();

      showMessage(
        "Completa correctamente todos los datos del módulo."
      );

      return;
    }

    moduleData = {
      title: document
        .querySelector("#module-name")
        .value
        .trim(),

      description: document
        .querySelector("#module-description")
        .value
        .trim(),

      levelNumber: Number(
        document
          .querySelector("#module-level")
          .value
      )
    };

    showStep(2);
  }
);

lessonsForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();

    if (!lessonsForm.checkValidity()) {
      lessonsForm.reportValidity();

      showMessage(
        "Completa correctamente los datos de todas las lecciones."
      );

      return;
    }

    const lessons = [
      ...document.querySelectorAll(
        ".lesson-card"
      )
    ].map(card => ({
      title: card
        .querySelector(".lesson-title")
        .value
        .trim(),

      description: card
        .querySelector(
          ".lesson-description"
        )
        .value
        .trim(),

      maxAttempts: Number(
        card.querySelector(
          ".lesson-attempts"
        ).value
      )
    }));

    const storedModules = JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      ) || "[]"
    );

    storedModules.push({
      id: Date.now(),
      ...moduleData,
      currentLevel: 1,
      levels: lessons.map(
        lesson => lesson.title
      ),
      lessons
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(storedModules)
    );

    showMessage(
      "Módulo guardado correctamente.",
      "success"
    );

    setTimeout(
      () => {
        window.location.href =
          "./principal.html";
      },
      900
    );
  }
);

addLessonButton.addEventListener(
  "click",
  addLesson
);

backButton.addEventListener(
  "click",
  () => showStep(1)
);

addLesson();