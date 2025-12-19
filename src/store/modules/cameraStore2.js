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
      // 限制检测帧率为 30fps (每33ms一次)，节省性能
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
          // 丢失手势时，快速降低置信度，而不是立即重置，防止闪烁
          if (this.gesture.confidence > 0) {
             this.gesture.confidence = Math.max(0, this.gesture.confidence - 20);
          }
          // 缓慢复位交互参数
          this.interaction.rotationFactor *= 0.9;
        }
      }
    },

    // --- 核心手势算法 (防抖优化版) ---
    processGesture(lm, now) {
      // 1. 基础几何计算
      const dist = (i, j) => Math.hypot(lm[i].x - lm[j].x, lm[i].y - lm[j].y);
      const wrist = lm[0];
      
      // 手掌尺度基准 (手腕到中指根部)
      const palmSize = dist(0, 9); 

      // 2. 手指状态判定 (伸直/弯曲)
      const isOpen = (tip, pip) => dist(0, tip) > dist(0, pip) * 1.2;
      
      const indexOpen = isOpen(8, 5);
      const middleOpen = isOpen(12, 9);
      const ringOpen = isOpen(16, 13);
      const pinkyOpen = isOpen(20, 17);

      // 3. 拇指状态判定
      const thumbOut = dist(4, 17) > palmSize * 1.1; 
      const isPinch = dist(4, 8) < palmSize * 0.5;

      // 4. 手势分类
      let currentGesture = 'UNKNOWN';

      if (isPinch && middleOpen && ringOpen && pinkyOpen) {
        currentGesture = 'OK'; // 👌
      } else if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        currentGesture = 'POINTING'; // 👉
      } else if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        currentGesture = thumbOut ? 'OPEN_FULL' : 'OPEN_NO_THUMB'; 
      } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        currentGesture = thumbOut ? 'FIST_THUMB' : 'FIST_CLOSED'; 
      }

      // 5. 状态确认 (核心优化：粘性防抖)
      // 如果检测结果与当前记录一致，增加置信度（回血）
      if (currentGesture === this.gesture.name) {
        // 增加速度：+15 (快速确认)
        this.gesture.confidence = Math.min(this.gesture.confidence + 15, 100);
      } else {
        // 如果检测结果不一致，减少置信度（扣血）
        // 扣减速度：-20 (容忍约 5 帧的误检或过渡)
        this.gesture.confidence = Math.max(this.gesture.confidence - 20, 0);

        // 只有当置信度归零时，才正式切换手势名称
        if (this.gesture.confidence === 0) {
          this.gesture.name = currentGesture;
        }
      }

      // 6. 执行业务逻辑 (使用稳定后的 this.gesture.name，而非瞬时的 currentGesture)
      // 提高触发门槛：必须 > 60 才执行逻辑，防止手势切换过程中的误触
      if (this.gesture.confidence > 60) {
        this.handleLogic(this.gesture.name, lm, now);
      }
    },

    handleLogic(gesture, lm, now) {
      // 更新手掌中心用于旋转/缩放
      const center = lm[9]; 
      
      // 使用平滑插值更新手掌位置，减少画面抖动
      const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
      this.interaction.handPos.x = lerp(this.interaction.handPos.x, center.x, 0.2);
      this.interaction.handPos.y = lerp(this.interaction.handPos.y, center.y, 0.2);

      // 1. 👊 圣诞树形态
      if (gesture === 'FIST_CLOSED') {
        this.triggerEvent('mode', 'tree');
      }

      // 2. 👊 + 拇指伸出 -> 切换颜色
      else if (gesture === 'FIST_THUMB') {
        this.trySwitchTheme(now);
      }

      // 3. 🖐 星云形态
      else if (gesture === 'OPEN_FULL') {
        this.triggerEvent('mode', 'scatter');
        
        // 计算旋转
        // 增加死区 (Deadzone)，中间区域不旋转
        let rotRaw = (0.5 - this.interaction.handPos.x) * 4.0;
        if (Math.abs(rotRaw) < 0.2) rotRaw = 0; 
        this.interaction.rotationFactor = rotRaw;
        
        // 计算缩放
        const targetScale = 1.6 - this.interaction.handPos.y; 
        this.interaction.scaleFactor += (targetScale - this.interaction.scaleFactor) * 0.1;
      }

      // 4. 🖐 + 拇指收起 -> 备选切换
      else if (gesture === 'OPEN_NO_THUMB') {
        this.trySwitchTheme(now);
      }

      // 5. 👉 放大照片
      else if (gesture === 'POINTING') {
        this.triggerEvent('mode', 'zoom');
      }

      // 6. 👌 书信告白
      else if (gesture === 'OK') {
        // 要求更高的置信度才触发信件，防止误触
        if (this.gesture.confidence > 800) { 
            if (now - this.lastLetterTime > 3000) { 
                this.triggerEvent('letter', true);
                this.lastLetterTime = now;
            }
        }
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