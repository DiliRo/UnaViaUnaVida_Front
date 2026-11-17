/*
 * Vista de lección: leccion.html?modulo=<idModulo>&leccion=<numeroLeccion>
 *
 * Rutas del back que usa:
 *   GET  /v1/modulos/:id                                          -> módulo + lecciones
 *   GET  /v1/lecciones/modulo/:idModulo/numeroLeccion/:numero     -> lección de ese módulo
 *   POST /v1/preguntas/:id/responder  { idOpcion }                -> correcta + retroalimentación
 *   GET  /v1/modulos/nivel/:nivel                                 -> siguiente módulo (al terminar)
 */

/*
 * intentosMaximos = cantidad de respuestas equivocadas permitidas dentro de
 * un intento de la lección. Al llegar a ese número de errores, el intento
 * se termina y el usuario tiene que volver a empezar la lección.
 */

const $ = selector => document.querySelector(selector);

const estado = {
    modulo: null,
    leccion: null,
    preguntas: [],
    indice: 0,
    puntaje: 0,
    correctas: 0,
    errores: 0,
    agotado: false,
    repetir: false,
    puntosMaximos: 0,
    intentosMaximos: 0,
    esLeccionActual: false,
    esAdmin: false,
    respondiendo: false
};

let el;

/* ---------- Utilidades de vista ---------- */

function mostrarToast(mensaje, tipo = 'success') {
    const color = tipo === 'success' ? 'bg-[#168653]' : 'bg-[#D9363E]';

    el.toast.textContent = mensaje;
    el.toast.className = `
        fixed bottom-[1.25rem] left-1/2 z-50 -translate-x-1/2
        rounded-[0.7rem] px-[1rem] py-[0.8rem] text-[0.85rem]
        font-bold text-[#FFFFFF] shadow-lg shadow-[#151A1E]/20 ${color}
    `;

    clearTimeout(mostrarToast.timeout);
    mostrarToast.timeout = setTimeout(() => el.toast.classList.add('hidden'), 2500);
}

function mostrarSeccion(seccion) {
    [el.stateView, el.questionView, el.resultView].forEach(vista => vista.classList.add('hidden'));
    seccion.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarEstado({ icono, titulo, texto, tipo = 'info', volver = true }) {
    const colores = {
        info: 'bg-[#E0EFE7] text-[#0F6840]',
        error: 'bg-[#FDE8E9] text-[#A9242B]',
        bloqueado: 'bg-[#FFF6D6] text-[#8A6A00]'
    };

    el.stateIcon.className = `mx-auto grid size-[3.5rem] place-items-center rounded-full text-[1.4rem] font-black ${colores[tipo]}`;
    el.stateIcon.textContent = icono;
    el.stateTitle.textContent = titulo;
    el.stateText.textContent = texto;
    el.stateBack.classList.toggle('hidden', !volver);
    el.stateBack.classList.toggle('inline-block', volver);

    mostrarSeccion(el.stateView);
}

function intentosRestantes() {
    return Math.max(estado.intentosMaximos - estado.errores, 0);
}

function etiquetaPregunta() {
    return `Pregunta ${estado.indice + 1} · Intentos restantes: ${intentosRestantes()}`;
}

function renderEncabezado() {
    const { modulo, leccion } = estado;

    document.title = `${leccion.titulo} | Ruta Segura`;

    el.moduleName.textContent = `Módulo ${modulo.nivel} · ${modulo.nombre}`;
    el.lessonTitle.textContent = `Lección ${leccion.numeroLeccion}: ${leccion.titulo}`;
    el.lessonDescription.textContent = leccion.descripcion ?? '';

    el.sideLessonNumber.textContent = `${leccion.numeroLeccion}/${modulo.lecciones.length}`;
    el.sideMaxPoints.textContent = estado.puntosMaximos;
    el.sideAttempts.textContent = intentosRestantes();

    renderProgreso();
}

function renderProgreso() {
    const total = estado.preguntas.length;
    const respondidas = Math.min(estado.indice, total);

    el.questionCounter.textContent = `Pregunta ${Math.min(estado.indice + 1, total)} de ${total}`;
    el.scoreCounter.textContent = `${estado.puntaje} / ${estado.puntosMaximos} pts`;
    el.lessonProgress.style.width = total ? `${Math.round(respondidas / total * 100)}%` : '0%';
}

/* ---------- Preguntas ---------- */

function renderPregunta() {
    const pregunta = estado.preguntas[estado.indice];

    estado.respondiendo = false;

    el.questionLabel.textContent = etiquetaPregunta();
    el.questionStatement.textContent = pregunta.enunciado;
    el.questionFeedback.className = 'mt-[1rem] hidden rounded-[0.7rem] p-[1rem] text-[0.85rem] leading-[1.55]';
    el.nextButton.disabled = true;
    el.nextButton.textContent = estado.indice === estado.preguntas.length - 1 ? 'Ver resultado' : 'Siguiente';

    el.questionOptions.replaceChildren();

    pregunta.opciones.forEach((opcion, index) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.dataset.idOpcion = opcion._id;
        boton.className = `
            option-button flex items-center gap-[0.8rem] rounded-[0.75rem]
            border-[0.125rem] border-[#DBE0DC] bg-[#F4F6F3] p-[0.9rem]
            text-left text-[0.9rem] font-semibold transition
            enabled:hover:border-[#168653] enabled:hover:bg-[#E0EFE7]
            disabled:cursor-not-allowed
        `;

        const letra = document.createElement('span');
        letra.className = 'grid size-[2rem] shrink-0 place-items-center rounded-[0.5rem] bg-[#FFFFFF] text-[0.8rem] font-extrabold text-[#68747B]';
        letra.textContent = String.fromCharCode(65 + index);

        const texto = document.createElement('span');
        texto.textContent = opcion.texto;

        boton.append(letra, texto);
        boton.addEventListener('click', () => responder(pregunta, opcion, boton));

        el.questionOptions.appendChild(boton);
    });

    renderProgreso();
    mostrarSeccion(el.questionView);
}

