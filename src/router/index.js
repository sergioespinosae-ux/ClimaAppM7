// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router';
import store from '@/store';

import HomeView      from '@/views/HomeView.vue';
import LoginView     from '@/views/LoginView.vue';
import RegisterView  from '@/views/RegisterView.vue';
import FavoritesView from '@/views/FavoritesView.vue';
import ProfileView   from '@/views/ProfileView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { titulo: 'Inicio' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { titulo: 'Iniciar sesión', guestOnly: true },
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegisterView,
    meta: { titulo: 'Crear cuenta', guestOnly: true },
  },
  {
    path: '/favoritos',
    name: 'favoritos',
    component: FavoritesView,
    meta: { titulo: 'Mis favoritos', requiresAuth: true },
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: ProfileView,
    meta: { titulo: 'Mi perfil', requiresAuth: true },
  },
  {
    // Redirigir rutas desconocidas a home
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// ── Navigation Guard Global ──────────────────────────────────
router.beforeEach((to, _from, next) => {
  const isAuth = store.getters.isAuthenticated;

  // Ruta protegida y no autenticado → redirigir a login
  if (to.meta.requiresAuth && !isAuth) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  // Ruta solo para invitados y ya autenticado → redirigir a home
  if (to.meta.guestOnly && isAuth) {
    return next({ name: 'home' });
  }

  next();
});

export default router;
