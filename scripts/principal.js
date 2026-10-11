const appData = {
  selectedModuleId: 1,
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
    }
  ],

  friends: [
    { initials: "JR", name: "Jonathan", points: 520, online: true },
    { initials: "DR", name: "Dilan", points: 460, online: true },
    { initials: "MG", name: "María", points: 390, online: false }
  ],

  achievements: [
    { icon: "★", title: "Primer recorrido", unlocked: true },
    { icon: "◆", title: "Tres niveles seguidos", unlocked: true },
    { icon: "●", title: "Experto en señales", unlocked: false }
  ],

  tips: [
    "Reduce la velocidad antes de llegar a una intersección.",
    "Mantén una distancia segura con el vehículo de adelante.",
    "Las señales preventivas advierten sobre riesgos en la vía."
  ]
};


const elements = {
  moduleSelector: document.querySelector("#module-selector"),
  moduleTitle: document.querySelector("#module-title"),
  moduleDescription: document.querySelector("#module-description"),
  levelsContainer: document.querySelector("#levels-container"),
  playerCar: document.querySelector("#player-car"),
  progressLabel: document.querySelector("#progress-label"),
  progressRing: document.querySelector("#progress-ring"),
  progressBar: document.querySelector("#progress-bar"),
  completeButton: document.querySelector("#complete-level-button"),
  points: document.querySelector("#points-value"),
  streak: document.querySelector("#streak-value"),
  completed: document.querySelector("#completed-value"),
  sidebarLevel: document.querySelector("#sidebar-level"),
  friendsList: document.querySelector("#friends-list"),
  achievementsList: document.querySelector("#achievements-list"),
  achievementCount: document.querySelector("#achievement-count"),
  roadTip: document.querySelector("#road-tip"),
  toast: document.querySelector("#toast")
};


const levelPositions = [
  { left: 18, top: 8 },
  { left: 68, top: 17 },
  { left: 50, top: 32 },
  { left: 27, top: 48 },
  { left: 68, top: 65 },
  { left: 18, top: 88 }
];

function getSelectedModule() {
  return appData.modules.find(
    module => module.id === appData.selectedModuleId
  );
}

function getLevelStatus(level, currentLevel) {
  if (level < currentLevel) return "completed";
  if (level === currentLevel) return "current";
  return "locked";
}

function getLevelColor(status) {
  const colors = {
    completed: "#168653",
    current: "#D9363E",
    locked: "#F5C518"
  };

  return colors[status];
}