function pintarOpcion(boton, correcta) {
    boton.classList.remove('border-[#DBE0DC]', 'bg-[#F4F6F3]');
    boton.classList.add(
        correcta ? 'border-[#168653]' : 'border-[#D9363E]',
        correcta ? 'bg-[#E0EFE7]' : 'bg-[#FDE8E9]'
    );
}

async function responder(pregunta, opcion, boton) {
    if (estado.respondiendo) return;
    estado.respondiendo = true;

    const botones = [...el.questionOptions.querySelectorAll('.option-button')];
    botones.forEach(b => (b.disabled = true));

    try {
        const data = await Progreso.peticion(`/preguntas/${pregunta._id}/responder`, {
            method: 'POST',
            body: JSON.stringify({ idOpcion: opcion._id })
        });

        const correcta = data.correcta === true;

        pintarOpcion(boton, correcta);
        botones.filter(b => b !== boton).forEach(b => b.classList.add('opacity-60'));

        if (correcta) {
            estado.puntaje += 1;
            estado.correctas += 1;
            estado.repetir = false;
        } else {
            estado.errores += 1;
            estado.agotado = estado.errores >= estado.intentosMaximos;
            estado.repetir = !estado.agotado;
        }

        const restantes = intentosRestantes();
        el.sideAttempts.textContent = restantes;
        el.questionLabel.textContent = etiquetaPregunta();

        const retro = (data.retroalimentacion ?? '').trim();
        const retroConPunto = retro && !/[.!?]$/.test(retro) ? `${retro}.` : retro;

        let mensaje;

        if (correcta) {
            mensaje = `¡Correcto! ${retroConPunto}`;
        } else if (estado.agotado) {
            mensaje = `Incorrecto. ${retroConPunto} Intentos fallidos: vuelve a hacer esta lección desde el principio.`;
        } else {
            mensaje = `Incorrecto. ${retroConPunto} ${restantes === 1 ? 'Te queda 1 intento' : `Te quedan ${restantes} intentos`}. Vuelve a intentarlo.`;
        }

        mensaje = mensaje.replace(/\s+/g, ' ');

        el.questionFeedback.className = `mt-[1rem] rounded-[0.7rem] p-[1rem] text-[0.85rem] leading-[1.55] ${
            correcta ? 'bg-[#E0EFE7] text-[#0F6840]' : 'bg-[#FDE8E9] text-[#A9242B]'
        }`;
        el.questionFeedback.textContent = mensaje.trim();

        if (estado.agotado) {
            el.nextButton.textContent = 'Ver resultado';
        } else if (estado.repetir) {
            el.nextButton.textContent = 'Intentar de nuevo';
        }

        el.nextButton.disabled = false;
        renderProgreso();
    } catch (error) {
        console.error('Error al responder:', error);
        mostrarToast('No se pudo enviar tu respuesta. Intenta de nuevo.', 'error');
        botones.forEach(b => (b.disabled = false));
        estado.respondiendo = false;
    }
}

function siguiente() {
    if (estado.agotado) {
        return finalizar();
    }

    /* Respuesta incorrecta: se repite la misma pregunta. */
    if (estado.repetir) {
        estado.repetir = false;
        return renderPregunta();
    }

    estado.indice += 1;

    if (estado.indice < estado.preguntas.length) {
        renderPregunta();
    } else {
        finalizar();
    }
}

