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
        path: '/shop',
        name: 'Shop',
        component: () => import('../views/games/ShopGame.vue')
    },
    {
        path: '/2048',
        name: '2048',
        component: () => import('../views/games/2048.vue')
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
    {
        path: '/img',
        name: 'Img',
        component: () => import('../views/love/picture.vue')
    },
    {
        path: '/examples/store',
        name: 'StoreExample',
        component: () => import('../examples/StoreExample.vue')
    },
    {
        path: '/examples/api',
        name: 'ApiExample',
        component: () => import('../examples/ApiExample.vue')
    },
    {
        path: '/examples/quickstart',
        name: 'QuickStart',
        component: () => import('../examples/QuickStart.vue')
    },
    {
        path: '/user/settings',
        name: 'UserSettings',
        component: () => import('../views/UserSettings.vue')
    }, {
        path: '/user/img',
        name: 'Img',
        component: () => import('../views/love/picture.vue')
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
