<template>
  <div ref="containerRef" class="relative w-full h-full" @click="handleClick">
    <canvas ref="canvasRef" class="absolute inset-0 pointer-events-none" />

    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  watch,
  useTemplateRef,
} from "vue";
import { getCurrentTheme } from '@/theme/index.js';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

interface Props {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  sparkOpacity?: number;
}

// 获取当前主题
const currentTheme = ref(getCurrentTheme());

// 主题变化监听器
const handleThemeChange = () => {
  currentTheme.value = getCurrentTheme();
};

const props = withDefaults(defineProps<Props>(), {
  sparkColor: computed(() => currentTheme.value.colors.decoration?.gold?.light || "#f0f0f0"),
  sparkSize: 8, // 减小粒子大小
  sparkRadius: 15,
  sparkCount: 6, // 减少粒子数量
  duration: 500, // 延长持续时间，使效果更柔和
  easing: "ease-out",
  extraScale: 0.8, // 减小缩放
  sparkOpacity: 0.6, // 降低透明度
});

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");
const sparks = ref<Spark[]>([]);
const startTimeRef = ref<number | null>(null);
const animationId = ref<number | null>(null);

const easeFunc = computed(() => {
  return (t: number) => {
    switch (props.easing) {
      case "linear":
        return t;
      case "ease-in":
        return t * t;
      case "ease-in-out":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t);
    }
  };
});

const handleClick = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const now = performance.now();
  const newSparks: Spark[] = Array.from(
    { length: props.sparkCount },
    (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / props.sparkCount,
      startTime: now,
    })
  );

  sparks.value.push(...newSparks);
};

const draw = (timestamp: number) => {
  if (!startTimeRef.value) {
    startTimeRef.value = timestamp;
  }

  const canvas = canvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  sparks.value = sparks.value.filter((spark: Spark) => {
    const elapsed = timestamp - spark.startTime;
    if (elapsed >= props.duration) {
      return false;
    }

    const progress = elapsed / props.duration;
    const eased = easeFunc.value(progress);

    const distance = eased * props.sparkRadius * props.extraScale;
    const lineLength = props.sparkSize * (1 - eased);

    const x1 = spark.x + distance * Math.cos(spark.angle);
    const y1 = spark.y + distance * Math.sin(spark.angle);
    const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
    const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

    // 设置渐变色，使粒子从中心到边缘逐渐消失
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    // 起始点透明度较高，结束点透明度为0
    const currentOpacity = props.sparkOpacity * (1 - eased);
    
    // 处理不同颜色格式
    let rgbColor = props.sparkColor;
    if (rgbColor.startsWith('#')) {
      // 十六进制颜色转换为RGB
      const hex = rgbColor.replace('#', '');
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
      rgbColor = `rgba(${r}, ${g}, ${b}`;
    } else if (rgbColor.startsWith('rgb(')) {
      // RGB转换为RGBA
      rgbColor = rgbColor.replace('rgb(', 'rgba(');
    }
    
    // 确保颜色格式为rgba
    if (!rgbColor.includes('rgba(')) {
      rgbColor = rgbColor.replace(')', ', 1)');
    }
    
    // 设置渐变颜色
    const startColor = rgbColor.replace(/[\d.]+\)$/, `${currentOpacity})`);
    const endColor = rgbColor.replace(/[\d.]+\)$/, '0)');
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1; // 减小线条宽度
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    return true;
  });

  animationId.value = requestAnimationFrame(draw);
};

const resizeCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  const { width, height } = parent.getBoundingClientRect();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
};

let resizeTimeout: number;

const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 100);
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(parent);

  resizeCanvas();

  animationId.value = requestAnimationFrame(draw);
  
  // 监听主题变化
  window.addEventListener('themeChanged', handleThemeChange);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  clearTimeout(resizeTimeout);

  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
  
  // 移除主题变化监听
  window.removeEventListener('themeChanged', handleThemeChange);
});

watch(
  [
    () => props.sparkColor,
    () => props.sparkSize,
    () => props.sparkRadius,
    () => props.sparkCount,
    () => props.duration,
    easeFunc,
    () => props.extraScale,
    () => props.sparkOpacity,
  ],
  () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value);
    }
    animationId.value = requestAnimationFrame(draw);
  }
);
</script>
