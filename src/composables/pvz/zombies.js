import { reactive } from 'vue'

export const registeredZombies = reactive({
    basic: {
        displayName: '普通僵尸',
        emoji: '🧟',
        hp: 3,
        speed: 1,
        reward: 0,
        actions: { walk: true, attack: true },
        effects: {},
        initialState: { isFrozen: false, isSlowed: false }
    },
    conehead: {
        displayName: '路障僵尸',
        emoji: '🪖',
        hp: 7,
        speed: 1,
        reward: 0,
        actions: { walk: true, attack: true },
        effects: { shield: true },
        initialState: { shield: 4, isFrozen: false, isSlowed: false }
    }
    // 可扩展更多僵尸
})

export function registerZombie(type, config) {
    registeredZombies[type] = config
}
