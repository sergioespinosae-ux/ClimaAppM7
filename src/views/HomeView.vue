<template>
  <div class="home-view">
    <!-- Hero section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            Clima,<br />
            <span class="accent-text">a tu medida.</span>
          </h1>
          <p class="hero-sub">
            Busca cualquier ciudad del mundo y accede al pronóstico en tiempo real.
          </p>

          <!-- Search bar -->
          <div class="search-wrap">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                v-model="query"
                type="text"
                class="search-input"
                placeholder="Curicó, Santiago, Tenerife…"
                @input="onInput"
                @keydown.enter="seleccionarPrimero"
                @keydown.down.prevent="moverFoco(1)"
                @keydown.up.prevent="moverFoco(-1)"
                @keydown.esc="limpiarSugerencias"
                autocomplete="off"
              />
              <button v-if="query" class="clear-btn" @click="limpiar">✕</button>
              <button
                class="geo-btn"
                :class="{ loading: geoLoading }"
                @click="usarUbicacion"
                :title="geoError || 'Usar mi ubicación'"
                :disabled="geoLoading"
              >
                <span class="geo-icon">{{ geoLoading ? '⏳' : '📍' }}</span>
                <span v-if="geoNombre" class="geo-nombre">{{ geoNombre }}</span>
              </button>
            </div>

            <!-- Geo error -->
            <div v-if="geoError" class="geo-error">{{ geoError }}</div>

            <!-- Autocomplete dropdown -->
            <div v-if="sugerencias.length" class="suggestions">
              <button
                v-for="(s, i) in sugerencias"
                :key="s.id || i"
                class="suggestion-item"
                :class="{ focused: i === focusIndex }"
                @click="seleccionar(s)"
              >
                <span class="sug-name">{{ s.name }}</span>
                <span class="sug-meta">
                  {{ s.admin1 ? s.admin1 + ', ' : '' }}{{ s.country }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Weather Card -->
    <section class="weather-section" v-if="climaActual || climaLoading || climaError">
      <div class="container">
        <WeatherCard
          :clima="climaActual"
          :ciudad="ciudadNombre"
          :ciudadData="ciudadSeleccionada"
          :isLoading="climaLoading"
          :error="climaError"
        />
      </div>
    </section>

    <!-- Welcome / guest section -->
    <section v-if="!isAuthenticated && !climaActual && !climaLoading" class="guest-section">
      <div class="container">
        <div class="guest-cards">
          <div class="guest-card">
            <div class="gc-icon">★</div>
            <h3>Guarda en favoritos</h3>
            <p>Inicia sesión para guardar tus ciudades y acceder al clima de cada una.</p>
          </div>
          <div class="guest-card">
            <div class="gc-icon">⚙</div>
            <h3>Personaliza la app</h3>
            <p>Elige tu unidad de temperatura preferida (°C / °F) y el tema visual que más te guste.</p>
          </div>
          <div class="guest-card">
            <div class="gc-icon">🌍</div>
            <h3>Pronóstico de 7 días</h3>
            <p>Visualiza el pronóstico extendido para cualquier ciudad del planeta.</p>
          </div>
        </div>
        <div class="guest-cta">
          <router-link to="/registro" class="btn btn-primary">Crear cuenta gratis</router-link>
          <router-link to="/login" class="btn btn-ghost">Ya tengo cuenta</router-link>
        </div>
      </div>
    </section>

    <!-- Logged-in quick favorites -->
    <section v-if="isAuthenticated && favoritos.length && !climaActual && !climaLoading" class="fav-quick">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Tus favoritos</h2>
          <router-link to="/favoritos" class="btn btn-ghost btn-sm">Ver todos →</router-link>
        </div>
        <div class="fav-grid">
          <button
            v-for="fav in favoritos.slice(0, 4)"
            :key="fav.id"
            class="fav-quick-card"
            @click="cargarDesdefavorito(fav)"
          >
            <span class="fqc-city">{{ fav.ciudad }}</span>
            <span class="fqc-country">{{ fav.pais }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import WeatherCard from '@/components/WeatherCard.vue';
import { weatherService } from '@/services/weatherService';

export default {
  name: 'HomeView',
  components: { WeatherCard },
  setup() {
    const store = useStore();

    const query            = ref('');
    const sugerencias      = ref([]);
    const focusIndex       = ref(-1);
    const ciudadSeleccionada = ref(null);
    const ciudadNombre     = ref('');
    let debounceTimer      = null;

    const climaActual  = computed(() => store.getters.climaActual);
    const ciudadActual = computed(() => store.getters.ciudadActual);
    const climaLoading = computed(() => store.getters.climaLoading);
    const climaError   = computed(() => store.getters.climaError);
    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const favoritos    = computed(() => store.getters.favoritos);

    const onInput = () => {
      clearTimeout(debounceTimer);
      focusIndex.value = -1;
      if (query.value.trim().length < 2) {
        sugerencias.value = [];
        return;
      }
      debounceTimer = setTimeout(async () => {
        try {
          sugerencias.value = await weatherService.buscarCiudad(query.value);
        } catch {
          sugerencias.value = [];
        }
      }, 350);
    };

    const seleccionar = (ciudad) => {
      ciudadSeleccionada.value = ciudad;
      ciudadNombre.value = ciudad.name + (ciudad.country ? `, ${ciudad.country}` : '');
      query.value = ciudadNombre.value;
      sugerencias.value = [];
      store.dispatch('cargarClima', {
        lat: ciudad.latitude,
        lon: ciudad.longitude,
        ciudad: ciudadNombre.value,
      });
    };

    const seleccionarPrimero = () => {
      const idx = focusIndex.value >= 0 ? focusIndex.value : 0;
      if (sugerencias.value[idx]) seleccionar(sugerencias.value[idx]);
    };

    const moverFoco = (dir) => {
      const len = sugerencias.value.length;
      if (!len) return;
      focusIndex.value = (focusIndex.value + dir + len) % len;
    };

    const limpiarSugerencias = () => { sugerencias.value = []; };
    const limpiar = () => {
      query.value = '';
      sugerencias.value = [];
    };

    const cargarDesdefavorito = (fav) => {
      ciudadNombre.value = `${fav.ciudad}, ${fav.pais}`;
      store.dispatch('cargarClima', {
        lat: fav.lat,
        lon: fav.lon,
        ciudad: ciudadNombre.value,
      });
    };

    // Geolocalización
    const geoLoading = ref(false);
    const geoError   = ref('');
    const geoNombre  = ref('');

    const usarUbicacion = () => {
      if (!navigator.geolocation) {
        geoError.value = 'Tu navegador no soporta geolocalización.';
        return;
      }
      geoLoading.value = true;
      geoError.value = '';
      geoNombre.value = '';
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          try {
            const nombreCiudad = await weatherService.reverseGeocode(lat, lon);
            const nombre = nombreCiudad ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            const nombreSolo = nombre.split(',')[0].trim();
            ciudadNombre.value = nombre;
            query.value = nombre;
            geoNombre.value = nombreCiudad ? nombreSolo : '';
            // Armar ciudadData para que el botón de favoritos funcione
            ciudadSeleccionada.value = {
              name: nombreSolo,
              country_code: nombre.includes(',') ? nombre.split(',').slice(-1)[0].trim() : '',
              latitude: lat,
              longitude: lon,
            };
            store.dispatch('cargarClima', { lat, lon, ciudad: nombre });
          } finally {
            geoLoading.value = false;
          }
        },
        (err) => {
          geoLoading.value = false;
          geoError.value = err.code === 1
            ? 'Permiso de ubicación denegado.'
            : 'No se pudo obtener tu ubicación.';
          setTimeout(() => { geoError.value = ''; }, 3000);
        },
        { timeout: 8000 }
      );
    };

    return {
      query, sugerencias, focusIndex, ciudadSeleccionada, ciudadNombre,
      climaActual, ciudadActual, climaLoading, climaError,
      isAuthenticated, favoritos,
      geoLoading, geoError, geoNombre,
      onInput, seleccionar, seleccionarPrimero, moverFoco,
      limpiarSugerencias, limpiar, cargarDesdefavorito, usarUbicacion,
    };
  },
};
</script>

