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
    
    // ✅ 正确：状态定义在这里 
    gestureHistory: [],
    
    verticalFactor: 0, // 垂直高度因子 (-1.0 ~ 1.0)
    isMagicMode: false // 是否开启高光模式
  }),

  actions: {
    // --- 初始化与开关 ---
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
            minHandDetectionConfidence: 0.6,
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
      
      // 清理历史记录
      this.gestureHistory = [];

      cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    },

    // --- 核心循环 ---
    predictLoop(videoElement) {
      if (!this.isCameraOpen || !videoElement) return;
      
      rafId = requestAnimationFrame(() => this.predictLoop(videoElement));

      const now = performance.now();
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
          
          // 2. 状态去抖动
          this.updateStableGesture(rawGesture);
          
          // 3. 更新业务逻辑
          this.updateLogic(this.gesture.stable, landmarks);
          
        } else {
          this.isHandDetected = false;
          this.gesture.current = 'NONE';
          this.gesture.progress = Math.max(0, this.gesture.progress - 10);
          this.rotationFactor = this.lerp(this.rotationFactor, 0, 0.2);
        }
      }
    },

    // --- 防抖函数 ---
    updateStableGesture(rawGesture) {
      this.gestureHistory.push(rawGesture);
      if (this.gestureHistory.length > 6) {
        this.gestureHistory.shift();
      }

      const isStable = this.gestureHistory.length >= 4 && 
                       this.gestureHistory.every(g => g === rawGesture);

      if (isStable && rawGesture !== this.gesture.stable) {
        this.gesture.stable = rawGesture;
      }
    },

    // --- 几何计算 ---
    analyzeGeometry(lm) {
      const isFingerBent = (base, mid, tip) => {
        const distTip = Math.hypot(lm[tip].x - lm[0].x, lm[tip].y - lm[0].y);
        const distMid = Math.hypot(lm[mid].x - lm[0].x, lm[mid].y - lm[0].y);
        return distTip < distMid; 
      };

      const isThumbBent = () => {
        const dist = Math.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y);
        return dist < 0.15; 
      };

      const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
      if (pinchDist < 0.06) return 'GRAB';

      const indexBent = isFingerBent(5, 6, 8);
      const middleBent = isFingerBent(9, 10, 12);
      const ringBent = isFingerBent(13, 14, 16);
      const pinkyBent = isFingerBent(17, 18, 20);

      let bentCount = 0;
      if (indexBent) bentCount++;
      if (middleBent) bentCount++;
      if (ringBent) bentCount++;
      if (pinkyBent) bentCount++;

      // VICTORY (✌️)
      if (!indexBent && !middleBent && ringBent && pinkyBent) return 'VICTORY';

      // POINTING (☝️)
      if (!indexBent && middleBent && ringBent && pinkyBent) return 'POINTING';

      // FIST (✊)
      if (bentCount >= 3) return 'FIST'; 

      // OPEN (🖐️)
      if (bentCount <= 1 && !isThumbBent()) return 'OPEN'; 

      return 'UNKNOWN'; 
    },

    // --- 业务逻辑更新 ---
    updateLogic(gesture, landmarks) {
      let targetAction = null;
      if (gesture === 'FIST') targetAction = 'tree';
      if (gesture === 'OPEN') targetAction = 'scatter';
      if (gesture === 'GRAB') targetAction = 'zoom';

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

      // 旋转 (OPEN)
      let targetRotation = 0;
      if (gesture === 'OPEN') {
        const wristX = landmarks[0].x; 
        if (wristX < 0.35) targetRotation = (0.35 - wristX) * 6.0; 
        else if (wristX > 0.65) targetRotation = (0.65 - wristX) * 6.0;
      }
      this.rotationFactor = this.lerp(this.rotationFactor, targetRotation, 0.1);

      // 升降 (POINTING)
      let targetVertical = 0;
      if (gesture === 'POINTING') {
        const wristY = landmarks[0].y;
        if (wristY < 0.4) {
          targetVertical = (0.4 - wristY) * 3.0;
        } else if (wristY > 0.6) {
          targetVertical = -(wristY - 0.6) * 3.0;
        }
      }
      this.verticalFactor = this.lerp(this.verticalFactor || 0, targetVertical, 0.1);

      // 魔法 (VICTORY)
      this.isMagicMode = (gesture === 'VICTORY');
    },

    lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
    }
  }
});