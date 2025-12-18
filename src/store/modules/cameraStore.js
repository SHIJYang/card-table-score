import { defineStore } from 'pinia';

// 外部变量
let handLandmarker = null;
let rafId = null;
let stream = null;
let lastVideoTime = -1;
let lastProcessTime = 0;

export const useCameraStore = defineStore('camera', {
  state: () => ({
    isCameraOpen: false,
    isLoading: false,
    isHandDetected: false,
    error: null,
    
    gesture: {
      current: 'NONE',    // 原始结果
      stable: 'NONE',     // 稳定结果
      progress: 0,        // 触发进度 0-100
      lastConfirmed: null // 上一次触发的动作，防止重复触发
    },

    actionTrigger: null,   // 单次动作触发器 (如切换模式)
    rotationFactor: 0,     // 实时交互 (旋转)
    verticalFactor: 0,     // 实时交互 (升降)
    isMagicMode: false     // 实时交互 (特效)
  }),

  actions: {
    // --- 初始化 (保持不变) ---
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
            // 优化 1: 稍微降低置信度阈值，减少因光线波动导致的丢帧，提升流畅度
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ 
          // 优化 2: 保持低分辨率以获得极高的处理速度
          video: { width: 320, height: 240, frameRate: { ideal: 60 } } 
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
      this.verticalFactor = 0; 
      this.isMagicMode = false;
      this._gestureHistory = []; // 使用局部变量存储历史，不放入 state
      cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    },

    // --- 核心循环 (优化重点) ---
    predictLoop(videoElement) {
      if (!this.isCameraOpen || !videoElement) return;
      
      rafId = requestAnimationFrame(() => this.predictLoop(videoElement));

      const now = performance.now();
      // 优化 3: 提升 FPS 限制。
      // 33ms ≈ 30 FPS。原 50ms(20FPS) 太卡顿，30FPS 是流畅交互的底线。
      if (now - lastProcessTime < 32) return; 
      lastProcessTime = now;

      if (videoElement.currentTime === lastVideoTime) return;
      lastVideoTime = videoElement.currentTime;

      if (handLandmarker) {
        const results = handLandmarker.detectForVideo(videoElement, now);

        if (results.landmarks && results.landmarks.length > 0) {
          this.isHandDetected = true;
          const landmarks = results.landmarks[0];
          
          // 1. 分析原始手势
          const rawGesture = this.analyzeGeometry(landmarks);
          this.gesture.current = rawGesture; // 更新 UI 显示用
          
          // 2. 状态去抖动 (计算 stable)
          this.updateStableGesture(rawGesture);
          
          // 3. 更新逻辑
          // 关键优化: 
          // - 动作触发 (Trigger) 使用去抖后的 gesture.stable (防误触)
          // - 连续交互 (Rotation/Vertical) 直接使用 rawGesture (零延迟)
          this.updateLogic(rawGesture, this.gesture.stable, landmarks);
          
        } else {
          this.handleLostTracking();
        }
      }
    },

    handleLostTracking() {
      this.isHandDetected = false;
      this.gesture.current = 'NONE';
      // 丢失时快速回退进度
      this.gesture.progress = Math.max(0, this.gesture.progress - 20);
      // 平滑归零交互参数
      this.rotationFactor = this.lerp(this.rotationFactor, 0, 0.1);
      this.verticalFactor = this.lerp(this.verticalFactor, 0, 0.1);
    },

    // --- 防抖函数 (优化重点) ---
    _gestureHistory: [], // 移出 state 提升性能
    
    updateStableGesture(rawGesture) {
      this._gestureHistory.push(rawGesture);
      // 优化 4: 缩短历史队列。
      // 原 6 帧 -> 改为 3 帧。在 30FPS 下，这意味着仅需 100ms 确认手势，响应极快。
      if (this._gestureHistory.length > 3) {
        this._gestureHistory.shift();
      }

      // 宽松策略: 只要最近 3 帧里有 2 帧是一样的，就认为是稳定态
      // 或者保持严格策略但队列短：3 帧全一致
      const isStable = this._gestureHistory.length >= 3 && 
                       this._gestureHistory.every(g => g === rawGesture);

      if (isStable && rawGesture !== this.gesture.stable) {
        this.gesture.stable = rawGesture;
      }
    },

    // --- 几何计算 (保持不变，逻辑准确) ---
    analyzeGeometry(lm) {
      // (保持原来的 analyzeGeometry 代码逻辑不变)
      const isFingerBent = (base, mid, tip) => {
        const distTip = Math.hypot(lm[tip].x - lm[0].x, lm[tip].y - lm[0].y);
        const distMid = Math.hypot(lm[mid].x - lm[0].x, lm[mid].y - lm[0].y);
        return distTip < distMid; 
      };
      const isThumbBent = () => Math.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y) < 0.15;
      const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

      if (pinchDist < 0.06) return 'GRAB'; // 抓取/捏合
      
      const bentState = [
        isFingerBent(5, 6, 8),   // Index
        isFingerBent(9, 10, 12), // Middle
        isFingerBent(13, 14, 16),// Ring
        isFingerBent(17, 18, 20) // Pinky
      ];
      const bentCount = bentState.filter(b => b).length;

      if (!bentState[0] && !bentState[1] && bentState[2] && bentState[3]) return 'VICTORY';
      if (!bentState[0] && bentState[1] && bentState[2] && bentState[3]) return 'POINTING';
      if (bentCount >= 3) return 'FIST'; 
      if (bentCount <= 1 && !isThumbBent()) return 'OPEN'; 

      return 'UNKNOWN'; 
    },

    // --- 业务逻辑更新 (优化重点) ---
    updateLogic(rawGesture, stableGesture, landmarks) {
      // Part A: 模式切换 (Action Trigger)
      // 使用 stableGesture 确保不会乱跳模式
      let targetAction = null;
      if (stableGesture === 'FIST') targetAction = 'tree';
      if (stableGesture === 'OPEN') targetAction = 'scatter';
      if (stableGesture === 'GRAB') targetAction = 'zoom';

      const isRepeat = targetAction === this.gesture.lastConfirmed && targetAction !== 'zoom';
      
      if (targetAction && !isRepeat) {
         // 优化 5: 大幅提升进度增量。
         // +5 (需20帧) -> +20 (仅需5帧)。
         // 在 30FPS 下，约 160ms 即可触发动作，感觉非常“跟手”。
         this.gesture.progress = Math.min(this.gesture.progress + 20, 100);
      } else {
         // 快速衰减
         this.gesture.progress = Math.max(this.gesture.progress - 10, 0);
      }

      if (this.gesture.progress >= 100) {
        this.actionTrigger = { type: targetAction, timestamp: Date.now() };
        this.gesture.lastConfirmed = targetAction;
        this.gesture.progress = 0; 
      }

      // Part B: 连续交互 (Rotation / Vertical / Magic)
      // 优化 6: 这里的判定直接使用 rawGesture (原始手势)。
      // 不需要等待 stableGesture 确认。例如：只要手掌张开，马上开始旋转，不要等防抖。
      // 配合 lerp 插值，画面会很丝滑且响应即时。
      
      // 旋转 (基于 OPEN)
      let targetRotation = 0;
      if (rawGesture === 'OPEN' || rawGesture === 'SCATTER') { // 容错
        const wristX = landmarks[0].x; 
        // 增加死区，防止手在中间微动时画面乱晃
        if (wristX < 0.4) targetRotation = (0.4 - wristX) * 5.0; 
        else if (wristX > 0.6) targetRotation = (0.6 - wristX) * 5.0;
      }
      // 稍微调大 lerp 系数 (0.1 -> 0.15) 让跟随更紧密
      this.rotationFactor = this.lerp(this.rotationFactor, targetRotation, 0.15);

      // 升降 (基于 POINTING)
      let targetVertical = 0;
      if (rawGesture === 'POINTING') {
        const wristY = landmarks[0].y;
        if (wristY < 0.4) targetVertical = (0.4 - wristY) * 3.0;
        else if (wristY > 0.6) targetVertical = -(wristY - 0.6) * 3.0;
      }
      this.verticalFactor = this.lerp(this.verticalFactor, targetVertical, 0.15);

      // 魔法 (基于 VICTORY) - 瞬时反馈
      this.isMagicMode = (rawGesture === 'VICTORY');
    },

    lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
    }
  }
});