const savedModules = JSON.parse(
  localStorage.getItem("rutaSeguraModules") || "[]"
);

const data = {
  selectedId: 1,
  points: 340,
  streak: 5,

  modules: [
    {
      id: 1,
      title: "Señales de tránsito",
      description: "Aprende a reconocer las principales señales de tránsito.",
      currentLevel: 3,
      levels: [
        "Introducción",
        "Señales preventivas",
        "Señales reglamentarias",
        "Señales informativas",
        "Señales de obras",
        "Evaluación"
      ]
    },
    {
      id: 2,
      title: "Normas de circulación",
      description: "Practica las reglas esenciales para circular con seguridad.",
      currentLevel: 1,
      levels: [
        "Prioridad de paso",
        "Uso de carriles",
        "Límites de velocidad",
        "Intersecciones",
        "Rotondas",
        "Evaluación"
      ]
    },
    {
      id: 3,
      title: "Seguridad vial",
      description: "Identifica riesgos y toma mejores decisiones en la vía.",
      currentLevel: 1,
      levels: [
        "Conducción preventiva",
        "Peatones y ciclistas",
        "Uso del cinturón",
        "Distracciones",
        "Emergencias",
        "Evaluación final"
      ]
    },

    ...savedModules
  ]
};

const $ = selector => document.querySelector(selector);

const elements = {
  selector: $("#module-selector"),
  title: $("#module-title"),
  description: $("#module-description"),
  levels: $("#levels-container"),
  car: $("#player-car"),
  progress: $("#progress-label"),
  ring: $("#progress-ring"),
  bar: $("#progress-bar"),
  completeButton: $("#complete-level-button"),
  points: $("#points-value"),
  streak: $("#streak-value"),
  completed: $("#completed-value"),
  sidebarLevel: $("#sidebar-level"),
  friends: $("#friends-list"),
  achievements: $("#achievements-list"),
  achievementCount: $("#achievement-count"),
  tip: $("#road-tip"),
  toast: $("#toast")
};

const positions = [
  [18, 8],
  [68, 17],
  [50, 32],
  [27, 48],
  [68, 65],
  [18, 88]
];

const friends = [
  ["JR", "Jonathan", 520, true],
  ["DR", "Dilan", 460, true],
  ["MG", "María", 390, false]
];

const achievements = [
  ["★", "Primer recorrido", true],
  ["◆", "Tres niveles seguidos", true],
  ["●", "Experto en señales", false]
];

const tips = [
  "Reduce la velocidad antes de llegar a una intersección.",
  "Mantén una distancia segura con el vehículo de adelante.",
  "Las señales preventivas advierten sobre riesgos en la vía."
];

function getModule() {
  return data.modules.find(
    module => module.id === data.selectedId
  );
}

function showToast(message, error = false) {
  elements.toast.textContent = message;

  elements.toast.className = `
    fixed bottom-[1.25rem] left-1/2 z-50
    -translate-x-1/2 rounded-[0.7rem]
    px-[1rem] py-[0.8rem] text-[0.85rem]
    font-bold text-[#FFFFFF] shadow-lg
    ${error ? "bg-[#D9363E]" : "bg-[#168653]"}
  `;

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(
    () => elements.toast.classList.add("hidden"),
    2500
  );
}

