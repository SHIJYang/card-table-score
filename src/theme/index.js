// 主题配置管理
// 该文件定义了应用的所有颜色变量，并负责 CSS 变量的注入

const baseTheme = {
    colors: {
      primary: '#409eff',
      success: '#67c23a',
      warning: '#e6a23c',
      danger: '#f56c6c',
      info: '#909399',
      // 映射 Element Plus 基础变量
      'el-color-primary': '#409eff',
      'el-color-success': '#67c23a',
      'el-color-warning': '#e6a23c',
      'el-color-danger': '#f56c6c',
      'el-color-info': '#909399',
    },
    variables: {
      borderRadius: '6px', // Element 默认圆角较小，精致
      transitionDuration: '0.3s'
    }
  };
  
  // 3D 装饰元素颜色 (如圣诞树、游戏棋子)，独立于 UI 主题
  const decorationColors = {
    gold: { light: '#FFEAA7', medium: '#FDCB6E', dark: '#E17055' },
    red: { light: '#FF7675', medium: '#D63031', dark: '#B01819' },
    blue: { light: '#74B9FF', medium: '#0984E3', dark: '#0C2461' },
    green: { light: '#55EFC4', medium: '#00B894', dark: '#006266' }
  };
  
  export const themes = {
      // ==========================================
      // 1. 标准浅色 (Element Plus 官方风格)
      // 特点：干净、白底、层级分明、蓝色主调
      // ==========================================
      light: {
          name: 'light',
          label: '标准浅色',
          colors: {
              ...baseTheme.colors,
              decoration: decorationColors,
              
              // --- 基础文字 ---
              text: '#303133',            // 主要文字 (Primary Text)
              textSecondary: '#606266',   // 常规文字 (Regular Text)
              textLight: '#909399',       // 次要文字 (Secondary Text)
              textDisabled: '#A8ABB2',    // 占位/禁用 (Placeholder)
              
              // --- 背景体系 ---
              bgPrimary: '#ffffff',       // 页面主背景
              bgSecondary: '#ffffff',     // 卡片/浮层背景 (靠阴影区分)
              bgDisabled: '#f5f7fa',      // 禁用/表头/输入框背景
              
              // --- 边框与分割线 ---
              border: '#dcdfe6',          // 标准边框
              borderLight: '#e4e7ed',     // 浅边框
              borderLighter: '#ebeef5',   // 更浅
              borderExtraLight: '#f2f6fc',// 极浅
              
              // --- 特殊区域 ---
              headerBg: '#ffffff',        // 顶部导航背景 (纯净白)
              footerBg: '#ffffff',
              selectBg: '#ecf5ff',        // 选中项背景 (极淡蓝)
              
              // --- Element Plus 覆盖变量 (生成色阶) ---
              // 浅色模式下，light-9 是极淡的蓝，用于 hover
              'el-color-primary-light-3': '#79bbff', 
              'el-color-primary-light-5': '#a0cfff', 
              'el-color-primary-light-7': '#c6e2ff', 
              'el-color-primary-light-9': '#ecf5ff', 
              'el-color-primary-dark-2': '#337ecc',
              
              'el-bg-color': '#ffffff', 
              'el-bg-color-page': '#f2f3f5', // 页面底层稍微带点灰，突出卡片
              'el-bg-color-overlay': '#ffffff',
              
              'el-text-color-primary': '#303133', 
              'el-text-color-regular': '#606266', 
              'el-text-color-secondary': '#909399',
              'el-text-color-placeholder': '#A8ABB2',
              'el-border-color': '#dcdfe6',
              'el-border-color-light': '#e4e7ed',
              'el-box-shadow-base': '0 12px 32px 4px rgba(0, 0, 0, .04), 0 8px 20px rgba(0, 0, 0, .08)'
          },
          variables: { 
              ...baseTheme.variables, 
              boxShadow: '0px 12px 32px 4px rgba(0, 0, 0, .04)', // 极其柔和的漫射阴影
              boxShadowHover: '0px 16px 48px 16px rgba(0, 0, 0, .08)'
          }
      },
  
      // ==========================================
      // 2. 标准深色 (Element Plus 暗黑模式)
      // 特点：深灰底、护眼、低对比度
      // ==========================================
      dark: {
          name: 'dark',
          label: '深色护眼',
          colors: {
              ...baseTheme.colors,
              decoration: decorationColors,
              
              // --- 基础文字 (反白) ---
              text: '#E5EAF3', 
              textSecondary: '#CFD3DC', 
              textLight: '#A3A6AD', 
              textDisabled: '#6C6E72',
              
              // --- 背景体系 (黑/深灰) ---
              bgPrimary: '#141414',       // 页面底色 (纯黑)
              bgSecondary: '#1D1E1F',     // 卡片底色 (深灰)
              bgDisabled: '#262727',      // 输入框底色
              
              // --- 边框 ---
              border: '#4C4D4F', 
              borderLight: '#414243', 
              borderLighter: '#363637',
              borderExtraLight: '#2B2B2C',
              
              headerBg: '#1D1E1F', 
              footerBg: '#1D1E1F', 
              selectBg: '#2A2B2D',        // 选中项背景
              
              // --- Element Plus 覆盖变量 ---
              // 深色模式下，light-9 必须是深色，否则 hover 会变成白色亮块
              'el-color-primary-light-3': '#3375b9', 
              'el-color-primary-light-5': '#2a598a', 
              'el-color-primary-light-7': '#213d5b', 
              'el-color-primary-light-9': '#18222c', // 极深蓝
              'el-color-primary-dark-2': '#66b1ff',
              
              'el-bg-color': '#141414', 
              'el-bg-color-page': '#0A0A0A', 
              'el-bg-color-overlay': '#1D1E1F',
              
              'el-text-color-primary': '#E5EAF3', 
              'el-text-color-regular': '#CFD3DC',
              'el-text-color-secondary': '#A3A6AD',
              'el-text-color-placeholder': '#6C6E72',
              'el-border-color': '#4C4D4F',
              'el-border-color-light': '#414243',
              'el-box-shadow-base': '0 12px 32px 4px rgba(0, 0, 0, .36)'
          },
          variables: { 
              ...baseTheme.variables, 
              boxShadow: '0 12px 32px 4px rgba(0, 0, 0, .36)',
              boxShadowHover: '0 16px 48px 16px rgba(0, 0, 0, .5)'
          }
      },
  
      // ==========================================
      // 3. 糖果卡通 (多巴胺风格)
      // 特点：高饱和度、粗边框、硬阴影、暖色背景
      // ==========================================
      cartoon: {
          name: 'cartoon',
          label: '多巴胺',
          colors: {
              // 使用更鲜艳的品牌色
              primary: '#FF6B6B',
              success: '#4ECDC4',
              warning: '#FFE66D',
              danger: '#FF4757',
              info: '#45B7D1',
              decoration: decorationColors,
              
              text: '#2d3436', 
              textSecondary: '#636e72', 
              textLight: '#b2bec3',
              textDisabled: '#dfe6e9',
              
              bgPrimary: '#fff0f3',   // 极淡的粉白背景，增加温馨感
              bgSecondary: '#ffffff', // 卡片纯白
              bgDisabled: '#ffeaa7',  // 输入框用亮黄色，增加趣味
              
              border: '#2d3436',      // 黑色粗描边
              borderLight: '#636e72',
              borderLighter: '#b2bec3',
              borderExtraLight: '#dfe6e9',
              
              headerBg: '#ffffff', 
              selectBg: '#ffeaa7',    // 选中也是亮黄色
              
              // Element 覆盖
              'el-color-primary': '#FF6B6B',
              'el-color-success': '#4ECDC4',
              'el-color-warning': '#FFE66D',
              'el-color-danger': '#FF4757',
              'el-color-info': '#45B7D1',
              
              // 卡通模式下 hover 颜色可以鲜艳一点
              'el-color-primary-light-3': '#ff9f9f',
              'el-color-primary-light-5': '#ffbdbd',
              'el-color-primary-light-7': '#ffdcdc',
              'el-color-primary-light-9': '#fff0f0',
              
              'el-bg-color': '#ffffff',
              'el-bg-color-page': '#fff0f3',
              'el-bg-color-overlay': '#ffffff',
              'el-text-color-primary': '#2d3436',
              'el-border-color': '#2d3436', // 强制黑色边框
          },
          variables: {
              borderRadius: '12px', // 大圆角
              transitionDuration: '0.2s', // 动画稍快，更有弹力感
              // 硬阴影 (0px blur)
              boxShadow: '4px 4px 0px 0px rgba(45, 52, 54, 1)', 
              boxShadowHover: '6px 6px 0px 0px rgba(45, 52, 54, 1)'
          }
      },
      
      // ==========================================
      // 4. 自定义主题 (紫色系)
      // 特点：优雅、紫罗兰色调
      // ==========================================
      custom: {
          name: 'custom',
          label: '自定义主题',
          colors: {
              ...baseTheme.colors,
              primary: '#9b59b6', // 紫色
              'el-color-primary': '#9b59b6',
              decoration: decorationColors,
              
              text: '#303133', 
              textSecondary: '#606266', 
              textLight: '#909399', 
              textDisabled: '#c0c4cc',
              
              bgPrimary: '#f8f2fa', // 淡紫背景
              bgSecondary: '#ffffff', 
              bgDisabled: '#f3e5f5', 
              
              border: '#dcdfe6',
              borderLight: '#e4e7ed',
              borderLighter: '#ebeef5',
              borderExtraLight: '#f2f6fc',
              
              headerBg: '#ffffff',
              footerBg: '#f8f2fa', 
              selectBg: '#f3e5f5',
              
              // 紫色系色阶
              'el-color-primary-light-3': '#bfaac9', 
              'el-color-primary-light-5': '#d5c7dd', 
              'el-color-primary-light-7': '#eaddf0', 
              'el-color-primary-light-9': '#f8f2fa', 
              'el-color-primary-dark-2': '#763e8f',
              
              'el-bg-color': '#ffffff', 
              'el-bg-color-page': '#f8f2fa', 
              'el-bg-color-overlay': '#ffffff',
              
              'el-text-color-primary': '#303133',
              'el-border-color': '#dcdfe6',
              'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.1)'
          },
          variables: { ...baseTheme.variables, boxShadow: '0 8px 24px rgba(155, 89, 182, 0.15)' }
      }
  };
  
  // 获取当前主题 (默认为 light)
  export function getCurrentTheme() {
      const savedThemeName = localStorage.getItem('app-theme') || localStorage.getItem('theme');
      return savedThemeName && themes[savedThemeName] ? themes[savedThemeName] : themes.light;
  }
  
  // 设置并应用主题
  export function setTheme(themeName) {
      const theme = themes[themeName] || themes.light;
      localStorage.setItem('app-theme', themeName);
      localStorage.setItem('theme', themeName); // 兼容旧 key
      applyTheme(theme);
      return theme;
  }
  
  // 核心：将 JS 配置转换为 CSS 变量
  export function applyTheme(theme) {
      const root = document.documentElement;
      const cssVariables = {};
  
      // 1. 处理 Colors
      Object.entries(theme.colors).forEach(([key, value]) => {
          // 过滤掉 decoration 等嵌套对象，只处理字符串颜色值
          if (typeof value === 'string') {
              if (key.startsWith('el-')) {
                  // 如果已经是 el- 开头的变量，直接使用
                  cssVariables[`--${key}`] = value;
              } else if (key === 'headerBg' || key === 'footerBg') {
                  cssVariables[`--${key}`] = value;
              } else {
                  // 自动添加 -color 后缀，例如 --primary-color
                  cssVariables[`--${key}-color`] = value;
                  // 同时保留无后缀版本，兼容旧代码 --primary
                  cssVariables[`--${key}`] = value;
              }
          }
      });
  
      // 2. 处理 Variables (圆角、阴影等)
      Object.entries(theme.variables).forEach(([key, value]) => {
          cssVariables[`--${key}`] = value;
      });
  
      // 3. 批量写入 DOM
      Object.entries(cssVariables).forEach(([variableName, value]) => {
          root.style.setProperty(variableName, value);
      });
  
      // 4. 设置 data-theme 属性，供 CSS 选择器使用 (如 TopNav 中的 :global([data-theme="dark"]))
      root.setAttribute('data-theme', theme.name);
      
      // 5. 设置 Element Plus 的 dark class
      if (theme.name === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
  }
  
  // 初始化主题
  export function initTheme() {
      const theme = getCurrentTheme();
      applyTheme(theme);
      return theme;
  }
  
  export const THEME_NAMES = {
      LIGHT: 'light',
      DARK: 'dark',
      CUSTOM: 'custom',
      CARTOON: 'cartoon'
  };