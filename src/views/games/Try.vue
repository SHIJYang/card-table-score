<template>
  <div class="common-layout">
    <el-header class="header">
      <CardNav :logo="logo" logoAlt="Site Logo" :items="navItems" baseColor="#fff" menuColor="#000" />
    </el-header>
    <el-container>
      <el-main class="error404">
        <FuzzyText text="棒！" :font-size="40" :color="secondaryColor" :enable-hover="true" :base-intensity="0.1"
          :hover-intensity="0.3" />
        <GestureRadio v-model="activeMode" :options="menuConfig" />
        <div class="puzzle-card">
          <PuzzleCard v-for="puzzle in puzzleData" :key="puzzle.id" width="150px" height="200px"
            :puzzle-number="puzzle.id" :images="puzzle.images">
            <template #question>
              <div v-html="puzzle.questionHtml"></div>
            </template>
          </PuzzleCard>
        </div>

      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import FuzzyText from "../../components/gsap/FuzzyText.vue";
import logo from '../../assets/love-sign.svg'
import CardNav from '../../components/gsap/CardNav.vue'
import GestureRadio from "../../components/GestureRadio.vue"
import PuzzleCard from '../../components/box/PuzzleCard.vue'

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


const puzzleData = [
  {
    id: "001",
    questionHtml: `
      <p>
        三个嫌疑人谈论谁偷了蛋糕。<br>
        A 说: <i>"不是我。"</i><br>
        B 说: <i>"是 A 偷的。"</i><br>
        C 说: <i>"不是 B。"</i><br>
        已知只有一个人说了真话。<br>
        <b>谁偷了蛋糕？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/503c30/c9b28b?text=Suspect+A',
      B: 'https://placehold.co/200x150/306f7d/ffffff?text=Suspect+B',
      C: 'https://placehold.co/200x150/bd620a/ffffff?text=Suspect+C'
    }
  },
  {
    id: "002",
    questionHtml: `
      <p>
        在一次赛跑比赛中，<br>
        如果你超过了<b>第二名</b>，<br>
        请问你现在是第几名？
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/4a4a4a/ffffff?text=1st+Place',
      B: 'https://placehold.co/200x150/4a4a4a/ffffff?text=2nd+Place',
      C: 'https://placehold.co/200x150/4a4a4a/ffffff?text=3rd+Place'
    }
  },
  {
    id: "003",
    questionHtml: `
      <p>
        汤姆的父亲有三个儿子。<br>
        大儿子叫“大毛”，<br>
        二儿子叫“二毛”。<br>
        <b>三儿子叫什么名字？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/2e7d32/ffffff?text=SanMao',
      B: 'https://placehold.co/200x150/1565c0/ffffff?text=Tom',
      C: 'https://placehold.co/200x150/c62828/ffffff?text=XiaoMao'
    }
  },
  {
    id: "004",
    questionHtml: `
      <p>
        一年有的月份有31天，<br>
        有的月份有30天。<br>
        <b>请问有多少个月份有28天？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/555/fff?text=1+Month',
      B: 'https://placehold.co/200x150/555/fff?text=2+Months',
      C: 'https://placehold.co/200x150/555/fff?text=12+Months'
    }
  },
  {
    id: "005",
    questionHtml: `
      <p>
        如果不全是真话：<br>
        1 = 5<br>
        2 = 15<br>
        3 = 215<br>
        4 = 3215<br>
        <b>5 = ?</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/333/fff?text=43215',
      B: 'https://placehold.co/200x150/333/fff?text=1',
      C: 'https://placehold.co/200x150/333/fff?text=5'
    }
  },
  {
    id: "006",
    questionHtml: `
      <p>
        一列电动火车向北行驶，<br>
        风向是向南吹的。<br>
        <b>烟往哪个方向飘？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/607d8b/fff?text=South',
      B: 'https://placehold.co/200x150/607d8b/fff?text=North',
      C: 'https://placehold.co/200x150/607d8b/fff?text=No+Smoke'
    }
  },
  {
    id: "007",
    questionHtml: `
      <p>
        桌上的篮子里有6个苹果。<br>
        你拿走了4个。<br>
        <b>现在你有几个苹果？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/d84315/fff?text=2+Apples',
      B: 'https://placehold.co/200x150/d84315/fff?text=4+Apples',
      C: 'https://placehold.co/200x150/d84315/fff?text=6+Apples'
    }
  },
  {
    id: "008",
    questionHtml: `
      <p>
        红色的房子是用红砖盖的，<br>
        蓝色的房子是用蓝砖盖的。<br>
        <b>绿室 (Greenhouse) 是用什么盖的？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/2e7d32/fff?text=Green+Bricks',
      B: 'https://placehold.co/200x150/81d4fa/000?text=Glass',
      C: 'https://placehold.co/200x150/ffeb3b/000?text=Wood'
    }
  },
  {
    id: "009",
    questionHtml: `
      <p>
        一个 3米 x 3米 x 3米 的坑里<br>
        <b>有多少泥土？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/795548/fff?text=27+m3',
      B: 'https://placehold.co/200x150/795548/fff?text=9+m3',
      C: 'https://placehold.co/200x150/795548/fff?text=None'
    }
  },
  {
    id: "010",
    questionHtml: `
      <p>
        医生给你 3 颗药丸，<br>
        要你每半个小时吃一颗。<br>
        <b>吃完需要多长时间？</b>
      </p>
    `,
    images: {
      A: 'https://placehold.co/200x150/673ab7/fff?text=1.5+Hours',
      B: 'https://placehold.co/200x150/673ab7/fff?text=1+Hour',
      C: 'https://placehold.co/200x150/673ab7/fff?text=2+Hours'
    }
  }
];
</script>

<style scoped>
.common-layout {
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


.puzzle-card {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-evenly;
  gap: 20px;
}
</style>