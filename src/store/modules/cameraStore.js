import { defineStore } from 'pinia';

// 避免 Vue 代理这些复杂对象，提升性能
let handLandmarker = null;
let rafId = null;
let stream = null;
let lastVideoTime = -1;

export const useCameraStore = defineStore('camera', {
  state: () => ({
    isCameraOpen: false,
    isLoading: false,
    isHandDetected: false,
    error: null,
    
    // 手势状态
    gesture: {
      current: 'NONE',    // 当前帧识别到的手势
      lastConfirmed: 'NONE', // 稳定确认的手势
      progress: 0,        // 触发进度 0-100
    },

    // 控制信号
    actionTrigger: null,   // 当进度满100时，触发的动作 (例如: 'TREE', 'SCATTER', 'ZOOM')
    rotationFactor: 0,     // 旋转控制因子 (-1 到 1，用于控制场景旋转速度)
  }),

  actions: {
    // --- 初始化与开关 ---
    async toggleCamera(videoElement) {
      if (this.isCameraOpen) {
        this.stopCamera();
      } else {
        await this.startCamera(videoElement);
      }
    },

    async startCamera(videoElement) {
      this.isLoading = true;
      try {
        // 1. 加载模型 (单例模式)
        if (!handLandmarker) {
          const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm');
          const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
          
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
          });
        }

        // 2. 获取摄像头流
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
      this.rotationFactor = 0;

      cancelAnimationFrame(rafId);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    },

    // --- 核心识别循环 ---
    predictLoop(videoElement) {
      if (!this.isCameraOpen || !videoElement) return;
      
      rafId = requestAnimationFrame(() => this.predictLoop(videoElement));

      if (videoElement.currentTime === lastVideoTime) return;
      lastVideoTime = videoElement.currentTime;

      if (handLandmarker) {
        const startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(videoElement, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          this.isHandDetected = true;
          const landmarks = results.landmarks[0];
          
          // 分析具体手势
          const detectedGesture = this.analyzeGeometry(landmarks);
          this.gesture.current = detectedGesture;
          
          // 更新逻辑状态 (进度条、触发)
          this.updateLogic(detectedGesture, landmarks);
          
        } else {
          this.isHandDetected = false;
          this.gesture.progress = 0;
          this.rotationFactor = 0;
        }
      }
    },

    // --- 几何计算 ---
    analyzeGeometry(landmarks) {
      const calcDist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
      
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]; 

      // 1. 抓取 (Pinch)
      if (calcDist(thumbTip, indexTip) < 0.05) return 'GRAB';

      // 2. 张开/握拳
      let totalDist = 0;
      tips.forEach(tip => totalDist += calcDist(tip, wrist));
      const avgDist = totalDist / 4;

      if (avgDist < 0.28) return 'FIST';
      if (avgDist > 0.35) return 'OPEN';

      return 'UNKNOWN';
    },

    // --- 业务逻辑更新 ---
    updateLogic(gesture, landmarks) {
      // 1. 映射手势到目标动作
      let targetAction = null;
      // 注意：这里需要知道当前的模式来防止重复触发，
      // 但为了解耦，Store 只负责抛出意图，组件负责决定是否执行。
      // Store 仅负责“防抖”和“进度条”。
      
      if (gesture === 'FIST') targetAction = 'tree';     // 对应 STATE_KEYS.TREE
      if (gesture === 'OPEN') targetAction = 'scatter';  // 对应 STATE_KEYS.SCATTER
      if (gesture === 'GRAB') targetAction = 'zoom';     // 对应 STATE_KEYS.ZOOM

      // 2. 进度条逻辑
      if (targetAction && targetAction !== this.gesture.lastConfirmed) {
         // 如果是 GRAB，或者是一个新的意图，增加进度
         this.gesture.progress = Math.min(this.gesture.progress + 4, 100);
      } else {
         // 衰减
         this.gesture.progress = Math.max(this.gesture.progress - 10, 0);
      }

      // 3. 触发动作
      if (this.gesture.progress >= 100) {
        this.actionTrigger = { type: targetAction, timestamp: Date.now() }; // 使用对象确保 watch 能监听到变化
        this.gesture.lastConfirmed = targetAction; // 锁定当前状态防止重复触发
        this.gesture.progress = 0;
      }

      // 4. 旋转控制 (当手势为 OPEN 时，根据手腕 X 坐标控制旋转)
      if (gesture === 'OPEN') {
        const wristX = landmarks[0].x; 
        // 归一化：中心 0.5。 <0.4 左转, >0.6 右转
        if (wristX < 0.4) {
          this.rotationFactor = (0.4 - wristX) * 5.0; // 正值
        } else if (wristX > 0.6) {
          this.rotationFactor = (0.6 - wristX) * 5.0; // 负值
        } else {
          this.rotationFactor = 0;
        }
      } else {
        this.rotationFactor = 0;
      }
    }
  }
});