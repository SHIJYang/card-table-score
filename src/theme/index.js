// 主题配置
// 完全自定义主题，覆盖Element Plus所需的CSS变量
export const themes = {
    light: {
        name: 'light',
        label: '浅色主题',
        colors: {
            // 基础颜色
            primary: '#409eff',
            success: '#67c23a',
            warning: '#e6a23c',
            danger: '#f56c6c',
            info: '#909399',
            
            // 文本颜色
            text: '#303133',
            textSecondary: '#606266',
            textLight: '#909399',
            textDisabled: '#c0c4cc',
            
            // 背景颜色
            bgPrimary: '#f5f7fa',
            bgSecondary: '#e4e7ed',
            bgDisabled: '#f5f7fa',
            
            // 边框颜色
            border: '#ebeef5',
            borderLight: '#ebeef5',
            borderLighter: '#f2f6fc',
            borderExtraLight: '#f2f6fc',
            
            // 特定区域背景
            headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            footerBg: '#f5f7fa',
            
            // Element Plus 兼容变量
            'el-color-primary': '#409eff',
            'el-color-primary-light-3': '#79bbff',
            'el-color-primary-light-5': '#a0cfff',
            'el-color-primary-light-7': '#c6e2ff',
            'el-color-primary-light-9': '#ecf5ff',
            'el-color-primary-dark-2': '#337ecc',
            
            'el-color-success': '#67c23a',
            'el-color-warning': '#e6a23c',
            'el-color-danger': '#f56c6c',
            'el-color-info': '#909399',
            
            'el-bg-color': '#ffffff',
            'el-bg-color-page': '#f5f7fa',
            'el-bg-color-overlay': '#ffffff',
            
            'el-text-color-primary': '#303133',
            'el-text-color-regular': '#606266',
            'el-text-color-secondary': '#909399',
            'el-text-color-placeholder': '#c0c4cc',
            
            'el-border-color': '#ebeef5',
            'el-border-color-light': '#ebeef5',
            'el-border-color-lighter': '#f2f6fc',
            'el-border-color-extra-light': '#f2f6fc',
            
            'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.1)'
        },
        variables: {
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.08)',
            transitionDuration: '0.3s'
        }
    },
    dark: {
        name: 'dark',
        label: '深色主题',
        colors: {
            // 基础颜色
            primary: '#409eff',
            success: '#67c23a',
            warning: '#e6a23c',
            danger: '#f56c6c',
            info: '#909399',
            
            // 文本颜色
            text: '#e4e7ed',
            textSecondary: '#909399',
            textLight: '#606266',
            textDisabled: '#404040',
            
            // 背景颜色
            bgPrimary: '#1a1a1a',
            bgSecondary: '#2d2d2d',
            bgDisabled: '#1a1a1a',
            
            // 边框颜色
            border: '#4a5568',
            borderLight: '#4a5568',
            borderLighter: '#374151',
            borderExtraLight: '#374151',
            
            // 特定区域背景
            headerBg: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            footerBg: '#2d2d2d',
            
            // Element Plus 兼容变量
            'el-color-primary': '#409eff',
            'el-color-primary-light-3': '#79bbff',
            'el-color-primary-light-5': '#a0cfff',
            'el-color-primary-light-7': '#c6e2ff',
            'el-color-primary-light-9': '#ecf5ff',
            'el-color-primary-dark-2': '#337ecc',
            
            'el-color-success': '#67c23a',
            'el-color-warning': '#e6a23c',
            'el-color-danger': '#f56c6c',
            'el-color-info': '#909399',
            
            'el-bg-color': '#141414',
            'el-bg-color-page': '#1a1a1a',
            'el-bg-color-overlay': '#2d2d2d',
            
            'el-text-color-primary': '#e4e7ed',
            'el-text-color-regular': '#dcdfe6',
            'el-text-color-secondary': '#909399',
            'el-text-color-placeholder': '#606266',
            
            'el-border-color': '#4a5568',
            'el-border-color-light': '#4a5568',
            'el-border-color-lighter': '#374151',
            'el-border-color-extra-light': '#374151',
            
            'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.3)'
        },
        variables: {
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.3)',
            transitionDuration: '0.3s'
        }
    },
    custom: {
        name: 'custom',
        label: '自定义主题',
        colors: {
            // 基础颜色 - 使用更有个性的配色
            primary: '#6c63ff',
            success: '#00b42a',
            warning: '#ff7d00',
            danger: '#f53f3f',
            info: '#86909c',
            
            // 文本颜色
            text: '#1d2129',
            textSecondary: '#4e5969',
            textLight: '#86909c',
            textDisabled: '#c9cdd4',
            
            // 背景颜色
            bgPrimary: '#f7f8fa',
            bgSecondary: '#f2f3f5',
            bgDisabled: '#f7f8fa',
            
            // 边框颜色
            border: '#e5e6eb',
            borderLight: '#e5e6eb',
            borderLighter: '#f2f3f5',
            borderExtraLight: '#f2f3f5',
            
            // 特定区域背景
            headerBg: 'linear-gradient(135deg, #6c63ff 0%, #5468ff 100%)',
            footerBg: '#f7f8fa',
            
            // Element Plus 兼容变量
            'el-color-primary': '#6c63ff',
            'el-color-primary-light-3': '#8e87ff',
            'el-color-primary-light-5': '#a9a2ff',
            'el-color-primary-light-7': '#c3bdff',
            'el-color-primary-light-9': '#e9e8ff',
            'el-color-primary-dark-2': '#544bd6',
            
            'el-color-success': '#00b42a',
            'el-color-warning': '#ff7d00',
            'el-color-danger': '#f53f3f',
            'el-color-info': '#86909c',
            
            'el-bg-color': '#ffffff',
            'el-bg-color-page': '#f7f8fa',
            'el-bg-color-overlay': '#ffffff',
            
            'el-text-color-primary': '#1d2129',
            'el-text-color-regular': '#4e5969',
            'el-text-color-secondary': '#86909c',
            'el-text-color-placeholder': '#c9cdd4',
            
            'el-border-color': '#e5e6eb',
            'el-border-color-light': '#e5e6eb',
            'el-border-color-lighter': '#f2f3f5',
            'el-border-color-extra-light': '#f2f3f5',
            
            'el-box-shadow-base': '0 2px 12px 0 rgba(0, 0, 0, 0.08)'
        },
        variables: {
            borderRadius: '12px',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
            boxShadowHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
            transitionDuration: '0.35s'
        }
    }
}

