// src/store/index.js
import { createStore } from 'vuex';
import { authService } from '@/services/authService';

export default createStore({
  state: {
    // ── Autenticación ──────────────────────────────────
    usuario: null,          // objeto con datos del usuario logueado
    isAuthenticated: false, // flag de sesión activa
    authLoading: false,
    authError: null,

    // ── Clima ──────────────────────────────────────────
    climaActual: null,
    ciudadActual: null,
    climaLoading: false,
    climaError: null,

    // ── Tema (invitados) ───────────────────────────────
    temaGuest:   localStorage.getItem('weather_tema')   ?? 'dark',
    // ── Unidad (invitados) ────────────────────────────
    unidadGuest: localStorage.getItem('weather_unidad') ?? 'C',
  },

  getters: {
    usuario: (state) => state.usuario,
    isAuthenticated: (state) => state.isAuthenticated,
    authLoading: (state) => state.authLoading,
    authError: (state) => state.authError,

    nombreUsuario: (state) => state.usuario?.nombre ?? '',
    preferencias: (state) => state.usuario?.preferencias ?? { unidad: 'C', tema: 'dark' },
    favoritos: (state) => state.usuario?.favoritos ?? [],
    unidad: (state) => state.usuario?.preferencias?.unidad ?? state.unidadGuest,
    tema: (state) => state.usuario?.preferencias?.tema ?? state.temaGuest,

    climaActual: (state) => state.climaActual,
    ciudadActual: (state) => state.ciudadActual,
    climaLoading: (state) => state.climaLoading,
    climaError: (state) => state.climaError,
  },

  mutations: {
    // ── Auth ───────────────────────────────────────────
    SET_AUTH_LOADING(state, val) { state.authLoading = val; },
    SET_AUTH_ERROR(state, msg)   { state.authError = msg; },
    CLEAR_AUTH_ERROR(state)      { state.authError = null; },

    LOGIN_SUCCESS(state, usuario) {
      state.usuario = usuario;
      state.isAuthenticated = true;
      state.authError = null;
    },
    LOGOUT(state) {
      state.usuario = null;
      state.isAuthenticated = false;
      state.climaActual = null;
      state.ciudadActual = null;
    },

    ACTUALIZAR_PREFERENCIAS(state, prefs) {
      if (state.usuario) {
        state.usuario.preferencias = { ...state.usuario.preferencias, ...prefs };
        // Persistir en localStorage
        localStorage.setItem('weather_user', JSON.stringify(state.usuario));
      }
      // Persistir tema y unidad para invitados también
      if (prefs.tema) {
        state.temaGuest = prefs.tema;
        localStorage.setItem('weather_tema', prefs.tema);
      }
      if (prefs.unidad) {
        state.unidadGuest = prefs.unidad;
        localStorage.setItem('weather_unidad', prefs.unidad);
      }
    },

    AGREGAR_FAVORITO(state, ciudad) {
      if (!state.usuario) return;
      const existe = state.usuario.favoritos.find((f) => f.ciudad === ciudad.ciudad);
      if (!existe) {
        const nuevoId = Date.now();
        state.usuario.favoritos.push({ ...ciudad, id: nuevoId });
        localStorage.setItem('weather_user', JSON.stringify(state.usuario));
      }
    },

    ELIMINAR_FAVORITO(state, id) {
      if (!state.usuario) return;
      state.usuario.favoritos = state.usuario.favoritos.filter((f) => f.id !== id);
      localStorage.setItem('weather_user', JSON.stringify(state.usuario));
    },

    // ── Clima ───────────────────────────────────────────
    SET_CLIMA_LOADING(state, val) { state.climaLoading = val; },
    SET_CLIMA_ERROR(state, msg)   { state.climaError = msg; },
    SET_CLIMA(state, { clima, ciudad }) {
      state.climaActual = clima;
      state.ciudadActual = ciudad;
      state.climaError = null;
    },
  },

  actions: {
    // ── Restaurar sesión al iniciar la app ───────────────
    async restaurarSesion({ commit }) {
      const stored = authService.getStoredUser();
      if (stored) {
        commit('LOGIN_SUCCESS', stored);
      }
    },

    // ── Login ─────────────────────────────────────────────
    async login({ commit }, { email, password }) {
      commit('SET_AUTH_LOADING', true);
      commit('CLEAR_AUTH_ERROR');
      try {
        const usuario = await authService.login(email, password);
        commit('LOGIN_SUCCESS', usuario);
        return true;
      } catch (err) {
        commit('SET_AUTH_ERROR', err.message);
        return false;
      } finally {
        commit('SET_AUTH_LOADING', false);
      }
    },

    // ── Registro ───────────────────────────────────────────
    async register({ commit }, { nombre, email, password }) {
      commit('SET_AUTH_LOADING', true);
      commit('CLEAR_AUTH_ERROR');
      try {
        const usuario = await authService.register(nombre, email, password);
        commit('LOGIN_SUCCESS', usuario);
        return true;
      } catch (err) {
        commit('SET_AUTH_ERROR', err.message);
        return false;
      } finally {
        commit('SET_AUTH_LOADING', false);
      }
    },

    // ── Logout ─────────────────────────────────────────────
    async logout({ commit }) {
      await authService.logout();
      commit('LOGOUT');
    },

    // ── Preferencias ────────────────────────────────────────
    actualizarPreferencias({ commit }, prefs) {
      commit('ACTUALIZAR_PREFERENCIAS', prefs);
    },

    // ── Favoritos ────────────────────────────────────────────
    agregarFavorito({ commit }, ciudad) {
      commit('AGREGAR_FAVORITO', ciudad);
    },
    eliminarFavorito({ commit }, id) {
      commit('ELIMINAR_FAVORITO', id);
    },

    // ── Clima ────────────────────────────────────────────────
    async cargarClima({ commit }, { lat, lon, ciudad }) {
      const { weatherService } = await import('@/services/weatherService');
      commit('SET_CLIMA_LOADING', true);
      try {
        const clima = await weatherService.obtenerClima(lat, lon);
        commit('SET_CLIMA', { clima, ciudad });
      } catch {
        commit('SET_CLIMA_ERROR', 'No se pudo obtener el clima.');
      } finally {
        commit('SET_CLIMA_LOADING', false);
      }
    },
  },
});
