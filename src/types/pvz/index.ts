// src/types/pvz/index.ts
import type { Ref } from 'vue'

export interface PlantConfig {
    displayName: string
    cost: number
    emoji: string
    onPlace?: (row: number, col: number, ctx: GameContext) => any
    onRemove?: (instanceData: any, ctx: GameContext) => void
}

export interface ZombieConfig {
    displayName: string
    emoji: string
    hp: number
    speed: number
    reward: number
}

export interface PlantInstance {
    type: string
    emoji?: string
    instanceData?: any
}

export interface Bullet {
    id: string | number
    row: number
    x: number
    type: string
    emoji: string
}

export interface Zombie {
    id: string | number
    row: number
    x: number
    hp: number
    maxHp: number
    speed: number
    type: string
    emoji: string
    isDamaged: boolean
}

export interface GameContext {
    sun: Ref<number>
    grid: PlantInstance[][]
    startPeriodicTask: (fn: () => void, interval: number) => number
    stopPeriodicTask: (id: number) => void
    spawnBullet: (opts: { row: number; type?: string }) => void
    spawnZombie: (opts: { row: number; type?: string }) => void
}