// 获取当前主题
export function getCurrentTheme() {
    const saved = localStorage.getItem('app-theme') || localStorage.getItem('theme')
    return saved && themes[saved] ? themes[saved] : themes.light
}

// 设置主题
export function setTheme(themeName) {
    const theme = themes[themeName] || themes.light
    localStorage.setItem('app-theme', themeName)
    localStorage.setItem('theme', themeName) // 为了与store兼容
    applyTheme(theme)
    return theme
}

// 应用主题到CSS变量
export function applyTheme(theme) {
    const root = document.documentElement
    
    // 清除之前的所有主题变量
    Object.keys(root.style).forEach(key => {
        if (key.startsWith('--')) {
            root.style.removeProperty(key)
        }
    })
    
    // 设置颜色变量 - 为了兼容性，确保变量名称正确
    Object.entries(theme.colors).forEach(([key, value]) => {
        // 对于特殊变量如headerBg，确保直接设置，不添加-color后缀
        if (key === 'headerBg' || key === 'footerBg') {
            root.style.setProperty(`--${key}`, value)
        } else {
            // 其他颜色变量同时设置带-color后缀和不带后缀的版本
            root.style.setProperty(`--${key}-color`, value)
            root.style.setProperty(`--${key}`, value)
        }
    })
    
    // 设置其他变量
    Object.entries(theme.variables).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
    })
    
    // 确保Element Plus的CSS变量正确设置
    // 重新应用所有el-前缀的变量，确保优先级
    Object.entries(theme.colors).forEach(([key, value]) => {
        if (key.startsWith('el-')) {
            root.style.setProperty(`--${key}`, value)
        }
    })
    
    // 设置data-theme属性
    root.setAttribute('data-theme', theme.name)
}

// 初始化主题
export function initTheme() {
    const theme = getCurrentTheme()
    applyTheme(theme)
    return theme
}
