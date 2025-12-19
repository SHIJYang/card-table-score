<template>
  <div class="common-layout">
    <CardNav
      :logo="logo"
      logoAlt="Site Logo"
      :items="navItems"
      baseColor="#fff"
      menuColor="#000"
      buttonBgColor="#111"
      buttonTextColor="#fff"
      :buttonText="'Login'" 
    />
    <el-container>
      <el-main class="error404">
        <FuzzyText
          text="404"
          :font-size="180"
          font-weight="900"
          :color="themeColor"
          :enable-hover="true"
          :base-intensity="0.2"
          :hover-intensity="0.8"
        />
        <FuzzyText
          text="oops!"
          :font-size="80"
          font-weight="900"
          :color="secondaryColor"
          :enable-hover="true"
          :base-intensity="0.2"
          :hover-intensity="0.8"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import FuzzyText from "../../components/gsap/FuzzyText.vue";
import logo from '../../assets/love-sign.svg'
import CardNav from '../../components/gsap/CardNav.vue'
// 获取 CSS 变量颜色
const themeColor = computed(() => getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#FF6B6B');
const secondaryColor = computed(() => getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#2C3E50');
const navItems = computed(() => [
  {
    label: t('nav.games'), // 对应原 "Games" 菜单
    bgColor: "#0D0716",    // 深紫色背景
    textColor: "#fff",
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
    label: t('nav.our'),   // 对应原 "Our" 菜单
    bgColor: "#170D27",    // 深蓝色背景
    textColor: "#fff",
    links: [
      { label: t('nav.christmasTree'), path: "/our/tree" },
      { label: `${t('nav.christmasTree')} 2`, path: "/our/trees" }
    ]
  },
  {
    label: t('nav.settings'), // 对应原 "Settings" 菜单
    bgColor: "#271E37",       // 深灰紫色背景
    textColor: "#fff",
    links: [
      { label: t('nav.pictureSettings'), path: "/sets/picture" },
      { label: t('nav.habits'), path: "/sets/habits" },
      { label: t('nav.gameHistory'), path: "/sets/GameHistory" }
    ]
  }
])
</script>

<style scoped>
.error404 {
  height: calc(80vh - 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background-color: var(--bg-color);
  transition: background-color var(--transition-duration);
  /* 增加卡通背景圆点装饰 */
  background-image: radial-gradient(var(--border-color-extra-light) 2px, transparent 2px);
  background-size: 30px 30px;
}

@media (max-width: 768px) {
  .error404 :deep(.fuzzy-text) { font-size: 120px !important; }
  .error404 :deep(.fuzzy-text:nth-child(2)) { font-size: 60px !important; }
}
</style>