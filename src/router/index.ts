import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      // The main view is App.vue itself; we use a simple redirect component
      component: () => import('@/App.vue'),
    },
  ],
});

export default router;
