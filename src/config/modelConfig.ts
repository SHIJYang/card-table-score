// src/config/modelConfig.ts

// 1. 动作翻译字典 (合并 Rig Medium 和 Rig Large 所有 100+ 个动作)
export const actionNameMap: Record<string, string> = {
  // ==========================
  // 🟢 基础移动 (Movement Basic)
  // ==========================
  "T-Pose": "T型姿势",
  "Idle_A": "待机_A",
  "Idle_B": "待机_B",
  "Running_A": "跑步_A",
  "Running_B": "跑步_B", // Medium
  "Walking_A": "走路_A",
  "Walking_B": "走路_B", // Medium
  "Walking_C": "走路_C", // Medium
  "Jump_Full_Long": "跳跃_远", // Medium
  "Jump_Full_Short": "跳跃_近", // Medium
  "Jump_Idle": "跳跃_滞空", // Medium
  "Jump_Land": "跳跃_落地", // Medium
  "Jump_Start": "跳跃_起跳", // Medium

  // ==========================
  // 🔵 高级移动 (Movement Advanced)
  // ==========================
  "Crawling": "爬行",
  "Crouching": "蹲伏", // Medium
  "Sneaking": "潜行",
  "Dodge_Backward": "闪避-后退",
  "Dodge_Forward": "闪避-向前",
  "Dodge_Left": "闪避-左移",
  "Dodge_Right": "闪避-右移",
  "Running_HoldingBow": "跑步-持弓", // Medium
  "Running_HoldingRifle": "跑步-持枪", // Medium
  "Running_Strafe_Left": "跑步-左横移", // Medium
  "Running_Strafe_Right": "跑步-右横移", // Medium
  "Walking_Backwards": "倒退走", // Medium

  // ==========================
  // ⚔️ 近战战斗 (Combat Melee)
  // ==========================
  // --- 格挡 ---
  "Melee_Block": "格挡-举盾",
  "Melee_Block_Attack": "格挡-反击",
  "Melee_Block_Hit": "格挡-受击",
  "Melee_Blocking": "格挡-保持",
  
  // --- 单手 (1H) ---
  "Melee_1H_Attack_Chop": "单手-劈砍",
  "Melee_1H_Attack_Jump_Chop": "单手-跳劈",
  "Melee_1H_Attack_Slice_Diagonal": "单手-斜切",
  "Melee_1H_Attack_Slice_Horizontal": "单手-横扫",
  "Melee_1H_Attack_Stab": "单手-刺击",
  "Melee_1H_Slash": "单手-挥砍", // Large 特有
  "Melee_1H_Stab": "单手-突刺", // Large 特有

  // --- 双手 (2H) ---
  "Melee_2H_Idle": "双手-待机",
  "Melee_2H_Attack_Chop": "双手-劈砍",
  "Melee_2H_Attack_Slice": "双手-挥砍",
  "Melee_2H_Attack_Spin": "双手-大风车",
  "Melee_2H_Attack_Spinning": "双手-旋风斩",
  "Melee_2H_Attack_Stab": "双手-刺击",
  "Melee_2H_Attack": "双手-攻击", // Large 特有
  "Melee_2H_Slam": "双手-重击(Slam)", // Large 特有

  // --- 双持 (Dualwield) ---
  "Melee_Dualwield_Attack_Chop": "双持-劈砍",
  "Melee_Dualwield_Attack_Slice": "双持-切击",
  "Melee_Dualwield_Attack_Stab": "双持-刺击",
  "Melee_Dualwield_Slash": "双持-挥砍", // Large 特有
  "Melee_Dualwield_SlashCombo": "双持-连招", // Large 特有

  // --- 徒手 (Unarmed) ---
  "Melee_Unarmed_Idle": "徒手-待机",
  "Melee_Unarmed_Attack_Kick": "徒手-踢腿",
  "Melee_Unarmed_Attack_Punch_A": "徒手-出拳", // Medium
  "Melee_Unarmed_Kick": "徒手-猛踢", // Large
  "Melee_Unarmed_Punch": "徒手-直拳", // Large
  "Melee_Unarmed_Smash": "徒手-砸击", // Large 特有

  // ==========================
  // 🏹 远程战斗 (Combat Ranged) - Medium 特有
  // ==========================
  // --- 单手远程 ---
  "Ranged_1H_Aiming": "单手枪-瞄准",
  "Ranged_1H_Reload": "单手枪-换弹",
  "Ranged_1H_Shoot": "单手枪-射击",
  "Ranged_1H_Shooting": "单手枪-连射",
  
  // --- 双手远程 ---
  "Ranged_2H_Aiming": "双手枪-瞄准",
  "Ranged_2H_Reload": "双手枪-换弹",
  "Ranged_2H_Shoot": "双手枪-射击",
  "Ranged_2H_Shooting": "双手枪-连射",

  // --- 弓箭 ---
  "Ranged_Bow_Aiming_Idle": "弓箭-瞄准待机",
  "Ranged_Bow_Draw": "弓箭-拉弓",
  "Ranged_Bow_Draw_Up": "弓箭-向上拉弓",
  "Ranged_Bow_Idle": "弓箭-持弓待机",
  "Ranged_Bow_Release": "弓箭-射出",
  "Ranged_Bow_Release_Up": "弓箭-向上射出",

  // --- 魔法 ---
  "Ranged_Magic_Raise": "魔法-举手",
  "Ranged_Magic_Shoot": "魔法-发射",
  "Ranged_Magic_Summon": "魔法-召唤",
  "Ranged_Magic_Spellcasting": "魔法-施法",
  "Ranged_Magic_Spellcasting_Long": "魔法-持续施法",

  // ==========================
  // 🎭 通用交互 (General & Simulation)
  // ==========================
  "Hit_A": "受击_A",
  "Hit_B": "受击_B",
  "Death_A": "死亡_A",
  "Death_A_Pose": "死亡姿态_A",
  "Death_B": "死亡_B",
  "Death_B_Pose": "死亡姿态_B",
  "Interact": "交互",
  "Pickup": "捡起",
  "Throw": "投掷",
  "Use_Item": "使用物品",
  "Spawn_Air": "空中生成",
  "Spawn_Ground": "地面生成",
  
  "Cheering": "欢呼",
  "Push_Ups": "俯卧撑",
  "Sit_Ups": "仰卧起坐",
  "Lie_Down": "躺下",
  "Lie_Idle": "躺着待机",
  "Lie_StandUp": "躺着站起",
  "Sit_Chair_Down": "坐椅子",
  "Sit_Chair_Idle": "坐椅子待机",
  "Sit_Chair_StandUp": "椅子站起",
  "Sit_Chair_Floor_Down": "席地而坐",
  "Sit_Chair_Floor_Idle": "席地待机",
  "Sit_Chair_Floor_StandUp": "席地站起",
  "Waving": "挥手",
  "Flexing": "秀肌肉", // Large 特有

  // ==========================
  // 💀 特殊 & 骷髅 (Special)
  // ==========================
  "Skeletons_Awaken_Floor": "骷髅-地面苏醒",
  "Skeletons_Awaken_Floor_Long": "骷髅-地面苏醒(长)",
  "Skeletons_Awaken_Standing": "骷髅-站立苏醒",
  "Skeletons_Idle": "骷髅-待机",
  "Skeletons_Taunt": "骷髅-嘲讽",
  "Skeletons_Taunt_Longer": "骷髅-嘲讽(长)",
  "Skeletons_Death": "骷髅-死亡",
  "Skeletons_Death_Pose": "骷髅-死亡姿态",
  "Skeletons_Death_Resurrect": "骷髅-复活",
  "Skeletons_Inactive_Floor_Pose": "骷髅-地面休眠",
  "Skeletons_Inactive_Standing_Pose": "骷髅-站立休眠",
  "Skeletons_Spawn_Ground": "骷髅-钻出地面",
  "Skeletons_Walking": "骷髅-走路",
  
  "EXPERIMENTAL_Medium_Transform": "变身(中型)",
  "EXPERIMENTAL_Large_Transform": "变身(大型)" 
};

