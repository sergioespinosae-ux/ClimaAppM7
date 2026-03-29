# ClimaApp — Módulo 7

App de Clima con sistema de usuarios, autenticación, estado global y múltiples mejoras visuales.

## Características

- 🔍 **Búsqueda de ciudades** con autocompletado (Open-Meteo Geocoding)
- 📍 **Geolocalización** — detecta tu ciudad automáticamente
- 🌡️ **Clima actual** — temperatura, sensación, humedad, viento, máx/mín
- 🕐 **Pronóstico por horas** — próximas 12 horas con scroll horizontal
- 📅 **Pronóstico 7 días** — con gráfico de barras de temperatura
- 🌈 **Fondo dinámico** en la tarjeta según el clima (sol, lluvia, nieve, tormenta…)
- ⏳ **Skeleton loaders** animados al cargar datos
- ☀️🌙 **Modo claro/oscuro** — toggle en la navbar, persistido para todos los usuarios
- °C/°F **Cambio de unidad** — toggle en la navbar, persistido para todos los usuarios
- ★ **Ciudades favoritas** — guardar, ver y eliminar
- 👤 **Autenticación** — login, registro y perfil de usuario

## Sistema de usuarios

Cada usuario almacenado en Vuex contiene:

| Campo | Descripción |
|---|---|
| `id` | Identificador único |
| `nombre` | Nombre completo |
| `email` | Correo (usado como credencial) |
| `preferencias.unidad` | Unidad de temperatura: `'C'` o `'F'` |
| `preferencias.tema` | Tema visual: `'dark'` o `'light'` |
| `favoritos` | Array de ciudades: `{ id, ciudad, pais, lat, lon }` |

La sesión y las preferencias se persisten en `localStorage`.

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Inicio + buscador de clima | Público |
| `/login` | Inicio de sesión | Solo invitados |
| `/registro` | Crear cuenta | Solo invitados |
| `/favoritos` | Ciudades favoritas | **Requiere login** |
| `/perfil` | Preferencias y datos | **Requiere login** |

## Usuarios de prueba

```
Email: ana@clima.com     | Contraseña: 123456
Email: carlos@clima.com  | Contraseña: abcdef
Email: demo@demo.com     | Contraseña: demo
```

## Vuex Store

```
state
 ├── usuario           → objeto con datos del usuario logueado
 ├── isAuthenticated   → boolean
 ├── authLoading       → boolean
 ├── authError         → string | null
 ├── climaActual       → datos meteorológicos de la ciudad buscada
 ├── ciudadActual      → nombre de la ciudad actual
 ├── temaGuest         → tema para usuarios no logueados
 └── unidadGuest       → unidad para usuarios no logueados

mutations: LOGIN_SUCCESS · LOGOUT · ACTUALIZAR_PREFERENCIAS ·
           AGREGAR_FAVORITO · ELIMINAR_FAVORITO · SET_CLIMA · ...

actions:   login · logout · register · restaurarSesion ·
           actualizarPreferencias · agregarFavorito · eliminarFavorito · cargarClima
```

## Cómo ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo
npm run serve
# → http://localhost:8080

# 3. Build de producción
npm run build
```

## APIs utilizadas

| API | Uso | Key requerida |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | Clima actual y pronóstico | No |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Búsqueda de ciudades | No |
| [Nominatim (OpenStreetMap)](https://nominatim.org/) | Geolocalización inversa | No |

Si hay problemas de red, la app cae automáticamente a datos de ejemplo.

## Tecnologías

- **Vue 3** — Composition API
- **Vue Router 4** — SPA routing + navigation guards
- **Vuex 4** — Estado global (auth + clima + preferencias)
- **Axios** — Peticiones HTTP
- **Open-Meteo API** — Datos meteorológicos en tiempo real
- **Nominatim API** — Reverse geocoding

## Repositorio

> *(actualiza este enlace con tu repositorio real)*
