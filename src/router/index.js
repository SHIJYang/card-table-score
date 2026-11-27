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
    {
        path: '/vrview',
        name: 'VrView',
        component: () => import('../views/our/VrView.vue')
    },
    {
        path: '/pixel-stack',
        name: 'PixelStack',
        component: () => import('../views/games/PixelStack.vue')
    },
    // 旧路径兼容重定向
    { path: '/img', redirect: '/sets/picture' },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// ========== 空闲预取其它路由模块 ==========
// 首屏渲染完成后，在浏览器空闲时预取其余路由的 chunk，
// 避免第一次点击某个路由时才开始下载代码，出现“点了没反应/第一次失效”的体验。
const lazyRouteLoaders = routes
    .map(route => route.component)
    .filter(component => typeof component === 'function')

const PREFETCH_CONCURRENCY = 2
let prefetchStarted = false

function scheduleIdle(callback) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout: 2000 })
    } else {
        setTimeout(callback, 200)
    }
}

export function prefetchRouteModules() {
    if (prefetchStarted) return
    prefetchStarted = true

    // 省流量/弱网环境下不预取
    const connection = navigator.connection
    if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return
    if (!lazyRouteLoaders.length) return

    const queue = [...lazyRouteLoaders]

    const worker = () => {
        const loader = queue.shift()
        if (!loader) return Promise.resolve()
        // 单个模块失败不影响后续预取
        return loader().catch(() => {}).then(() => scheduleIdle(worker))
    }

    scheduleIdle(() => {
        for (let i = 0; i < PREFETCH_CONCURRENCY; i++) {
            worker()
        }
    })
}

export default router
