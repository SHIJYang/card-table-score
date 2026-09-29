// 江南园林场景 - PBR 材质工厂（全部程序化贴图）
import * as THREE from 'three'
import * as T from './textures'

export const windUniforms = { uTime: { value: 0 }, uWind: { value: 0.55 } }

// 植物风摆：注入顶点着色器，aWing 为摆动幅度属性
export function applyWind(mat, strength = 0.06) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime
    shader.uniforms.uWind = windUniforms.uWind
    shader.uniforms.uSway = { value: strength }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uWind; uniform float uSway;
        attribute float aWing;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          float ph = uTime * 1.7 + position.x * 0.6 + position.y * 0.35 + position.z * 0.8;
          float amp = uSway * (0.35 + aWing) * (0.3 + 0.7 * clamp(position.y * 0.8, 0.0, 1.6));
          transformed.x += sin(ph) * amp * uWind;
          transformed.z += cos(ph * 0.83) * amp * 0.7 * uWind;
        }`)
  }
  mat.customProgramCacheKey = () => 'wind' + strength
  return mat
}

export function buildMaterials() {
  const tex = {
    woodDark: T.woodTexture({ seed: 3, base: [86, 54, 36], dark: [52, 30, 20], light: [116, 76, 50] }),
    woodDarkR: T.woodRough(3),
    // 柱子朱漆偏褐（江南民居常见褐栗色）
    woodLacquer: T.woodTexture({ seed: 13, base: [96, 56, 38], dark: [58, 32, 24], light: [128, 82, 56] }),
    woodFur: T.woodTexture({ seed: 23, base: [168, 132, 92], dark: [128, 94, 62], light: [198, 162, 118] }),
    woodFurR: T.woodRough(23),
    plaster: T.plasterTexture(11),
    roof: T.roofTileTexture(21),
    brick: T.brickTexture(31),
    stone: T.stoneTexture(41),
    stoneWarm: T.stoneTexture(45, 512, [138, 132, 120]),
    rock: T.rockTexture(51),
    ground: T.groundTexture(61),
    waterN: T.waterNormalsTexture(),
    canopy: T.canopyTexture({ seed: 81 }),
    canopyRed: T.canopyTexture({ seed: 811, hues: [[148, 66, 40], [172, 88, 42], [128, 52, 36], [186, 112, 50]] }),
    canopyPlum: T.canopyTexture({ seed: 812, hues: [[70, 92, 44], [56, 80, 40]], spread: 0.8 }),
    pine: T.pineTexture(82),
    bambooLeaf: T.bambooLeafTexture(83),
    willow: T.willowTexture(84),
    plum: T.plumTexture(85),
    fern: T.fernTexture(86),
    grass: T.grassTexture(87),
    grassDry: T.grassTexture({ seed: 871, hue: [128, 122, 66] }),
    banana: T.bananaLeafTexture(88),
    paintingV: T.inkPaintingTexture({ seed: 91 }),
    paintingH: T.inkPaintingTexture({ seed: 912, w: 768, h: 384 }),
    screen: T.screenTexture(92),
    lantern: T.lanternTexture(95),
    streak: T.streakTexture(),
    glow: T.glowTexture(),
    smoke: T.smokeTexture(),
    puddle: T.puddleTexture(),
  }

  const std = (o) => new THREE.MeshStandardMaterial(o)
  const phy = (o) => new THREE.MeshPhysicalMaterial(o)

  const M = {
    tex,
    // ---- 建筑 ----
    column: std({ map: tex.woodLacquer, roughnessMap: tex.woodDarkR, roughness: 0.52, metalness: 0.02, color: 0xffffff }),
    beam: std({ map: tex.woodDark, roughnessMap: tex.woodDarkR, roughness: 0.58, color: 0xf3ead9 }),
    rafter: std({ map: tex.woodDark, roughness: 0.6, color: 0xead9c2 }),
    board: std({ map: tex.woodDark, roughness: 0.66, color: 0xe2d0b8 }), // 望板/裙板
    plank: std({ map: tex.woodFur, roughnessMap: tex.woodFurR, roughness: 0.6, color: 0xf5e8d2 }), // 地板/廊板
    plasterWall: std({ map: tex.plaster, roughness: 0.92, color: 0xffffff }),
    plasterWallIn: std({ map: tex.plaster, roughness: 0.95, color: 0xffffff }),
    roofTile: std({ map: tex.roof, roughness: 0.72, color: 0xdfe4ea }),
    ridge: std({ map: tex.roof, roughness: 0.6, color: 0xc8ced6 }),
    brickMat: std({ map: tex.brick, roughness: 0.85, color: 0xe8eaee }),
    stoneMat: std({ map: tex.stone, roughness: 0.62, color: 0xf2f2f2 }),
    stoneWarmMat: std({ map: tex.stoneWarm, roughness: 0.55, color: 0xf6f0e4 }),
    lattice: std({ map: tex.woodFur, roughness: 0.5, color: 0xd8c2a0 }), // 棂格/门窗框
    doorPanel: std({ map: tex.woodDark, roughness: 0.5, color: 0xe8d5bc }),
    paper: phy({ map: tex.lantern, roughness: 0.9, color: 0xf3e8d0, emissive: 0xffb45c, emissiveIntensity: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.96 }),
    bronze: std({ color: 0x4d4438, roughness: 0.38, metalness: 0.85 }),
    ironDark: std({ color: 0x2b2b2e, roughness: 0.5, metalness: 0.7 }),

    // ---- 家具 ----
    furniture: std({ map: tex.woodDark, roughnessMap: tex.woodDarkR, roughness: 0.42, color: 0xe8c9a8 }),
    furnitureDark: std({ map: tex.woodLacquer, roughness: 0.36, color: 0xd4b394 }),
    silk: std({ color: 0xcfc4ac, roughness: 0.9, side: THREE.DoubleSide }),
    curtain: phy({ color: 0xb8a88e, roughness: 0.85, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    scrollPaper: std({ color: 0xefe6d2, roughness: 0.9 }),

    // ---- 植物（风摆） ----
    leafCanopy: applyWind(std({ map: tex.canopy, alphaTest: 0.42, roughness: 0.85, side: THREE.DoubleSide, color: 0xffffff }), 0.05),
    leafCanopyRed: applyWind(std({ map: tex.canopyRed, alphaTest: 0.42, roughness: 0.85, side: THREE.DoubleSide }), 0.05),
    leafPlum: applyWind(std({ map: tex.canopyPlum, alphaTest: 0.42, roughness: 0.85, side: THREE.DoubleSide }), 0.04),
    pine: applyWind(std({ map: tex.pine, alphaTest: 0.4, roughness: 0.8, side: THREE.DoubleSide }), 0.035),
    bamboo: applyWind(std({ map: tex.bambooLeaf, alphaTest: 0.4, roughness: 0.7, side: THREE.DoubleSide }), 0.09),
    willow: applyWind(std({ map: tex.willow, alphaTest: 0.35, roughness: 0.8, side: THREE.DoubleSide }), 0.1),
    fern: applyWind(std({ map: tex.fern, alphaTest: 0.4, roughness: 0.85, side: THREE.DoubleSide }), 0.07),
    grass: applyWind(std({ map: tex.grass, alphaTest: 0.4, roughness: 0.9, side: THREE.DoubleSide }), 0.1),
    grassDry: applyWind(std({ map: tex.grassDry, alphaTest: 0.4, roughness: 0.9, side: THREE.DoubleSide }), 0.09),
    banana: applyWind(std({ map: tex.banana, alphaTest: 0.4, roughness: 0.75, side: THREE.DoubleSide }), 0.07),
    bark: std({ map: tex.woodDark, roughness: 0.9, color: 0xcabcab }),
    barkPine: std({ map: tex.woodDark, roughness: 0.95, color: 0xa89c8c }),
    barkBanana: std({ color: 0x7a8a5a, roughness: 0.8 }),
    lotusPad: applyWind(std({ color: 0x3f6b34, roughness: 0.6, side: THREE.DoubleSide }), 0.02),
    lotusFlower: applyWind(std({ color: 0xd8b8c4, roughness: 0.7, side: THREE.DoubleSide }), 0.02),

    // ---- 环境 ----
    rockMat: std({ map: tex.rock, roughness: 0.68, color: 0xe4e6e7 }),
    mossMat: std({ map: tex.grass, alphaTest: 0.35, roughness: 0.95, side: THREE.DoubleSide, color: 0x8ea06a }),

    // ---- 灯具（夜晚发光，intensity 由昼夜系统驱动） ----
    lanternGlow: phy({ map: tex.lantern, color: 0xffe8c0, emissive: 0xff9a3c, emissiveIntensity: 0, roughness: 0.6, side: THREE.DoubleSide }),
    flame: std({ color: 0xffcc66, emissive: 0xffaa33, emissiveIntensity: 3.2, roughness: 0.4, transparent: true, opacity: 0.9 }),
    candle: std({ color: 0xe8dcc0, roughness: 0.6 }),

    ground: std({ map: tex.ground, roughness: 0.82, color: 0xf1eee6 }),
    floorTile: std({ map: tex.stone, roughness: 0.42, color: 0xd8dadc }), // 室内方砖
    bambooCulm: std({ color: 0x9aa065, roughness: 0.6 }),                 // 竹竿（实例色乘色）
    wetStone: std({ map: tex.stone, roughness: 0.18, color: 0xdadddF }),
    rain: null,
  }
  return M
}
