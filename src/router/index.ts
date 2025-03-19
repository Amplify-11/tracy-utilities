import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import TranscriptDetailPage from '../components/TranscriptDetailPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/transcript/:id',
      name: 'transcript',
      component: TranscriptDetailPage
    }
  ]
});

export default router;