import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/snake',
        name: 'Snake',
        component: () => import('../views/games/SnakeGame.vue')
    },
    {
        path: '/gomoku',
        name: 'Gomoku',
        component: () => import('../views/games/GomokuGame.vue')
    },
    {
        path: '/score',
        name: 'Score',
        component: () => import('../views/games/ScoreSystem.vue')
    },
    {
        path: '/try',
        name: 'Try',
        component: () => import('../views/games/try.vue')
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