function renderModuleButtons() {
  elements.selector.innerHTML = data.modules
    .map((module, index) => {
      const selected = module.id === data.selectedId;

      return `
        <button
          type="button"
          data-id="${module.id}"
          class="module-button shrink-0 rounded-[0.7rem]
                 px-[1rem] py-[0.7rem] text-[0.78rem]
                 font-extrabold shadow-sm
                 ${
                   selected
                     ? "bg-[#168653] text-[#FFFFFF]"
                     : "bg-[#FFFFFF] text-[#68747B] hover:bg-[#E0EFE7]"
                 }"
        >
          Módulo ${index + 1}
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".module-button").forEach(button => {
    button.addEventListener("click", () => {
      data.selectedId = Number(button.dataset.id);
      render();
    });
  });
}

function renderLevels() {
  const module = getModule();

  elements.levels.innerHTML = module.levels
    .slice(0, 6)
    .map((title, index) => {
      const level = index + 1;
      const [left, top] = positions[index];

      let color = "#F5C518";
      let disabled = "disabled";

      if (level < module.currentLevel) {
        color = "#168653";
        disabled = "";
      }

      if (level === module.currentLevel) {
        color = "#D9363E";
        disabled = "";
      }

      return `
        <div
          class="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style="left:${left}%; top:${top}%"
        >
          <button
            type="button"
            class="level-button flex flex-col items-center"
            data-level="${level}"
            ${disabled}
          >
            <span
              class="grid size-[3.2rem] place-items-center
                     rounded-[0.75rem] bg-[#090C0E]
                     shadow-lg shadow-[#090C0E]"
            >
              <span
                class="size-[1.55rem] rounded-full
                       border-[0.18rem] border-[#FFFFFF]"
                style="background-color:${color}"
              ></span>
            </span>

            <span
              class="mt-[0.4rem] max-w-[8rem]
                     rounded-[0.45rem] bg-[#FFFFFF]
                     px-[0.55rem] py-[0.3rem]
                     text-center text-[0.65rem]
                     font-extrabold text-[#172026]"
            >
              ${level}. ${title}
            </span>
          </button>
        </div>
      `;
    })
    .join("");

  document
    .querySelectorAll(".level-button:not(:disabled)")
    .forEach(button => {
      button.addEventListener("click", () => {
        const level = Number(button.dataset.level);

        showToast(
          `Nivel ${level}: ${module.levels[level - 1]}`
        );
      });
    });

  const positionIndex = Math.min(
    module.currentLevel - 1,
    positions.length - 1
  );

  const [left, top] = positions[positionIndex];

  elements.car.style.left = `calc(${left}% + 2.8rem)`;
  elements.car.style.top = `calc(${top}% - 1.2rem)`;
  elements.car.style.transform = "translate(-50%, -50%)";
}

function renderProgress() {
  const module = getModule();

  const completed = Math.min(
    module.currentLevel - 1,
    module.levels.length
  );

  const percentage = Math.round(
    completed / module.levels.length * 100
  );

  const totalCompleted = data.modules.reduce(
    (total, item) =>
      total + Math.min(
        item.currentLevel - 1,
        item.levels.length
      ),
    0
  );

  elements.title.textContent = module.title;
  elements.description.textContent = module.description;
  elements.progress.textContent = `${percentage}%`;
  elements.ring.textContent = `${percentage}%`;
  elements.bar.style.width = `${percentage}%`;
  elements.points.textContent = data.points;
  elements.streak.textContent = data.streak;
  elements.completed.textContent = totalCompleted;
  elements.sidebarLevel.textContent = totalCompleted + 1;

  const finished =
    module.currentLevel > module.levels.length;

  elements.completeButton.disabled = finished;

  elements.completeButton.textContent = finished
    ? "Módulo completado"
    : "Completar nivel actual";
}

function renderFriends() {
  elements.friends.innerHTML = friends
    .map(([initials, name, points, online]) => `
      <div class="flex items-center gap-[0.7rem]">
        <span
          class="relative grid size-[2.4rem]
                 place-items-center rounded-full
                 bg-[#E0EFE7] text-[0.72rem]
                 font-extrabold text-[#0F6840]"
        >
          ${initials}

          <i
            class="absolute bottom-0 right-0
                   size-[0.55rem] rounded-full
                   border-[0.12rem] border-[#FFFFFF]
                   ${online ? "bg-[#168653]" : "bg-[#8A959A]"}"
          ></i>
        </span>

        <div class="flex-1">
          <p class="text-[0.8rem] font-bold">${name}</p>

          <p class="text-[0.68rem] text-[#8A959A]">
            ${points} puntos
          </p>
        </div>

        <span class="text-[#F5C518]">★</span>
      </div>
    `)
    .join("");
}

function renderAchievements() {
  const unlocked = achievements.filter(
    achievement => achievement[2]
  ).length;

  elements.achievementCount.textContent =
    `${unlocked}/${achievements.length}`;

  elements.achievements.innerHTML = achievements
    .map(([icon, title, isUnlocked]) => `
      <div
        class="flex items-center gap-[0.7rem]
               ${isUnlocked ? "" : "opacity-50"}"
      >
        <span
          class="grid size-[2.4rem] place-items-center
                 rounded-[0.65rem] font-black
                 ${
                   isUnlocked
                     ? "bg-[#F5C518] text-[#151A1E]"
                     : "bg-[#DBE0DC] text-[#68747B]"
                 }"
        >
          ${icon}
        </span>

        <div>
          <p class="text-[0.78rem] font-bold">
            ${title}
          </p>

          <p class="text-[0.66rem] text-[#8A959A]">
            ${isUnlocked ? "Desbloqueado" : "Pendiente"}
          </p>
        </div>
      </div>
    `)
    .join("");
}

function completeLevel() {
  const module = getModule();

  if (module.currentLevel > module.levels.length) {
    return;
  }

  module.currentLevel++;
  data.points += 100;
  data.streak++;

  showToast(
    module.currentLevel > module.levels.length
      ? "¡Módulo completado!"
      : "¡Nivel completado!"
  );

  renderLevels();
  renderProgress();
}

function render() {
  const moduleIndex = data.modules.indexOf(getModule());

  renderModuleButtons();
  renderLevels();
  renderProgress();

  elements.tip.textContent =
    tips[moduleIndex] || tips[0];
}

document.querySelectorAll(".nav-button").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view !== "ruta") {
      showToast(
        `La vista ${button.textContent.trim()} estará disponible próximamente.`,
        true
      );
    }
  });
});

elements.completeButton.addEventListener(
  "click",
  completeLevel
);

renderFriends();
renderAchievements();
render();