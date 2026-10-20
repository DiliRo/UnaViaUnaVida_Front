

const appData = {
    selectedModuleId: null,
    points: 340,
    streak: 5,
    modules: [],

    friends: [
        { initials: 'JR', name: 'Jonathan', points: 520, online: true },
        { initials: 'DR', name: 'Dilan', points: 460, online: true },
        { initials: 'MG', name: 'María', points: 390, online: false }
    ],

    achievements: [
        { icon: '★', title: 'Primer recorrido', unlocked: true },
        { icon: '◆', title: 'Tres niveles seguidos', unlocked: true },
        { icon: '●', title: 'Experto en señales', unlocked: false }
    ],

    tips: [
        'Reduce la velocidad antes de llegar a una intersección.',
        'Mantén una distancia segura con el vehículo de adelante.',
        'Las señales preventivas advierten sobre riesgos en la vía.'
    ]
};

const levelPositions = [
    { left: 18, top: 8 },
    { left: 68, top: 17 },
    { left: 50, top: 32 },
    { left: 27, top: 48 },
    { left: 68, top: 65 },
    { left: 18, top: 88 }
];

let elements;
let nombre = '';


function obtenerModulosLocales() {
    try {
        const modulos = JSON.parse(
            localStorage.getItem('rutaSeguraModules') || '[]'
        );

        if (!Array.isArray(modulos)) {
            return [];
        }

        return modulos.map(modulo => ({
            ...modulo,
            id: String(modulo.id)
        }));
    } catch (error) {
        console.error(
            'Error al cargar módulos locales:',
            error
        );

        return [];
    }
}

function getSelectedModule() {
    return appData.modules.find(
        module => module.id === appData.selectedModuleId
    );
}

function getLevelStatus(level, currentLevel) {
    if (level < currentLevel) return 'completed';
    if (level === currentLevel) return 'current';
    return 'locked';
}

function getLevelColor(status) {
    return {
        completed: '#168653',
        current: '#D9363E',
        locked: '#F5C518'
    }[status];
}

function renderModules() {
    elements.moduleSelector.replaceChildren();

    appData.modules.forEach((module, index) => {
        const selected = module.id === appData.selectedModuleId;

        const button = document.createElement('button');

        button.type = 'button';
        button.dataset.moduleId = module.id;

        button.className = `
            module-button shrink-0 rounded-[0.7rem]
            px-[1rem] py-[0.7rem] text-[0.78rem]
            font-extrabold shadow-sm
            ${
                selected
                    ? 'bg-[#168653] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#68747B] hover:bg-[#E0EFE7]'
            }
        `;

        button.textContent = `Módulo ${index + 1}`;

        button.addEventListener('click', () => {
            appData.selectedModuleId = button.dataset.moduleId;
            renderApp();
        });

        elements.moduleSelector.appendChild(button);
    });
}

function renderRoad() {
    const module = getSelectedModule();

    elements.levelsContainer.replaceChildren();

    if (!module || module.levels.length === 0) {
        elements.playerCar.classList.add('hidden');
        return;
    }

    elements.playerCar.classList.remove('hidden');

    module.levels.forEach((title, index) => {
        const level = index + 1;

        const position =
            levelPositions[index % levelPositions.length];

        const status = getLevelStatus(
            level,
            module.currentLevel
        );

        const color = getLevelColor(status);

        const wrapper = document.createElement('div');

        wrapper.className =
            'absolute z-10 -translate-x-1/2 -translate-y-1/2';

        wrapper.style.left = `${position.left}%`;
        wrapper.style.top = `${position.top}%`;

        const button = document.createElement('button');

        button.type = 'button';
        button.disabled = status === 'locked';
        button.dataset.level = String(level);

        button.className =
            'level-button group flex flex-col items-center';

        const outer = document.createElement('span');

        outer.className = `
            grid size-[3.2rem] place-items-center
            rounded-[0.75rem] bg-[#090C0E]
            shadow-lg shadow-[#090C0E]
            group-enabled:hover:-translate-y-[0.15rem]
        `;

        const circle = document.createElement('span');

        circle.className = `
            size-[1.55rem] rounded-full
            border-[0.18rem] border-[#FFFFFF]
        `;

        circle.style.backgroundColor = color;

        outer.appendChild(circle);

        const label = document.createElement('span');

        label.className = `
            mt-[0.4rem] max-w-[8rem] rounded-[0.45rem]
            bg-[#FFFFFF] px-[0.55rem] py-[0.3rem]
            text-center text-[0.65rem] font-extrabold
            text-[#172026] shadow-md shadow-[#090C0E]
        `;

        label.textContent = `${level}. ${title}`;

        button.append(outer, label);

        button.addEventListener('click', () => {
            showToast(`Nivel ${level}: ${title}`);
        });

        wrapper.appendChild(button);
        elements.levelsContainer.appendChild(wrapper);
    });

    const currentIndex = Math.max(
        0,
        Math.min(
            module.currentLevel - 1,
            module.levels.length - 1
        )
    );

    const carPosition =
        levelPositions[currentIndex % levelPositions.length];

    elements.playerCar.style.left =
        `calc(${carPosition.left}% + 2.8rem)`;

    elements.playerCar.style.top =
        `calc(${carPosition.top}% - 1.2rem)`;

    elements.playerCar.style.transform =
        'translate(-50%, -50%)';
}

