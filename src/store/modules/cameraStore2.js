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
      // 1. 检查是否处于锁定冷却期 (防止触发后误判)
      if (this.gesture.isLocked) {
         // 1秒后自动解锁
         if (now - this.lastLetterTime > 1000) { 
             this.gesture.isLocked = false;
         } else {
             return; // 还在冷却中，跳过检测
         }
      }

      const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
      const palmSize = dist(0, 9); 

      // 2. 手指伸直判定
      const isExtended = (tip, pip) => dist(0, tip) > dist(0, pip) * 1.1;
      
      const f1 = isExtended(8, 6);   // 食指
      const f2 = isExtended(12, 10); // 中指
      const f3 = isExtended(16, 14); // 无名指
      const f4 = isExtended(20, 18); // 小指
      
      // 3. 拇指判定
      const thumbExtended = dist(4, 17) > palmSize * 1.0; 
      // 拇指向上 (Y越小越高)
      const thumbUp = lm[4].y < lm[3].y && lm[4].y < lm[5].y && !f1 && !f2 && !f3 && !f4;
      
      // 4. OK 判定 (捏合)
      const pinchDist = dist(4, 8);
      const isPinch = pinchDist < palmSize * 0.25; 
      
      const extendedCount = [f1, f2, f3, f4].filter(Boolean).length;

      let currentGesture = 'UNKNOWN';

      // --- 手势状态机 (优先级判定) ---

      // 👌 OK 手势：最高优先级
      // 必须满足：捏合 + 中指/无名指伸直 (避免握拳误判)
      if (isPinch && f2 && f3) {
        currentGesture = 'OK';
      } 
      // ✌️ 耶 / V手势
      else if (f1 && f2 && !f3 && !f4) {
        currentGesture = 'POINTING'; 
      }
      // 🖐 全张开
      else if (extendedCount === 4 && thumbExtended) {
        currentGesture = 'OPEN_FULL';
      }
      // 👍 点赞
      else if (thumbUp) {
        currentGesture = 'FIST_THUMB';
      }
      // ✊ 握拳 (必须没有捏合)
      else if (extendedCount === 0 && !isPinch) {
        currentGesture = 'FIST_CLOSED';
      }
      // ✋ 四指开但拇指收
      else if (extendedCount === 4 && !thumbExtended) {
        currentGesture = 'OPEN_NO_THUMB';
      }

      // --- 粘性防抖逻辑 ---
      if (currentGesture === this.gesture.name) {
        // 匹配成功，增加信心 (OK加得快一点)
        const increment = currentGesture === 'OK' ? 30 : 20;
        this.gesture.confidence = Math.min(this.gesture.confidence + increment, 100);
      } else {
        // 不匹配，减少信心
        this.gesture.confidence = Math.max(this.gesture.confidence - 20, 0);
        // 信心归零才切换状态
        if (this.gesture.confidence === 0) {
          this.gesture.name = currentGesture;
          this.gesture.confidence = 10; // 初始信心
        }
      }

      // 触发业务逻辑 (阈值设为 75)
      if (this.gesture.confidence > 75) {
        this.handleLogic(this.gesture.name, lm, now);
      }
    },

    handleLogic(gesture, lm, now) {
      const center = lm[9]; 
      const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
      
      // 【优化】只有在非离散手势下才更新位置
      // 防止做 OK/点赞手势时，手指运动导致画面坐标乱飘
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