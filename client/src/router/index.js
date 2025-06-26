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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
    },
  ],
})

export default router
