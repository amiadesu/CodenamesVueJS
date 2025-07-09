import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/Home/HomeView.vue';
import CodenamesView from '../views/Codenames/CodenamesView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/codenames/:roomId?',
      name: 'Codenames',
      component: CodenamesView
    },
  ],
})

export default router
