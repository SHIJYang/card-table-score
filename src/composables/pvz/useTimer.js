// src/composables/useTimer.js
import { reactive } from 'vue'

let taskIdCounter = 0
let activeTasks = reactive({}) // 修正为 let

export function useTimer() {
    const startPeriodicTask = (fn, interval) => {
        const id = ++taskIdCounter
        activeTasks[id] = setInterval(fn, interval)
        return id
    }

    const stopPeriodicTask = (id) => {
        if (activeTasks[id]) {
            clearInterval(activeTasks[id])
            delete activeTasks[id]
        }
    }

    const clearAllTasks = () => {
        Object.keys(activeTasks).forEach(id => {
            clearInterval(activeTasks[id])
        })
        activeTasks = reactive({})
    }

    return {
        startPeriodicTask,
        stopPeriodicTask,
        clearAllTasks,
        activeTasks
    }
}