/* ---------- Resultado ---------- */

async function buscarSiguienteModulo(nivel) {
    try {
        const data = await Progreso.peticion(`/modulos/nivel/${nivel}`);
        return data.modulos ?? null;
    } catch {
        return null;
    }
}

async function finalizar() {
    const { modulo, leccion } = estado;
    /* Solo se aprueba si todas las preguntas se respondieron bien sin agotar los intentos. */
    const aprobado = !estado.agotado;
    const totalLecciones = modulo.lecciones.length;
    const esUltima = Number(leccion.numeroLeccion) >= totalLecciones;

    renderProgreso();

    if (aprobado) {
        el.lessonProgress.style.width = '100%';
    }

    let textoProgreso = '';

    if (aprobado && estado.esLeccionActual) {
        const siguienteProgreso = Progreso.calcularSiguiente(modulo.nivel, leccion.numeroLeccion, totalLecciones);
        await Progreso.guardarProgreso(siguienteProgreso);

        textoProgreso = esUltima
            ? ` ¡Completaste el módulo! Desbloqueaste el nivel ${siguienteProgreso.nivel}.`
            : ` Desbloqueaste la lección ${siguienteProgreso.numeroLeccion}.`;
    }

    const restantes = intentosRestantes();

    el.resultScore.textContent = `${estado.puntaje}/${estado.puntosMaximos}`;
    el.resultCorrect.textContent = `${estado.correctas}/${estado.preguntas.length}`;
    el.resultAttempts.textContent = restantes;
    el.sideAttempts.textContent = restantes;

    el.resultIcon.className = `mx-auto grid size-[4rem] place-items-center rounded-full text-[1.6rem] font-black ${
        aprobado ? 'bg-[#168653] text-[#FFFFFF]' : 'bg-[#D9363E] text-[#FFFFFF]'
    }`;
    el.resultIcon.textContent = aprobado ? '✓' : '✕';

    el.resultTitle.textContent = aprobado ? '¡Lección completada!' : 'Intentos fallidos';
    el.resultText.textContent = aprobado
        ? `Obtuviste ${estado.puntaje} de ${estado.puntosMaximos} puntos.${textoProgreso}`
        : `Fallaste ${estado.errores} ${estado.errores === 1 ? 'vez' : 'veces'} y se acabaron los ${estado.intentosMaximos} intentos. Vuelve a hacer esta lección desde el principio.`;

    el.retryButton.classList.toggle('hidden', aprobado);

    el.nextLessonButton.classList.add('hidden');

    if (aprobado) {
        if (!esUltima) {
            el.nextLessonButton.href = `./leccion.html?modulo=${modulo._id}&leccion=${leccion.numeroLeccion + 1}`;
            el.nextLessonButton.textContent = 'Siguiente lección →';
            el.nextLessonButton.classList.remove('hidden');
        } else {
            const siguienteModulo = await buscarSiguienteModulo(modulo.nivel + 1);

            if (siguienteModulo?._id && siguienteModulo.lecciones?.length) {
                el.nextLessonButton.href = `./leccion.html?modulo=${siguienteModulo._id}&leccion=1`;
                el.nextLessonButton.textContent = 'Siguiente módulo →';
                el.nextLessonButton.classList.remove('hidden');
            }
        }
    }

    mostrarSeccion(el.resultView);
}

function reiniciar() {
    estado.indice = 0;
    estado.puntaje = 0;
    estado.correctas = 0;
    estado.errores = 0;
    estado.agotado = false;
    estado.repetir = false;
    renderEncabezado();
    renderPregunta();
}

/* ---------- Carga inicial ---------- */

function preguntasConContenido(preguntas) {
    return Array.isArray(preguntas) &&
        preguntas.length > 0 &&
        preguntas.every(p => p && typeof p === 'object' && p.enunciado && Array.isArray(p.opciones));
}

