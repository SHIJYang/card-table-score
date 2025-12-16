import { defineStore } from 'pinia';

// 避免 Vue 代理这些复杂对象
let handLandmarker = null;
let rafId = null;
let stream = null;
let lastVideoTime = -1;
let lastProcessTime = 0; // 用于控制检测帧率

export const useCameraStore = defineStore('camera', {
  state: () => ({
    isCameraOpen: false,
    isLoading: false,
    isHandDetected: false,
    error: null,
    
    gesture: {
      current: 'NONE',    // 实时计算结果
      stable: 'NONE',     // 去抖动后的稳定结果
      progress: 0,        // 触发进度 0-100
    },

    actionTrigger: null,   
    rotationFactor: 0,     

    verticalFactor: 0, // 垂直高度因子 (-1.0 ~ 1.0)
    isMagicMode: false // 是否开启高光模式
  }),

  actions: {
    // --- 初始化与开关 (保持不变，略) ---
    async toggleCamera(videoElement) {
      if (this.isCameraOpen) this.stopCamera();
      else await this.startCamera(videoElement);
    },

    async startCamera(videoElement) {
      this.isLoading = true;
      try {
        if (!handLandmarker) {
          const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm');
          const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.6, // 提高置信度阈值，减少误检
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.6
          });
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: { ideal: 30 } } 
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
        console.error("Camera Error:", err);
        this.error = "无法启动摄像头";
        this.isCameraOpen = false;
        this.isLoading = false;
      }
    },

    stopCamera() {
      this.isCameraOpen = false;
      this.isHandDetected = false;
      this.gesture.progress = 0;
      
      // 重置所有控制因子
      this.rotationFactor = 0;
      this.verticalFactor = 0; 
      this.isMagicMode = false;
      
      cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    },

    // --- 核心循环 (优化：添加节流) ---
    predictLoop(videoElement) {
      if (!this.isCameraOpen || !videoElement) return;
      
      rafId = requestAnimationFrame(() => this.predictLoop(videoElement));

      const now = performance.now();
      // 限制检测帧率到 15-20fps 节省性能，同时足够流畅
      if (now - lastProcessTime < 50) return; 
      lastProcessTime = now;

      if (videoElement.currentTime === lastVideoTime) return;
      lastVideoTime = videoElement.currentTime;

      if (handLandmarker) {
        const results = handLandmarker.detectForVideo(videoElement, now);

        if (results.landmarks && results.landmarks.length > 0) {
          this.isHandDetected = true;
          const landmarks = results.landmarks[0];
          
          // 1. 分析手势
          const rawGesture = this.analyzeGeometry(landmarks);
          
          // 2. 状态去抖动 (防止 FIST/OPEN 快速跳变)
          this.updateStableGesture(rawGesture);
          
          // 3. 更新业务逻辑
          this.updateLogic(this.gesture.stable, landmarks);
          
        } else {
          // 手移出画面时，平滑归零
          this.isHandDetected = false;
          this.gesture.current = 'NONE';
          this.gesture.progress = Math.max(0, this.gesture.progress - 10);
          this.rotationFactor = this.lerp(this.rotationFactor, 0, 0.2);
        }
      }
    },

    // --- 增强版几何计算 (基于手指弯曲度) ---
    analyzeGeometry(lm) {
      // 内部辅助函数：判断手指是否弯曲
      const isFingerBent = (base, mid, tip) => {
        const distTip = Math.hypot(lm[tip].x - lm[0].x, lm[tip].y - lm[0].y);
        const distMid = Math.hypot(lm[mid].x - lm[0].x, lm[mid].y - lm[0].y);
        return distTip < distMid; 
      };

      // 内部辅助函数：判断拇指是否弯曲
      const isThumbBent = () => {
        const dist = Math.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y);
        return dist < 0.15; 
      };

      // 1. GRAB (Pinch) - 优先级最高
      const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
      if (pinchDist < 0.06) return 'GRAB';

      // 2. 统计弯曲手指 (排除拇指)
      // Index(8), Middle(12), Ring(16), Pinky(20)
      const indexBent = isFingerBent(5, 6, 8);
      const middleBent = isFingerBent(9, 10, 12);
      const ringBent = isFingerBent(13, 14, 16);
      const pinkyBent = isFingerBent(17, 18, 20);

      let bentCount = 0;
      if (indexBent) bentCount++;
      if (middleBent) bentCount++;
      if (ringBent) bentCount++;
      if (pinkyBent) bentCount++;

      // === 新增手势判定 ===

      // VICTORY (✌️): 食指、中指伸直，无名指、小指弯曲
      if (!indexBent && !middleBent && ringBent && pinkyBent) {
        return 'VICTORY';
      }

      // POINTING (☝️): 仅食指伸直，其余三指弯曲
      if (!indexBent && middleBent && ringBent && pinkyBent) {
        return 'POINTING';
      }

      // FIST (✊): 3根以上手指弯曲
      if (bentCount >= 3) return 'FIST'; 

      // OPEN (🖐️): 1根以下弯曲且拇指张开
      if (bentCount <= 1 && !isThumbBent()) return 'OPEN'; 

      return 'UNKNOWN'; 
    },

    // --- 状态去抖动 (防抖) ---
    // 只有连续 N 帧识别为同一手势，才更新 stable 状态
    gestureHistory: [],
    updateLogic(gesture, landmarks) {
      let targetAction = null;
      if (gesture === 'FIST') targetAction = 'tree';
      if (gesture === 'OPEN') targetAction = 'scatter';
      if (gesture === 'GRAB') targetAction = 'zoom';

      // 1. 进度条与动作触发 (保持原有逻辑)
      const isRepeat = targetAction === this.gesture.lastConfirmed && targetAction !== 'zoom';
      
      if (targetAction && !isRepeat) {
         this.gesture.progress = Math.min(this.gesture.progress + 5, 100);
      } else {
         this.gesture.progress = Math.max(this.gesture.progress - 8, 0);
      }

      if (this.gesture.progress >= 100) {
        this.actionTrigger = { type: targetAction, timestamp: Date.now() };
        this.gesture.lastConfirmed = targetAction;
        this.gesture.progress = 0; 
      }

      // 2. 旋转控制 (OPEN 状态)
      let targetRotation = 0;
      if (gesture === 'OPEN') {
        const wristX = landmarks[0].x; 
        if (wristX < 0.35) targetRotation = (0.35 - wristX) * 6.0; 
        else if (wristX > 0.65) targetRotation = (0.65 - wristX) * 6.0;
      }
      this.rotationFactor = this.lerp(this.rotationFactor, targetRotation, 0.1);

      // 3. === [新增] 垂直升降控制 (POINTING 状态) ===
      let targetVertical = 0;
      if (gesture === 'POINTING') {
        const wristY = landmarks[0].y; // 0顶部, 1底部
        // 设定死区 [0.4, 0.6]，在这个范围内不动
        if (wristY < 0.4) {
          targetVertical = (0.4 - wristY) * 3.0; // 向上
        } else if (wristY > 0.6) {
          targetVertical = -(wristY - 0.6) * 3.0; // 向下
        }
      }
      this.verticalFactor = this.lerp(this.verticalFactor || 0, targetVertical, 0.1);

      // 4. === [新增] 魔法高光 (VICTORY 状态) ===
      // 直接切换布尔值
      this.isMagicMode = (gesture === 'VICTORY');
    },

    lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
    }
  }
});