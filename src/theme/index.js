// 主题配置
export const themes = {
    light: {
        name: 'light',
        label: '浅色主题',
        colors: {
            primary: '#409eff',
            success: '#67c23a',
            warning: '#e6a23c',
            danger: '#f56c6c',
            info: '#909399',
            text: '#303133',
            textSecondary: '#606266',
            bgPrimary: '#f5f7fa',
            bgSecondary: '#e4e7ed',
            headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            footerBg: '#f5f7fa',
            border: '#ebeef5'
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
            primary: '#409eff',
            success: '#67c23a',
            warning: '#e6a23c',
            danger: '#f56c6c',
            info: '#909399',
            text: '#e4e7ed',
            textSecondary: '#909399',
            bgPrimary: '#1a1a1a',
            bgSecondary: '#2d2d2d',
            headerBg: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            footerBg: '#2d2d2d',
            border: '#4a5568'
        },
        variables: {
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.3)',
            transitionDuration: '0.3s'
        }
    },
    blue: {
        name: 'blue',
        label: '蓝色主题',
        colors: {
            primary: '#1890ff',
            success: '#52c41a',
            warning: '#faad14',
            danger: '#f5222d',
            info: '#8c8c8c',
            text: '#262626',
            textSecondary: '#595959',
            bgPrimary: '#f0f8ff',
            bgSecondary: '#e6f7ff',
            headerBg: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            footerBg: '#f0f8ff',
            border: '#d9d9d9'
        },
        variables: {
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.1)',
            boxShadowHover: '0 4px 12px rgba(24, 144, 255, 0.2)',
            transitionDuration: '0.3s'
        }
    }
}

// 获取当前主题
export function getCurrentTheme() {
    const saved = localStorage.getItem('app-theme')
    return saved && themes[saved] ? themes[saved] : themes.light
}

// 设置主题
export function setTheme(themeName) {
    const theme = themes[themeName] || themes.light
    localStorage.setItem('app-theme', themeName)
    applyTheme(theme)
    return theme
}

// 应用主题到CSS变量
export function applyTheme(theme) {
    const root = document.documentElement

    // 设置颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}-color`, value)
    })

    // 设置其他变量
    Object.entries(theme.variables).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
    })
}

// 初始化主题
export function initTheme() {
    const theme = getCurrentTheme()
    applyTheme(theme)
    return theme
}
