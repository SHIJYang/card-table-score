<template>
  <div class="common-layout">
    <el-header class="header">
      <CardNav
      :logo="logo"
      logoAlt="Site Logo"
      :items="navItems"
      baseColor="#fff"
      menuColor="#000"
    />
    </el-header>
    <el-container>
      <el-main class="error404">
        <FuzzyText
          text="棒！"
          :font-size="40"
          :color="secondaryColor"
          :enable-hover="true"
          :base-intensity="0.1"
          :hover-intensity="0.3"
        />
        <GestureRadio 
        v-model="activeMode" 
        :options="menuConfig" 
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router' 
import FuzzyText from "../../components/gsap/FuzzyText.vue";
import logo from '../../assets/love-sign.svg'
import CardNav from '../../components/gsap/CardNav.vue'
import GestureRadio from "../../components/GestureRadio.vue"


const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// --- 颜色响应式处理 ---
const themeColor = ref('#FF6B6B');
const secondaryColor = ref('#2C3E50');

const updateColors = () => {
  const style = getComputedStyle(document.documentElement);
  themeColor.value = style.getPropertyValue('--primary-color').trim() || '#FF6B6B';
  secondaryColor.value = style.getPropertyValue('--text-color').trim() || '#2C3E50';
};

// 监听 HTML class 变化 (用于感知暗黑模式/主题切换)
let observer = null;
onMounted(() => {
  updateColors(); // 初始化颜色
  observer = new MutationObserver(updateColors);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
// --------------------



const navItems = computed(() => [
  {
    label: t('nav.games'),
    bgColor: "var(--el-bg-color-page)",
    textColor: "var(--text)",
    links: [
      { label: t('nav.score'), path: "/score" },
      { label: t('nav.gomoku'), path: "/gomoku" },
      { label: t('nav.shop'), path: "/shop" },
      { label: t('nav.snake'), path: "/snake" },
      { label: t('nav.2048'), path: "/2048" },
      { label: t('nav.try'), path: "/try" }
    ]
  },
  {
    label: t('nav.our'),
    bgColor: "var(--el-bg-color-page)",
    textColor: "var(--text)",
    links: [
      { label: t('nav.christmasTree'), path: "/tree" },
      { label: `${t('nav.christmasTree')} 2`, path: "/trees" },
      { label: `${t('nav.dog')} 2`, path: "/dog" }
    ]
  },
  {
    label: t('nav.settings'),
    bgColor: "var(--el-bg-color-page)",
    textColor: "var(--text)",
    links: [
      { label: t('nav.pictureSettings'), path: "/sets/picture" },
      { label: t('nav.habits'), path: "/sets/habits" },
  
    ]
  }
])

const activeMode = ref('');

const menuConfig = [
  { 
    value: '1',
    rgb: 'rgb(255, 71, 87)', // 鲜艳红
    icon: '/icon/back.svg' 
  },
  { 
    value: '2',
    rgb: 'rgb(255, 202, 58)', // 鲜艳黄
    icon: '/icon/more.svg'
  },
  { 
    value: '3',
    rgb: 'rgb(46, 213, 115)', // 鲜艳绿
    icon: '/icon/enter.svg' 
  },
  { 
    value: '4',
    rgb: 'rgb(55, 66, 250)', // 鲜艳蓝
    icon: '/icon/close.svg' 
  }
];

</script>

<style scoped>
  
  .common-layout{
    top: 80px;
  }
.error404 {
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background-color: var(--bg-color);
  transition: background-color 0.3s ease;
  
  /* 卡通背景：调整为更加柔和的波点 */
  background-image: radial-gradient(var(--border-color-extra-light) 20%, transparent 20%);
  background-size: 20px 20px;
}

.action-area {
    margin-top: 30px;
}

/* 卡通风格按钮 */
.cartoon-btn {
    padding: 12px 36px;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--bg-color);
    background-color: var(--primary-color);
    border: 3px solid var(--text-color);
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 6px 6px 0px var(--text-color); /* 硬阴影，增强卡通感 */
    transition: all 0.1s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.cartoon-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0px var(--text-color);
}

.cartoon-btn:active {
    transform: translate(4px, 4px);
    box-shadow: 0px 0px 0px var(--text-color); /* 点击时的按压效果 */
}


</style>