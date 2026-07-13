import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'simulator',
      component: () => import('@/views/SimulatorView.vue'),
    },
    {
      path: '/custom',
      name: 'custom-pools',
      component: () => import('@/views/CustomPoolPage.vue'),
    },
  ],
});

export default router;