async function cargarLeccion() {
    const params = new URLSearchParams(window.location.search);
    const idModulo = params.get('modulo');
    const numeroLeccion = Number(params.get('leccion'));

    if (!idModulo || !Number.isInteger(numeroLeccion) || numeroLeccion < 1) {
        return mostrarEstado({
            icono: '!',
            titulo: 'Lección no encontrada',
            texto: 'El enlace de la lección no es válido. Regresa a tu ruta y elige un módulo.',
            tipo: 'error'
        });
    }

    try {
        const [progreso, dataModulo, dataLeccion] = await Promise.all([
            Progreso.obtenerProgreso(),
            Progreso.peticion(`/modulos/${idModulo}`),
            Progreso.peticion(`/lecciones/modulo/${idModulo}/numeroLeccion/${numeroLeccion}`)
        ]);

        const modulo = dataModulo.modulo;
        const leccion = Array.isArray(dataLeccion.leccion) ? dataLeccion.leccion[0] : dataLeccion.leccion;

        if (!modulo || !leccion) {
            return mostrarEstado({
                icono: '!',
                titulo: 'Lección no encontrada',
                texto: `El módulo no tiene una lección número ${numeroLeccion}.`,
                tipo: 'error'
            });
        }

        estado.modulo = modulo;
        estado.leccion = leccion;

        estado.esAdmin = Progreso.esAdmin();

        /* Bloqueos por nivel / número de lección del usuario (no aplican al ADMIN) */
        if (!estado.esAdmin && modulo.nivel > progreso.nivel) {
            return mostrarEstado({
                icono: '🔒',
                titulo: 'Módulo bloqueado',
                texto: `Este módulo es de nivel ${modulo.nivel}. Tú estás en el nivel ${progreso.nivel}; completa tus módulos actuales para desbloquearlo.`,
                tipo: 'bloqueado'
            });
        }

        if (!estado.esAdmin && modulo.nivel === progreso.nivel && numeroLeccion > progreso.numeroLeccion) {
            return mostrarEstado({
                icono: '🔒',
                titulo: 'Lección bloqueada',
                texto: `Primero completa la lección ${progreso.numeroLeccion} de este módulo.`,
                tipo: 'bloqueado'
            });
        }

        estado.esLeccionActual = modulo.nivel === progreso.nivel && numeroLeccion === progreso.numeroLeccion;

        const preguntas = leccion.preguntas ?? [];
        estado.preguntas = preguntas;
        estado.intentosMaximos = Number(leccion.intentosMaximos) || 1;
        estado.puntosMaximos = Number(leccion.puntosMaximos) || preguntas.length;

        renderEncabezado();

        if (preguntas.length === 0) {
            return mostrarEstado({
                icono: '?',
                titulo: 'Sin preguntas',
                texto: 'Esta lección todavía no tiene preguntas.',
                tipo: 'error'
            });
        }

        if (!preguntasConContenido(preguntas)) {
            console.error(
                'La lección trae las preguntas como IDs. El back debe hacer populate("preguntas") ' +
                'en GET /v1/lecciones/modulo/:idModulo/numeroLeccion/:numeroLeccion.',
                preguntas
            );

            return mostrarEstado({
                icono: '!',
                titulo: 'No se pudieron cargar las preguntas',
                texto: 'El servidor envió la lección sin el contenido de sus preguntas. Intenta más tarde.',
                tipo: 'error'
            });
        }

        const yaCompletada =
            modulo.nivel < progreso.nivel ||
            (modulo.nivel === progreso.nivel && numeroLeccion < progreso.numeroLeccion);

        if (yaCompletada) {
            mostrarToast('Modo repaso: esta lección ya la completaste.');
        }

        renderPregunta();
    } catch (error) {
        console.error('Error al cargar la lección:', error);

        mostrarEstado({
            icono: '!',
            titulo: 'Error al cargar la lección',
            texto: 'No se pudo conectar con el servidor. Revisa que el back esté encendido.',
            tipo: 'error'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!Progreso.validarSesion()) return;

    el = {
        moduleName: $('#module-name'),
        lessonTitle: $('#lesson-title'),
        lessonDescription: $('#lesson-description'),
        questionCounter: $('#question-counter'),
        scoreCounter: $('#score-counter'),
        lessonProgress: $('#lesson-progress'),
        sideLessonNumber: $('#side-lesson-number'),
        sideMaxPoints: $('#side-max-points'),
        sideAttempts: $('#side-attempts'),
        stateView: $('#state-view'),
        stateIcon: $('#state-icon'),
        stateTitle: $('#state-title'),
        stateText: $('#state-text'),
        stateBack: $('#state-back'),
        questionView: $('#question-view'),
        questionLabel: $('#question-label'),
        questionStatement: $('#question-statement'),
        questionOptions: $('#question-options'),
        questionFeedback: $('#question-feedback'),
        nextButton: $('#next-button'),
        resultView: $('#result-view'),
        resultIcon: $('#result-icon'),
        resultTitle: $('#result-title'),
        resultText: $('#result-text'),
        resultScore: $('#result-score'),
        resultCorrect: $('#result-correct'),
        resultAttempts: $('#result-attempts'),
        retryButton: $('#retry-button'),
        nextLessonButton: $('#next-lesson-button'),
        toast: $('#toast')
    };

    el.nextButton.addEventListener('click', siguiente);
    el.retryButton.addEventListener('click', reiniciar);

    cargarLeccion();
});
