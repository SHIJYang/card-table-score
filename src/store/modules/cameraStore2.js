import { defineStore } from 'pinia';

// 外部变量，避免Vue深度监听导致性能损耗
let handLandmarker = null;
let rafId = null;
let lastVideoTime = -1;
let lastProcessTime = 0;

export const useCamerasStore = defineStore('camera', {
  state: () => ({
    isCameraOpen: false,
    isLoading: false,
    isHandDetected: false,
    
    // 手势状态
    gesture: {
      name: 'NONE',         // 当前识别到的手势名称
      confidence: 0,        // 确认置信度 (0-100)
      isLocked: false       // 【新增】锁定状态，用于触发一次性动作后的冷却
    },

    // 交互参数 (用于控制画面)
    interaction: {
      rotationFactor: 0,    // 左右旋转 (-1 ~ 1)
      scaleFactor: 1.0,     // 缩放系数 (0.8 ~ 1.5)
      handPos: { x: 0.5, y: 0.5 } // 手掌中心坐标
    },

    // 事件触发器 (用于通知Vue组件执行一次性动作)
    trigger: {
      mode: null,           // 'tree' | 'scatter' | 'zoom'
      theme: null,          // true (切换颜色)
      letter: null,         // true (打开信件)
      timestamp: 0          // 变化时触发监听
    },
    
    // 内部计时器
    lastThemeSwitchTime: 0,
    lastLetterTime: 0,
  }),

  actions: {
    async toggleCamera(videoElement) {
      if (this.isCameraOpen) this.stopCamera();
      else await this.startCamera(videoElement);
    },

    async startCamera(videoElement) {
      this.isLoading = true;
      try {
        // 使用 CDN 加速加载 MediaPipe
        const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm');
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU" // 强制 GPU 加速
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        // 请求较低分辨率以优化性能
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } 
        });

        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.onloadeddata = () => {
            this.isCameraOpen = true;
            this.isLoading = false;
            this.predictLoop(videoElement);
          };
        }
      } catch (err) {
        console.error("Camera Init Error:", err);
        this.isCameraOpen = false;
        this.isLoading = false;
      }
    },

    stopCamera() {
      this.isCameraOpen = false;
      this.isHandDetected = false;
      cancelAnimationFrame(rafId);
      // 停止视频流
      const video = document.querySelector('video');
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
    },

    predictLoop(videoElement) {
      if (!this.isCameraOpen || !videoElement) return;
      rafId = requestAnimationFrame(() => this.predictLoop(videoElement));

      const now = performance.now();
      // 【优化】限制检测帧率约 20fps，给 UI 渲染留出更多性能
      if (now - lastProcessTime < 50) return; 
      lastProcessTime = now;

      if (videoElement.currentTime === lastVideoTime) return;
      lastVideoTime = videoElement.currentTime;

      if (handLandmarker) {
        const result = handLandmarker.detectForVideo(videoElement, now);
        
        if (result.landmarks && result.landmarks.length > 0) {
          this.isHandDetected = true;
          this.processGesture(result.landmarks[0], now);
        } else {
          this.isHandDetected = false;
          // 丢失手部时快速重置
          this.resetGestureState();
        }
      }
    },

    // --- 核心手势算法 (逻辑修复版) ---
    processGesture(lm, now) {
      // 1. 冷却逻辑
      if (this.gesture.isLocked) {
        if (now - this.lastLetterTime > 1000) {
          this.gesture.isLocked = false;
        } else {
          return;
        }
      }

      // --- 基础几何计算 ---
      // 计算两点距离
      const getDist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
      
      // 手掌基准大小 (手腕到中指根部)，用于归一化距离，适应不同远近
      const palmBaseSize = getDist(0, 9); 

      // 辅助函数：判断手指是否伸直
      // 逻辑：指尖到手腕的距离 > 指关节到手腕的距离 * 阈值
      const isStraight = (tipIdx, pipIdx) => getDist(0, tipIdx) > getDist(0, pipIdx) * 1.2;

      // 2. 获取五个手指的状态 (True=伸直, False=弯曲)
      // 拇指逻辑特殊：比较指尖和指根到小指根部(17)的距离，或者简单的张开角度
      const thumbOpen = getDist(4, 17) > palmBaseSize * 1.1; 
      const indexOpen = isStraight(8, 6);
      const middleOpen = isStraight(12, 10);
      const ringOpen = isStraight(16, 14);
      const pinkyOpen = isStraight(20, 18);

      // 3. 特殊特征计算
      // 捏合检测 (拇指尖-食指尖)
      const pinchDist = getDist(4, 8);
      const isPinch = pinchDist < palmBaseSize * 0.3; // 阈值可微调

      // 拇指向上逻辑 (不仅看Y轴，还要确保拇指伸直且其他手指弯曲)
      // 修正：使用相对坐标判断拇指是否在上方 (y更小)
      const isThumbUpward = lm[4].y < lm[3].y && lm[4].y < lm[17].y;

      // 统计伸直的手指数量 (不含拇指)
      const fingersCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

      // --- 4. 手势状态机 (严格优先级) ---
      let detected = 'UNKNOWN';

      // 🟢 [OK 手势]
      // 核心特征：拇指食指捏合 + 中指/无名指/小指必须伸直 (这是为了和握拳区分的关键)
      if (isPinch && middleOpen && ringOpen) {
        detected = 'OK';
      }
      
      // 🟢 [FIST_CLOSED 握拳]
      // 核心特征：所有手指(除拇指外)弯曲 + 没有捏合(或者捏合了但其他手指没伸直)
      // 放宽条件：允许拇指随意，只要其他四指紧握
      else if (fingersCount === 0) {
         // 细分：如果是竖起大拇指
         if (thumbOpen && isThumbUpward) {
            detected = 'FIST_THUMB'; // 👍 点赞
         } else {
            detected = 'FIST_CLOSED'; // 👊 纯握拳
         }
      }

      // 🟢 [POINTING 剪刀手/指引]
      // 核心特征：食指(或加中指)伸直 + 无名指小指弯曲
      else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        detected = 'POINTING';
      }
      else if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        detected = 'POINTING'; // 单指也算
      }

      // 🟢 [OPEN_FULL 张开手掌]
      // 核心特征：至少4指伸直
      else if (fingersCount >= 4) {
        if (thumbOpen) {
           detected = 'OPEN_FULL'; // 🖐 全开
        } else {
           detected = 'OPEN_NO_THUMB'; // ✋ 四指开
        }
      }

      // --- 5. 粘性防抖 (Confidence System) ---
      this.updateGestureConfidence(detected);

      // --- 6. 触发业务逻辑 ---
      if (this.gesture.confidence > 70) {
        this.handleLogic(this.gesture.name, lm, now);
      }
    },

    // 抽离出来的防抖逻辑
    updateGestureConfidence(currentGesture) {
       // 如果检测结果变化，迅速降低当前置信度
       if (currentGesture !== this.gesture.name) {
          this.gesture.confidence -= 20;
          if (this.gesture.confidence <= 0) {
             // 信心归零，切换手势
             this.gesture.name = currentGesture;
             this.gesture.confidence = 0;
          }
       } else {
          // 如果检测结果一致，增加置信度
          // OK 手势因为动作精细，增加得慢一点，防止误触
          const step = currentGesture === 'OK' ? 15 : 25;
          this.gesture.confidence = Math.min(this.gesture.confidence + step, 100);
       }
    },

    handleLogic(gesture, lm, now) {
      const center = lm[9]; 
      const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
      
      
      if (gesture === 'OPEN_FULL' || gesture === 'POINTING' || gesture === 'FIST_CLOSED') {
          this.interaction.handPos.x = lerp(this.interaction.handPos.x, center.x, 0.2);
          this.interaction.handPos.y = lerp(this.interaction.handPos.y, center.y, 0.2);
      }

      switch (gesture) {
        case 'FIST_CLOSED': // 👊 圣诞树
          this.triggerEvent('mode', 'tree');
          break;

        case 'FIST_THUMB':  // 👍 切换颜色
          this.trySwitchTheme(now);
          break;

        case 'OPEN_FULL':   // 🖐 星云 & 操控
          this.triggerEvent('mode', 'scatter');
          // 增加死区，防止手放在中间时还在旋转
          let rotRaw = (0.5 - this.interaction.handPos.x) * 3.0;
          this.interaction.rotationFactor = Math.abs(rotRaw) < 0.1 ? 0 : rotRaw;
          
          const targetScale = 1.6 - this.interaction.handPos.y; 
          this.interaction.scaleFactor += (targetScale - this.interaction.scaleFactor) * 0.1;
          break;

        case 'POINTING':    // ✌️ 放大
          this.triggerEvent('mode', 'zoom');
          break;

        case 'OK':          // 👌 告白 (一次性触发)
          // OK手势要求极高的置信度
          if (this.gesture.confidence > 95) { 
            if (now - this.lastLetterTime > 3000) { 
              this.triggerEvent('letter', true);
              this.lastLetterTime = now;
              
              // 【关键】触发成功后，强制重置并锁定！
              this.forceResetAfterTrigger();
            }
          }
          break;
          
        case 'OPEN_NO_THUMB':
          this.trySwitchTheme(now);
          break;
      }
    },

    // 辅助：丢失目标或需要重置时调用
    resetGestureState() {
      this.gesture.confidence = 0;
      this.interaction.rotationFactor *= 0.5; // 缓动归零
    },

    // 【新增】触发一次性事件后的强制重置
    forceResetAfterTrigger() {
        this.gesture.name = 'NONE';
        this.gesture.confidence = 0;
        this.gesture.isLocked = true; // 锁定，等待用户把手拿开
        this.interaction.rotationFactor = 0; // 停止旋转
    },

    trySwitchTheme(now) {
      if (this.gesture.confidence < 85) return; 

      if (now - this.lastThemeSwitchTime > 1500) {
        this.triggerEvent('theme', true);
        this.lastThemeSwitchTime = now;
      }
    },

    triggerEvent(key, val) {
      if (key === 'mode' && this.trigger.mode === val) return;
      this.trigger[key] = val;
      this.trigger.timestamp = Date.now();
    }
  }
});