// 2. 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  modelPath: string;
  texturePath: string;
  scale?: number;
}

// 3. 模型列表
export const modelList: ModelConfig[] = [
  {
    id: 'melee_medium',
    name: '中型战士 (Rig Medium)',
    
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_CombatMelee.glb', 
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'ranged_medium',
    name: '中型射手 (Rig Medium CombatRanged)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_CombatRanged.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'general_medium',
    name: '中型通用 (Rig Medium General)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_General.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'movement_advanced_medium',
    name: '中型进阶移动 (Rig Medium MovementAdvanced)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_MovementAdvanced.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'movement_basic_medium',
    name: '中型基础移动 (Rig Medium MovementBasic)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'simulation_medium',
    name: '中型模拟动作 (Rig Medium Simulation)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_Simulation.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'special_medium',
    name: '中型特殊动作 (Rig Medium Special)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_Special.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'tools_medium',
    name: '中型工具交互 (Rig Medium Tools)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Medium/Rig_Medium_Tools.glb',
    texturePath: '/mannequin.png',
    scale: 1
  },
  {
    id: 'warrior_large',
    name: '重装战士 (Rig Large)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Large/Rig_Large_Special.glb',
    texturePath: '/mannequin.png',
    scale: 1.2
  },
  {
    id: 'melee_large',
    name: '重装近战 (Rig Large CombatMelee)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Large/Rig_Large_CombatMelee.glb',
    texturePath: '/mannequin.png',
    scale: 1.2
  },
  {
    id: 'general_large',
    name: '重装通用 (Rig Large General)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Large/Rig_Large_General.glb',
    texturePath: '/mannequin.png',
    scale: 1.2
  },
  {
    id: 'movement_advanced_large',
    name: '重装进阶移动 (Rig Large MovementAdvanced)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Large/Rig_Large_MovementAdvanced.glb',
    texturePath: '/mannequin.png',
    scale: 1.2
  },
  {
    id: 'movement_basic_large',
    name: '重装基础移动 (Rig Large MovementBasic)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Large/Rig_Large_MovementBasic.glb',
    texturePath: '/mannequin.png',
    scale: 1.2
  },
  {
    id: 'simulation_large',
    name: '重装模拟动作 (Rig Large Simulation)',
    modelPath: '/models/KayKit/Animations/gltf/Rig_Large/Rig_Large_Simulation.glb',
    texturePath: '/mannequin.png',
    scale: 1.2
  },
];