function renderModules() {
  elements.moduleSelector.innerHTML = appData.modules
    .map((module, index) => {
      const selected = module.id === appData.selectedModuleId;

      const classes = selected
        ? "bg-[#168653] text-[#FFFFFF]"
        : "bg-[#FFFFFF] text-[#68747B] hover:bg-[#E0EFE7]";

      return `
        <button
          type="button"
          data-module-id="${module.id}"
          class="module-button shrink-0 rounded-[0.7rem]
                 px-[1rem] py-[0.7rem] text-[0.78rem]
                 font-extrabold shadow-sm ${classes}"
        >
          Módulo ${index + 1}
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".module-button").forEach(button => {
    button.addEventListener("click", () => {
      appData.selectedModuleId = Number(button.dataset.moduleId);
      renderApp();
    });
  });
}


function renderRoad() {
  const module = getSelectedModule();

  elements.levelsContainer.innerHTML = module.levels
    .map((title, index) => {
      const level = index + 1;
      const position = levelPositions[index];
      const status = getLevelStatus(level, module.currentLevel);
      const color = getLevelColor(status);
      const disabled = status === "locked" ? "disabled" : "";

      return `
        <div
          class="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style="left:${position.left}%; top:${position.top}%"
        >
          <button
            type="button"
            ${disabled}
            data-level="${level}"
            class="level-button group flex flex-col items-center"
          >
            <span
              class="grid size-[3.2rem] place-items-center
                     rounded-[0.75rem] bg-[#090C0E]
                     shadow-lg shadow-[#090C0E]
                     group-enabled:hover:-translate-y-[0.15rem]"
            >
              <span
                class="size-[1.55rem] rounded-full
                       border-[0.18rem] border-[#FFFFFF]"
                style="background-color:${color}"
              ></span>
            </span>

            <span
              class="mt-[0.4rem] max-w-[8rem] rounded-[0.45rem]
                     bg-[#FFFFFF] px-[0.55rem] py-[0.3rem]
                     text-center text-[0.65rem] font-extrabold
                     text-[#172026] shadow-md shadow-[#090C0E]"
            >
              ${level}. ${title}
            </span>
          </button>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".level-button:not(:disabled)").forEach(button => {
    button.addEventListener("click", () => {
      const level = Number(button.dataset.level);
      showToast(`Nivel ${level}: ${module.levels[level - 1]}`);
    });
  });

  const currentIndex = Math.min(
    module.currentLevel - 1,
    levelPositions.length - 1
  );

  const carPosition = levelPositions[currentIndex];

  elements.playerCar.style.left =
    `calc(${carPosition.left}% + 2.8rem)`;

  elements.playerCar.style.top =
    `calc(${carPosition.top}% - 1.2rem)`;

  elements.playerCar.style.transform =
    "translate(-50%, -50%)";
}


function renderProgress() {
  const module = getSelectedModule();
  const completed = Math.max(module.currentLevel - 1, 0);

  const percentage = Math.round(
    completed / module.levels.length * 100
  );

  const totalCompleted = appData.modules.reduce(
    (total, item) => total + Math.max(item.currentLevel - 1, 0),
    0
  );

  elements.moduleTitle.textContent = module.title;
  elements.moduleDescription.textContent = module.description;
  elements.progressLabel.textContent = `${percentage}%`;
  elements.progressRing.textContent = `${percentage}%`;
  elements.progressBar.style.width = `${percentage}%`;
  elements.points.textContent = appData.points;
  elements.streak.textContent = appData.streak;
  elements.completed.textContent = totalCompleted;
  elements.sidebarLevel.textContent = totalCompleted + 1;

  const finished = module.currentLevel > module.levels.length;

  elements.completeButton.disabled = finished;
  elements.completeButton.textContent = finished
    ? "Módulo completado"
    : "Completar nivel actual";
}


function renderFriends() {
  elements.friendsList.innerHTML = appData.friends
    .map(friend => `
      <div class="flex items-center gap-[0.7rem]">
        <span
          class="relative grid size-[2.4rem] place-items-center
                 rounded-full bg-[#E0EFE7] text-[0.72rem]
                 font-extrabold text-[#0F6840]"
        >
          ${friend.initials}

          <i
            class="absolute bottom-0 right-0 size-[0.55rem]
                   rounded-full border-[0.12rem] border-[#FFFFFF]
                   ${friend.online ? "bg-[#168653]" : "bg-[#8A959A]"}"
          ></i>
        </span>

        <div class="flex-1">
          <p class="text-[0.8rem] font-bold">${friend.name}</p>
          <p class="text-[0.68rem] text-[#8A959A]">
            ${friend.points} puntos
          </p>
        </div>

        <span class="font-extrabold text-[#F5C518]">★</span>
      </div>
    `)
    .join("");
}

function renderAchievements() {
  const unlocked = appData.achievements.filter(
    achievement => achievement.unlocked
  ).length;

  elements.achievementCount.textContent =
    `${unlocked}/${appData.achievements.length}`;

  elements.achievementsList.innerHTML = appData.achievements
    .map(achievement => `
      <div
        class="flex items-center gap-[0.7rem]
               ${achievement.unlocked ? "" : "opacity-50"}"
      >
        <span
          class="grid size-[2.4rem] place-items-center
                 rounded-[0.65rem] font-black
                 ${
                   achievement.unlocked
                     ? "bg-[#F5C518] text-[#151A1E]"
                     : "bg-[#DBE0DC] text-[#68747B]"
                 }"
        >
          ${achievement.icon}
        </span>

        <div>
          <p class="text-[0.78rem] font-bold">
            ${achievement.title}
          </p>

          <p class="text-[0.66rem] text-[#8A959A]">
            ${achievement.unlocked ? "Desbloqueado" : "Pendiente"}
          </p>
        </div>
      </div>
    `)
    .join("");
}
function showToast(message, type = "success") {
  const color = type === "success"
    ? "bg-[#168653]"
    : "bg-[#D9363E]";

  elements.toast.textContent = message;

  elements.toast.className = `
    fixed bottom-[1.25rem] left-1/2 z-50
    -translate-x-1/2 rounded-[0.7rem]
    px-[1rem] py-[0.8rem] text-[0.85rem]
    font-bold text-[#FFFFFF] shadow-lg
    shadow-[#151A1E]/20 ${color}
  `;

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 2500);
}

function completeCurrentLevel() {
  const module = getSelectedModule();

  if (module.currentLevel > module.levels.length) return;

  module.currentLevel++;
  appData.points += 100;
  appData.streak++;

  const finished = module.currentLevel > module.levels.length;

  showToast(
    finished
      ? "¡Módulo completado!"
      : "¡Nivel completado! Avanzaste al siguiente semáforo."
  );

  renderRoad();
  renderProgress();
}
function setupNavigation() {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.view !== "ruta") {
        showToast(
          `La vista ${button.textContent.trim()} estará disponible próximamente.`,
          "error"
        );
      }
    });
  });
}
function renderApp() {
  renderModules();
  renderRoad();
  renderProgress();
  renderFriends();
  renderAchievements();

  elements.roadTip.textContent =
    appData.tips[appData.selectedModuleId - 1] ||
    appData.tips[0];
}

elements.completeButton.addEventListener(
  "click",
  completeCurrentLevel
);

setupNavigation();
renderApp();