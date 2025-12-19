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
      confidence: 0,        // 确认置信度
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
    
    // 内部防抖计时器
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
      if (now - lastProcessTime < 33) return; 
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
          if (this.gesture.confidence > 0) {
             this.gesture.confidence = Math.max(0, this.gesture.confidence - 15);
          }
          this.interaction.rotationFactor *= 0.8; 
        }
      }
    },
    // --- 核心手势算法 (防抖优化版) ---
    processGesture(lm, now) {
      const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
      const palmSize = dist(0, 9); 

      // 1. 手指伸直判定优化：判断指尖到手腕距离 > 指关节到手腕距离
      const isExtended = (tip, pip) => dist(0, tip) > dist(0, pip) * 1.15;
      
      const f1 = isExtended(8, 6);  // 食指
      const f2 = isExtended(12, 10); // 中指
      const f3 = isExtended(16, 14); // 无名指
      const f4 = isExtended(20, 18); // 小指
      
      // 2. 拇指特殊判定
      // 拇指伸开：拇指尖距离小指根部较远
      const thumbExtended = dist(4, 17) > palmSize * 1.2;
      // 拇指向上：拇指尖的 Y 坐标明显高于所有指关节（在屏幕上 Y 越小越高）
      const thumbUp = lm[4].y < lm[3].y && lm[4].y < lm[5].y && !f1 && !f2 && !f3 && !f4;
      
      // 3. 核心计算：OK 判定（食指尖和拇指尖捏合）
      const isPinch = dist(4, 8) < palmSize * 0.3;

      // 4. 计算伸直手指的总数 (不含拇指)
      const extendedCount = [f1, f2, f3, f4].filter(Boolean).length;

      let currentGesture = 'UNKNOWN';

      // --- 手势状态机优化 ---
      
      // 👌 OK 手势：捏合且中、无、小指必须伸直 (极高区分度)
      if (isPinch && f2 && f3 && f4) {
        currentGesture = 'OK';
      } 
      // ✌️ 耶 / V手势：只有食指和中指伸直 (替代 POINTING，更稳定)
      else if (f1 && f2 && !f3 && !f4) {
        currentGesture = 'POINTING'; 
      }
      // 🖐 全张开：四指全开 + 拇指张开
      else if (extendedCount === 4 && thumbExtended) {
        currentGesture = 'OPEN_FULL';
      }
      // ✋ 四指开但拇指收：(替代 OPEN_NO_THUMB)
      else if (extendedCount === 4 && !thumbExtended) {
        currentGesture = 'OPEN_NO_THUMB';
      }
      // 👍 点赞手势：(替代 FIST_THUMB)
      else if (thumbUp) {
        currentGesture = 'FIST_THUMB';
      }
      // ✊ 握拳：所有手指都收起
      else if (extendedCount === 0 && !thumbExtended) {
        currentGesture = 'FIST_CLOSED';
      }

      // 5. 粘性防抖逻辑 (维持原样，确保平滑)
      if (currentGesture === this.gesture.name) {
        this.gesture.confidence = Math.min(this.gesture.confidence + 20, 100);
      } else {
        this.gesture.confidence = Math.max(this.gesture.confidence - 25, 0);
        if (this.gesture.confidence === 0) {
          this.gesture.name = currentGesture;
        }
      }

      // 6. 业务触发
      if (this.gesture.confidence > 70) {
        this.handleLogic(this.gesture.name, lm, now);
      }
    },

    handleLogic(gesture, lm, now) {
      const center = lm[9]; 
      const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
      
      this.interaction.handPos.x = lerp(this.interaction.handPos.x, center.x, 0.2);
      this.interaction.handPos.y = lerp(this.interaction.handPos.y, center.y, 0.2);

      switch (gesture) {
        case 'FIST_CLOSED': // 👊 圣诞树
          this.triggerEvent('mode', 'tree');
          break;

        case 'FIST_THUMB':  // 👍 切换颜色 (点赞触发，比拳头带拇指更明确)
          this.trySwitchTheme(now);
          break;

        case 'OPEN_FULL':   // 🖐 星云 & 操控
          this.triggerEvent('mode', 'scatter');
          // 增加死区
          let rotRaw = (0.5 - this.interaction.handPos.x) * 4.0;
          this.interaction.rotationFactor = Math.abs(rotRaw) < 0.25 ? 0 : rotRaw;
          
          const targetScale = 1.6 - this.interaction.handPos.y; 
          this.interaction.scaleFactor += (targetScale - this.interaction.scaleFactor) * 0.1;
          break;

        case 'POINTING':    // ✌️ 放大 (使用耶的手势，更不容易误触)
          this.triggerEvent('mode', 'zoom');
          break;

        case 'OK':          // 👌 告白
          if (this.gesture.confidence > 90) { // OK要求极高稳定性
            if (now - this.lastLetterTime > 3000) { 
              this.triggerEvent('letter', true);
              this.lastLetterTime = now;
            }
          }
          break;
          
        case 'OPEN_NO_THUMB': // ✋ 备选切换
          this.trySwitchTheme(now);
          break;
      }
    },

    trySwitchTheme(now) {
      // 切换主题是突变操作，要求极高置信度 (防止从拳头变成张开过程中的中间态误触)
      if (this.gesture.confidence < 80) return;

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