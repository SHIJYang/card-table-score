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

    // 交互参数
    interaction: {
      rotationFactor: 0,    
      scaleFactor: 1.0,     
      handPos: { x: 0.5, y: 0.5 } 
    },

    // 事件触发器
    trigger: {
      mode: null,           
      theme: null,          
      letter: null,         
      timestamp: 0          
    },
    
    // 内部防抖与计时器
    lastThemeSwitchTime: 0,
    lastLetterTime: 0,
    okGestureStartTime: 0, // 新增：用于记录OK手势持续时间
  }),

  actions: {
    async toggleCamera(videoElement) {
      if (this.isCameraOpen) this.stopCamera();
      else await this.startCamera(videoElement);
    },

    async startCamera(videoElement) {
      this.isLoading = true;
      try {
        const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm');
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
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
          this.okGestureStartTime = 0; // 丢失目标时立即重置计时
          if (this.gesture.confidence > 0) {
              this.gesture.confidence = Math.max(0, this.gesture.confidence - 20);
          }
          this.interaction.rotationFactor *= 0.9;
        }
      }
    },

    // --- 核心手势算法 ---
    processGesture(lm, now) {
      const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
      const palmSize = dist(0, 9); 
      const isOpen = (tip, pip) => dist(0, tip) > dist(0, pip) * 1.2;
      
      const indexOpen = isOpen(8, 5);
      const middleOpen = isOpen(12, 9);
      const ringOpen = isOpen(16, 13);
      const pinkyOpen = isOpen(20, 17);

      // 拇指逻辑
      const thumbOut = dist(4, 17) > palmSize * 1.1; 

      // 优化1：更严格的 OK 判定几何逻辑
      // 捏合距离从 0.5 缩小到 0.35；同时增加中指/无名指/小指必须“高于”指根的判定
      const isPinch = dist(4, 8) < palmSize * 0.35;
      const otherFingersUp = lm[12].y < lm[9].y && lm[16].y < lm[13].y && lm[20].y < lm[17].y;

      let currentGesture = 'UNKNOWN';

      if (isPinch && otherFingersUp && middleOpen && ringOpen && pinkyOpen) {
        currentGesture = 'OK'; 
      } else if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        currentGesture = 'POINTING'; 
      } else if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        currentGesture = thumbOut ? 'OPEN_FULL' : 'OPEN_NO_THUMB'; 
      } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        currentGesture = thumbOut ? 'FIST_THUMB' : 'FIST_CLOSED'; 
      }

      // 粘性防抖处理
      if (currentGesture === this.gesture.name) {
        this.gesture.confidence = Math.min(this.gesture.confidence + 15, 100);
      } else {
        this.gesture.confidence = Math.max(this.gesture.confidence - 20, 0);
        if (this.gesture.confidence === 0) {
          this.gesture.name = currentGesture;
        }
      }

      // 只有在置信度足够高时才执行逻辑
      if (this.gesture.confidence > 60) {
        this.handleLogic(this.gesture.name, lm, now);
      }
    },

    handleLogic(gesture, lm, now) {
      const center = lm[9]; 
      const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
      this.interaction.handPos.x = lerp(this.interaction.handPos.x, center.x, 0.2);
      this.interaction.handPos.y = lerp(this.interaction.handPos.y, center.y, 0.2);

      // 1. 👊 圣诞树
      if (gesture === 'FIST_CLOSED') {
        this.triggerEvent('mode', 'tree');
      }

      // 2. 👊 + 拇指 -> 切换颜色
      else if (gesture === 'FIST_THUMB') {
        this.trySwitchTheme(now);
      }

      // 3. 🖐 全开 -> 旋转/缩放
      else if (gesture === 'OPEN_FULL') {
        this.triggerEvent('mode', 'scatter');
        let rotRaw = (0.5 - this.interaction.handPos.x) * 4.0;
        if (Math.abs(rotRaw) < 0.2) rotRaw = 0; 
        this.interaction.rotationFactor = rotRaw;
        const targetScale = 1.6 - this.interaction.handPos.y; 
        this.interaction.scaleFactor += (targetScale - this.interaction.scaleFactor) * 0.1;
      }

      // 4. 👉 指向
      else if (gesture === 'POINTING') {
        this.triggerEvent('mode', 'zoom');
      }

      // 5. 👌 书信告白 (优化重点：增加持续时间验证)
      else if (gesture === 'OK') {
        // 要求高置信度且没有切换手势
        if (this.gesture.confidence > 85) {
          // 如果是刚开始识别到OK，记录起始时间
          if (this.okGestureStartTime === 0) {
            this.okGestureStartTime = now;
          }
          // 持续时间必须超过 800ms 且 冷却时间已过
          if (now - this.okGestureStartTime > 800) {
            if (now - this.lastLetterTime > 4000) {
              this.triggerEvent('letter', true);
              this.lastLetterTime = now;
            }
          }
        } else {
          this.okGestureStartTime = 0;
        }
      } 
      else {
        // 如果当前识别的不是OK手势，立即重置计时器
        this.okGestureStartTime = 0;
      }
    },

    trySwitchTheme(now) {
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