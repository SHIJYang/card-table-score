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
        component: () => import('../views/games/snake/SnakeGame.vue')
    },
    {
        path: '/gomoku',
        name: 'Gomoku',
        component: () => import('../views/games/gomoku/GomokuGame.vue')
    },
    {
        path: '/score',
        name: 'Score',
        component: () => import('../views/games/score/ScoreSystem.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