function renderProgress() {
    const module = getSelectedModule();

    if (!module) {
        elements.moduleTitle.textContent =
            'No hay módulos disponibles';

        elements.moduleDescription.textContent = '';
        elements.progressLabel.textContent = '0%';
        elements.progressRing.textContent = '0%';
        elements.progressBar.style.width = '0%';

        elements.completeButton.disabled = true;
        elements.completeButton.textContent = 'Sin módulos';

        elements.points.textContent = appData.points;
        elements.streak.textContent = appData.streak;
        elements.completed.textContent = '0';
        elements.sidebarLevel.textContent = '1';

        return;
    }

    const completed = Math.max(
        module.currentLevel - 1,
        0
    );

    const percentage = module.levels.length > 0
        ? Math.round(
            Math.min(completed, module.levels.length)
            / module.levels.length * 100
        )
        : 0;

    const totalCompleted = appData.modules.reduce(
        (total, item) =>
            total + Math.min(
                Math.max(item.currentLevel - 1, 0),
                item.levels.length
            ),
        0
    );

    elements.moduleTitle.textContent = module.title;

    elements.moduleDescription.textContent =
        module.description;

    elements.progressLabel.textContent = `${percentage}%`;
    elements.progressRing.textContent = `${percentage}%`;
    elements.progressBar.style.width = `${percentage}%`;

    elements.points.textContent = appData.points;
    elements.streak.textContent = appData.streak;
    elements.completed.textContent = totalCompleted;
    elements.sidebarLevel.textContent = totalCompleted + 1;

    const noLevels = module.levels.length === 0;

    const finished =
        !noLevels &&
        module.currentLevel > module.levels.length;

    elements.completeButton.disabled = noLevels || finished;

    elements.completeButton.textContent = noLevels
        ? 'Sin lecciones disponibles'
        : finished
            ? 'Módulo completado'
            : 'Completar nivel actual';
}

function renderFriends() {
    elements.friendsList.replaceChildren();

    appData.friends.forEach(friend => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-[0.7rem]';

        const avatar = document.createElement('span');

        avatar.className = `
            relative grid size-[2.4rem] place-items-center
            rounded-full bg-[#E0EFE7] text-[0.72rem]
            font-extrabold text-[#0F6840]
        `;

        avatar.textContent = friend.initials;

        const dot = document.createElement('i');

        dot.className = `
            absolute bottom-0 right-0 size-[0.55rem]
            rounded-full border-[0.12rem] border-[#FFFFFF]
            ${
                friend.online
                    ? 'bg-[#168653]'
                    : 'bg-[#8A959A]'
            }
        `;

        avatar.appendChild(dot);

        const details = document.createElement('div');
        details.className = 'flex-1';

        const name = document.createElement('p');
        name.className = 'text-[0.8rem] font-bold';
        name.textContent = friend.name;

        const points = document.createElement('p');
        points.className = 'text-[0.68rem] text-[#8A959A]';
        points.textContent = `${friend.points} puntos`;

        details.append(name, points);

        const star = document.createElement('span');
        star.className = 'font-extrabold text-[#F5C518]';
        star.textContent = '★';

        row.append(avatar, details, star);

        elements.friendsList.appendChild(row);
    });
}

function renderAchievements() {
    const unlocked = appData.achievements.filter(
        achievement => achievement.unlocked
    ).length;

    elements.achievementCount.textContent =
        `${unlocked}/${appData.achievements.length}`;

    elements.achievementsList.replaceChildren();

    appData.achievements.forEach(achievement => {
        const row = document.createElement('div');

        row.className = `
            flex items-center gap-[0.7rem]
            ${achievement.unlocked ? '' : 'opacity-50'}
        `;

        const icon = document.createElement('span');

        icon.className = `
            grid size-[2.4rem] place-items-center
            rounded-[0.65rem] font-black
            ${
                achievement.unlocked
                    ? 'bg-[#F5C518] text-[#151A1E]'
                    : 'bg-[#DBE0DC] text-[#68747B]'
            }
        `;

        icon.textContent = achievement.icon;

        const details = document.createElement('div');

        const title = document.createElement('p');
        title.className = 'text-[0.78rem] font-bold';
        title.textContent = achievement.title;

        const status = document.createElement('p');
        status.className = 'text-[0.66rem] text-[#8A959A]';

        status.textContent = achievement.unlocked
            ? 'Desbloqueado'
            : 'Pendiente';

        details.append(title, status);
        row.append(icon, details);

        elements.achievementsList.appendChild(row);
    });
}

