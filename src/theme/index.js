// 主题配置
// 完全自定义主题，覆盖Element Plus所需的CSS变量

// 提取基础主题配置，避免重复代码
const baseTheme = {
  // 基础颜色 - 三个主题共享的基础色调
  colors: {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    danger: '#f56c6c',
    info: '#909399',
    
    // Element Plus 兼容基础变量
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

// 3D装饰元素颜色配置
const decorationColors = {
  gold: {
    light: '#E6BE8A',
    medium: '#FFD700',
    dark: '#D4AF37'
  },
  red: {
    light: '#E74C3C',
    medium: '#C0392B',
    dark: '#922B21'
  },
  blue: {
    light: '#3498DB',
    medium: '#2874A6',
    dark: '#1B4F72'
  },
  green: {
    light: '#58D68D',
    medium: '#2ECC71',
    dark: '#1ABC9C'
  }
};

export const themes = {
    light: {
        name: 'light',
        label: '浅色主题',
        colors: {
            ...baseTheme.colors,
            
            // 3D装饰元素颜色
            decoration: decorationColors,
            
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
            selectBg: '#e9c811ff',
            // Element Plus 兼容变量 - 浅色主题特有
            'el-color-primary-light-3': '#79bbff',
            'el-color-primary-light-5': '#a0cfff',
            'el-color-primary-light-7': '#c6e2ff',
            'el-color-primary-light-9': '#ecf5ff',
            'el-color-primary-dark-2': '#337ecc',
            
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
            ...baseTheme.variables,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.08)'
        }
    },
    dark: {
        name: 'dark',
        label: '深色主题',
        colors: {
            ...baseTheme.colors,
            
            // 3D装饰元素颜色 - 深色主题适配
            decoration: {
                ...decorationColors,
                red: {
                    light: '#FF6666',
                    medium: '#FF4444',
                    dark: '#CC3333'
                },
                blue: {
                    light: '#4499FF',
                    medium: '#3377CC',
                    dark: '#2255AA'
                }
            },
            
            // 文本颜色
            text: '#eaedf1ff',
            textSecondary: '#abadb3ff',
            textLight: '#7a7c81ff',
            textDisabled: '#575656ff',
            
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
            selectBg: '#e9c811ff',
            
            // Element Plus 兼容变量 - 深色主题特有
            'el-color-primary-light-3': '#79bbff',
            'el-color-primary-light-5': '#a0cfff',
            'el-color-primary-light-7': '#c6e2ff',
            'el-color-primary-light-9': '#ecf5ff',
            'el-color-primary-dark-2': '#337ecc',
            
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
            ...baseTheme.variables,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            boxShadowHover: '0 6px 16px rgba(0, 0, 0, 0.3)'
        }
    },
    custom: {
        name: 'custom',
        label: '自定义主题',
        colors: {
            // 自定义主题使用独特的基础颜色
            primary: '#6c63ff',
            success: '#00b42a',
            warning: '#ff7d00',
            danger: '#f53f3f',
            info: '#86909c',
            
            // 3D装饰元素颜色 - 自定义主题风格
            decoration: {
                gold: {
                    light: '#FFE082',
                    medium: '#FFC107',
                    dark: '#FFA000'
                },
                red: {
                    light: '#FF5252',
                    medium: '#F44336',
                    dark: '#D32F2F'
                },
                blue: {
                    light: '#448AFF',
                    medium: '#3F51B5',
                    dark: '#303F9F'
                },
                green: {
                    light: '#66BB6A',
                    medium: '#4CAF50',
                    dark: '#388E3C'
                }
            },
            
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
            selectBg: '#e9e8ff',
            
            // Element Plus 兼容变量 - 自定义主题特有
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
            ...baseTheme.variables,
            borderRadius: '12px', // 自定义主题特殊的圆角
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
            boxShadowHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
            transitionDuration: '0.35s' // 自定义主题特殊的过渡时间
        }
    }
};

/**
 * 获取当前主题
 * @returns {Object} 当前主题配置对象
 */
export function getCurrentTheme() {
    // 统一使用 'app-theme' 作为键名，保持一致性
    const savedThemeName = localStorage.getItem('app-theme') || localStorage.getItem('theme');
    return savedThemeName && themes[savedThemeName] ? themes[savedThemeName] : themes.light;
}

/**
 * 设置主题
 * @param {string} themeName - 主题名称
 * @returns {Object} 设置后的主题配置对象
 */
export function setTheme(themeName) {
    const theme = themes[themeName] || themes.light;
    // 为了兼容，同时保存两个键名
    localStorage.setItem('app-theme', themeName);
    localStorage.setItem('theme', themeName);
    applyTheme(theme);
    return theme;
}

/**
 * 应用主题到CSS变量
 * @param {Object} theme - 主题配置对象
 */
export function applyTheme(theme) {
    const root = document.documentElement;
    
    // 性能优化：先收集所有变量，然后一次性设置
    const cssVariables = {};
    
    // 设置颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
        // 跳过嵌套对象（如decoration），只处理简单值
        if (typeof value !== 'object' || value === null || value instanceof Array) {
            if (key === 'headerBg' || key === 'footerBg') {
                // 特殊变量直接设置
                cssVariables[`--${key}`] = value;
            } else {
                // 其他颜色变量同时设置带-color后缀和不带后缀的版本，确保兼容性
                cssVariables[`--${key}-color`] = value;
                cssVariables[`--${key}`] = value;
            }
        }
    });
    
    // 设置其他变量
    Object.entries(theme.variables).forEach(([key, value]) => {
        cssVariables[`--${key}`] = value;
    });
    
    // 一次性设置所有CSS变量，减少DOM操作
    Object.entries(cssVariables).forEach(([variableName, value]) => {
        root.style.setProperty(variableName, value);
    });
    
    // 设置data-theme属性
    root.setAttribute('data-theme', theme.name);
}

/**
 * 初始化主题
 * @returns {Object} 初始化后的主题配置对象
 */
export function initTheme() {
    const theme = getCurrentTheme();
    applyTheme(theme);
    return theme;
}

// 导出主题名称常量，方便其他组件引用
export const THEME_NAMES = {
    LIGHT: 'light',
    DARK: 'dark',
    CUSTOM: 'custom'
};