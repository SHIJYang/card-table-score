// 主题配置
// 完全自定义主题，覆盖Element Plus所需的CSS变量

const baseTheme = {
  colors: {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    danger: '#f56c6c',
    info: '#909399',
    'el-color-primary': '#409eff',
    'el-color-success': '#67c23a',
    'el-color-warning': '#e6a23c',
    'el-color-danger': '#f56c6c',
    'el-color-info': '#909399',
  },
  variables: {
    borderRadius: '8px',
    transitionDuration: '0.3s'
  }
};

// 3D装饰元素颜色配置 - 更加鲜艳的卡通色
const decorationColors = {
  gold: { light: '#FFEAA7', medium: '#FDCB6E', dark: '#E17055' },
  red: { light: '#FF7675', medium: '#D63031', dark: '#B01819' },
  blue: { light: '#74B9FF', medium: '#0984E3', dark: '#0C2461' },
  green: { light: '#55EFC4', medium: '#00B894', dark: '#006266' }
};

export const themes = {
    light: {
        name: 'light',
        label: '浅色主题',
        colors: {
            ...baseTheme.colors,
            decoration: decorationColors,
            text: '#303133', textSecondary: '#606266', textLight: '#909399', textDisabled: '#c0c4cc',
            bgPrimary: '#f5f7fa', bgSecondary: '#ffffff', 
            bgDisabled: '#ecf5ff', // 优化：悬停背景色使用极淡的蓝色，比灰色更清爽
            
            border: '#ebeef5', borderLight: '#ebeef5', borderLighter: '#f2f6fc', borderExtraLight: '#f2f6fc',
            headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            footerBg: '#f5f7fa', selectBg: '#e9c811ff',
            
            'el-color-primary-light-3': '#79bbff', 'el-color-primary-light-5': '#a0cfff', 'el-color-primary-light-7': '#c6e2ff', 'el-color-primary-light-9': '#ecf5ff', 'el-color-primary-dark-2': '#337ecc',
            'el-bg-color': '#ffffff', 'el-bg-color-page': '#f5f7fa', 'el-bg-color-overlay': '#ffffff',
            'el-text-color-primary': '#303133', 'el-text-color-regular': '#606266', 'el-text-color-secondary': '#909399', 'el-text-color-placeholder': '#c0c4cc',
            'el-border-color': '#ebeef5', 'el-border-color-light': '#ebeef5', 'el-border-color-lighter': '#f2f6fc', 'el-border-color-extra-light': '#f2f6fc',
            'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.1)'
        },
        variables: { ...baseTheme.variables, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.08)' }
    },
    dark: {
        name: 'dark',
        label: '深色主题',
        colors: {
            ...baseTheme.colors,
            decoration: decorationColors,
            text: '#eaedf1ff', textSecondary: '#abadb3ff', textLight: '#7a7c81ff', textDisabled: '#575656ff',
            bgPrimary: '#1a1a1a', bgSecondary: '#2d2d2d', 
            bgDisabled: '#333333', // 优化：悬停色变亮，解决深色模式下看不见 hover 的问题
            
            border: '#4a5568', borderLight: '#4a5568', borderLighter: '#374151', borderExtraLight: '#374151',
            headerBg: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            footerBg: '#2d2d2d', selectBg: '#e9c811ff',
            
            // 优化：Light-9 在深色模式下不能是白色，改为深灰色，使背景类组件自然
            'el-color-primary-light-3': '#2a598a', 'el-color-primary-light-5': '#204060', 'el-color-primary-light-7': '#1a3045', 'el-color-primary-light-9': '#2d2d2d', 'el-color-primary-dark-2': '#66b1ff',
            
            'el-bg-color': '#141414', 'el-bg-color-page': '#1a1a1a', 'el-bg-color-overlay': '#2d2d2d',
            'el-text-color-primary': '#e4e7ed', 'el-text-color-regular': '#dcdfe6', 'el-text-color-secondary': '#909399', 'el-text-color-placeholder': '#606266',
            'el-border-color': '#4a5568', 'el-border-color-light': '#4a5568', 'el-border-color-lighter': '#374151', 'el-border-color-extra-light': '#374151',
            'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.5)' // 加深阴影
        },
        variables: { ...baseTheme.variables, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.4)' }
    },
    cartoon: {
        name: 'cartoon',
        label: '糖果卡通',
        colors: {
            primary: '#FF6B6B',
            success: '#4ECDC4',
            warning: '#FFE66D',
            danger: '#FF4757',
            info: '#45B7D1',
            
            decoration: decorationColors,
            
            text: '#2F3542', textSecondary: '#57606F', textLight: '#747D8C', textDisabled: '#A4B0BE',
            bgPrimary: '#FFF9F0', bgSecondary: '#FFFFFF', 
            bgDisabled: '#FFEAA7', // 优化：悬停色直接使用亮黄色，配合卡通风格
            
            border: '#2F3542', borderLight: '#2F3542', borderLighter: '#57606F', borderExtraLight: '#CED6E0',
            headerBg: 'linear-gradient(45deg, #FF9FF3 0%, #FECA57 100%)',
            footerBg: '#FFF9F0', selectBg: '#FFEAA7',
            
            'el-color-primary': '#FF6B6B', 'el-color-success': '#4ECDC4', 'el-color-warning': '#FFE66D', 'el-color-danger': '#FF4757', 'el-color-info': '#45B7D1',
            'el-bg-color': '#FFFFFF', 'el-bg-color-page': '#FFF9F0', 'el-bg-color-overlay': '#FFFFFF',
            'el-text-color-primary': '#2F3542', 'el-text-color-regular': '#57606F', 'el-text-color-secondary': '#747D8C', 'el-text-color-placeholder': '#A4B0BE',
            'el-border-color': '#2F3542', 'el-border-color-light': '#57606F', 'el-border-color-lighter': '#CED6E0', 'el-border-color-extra-light': '#DFE4EA',
            'el-box-shadow-base': '4px 4px 0px 0px rgba(47, 53, 66, 1)'
        },
        variables: {
            borderRadius: '16px',
            transitionDuration: '0.2s',
            boxShadow: '4px 4px 0px 0px rgba(47, 53, 66, 1)',
            boxShadowHover: '6px 6px 0px 0px rgba(47, 53, 66, 1)'
        }
    },
    custom: {
        name: 'custom',
        label: '自定义主题',
        colors: {
            ...baseTheme.colors,
            primary: '#9b59b6', // 紫色系，区别于浅色主题
            'el-color-primary': '#9b59b6',
            decoration: decorationColors,
            text: '#303133', textSecondary: '#606266', textLight: '#909399', textDisabled: '#c0c4cc',
            bgPrimary: '#f3e5f5', // 浅紫背景
            bgSecondary: '#ffffff', 
            bgDisabled: '#fdf2ff', // 悬停色
            
            border: '#dcdfe6', borderLight: '#e4e7ed', borderLighter: '#ebeef5', borderExtraLight: '#f2f6fc',
            headerBg: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
            footerBg: '#f3e5f5', selectBg: '#d1c4e9',
            
            'el-color-primary-light-3': '#bfaac9', 'el-color-primary-light-5': '#d5c7dd', 'el-color-primary-light-7': '#eaddf0', 'el-color-primary-light-9': '#f8f2fa', 'el-color-primary-dark-2': '#763e8f',
            'el-bg-color': '#ffffff', 'el-bg-color-page': '#f3e5f5', 'el-bg-color-overlay': '#ffffff',
            'el-text-color-primary': '#303133', 'el-text-color-regular': '#606266', 'el-text-color-secondary': '#909399', 'el-text-color-placeholder': '#c0c4cc',
            'el-border-color': '#dcdfe6', 'el-border-color-light': '#e4e7ed', 'el-border-color-lighter': '#ebeef5', 'el-border-color-extra-light': '#f2f6fc',
            'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.1)'
        },
        variables: { ...baseTheme.variables, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.12)' }
    }
};

export function getCurrentTheme() {
    const savedThemeName = localStorage.getItem('app-theme') || localStorage.getItem('theme');
    return savedThemeName && themes[savedThemeName] ? themes[savedThemeName] : themes.light;
}

export function setTheme(themeName) {
    const theme = themes[themeName] || themes.light;
    localStorage.setItem('app-theme', themeName);
    localStorage.setItem('theme', themeName);
    applyTheme(theme);
    return theme;
}

export function applyTheme(theme) {
    const root = document.documentElement;
    const cssVariables = {};
    Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value !== 'object' || value === null || value instanceof Array) {
            if (key === 'headerBg' || key === 'footerBg') {
                cssVariables[`--${key}`] = value;
            } else {
                cssVariables[`--${key}-color`] = value;
                cssVariables[`--${key}`] = value;
            }
        }
    });
    Object.entries(theme.variables).forEach(([key, value]) => {
        cssVariables[`--${key}`] = value;
    });
    Object.entries(cssVariables).forEach(([variableName, value]) => {
        root.style.setProperty(variableName, value);
    });
    root.setAttribute('data-theme', theme.name);
}

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