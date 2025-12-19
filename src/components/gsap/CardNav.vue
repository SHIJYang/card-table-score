<script setup lang="ts">
  import { gsap } from 'gsap';
  import { nextTick, onBeforeUpdate, onMounted, onUnmounted, ref, watch, type VNodeRef } from 'vue';
  
  // --- 类型定义 ---
  type CardNavLink = {
    label: string;
    path?: string;      // 内部路由
    href?: string;      // 外部链接
    target?: string;    // 打开方式
    ariaLabel?: string;
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
    ease?: string;
    baseColor?: string;
    menuColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonText?: string;
  }
  
  const props = withDefaults(defineProps<CardNavProps>(), {
    logoAlt: 'Logo',
    className: '',
    ease: 'power3.out',
    baseColor: '#fff',
    buttonText: 'Get Started'
  });
  
  // --- 状态与引用 ---
  const isHamburgerOpen = ref(false);
  const isExpanded = ref(false);
  const navRef = ref<HTMLDivElement | null>(null);
  const cardsRef = ref<HTMLDivElement[]>([]);
  const tlRef = ref<gsap.core.Timeline | null>(null);
  
  const setCardRef = (i: number): VNodeRef => (el) => {
    if (el && el instanceof HTMLDivElement) cardsRef.value[i] = el;
  };
  
  onBeforeUpdate(() => { cardsRef.value = []; });
  
  // --- 高度计算逻辑 ---
  const calculateHeight = () => {
    const navEl = navRef.value;
    if (!navEl) return 260; // 桌面端默认展开高度
  
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        // 临时显示以获取真实高度
        const css = contentEl.style;
        const prevVis = css.visibility;
        const prevPos = css.position;
        const prevH = css.height;
        
        css.visibility = 'visible';
        css.position = 'static';
        css.height = 'auto';
  
        // 60(header) + content + 16(padding)
        const h = 60 + contentEl.scrollHeight + 16; 
  
        css.visibility = prevVis;
        css.position = prevPos;
        css.height = prevH;
        return h;
      }
    }
    return 260; 
  };
  
  // --- GSAP 动画初始化 ---
  const createTimeline = () => {
    const navEl = navRef.value;
    if (!navEl) return null;
  
    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.value, { y: 50, opacity: 0 });
  
    const tl = gsap.timeline({ paused: true });
  
    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease: props.ease
    });
  
    tl.to(cardsRef.value, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: props.ease,
      stagger: 0.08
    }, '-=0.1');
  
    return tl;
  };
  
  const toggleMenu = () => {
    const tl = tlRef.value;
    if (!tl) return;
    
    if (!isExpanded.value) {
      isHamburgerOpen.value = true;
      isExpanded.value = true;
      nextTick(() => tl.play(0));
    } else {
      isHamburgerOpen.value = false;
      tl.eventCallback('onReverseComplete', () => {
        isExpanded.value = false;
        tl.eventCallback('onReverseComplete', null);
      });
      tl.reverse();
    }
  };
  
  const handleResize = () => {
    if (!tlRef.value) return;
    if (isExpanded.value) {
      const newH = calculateHeight();
      gsap.set(navRef.value, { height: newH });
      tlRef.value.kill();
      const newTl = createTimeline();
      if (newTl) {
        newTl.progress(1);
        tlRef.value = newTl;
      }
    } else {
      tlRef.value.kill();
      tlRef.value = createTimeline();
    }
  };
  
  onMounted(() => {
    tlRef.value = createTimeline();
    window.addEventListener('resize', handleResize);
  });
  
  onUnmounted(() => {
    tlRef.value?.kill();
    tlRef.value = null;
    window.removeEventListener('resize', handleResize);
  });
  
  watch(() => [props.ease, props.items], () => {
    nextTick(() => {
      if (tlRef.value) tlRef.value.kill();
      tlRef.value = createTimeline();
    });
  });
  </script>
  
  <template>
    <div class="card-nav-wrapper" :class="props.className">
      <nav
        ref="navRef"
        class="card-nav"
        :class="{ 'is-open': isExpanded }"
        :style="{ backgroundColor: props.baseColor }"
      >
        <div class="card-nav-header">
          <div
            class="hamburger-btn"
            :class="{ 'is-active': isHamburgerOpen }"
            @click="toggleMenu"
            role="button"
            :style="{ color: props.menuColor || '#000' }"
          >
            <span class="hamburger-line line-1"></span>
            <span class="hamburger-line line-2"></span>
          </div>
  
          <div class="logo-container">
            <img :src="props.logo" :alt="props.logoAlt" class="nav-logo" />
          </div>
  
          <div class="cta-container">
              <button
              type="button"
              class="cta-button"
              :style="{
                  backgroundColor: props.buttonBgColor || '#111',
                  color: props.buttonTextColor || '#fff'
              }"
              >
              {{ props.buttonText }}
              </button>
          </div>
        </div>
  
        <div
          class="card-nav-content"
          :class="{ 'content-visible': isExpanded }"
          :aria-hidden="!isExpanded"
        >
          <div
            v-for="(item, idx) in (props.items || []).slice(0, 3)"
            :key="idx"
            :ref="setCardRef(idx)"
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
                  <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
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
  /* --- 布局变量 --- */
  $nav-height: 60px;
  $radius: 12px;
  
  /* --- 容器 --- */
  .card-nav-wrapper {
    position: fixed; /* 悬浮固定 */
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 800px;
    z-index: 100;
  
    @media (min-width: 768px) {
      top: 2rem;
    }
  }
  
  .card-nav {
    position: relative;
    height: $nav-height;
    border-radius: $radius;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    will-change: height;
    /* 背景色由内联样式 style 控制 */
  }
  
  /* --- 顶部 Header --- */
  .card-nav-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: $nav-height;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
  }
  
  /* --- 汉堡菜单 --- */
  .hamburger-btn {
    width: 30px;
    height: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    z-index: 10;
    
    // 保持在左侧，或者是 flex 的 order 控制
    order: 2; 
    @media (min-width: 768px) {
        order: 0;
    }
  
    .hamburger-line {
      display: block;
      width: 24px;
      height: 2px;
      background-color: currentColor;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform-origin: center;
      margin: 0 auto;
    }
  
    &.is-active {
      .line-1 {
        transform: translateY(4px) rotate(45deg);
      }
      .line-2 {
        transform: translateY(-4px) rotate(-45deg);
      }
    }
  
    &:hover {
      opacity: 0.75;
    }
  }
  
  /* --- Logo --- */
  .logo-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    
    order: 1; /* 移动端在中间 */
    @media (min-width: 768px) {
        position: absolute; /* 桌面端绝对定位居中 */
    }
  }
  
  .nav-logo {
    height: 28px;
    width: auto;
  }
  
  /* --- CTA 按钮 --- */
  .cta-container {
      display: none;
      height: 100%;
      align-items: center;
      @media(min-width: 768px) {
          display: flex;
      }
  }
  
  .cta-button {
    padding: 0 1.2rem;
    height: 40px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s;
  
    &:hover {
      opacity: 0.9;
    }
  }
  
  /* --- 内容区域 --- */
  .card-nav-content {
    position: absolute;
    top: $nav-height;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8px;
    
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    visibility: hidden; /* 默认隐藏，由 GSAP 控制显示 */
    pointer-events: none;
  
    &.content-visible {
      visibility: visible;
      pointer-events: auto;
    }
  
    /* 桌面端横向排列 */
    @media (min-width: 768px) {
      flex-direction: row;
      align-items: flex-end;
      gap: 12px;
    }
  }
  
  /* --- 卡片项 --- */
  .nav-card {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    min-height: 80px; /* 移动端最小高度 */
    
    @media (min-width: 768px) {
      height: 100%; /* 填满剩余高度 */
      min-height: auto;
    }
  }
  
  .nav-card-title {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: auto; /* 标题顶格，链接沉底 */
    letter-spacing: -0.5px;
    
    @media (min-width: 768px) {
        font-size: 1.3rem;
    }
  }
  
  .nav-card-links {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }
  
  .nav-link-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    color: inherit; /* 继承卡片文字色 */
    font-size: 0.95rem;
    opacity: 1;
    transition: opacity 0.2s;
    cursor: pointer;
  
    &:hover {
      opacity: 0.75;
    }
  }
  
  .link-icon {
    width: 1.1em;
    height: 1.1em;
    flex-shrink: 0;
  }
  </style>