<script setup lang="ts">
  import { gsap } from 'gsap';
  import { nextTick, ref, type VNodeRef } from 'vue';
  import { useSettingsStore } from '@/store';
  import ThemeSwitch from '@/components/ThemeSwitch.vue';
  
  // --- 类型定义 ---
  type CardNavLink = {
    label: string;
    path?: string;      // 内部路由
    href?: string;      // 外部链接
    target?: string;    // 打开方式
  };
  
  export type CardNavItem = {
    label: string;
    bgColor: string;
    textColor: string;
    links: CardNavLink[];
  };
  
  export interface CardNavProps {
    logo: string;
    logoAlt?: string;
    items: CardNavItem[];
    className?: string;
    baseColor?: string; // 背景色
    menuColor?: string; // 汉堡菜单颜色
  }
  
  const props = withDefaults(defineProps<CardNavProps>(), {
    logoAlt: 'Logo',
    baseColor: '#ffffff',
    menuColor: '#000000',
  });
  
  const settingsStore = useSettingsStore();
  
  // --- 状态 ---
  const isExpanded = ref(false);
  const navRef = ref<HTMLDivElement | null>(null);
  const cardsRef = ref<HTMLDivElement[]>([]);
  
  // 收集卡片引用的函数
  const setCardRef = (el: any) => {
    if (el && !cardsRef.value.includes(el)) {
      cardsRef.value.push(el);
    }
  };
  
  // --- 动画逻辑 ---
  const toggleMenu = async () => {
    if (!navRef.value) return;
  
    // 切换状态
    isExpanded.value = !isExpanded.value;
    
    // 等待 DOM 更新（确保内容可见性变化）
    await nextTick();
  
    const ctx = gsap.context(() => {
      if (isExpanded.value) {
        // --- 展开动画 ---
        // 1. 容器高度动画到 auto
        gsap.to(navRef.value, {
          height: 'auto',
          duration: 0.5,
          ease: 'power3.out',
        });
        
        // 2. 卡片进场 (stagger)
        gsap.fromTo(
          cardsRef.value,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.08,
            ease: 'back.out(1.2)',
            delay: 0.1, // 稍微等待容器展开
          }
        );
      } else {
        // --- 收起动画 ---
        gsap.to(navRef.value, {
          height: 60, // 回到 Header 高度
          duration: 0.4,
          ease: 'power3.inOut',
        });
        
        gsap.to(cardsRef.value, {
          opacity: 0,
          y: 10,
          duration: 0.2
        });
      }
    }, navRef.value); // Scope to navRef
  };
  </script>
  
  <template>
    <div class="card-nav-wrapper" :class="props.className">
      <nav
        ref="navRef"
        class="card-nav"
        :class="{ 'is-expanded': isExpanded }"
        :style="{ '--base-bg': props.baseColor, '--menu-color': props.menuColor }"
      >
        <div class="card-nav-header">
          <button
            class="hamburger-btn"
            :class="{ 'is-active': isExpanded }"
            @click="toggleMenu"
            aria-label="Toggle Menu"
          >
            <span class="line line-1"></span>
            <span class="line line-2"></span>
          </button>
  
          <div class="logo-container">
            <img :src="props.logo" :alt="props.logoAlt" class="nav-logo" />
          </div>
  
          <div class="actions-container">
            <ThemeSwitch v-model="settingsStore.theme" />
          </div>
        </div>
  
        <div class="card-nav-content">
          <div
            v-for="(item, idx) in props.items"
            :key="idx"
            :ref="setCardRef"
            class="nav-card"
            :style="{ backgroundColor: item.bgColor, color: item.textColor }"
          >
            <div class="nav-card-title">{{ item.label }}</div>
            
            <div class="nav-card-links">
              <template v-for="(lnk, i) in item.links" :key="i">
                <component
                  :is="lnk.path ? 'router-link' : 'a'"
                  :to="lnk.path"
                  :href="lnk.href"
                  :target="lnk.target"
                  class="nav-link-item"
                  @click="toggleMenu"
                >
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  {{ lnk.label }}
                </component>
              </template>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </template>
  
  <style scoped lang="scss">
  /* --- 变量 --- */
  $nav-height: 60px;
  $radius: 16px;
  $mobile-breakpoint: 768px;
  
  .card-nav-wrapper {
    position: fixed;
    //top: 1.5rem;
    left: 50%;
    background: var(--bgSecondary);
    transform: translateX(-50%);
    width: 92%;
    max-width: 800px;
    z-index: 1000;
    pointer-events: none; /* 允许点击 wrapper 外部穿透 */
  
    @media (min-width: $mobile-breakpoint) {
      //top: 2rem;
    }
  }
  
  .card-nav {
    position: relative;
    height: $nav-height; /* 初始高度 */
    background-color: var(--bgSecondary);
    border-radius: $radius;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    pointer-events: auto; /* 恢复内部点击 */
    transition: box-shadow 0.3s ease;
    
    /* 玻璃拟态增强 (可选) */
    backdrop-filter: blur(10px); 
  
    &.is-expanded {
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
    }
  }
  
  /* --- Header 布局 --- */
  .card-nav-header {
    position: relative;
    height: $nav-height;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    background-color: inherit; /* 遮挡下方内容滚动 */
  }
  
  /* 汉堡按钮 */
  .hamburger-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: var(--text);
    padding: 0;
  
    .line {
      width: 20px;
      height: 2px;
      background-color: currentColor;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center;
    }
  
    &.is-active {
      .line-1 { transform: translateY(4px) rotate(45deg); }
      .line-2 { transform: translateY(-4px) rotate(-45deg); }
    }
  }
  
  /* Logo */
  .logo-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
  
    .nav-logo {
      height: 24px;
      width: auto;
      display: block;
    }
  }
  
  /* 右侧操作区 */
  .actions-container {
    display: flex;
    align-items: center;
  }
  
  /* --- 内容区域 --- */
  .card-nav-content {
    padding: 8px;
    display: flex;
    flex-direction: row;
    gap: 8px;
    
    /* 桌面端变为横向 */
    @media (min-width: $mobile-breakpoint) {
      flex-direction: row;
      align-items: stretch; /* 等高 */
      padding: 8px 12px 12px;
      gap: 12px;
    }
  }
  
  /* --- 卡片项 --- */
  .nav-card {
    flex: 1;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    /* 移动端稍微紧凑一点 */
    min-height: 90px;
  
    @media (min-width: $mobile-breakpoint) {
      min-height: 140px; 
    }
  
    .nav-card-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 12px;
      opacity: 0.9;
    }
  
    .nav-card-links {
      margin-top: auto; /* 链接沉底 */
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
  
  .nav-link-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    color: inherit;
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.75;
    transition: opacity 0.2s, transform 0.2s;
  
    &:hover {
      opacity: 1;
      transform: translateX(2px);
    }
  
    .link-icon {
      width: 14px;
      height: 14px;
    }
  }
  </style>