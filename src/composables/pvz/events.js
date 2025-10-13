// 简单事件钩子系统
export function createEventBus() {
    const hooks = {}
    function on(event, fn) {
        if (!hooks[event]) hooks[event] = []
        hooks[event].push(fn)
    }
    function emit(event, ...args) {
        if (hooks[event]) hooks[event].forEach(fn => fn(...args))
    }
    return { on, emit }
}
