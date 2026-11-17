/*
 * Progreso del usuario (nivel = módulo, numeroLeccion = lección actual).
 *
 * Lo usan principal.js y leccion.js. Se carga ANTES que esos scripts.
 *
 * Fuentes del progreso (se toma la más avanzada):
 *   1. Payload del JWT (nivel)                       -> login
 *   2. GET /v1/ranking/amigos (registro con esYo)     -> nivel actualizado del back
 *   3. localStorage (nivel + numeroLeccion)           -> respaldo local
 *
 * Al completar una lección se guarda en localStorage y se intenta
 * sincronizar con el back en RUTA_PROGRESO (PATCH { nivel, numeroLeccion }).
 */

const API_URL = 'http://localhost:3641/v1';

/* Ruta del back que actualiza nivel y numeroLeccion del usuario.
   Si el back aún no la tiene, el front sigue funcionando con localStorage. */
const RUTA_PROGRESO = `${API_URL}/usuarios/progreso`;

const Progreso = {
    obtenerToken() {
        return localStorage.getItem('token');
    },

    obtenerPayload(token = this.obtenerToken()) {
        const parte = token?.split('.')[1];

        if (!parte) {
            throw new Error('JWT sin payload');
        }

        const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));

        return JSON.parse(new TextDecoder().decode(bytes));
    },

    /* Devuelve el payload o redirige al login si el token no sirve. */
    validarSesion() {
        const token = this.obtenerToken();

        try {
            const payload = this.obtenerPayload(token);

            if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
                throw new Error('Token expirado');
            }

            return payload;
        } catch (error) {
            console.error('Token inválido:', error);
            localStorage.removeItem('token');
            window.location.replace('./login.html');
            return null;
        }
    },

    /* Borra el token y regresa al login. */
    cerrarSesion() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.replace('./login.html');
    },

    /* Pone el nombre del usuario loggeado en [data-user-name] y sus iniciales en [data-user-initials]. */
    pintarUsuario() {
        let nombre = '';

        try {
            const payload = this.obtenerPayload();
            nombre = (payload.nombre || payload.nombreUsuario || '').trim();
        } catch {
            return;
        }

        if (!nombre) return;

        const iniciales = nombre
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(palabra => palabra[0].toUpperCase())
            .join('');

        document.querySelectorAll('[data-user-name]').forEach(el => {
            el.textContent = nombre;
            el.title = nombre;
        });

        document.querySelectorAll('[data-user-initials]').forEach(el => {
            el.textContent = iniciales;
        });
    },

    /* Conecta los botones [data-logout] y pinta el nombre del usuario. */
    iniciarSidebar() {
        this.pintarUsuario();

        document.querySelectorAll('[data-logout]').forEach(boton => {
            boton.addEventListener('click', () => this.cerrarSesion());
        });
    },

    /* Los ADMIN tienen acceso a todos los módulos y lecciones. */
    esAdmin() {
        try {
            return this.obtenerPayload().rol === 'ADMIN';
        } catch {
            return false;
        }
    },

    async peticion(ruta, opciones = {}) {
        const response = await fetch(`${API_URL}${ruta}`, {
            ...opciones,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.obtenerToken()}`,
                ...(opciones.headers ?? {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            throw new Error(data.message ?? `HTTP ${response.status}`);
        }

        return data;
    },

    claveLocal(uid) {
        return `uvuv:progreso:${uid}`;
    },

    leerLocal(uid) {
        try {
            const guardado = JSON.parse(localStorage.getItem(this.claveLocal(uid)) || 'null');

            if (guardado && Number.isFinite(guardado.nivel) && Number.isFinite(guardado.numeroLeccion)) {
                return guardado;
            }
        } catch (error) {
            console.warn('Progreso local inválido:', error);
        }

        return null;
    },

    guardarLocal(uid, progreso) {
        localStorage.setItem(this.claveLocal(uid), JSON.stringify({
            nivel: progreso.nivel,
            numeroLeccion: progreso.numeroLeccion
        }));
    },

    /* true si a está más adelante que b */
    estaMasAdelante(a, b) {
        if (a.nivel !== b.nivel) return a.nivel > b.nivel;
        return a.numeroLeccion > b.numeroLeccion;
    },

    async nivelDesdeBack() {
        try {
            const data = await this.peticion('/ranking/amigos');
            const yo = (data.ranking ?? []).find(item => item.esYo);
            return Number(yo?.nivel) || null;
        } catch (error) {
            console.warn('No se pudo leer el nivel desde el back:', error.message);
            return null;
        }
    },

    async obtenerProgreso() {
        const payload = this.obtenerPayload();
        const uid = payload.uid;

        let progreso = {
            nivel: Number(payload.nivel) || 1,
            numeroLeccion: Number(payload.numeroLeccion) || 1
        };

        const nivelBack = await this.nivelDesdeBack();

        if (nivelBack && nivelBack > progreso.nivel) {
            progreso = { nivel: nivelBack, numeroLeccion: 1 };
        }

        const local = this.leerLocal(uid);

        if (local && this.estaMasAdelante(local, progreso)) {
            progreso = local;
        }

        this.guardarLocal(uid, progreso);

        return progreso;
    },

    /*
     * Al completar una lección, el numeroLeccion del usuario pasa a ser
     * el numeroLeccion de la lección completada + 1 (la siguiente).
     * Al completar la última lección del módulo, el nivel del usuario pasa a ser
     * el nivel del módulo + 1 y vuelve a la lección 1.
     */
    calcularSiguiente(nivelModulo, numeroLeccionCompletada, totalLecciones) {
        const nivel = Number(nivelModulo);
        const numero = Number(numeroLeccionCompletada);

        if (numero >= Number(totalLecciones)) {
            return { nivel: nivel + 1, numeroLeccion: 1 };
        }

        return { nivel, numeroLeccion: numero + 1 };
    },

    async guardarProgreso(nuevo) {
        const uid = this.obtenerPayload().uid;
        const actual = this.leerLocal(uid);

        /* Repetir una lección vieja nunca hace retroceder al usuario. */
        if (actual && !this.estaMasAdelante(nuevo, actual)) {
            return { progreso: actual, sincronizado: false };
        }

        this.guardarLocal(uid, nuevo);

        try {
            const response = await fetch(RUTA_PROGRESO, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.obtenerToken()}`
                },
                body: JSON.stringify(nuevo)
            });

            if (!response.ok) {
                console.warn(`Progreso guardado solo en local (back respondió ${response.status}).`);
                return { progreso: nuevo, sincronizado: false };
            }

            return { progreso: nuevo, sincronizado: true };
        } catch (error) {
            console.warn('Progreso guardado solo en local:', error.message);
            return { progreso: nuevo, sincronizado: false };
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Progreso.iniciarSidebar());
