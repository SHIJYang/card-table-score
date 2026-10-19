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
        path: '/go',
        name: 'Go',
        component: () => import('../views/games/PunigoGame.vue')
    },
    {
        path: '/shop',
        name: 'Shop',
        component: () => import('../views/games/ShopGame.vue')
    },
    {
        path: '/2048',
        name: 'Game2048',
        component: () => import('../views/games/Game2048.vue')
    },
    {
        path: '/yang',
        name: 'Yang',
        component: () => import('../views/games/YangGame.vue')
    },
    {
        path: '/score',
        name: 'Score',
        component: () => import('../views/games/ScoreSystem.vue')
    },
    {
        path: '/try',
        name: 'Try',
        component: () => import('../views/games/Try.vue')
    },
    {
        path: '/live',
        name: 'Love',
        component: () => import('../views/love/Live.vue')
    },
    {
        path: '/people',
        name: 'People',
        component: () => import('../views/our/People.vue')
    },
    {
        path: '/dog',
        name: 'Dog',
        component: () => import('../views/our/Dog.vue')
    },
    {
        path: '/player',
        name: 'Player',
        component: () => import('../views/our/Player.vue')
    },
    {
        path: '/music',
        name: 'Music',
        component: () => import('../views/games/Music.vue')
    },
    {
        path: '/trees',
        name: 'Trees',
        component: () => import('../views/our/Trees.vue')
    },
    {
        path: '/spindou',
        name: 'Spindou',
        component: () => import('../views/our/Spindou.vue')
    },
    {
        path: '/sets/picture',
        name: 'Picture',
        component: () => import('../views/sets/Picture.vue')
    },
    {
        path: '/sets/habits',
        name: 'Habits',
        component: () => import('../views/sets/Habits.vue')
    },
    {
        path: '/garden',
        name: 'Garden',
        component: () => import('../views/our/Garden.vue')
    },
    {
        path: '/coaster',
        name: 'Coaster',
        component: () => import('../views/games/DoodleCoaster.vue')
    },
    // 旧路径兼容重定向
    { path: '/img', redirect: '/sets/picture' },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