function showToast(message, type = 'success') {
    const color = type === 'success'
        ? 'bg-[#168653]'
        : 'bg-[#D9363E]';

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
        elements.toast.classList.add('hidden');
    }, 2500);
}

function completeCurrentLevel() {
    const module = getSelectedModule();

    if (
        !module ||
        module.levels.length === 0 ||
        module.currentLevel > module.levels.length
    ) {
        return;
    }

    module.currentLevel++;
    appData.points += 100;
    appData.streak++;

    const finished =
        module.currentLevel > module.levels.length;

    showToast(
        finished
            ? '¡Módulo completado!'
            : '¡Nivel completado! Avanzaste al siguiente semáforo.'
    );

    renderRoad();
    renderProgress();
}

function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.view !== 'ruta') {
                showToast(
                    `La vista ${button.textContent.trim()} estará disponible próximamente.`,
                    'error'
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

    const selectedIndex = appData.modules.findIndex(
        module => module.id === appData.selectedModuleId
    );

    elements.roadTip.textContent =
        appData.tips[
            Math.max(0, selectedIndex) % appData.tips.length
        ];
}

async function obtenerModulos(token) {
    try {
        const token = localStorage.getItem('token')
        const response = await fetch(
            'http://localhost:3641/v1/modulos/',
            {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${token}`
            }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Error al obtener módulos: HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.modulos)) {
            throw new Error('Respuesta de módulos inválida');
        }

        appData.modules = data.modulos.map(modulo => ({
            id: String(modulo._id),
            title: modulo.nombre,
            description: modulo.descripcion ?? '',
            currentLevel: 1,

            levels: (modulo.lecciones ?? []).map(
                (leccion, index) =>
                    typeof leccion === 'string'
                        ? leccion
                        : (
                            leccion.nombre ??
                            `Lección ${index + 1}`
                        )
            ),

            nivelRequerido: modulo.nivel,
            puedeAcceder: modulo.puedeAcceder
        }));

        /* Agrega los módulos creados desde el formulario. */
        appData.modules.push(...obtenerModulosLocales());

        appData.selectedModuleId =
            appData.modules[0]?.id ?? null;

        renderApp();

    } catch (error) {
        console.error('Error al cargar módulos:', error);

        showToast(
            'No se pudieron cargar los módulos',
            'error'
        );
    }
}

function obtenerPayloadJWT(token) {
    const parte = token.split('.')[1];

    if (!parte) {
        throw new Error('JWT sin payload');
    }

    const base64 = parte
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const padded = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
    );

    const bytes = Uint8Array.from(
        atob(padded),
        c => c.charCodeAt(0)
    );

    return JSON.parse(
        new TextDecoder().decode(bytes)
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('./login.html');
        return;
    }

    try {
        const payload = obtenerPayloadJWT(token);

        nombre = payload.nombre ?? '';
        

        const rol = payload.rol;

        if (rol === 'ADMIN') {
            console.log('Soy')
            const boton = document.getElementById('btn-agregar-modulo');
            console.log(boton)
            boton.style.display='flex'
        }
        console.log('Rol:', payload.rol);

        if (
            typeof payload.exp === 'number' &&
            Date.now() >= payload.exp * 1000
        ) {
            throw new Error('Token expirado');
        }

    } catch (error) {
        console.error('Token inválido:', error);

        localStorage.removeItem('token');
        window.location.replace('./login.html');
        return;
    }

    

    elements = {
        moduleSelector: document.querySelector('#module-selector'),
        moduleTitle: document.querySelector('#module-title'),
        moduleDescription: document.querySelector('#module-description'),
        levelsContainer: document.querySelector('#levels-container'),
        playerCar: document.querySelector('#player-car'),
        progressLabel: document.querySelector('#progress-label'),
        progressRing: document.querySelector('#progress-ring'),
        progressBar: document.querySelector('#progress-bar'),
        completeButton: document.querySelector('#complete-level-button'),
        points: document.querySelector('#points-value'),
        streak: document.querySelector('#streak-value'),
        completed: document.querySelector('#completed-value'),
        sidebarLevel: document.querySelector('#sidebar-level'),
        friendsList: document.querySelector('#friends-list'),
        achievementsList: document.querySelector('#achievements-list'),
        achievementCount: document.querySelector('#achievement-count'),
        roadTip: document.querySelector('#road-tip'),
        toast: document.querySelector('#toast')
    };

    elements.completeButton.addEventListener(
        'click',
        completeCurrentLevel
    );

    setupNavigation();

    obtenerModulos(token);
});