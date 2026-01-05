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
        path: '/people',
        name: 'People',
        component: () => import('../views/our/people.vue')
    },
    {
        path: '/dog',
        name: 'Dog',
        component: () => import('../views/our/dog.vue')
    },
    {
        path: '/img',
        name: 'Img',
        component: () => import('../views/sets/picture.vue')
    },
    
    {
        path: '/tree',
        name: 'Tree',
        component: () => import('../views/our/tree.vue')
    },
    {
        path: '/trees',
        name: 'Trees',
        component: () => import('../views/our/trees.vue')
    },
    {
        path: '/sets/picture',
        name: 'picture',
        component: () => import('../views/sets/picture.vue')
    },
   
    {
        path: '/sets/habits',
        name: 'habits',
        component: () => import('../views/sets/habits.vue')
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