<style scoped>
/* Hero */
.hero {
  position: relative;
  padding: 80px 0 60px;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}
.orb-1 {
  width: 500px; height: 500px;
  background: var(--accent);
  top: -200px; right: -100px;
}
.orb-2 {
  width: 300px; height: 300px;
  background: #a855f7;
  bottom: -100px; left: 5%;
}

.hero-content { position: relative; z-index: 1; max-width: 640px; }
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 6vw, 4.5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
}
.accent-text { color: var(--accent); }

.hero-sub {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 40px;
  max-width: 480px;
}

/* Search */
.search-wrap { position: relative; max-width: 540px; }
.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 4px 4px 4px 16px;
  gap: 8px;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.search-icon { font-size: 1rem; }
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 10px 0;
}
.search-input::placeholder { color: var(--text-muted); }
.clear-btn {
  background: var(--bg-surface);
  border: none;
  color: var(--text-muted);
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: color var(--transition);
  flex-shrink: 0;
}
.clear-btn:hover { color: var(--text-primary); }

/* Geo button */
.geo-btn {
  background: var(--bg-surface);
  border: none;
  color: var(--text-muted);
  height: 36px;
  min-width: 36px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  transition: color var(--transition), background var(--transition);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.geo-btn:hover:not(:disabled) { color: var(--accent); background: var(--bg-elevated); }
.geo-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.geo-btn.loading { animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.geo-nombre {
  font-size: 0.78rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--accent);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.geo-error {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--danger);
  padding: 6px 12px;
  background: rgba(248,113,113,0.1);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(248,113,113,0.25);
}

/* Suggestions */
.suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0; right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  animation: dropIn 0.12s ease;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.suggestion-item {
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition);
  border-bottom: 1px solid var(--border);
}
.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover, .suggestion-item.focused {
  background: var(--bg-elevated);
}
.sug-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}
.sug-meta {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-left: auto;
}

/* Weather section */
.weather-section {
  padding: 0 0 60px;
}

/* Guest section */
.guest-section { padding: 60px 0; }
.guest-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}
.guest-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  transition: border-color var(--transition), transform var(--transition);
}
.guest-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-3px);
}
.gc-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}
.guest-card h3 {
  font-family: var(--font-display);
  font-weight: 700;
  margin-bottom: 8px;
}
.guest-card p { color: var(--text-secondary); font-size: 0.9rem; }
.guest-cta {
  display: flex;
  gap: 12px;
}

/* Favorites quick */
.fav-quick { padding: 0 0 60px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
}
.btn-sm { padding: 7px 14px; font-size: 0.8rem; }
.fav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.fav-quick-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all var(--transition);
}
.fav-quick-card:hover {
  border-color: var(--accent);
  background: var(--bg-elevated);
  transform: translateY(-2px);
}
.fqc-city {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-primary);
}
.fqc-country {
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .guest-cards { grid-template-columns: 1fr; }
  .fav-grid    { grid-template-columns: repeat(2, 1fr); }
}
</style>
