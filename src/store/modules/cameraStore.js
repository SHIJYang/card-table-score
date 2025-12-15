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
      this.rotationFactor = 0;
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
      // 辅助函数：计算向量点积判断弯曲
      const isFingerBent = (base, mid, tip) => {
        // 简单做法：比较 (掌心->指尖距离) vs (掌心->指关节距离)
        // 0=Wrist, 0->tip < 0->mid 说明弯曲
        const distTip = Math.hypot(lm[tip].x - lm[0].x, lm[tip].y - lm[0].y);
        const distMid = Math.hypot(lm[mid].x - lm[0].x, lm[mid].y - lm[0].y);
        return distTip < distMid; 
      };

      // 拇指判断 (特殊逻辑)
      const isThumbBent = () => {
        // 比较拇指尖(4)与小指根(17)的距离
        const dist = Math.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y);
        return dist < 0.15; // 阈值需调试
      };

      // 1. 抓取 (Pinch) - 拇指尖(4)与食指尖(8)距离极近
      const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
      if (pinchDist < 0.06) return 'GRAB'; // 提高灵敏度

      // 2. 统计弯曲手指数量 (排除拇指)
      // Index(8), Middle(12), Ring(16), Pinky(20)
      // 对应的关节节点分别是 6, 10, 14, 18
      let bentCount = 0;
      if (isFingerBent(5, 6, 8)) bentCount++;
      if (isFingerBent(9, 10, 12)) bentCount++;
      if (isFingerBent(13, 14, 16)) bentCount++;
      if (isFingerBent(17, 18, 20)) bentCount++;

      // 3. 判定逻辑
      if (bentCount >= 3) return 'FIST'; // 3根以上手指弯曲即视为握拳
      if (bentCount <= 1 && !isThumbBent()) return 'OPEN'; // 1根以下弯曲且拇指张开

      return 'UNKNOWN'; // 过渡态
    },

    // --- 状态去抖动 (防抖) ---
    // 只有连续 N 帧识别为同一手势，才更新 stable 状态
    gestureHistory: [],
    updateStableGesture(rawGesture) {
      this.gesture.current = rawGesture;
      this.gestureHistory.push(rawGesture);
      if (this.gestureHistory.length > 5) this.gestureHistory.shift();

      // 检查最近 5 帧是否一致
      const allSame = this.gestureHistory.every(g => g === rawGesture);
      
      // 特殊情况：GRAB 需要立即响应，不需要防抖
      if (rawGesture === 'GRAB') {
        this.gesture.stable = 'GRAB';
      } else if (allSame && rawGesture !== 'UNKNOWN') {
        this.gesture.stable = rawGesture;
      }
      // 如果是 UNKNOWN 或 状态不一致，保持上一次的 stable 状态不变，或者设为 NONE
    },

    // --- 业务逻辑更新 ---
    updateLogic(gesture, landmarks) {
      let targetAction = null;
      if (gesture === 'FIST') targetAction = 'tree';
      if (gesture === 'OPEN') targetAction = 'scatter';
      if (gesture === 'GRAB') targetAction = 'zoom';

      // 1. 进度条逻辑 (平滑增减)
      // 防止重复触发同一动作 (除非是 ZOOM/GRAB，通常允许连续微调)
      // 这里添加逻辑：如果已经触发过该动作，且不是 ZOOM，则不再增加进度
      const isRepeat = targetAction === this.gesture.lastConfirmed && targetAction !== 'zoom';
      
      if (targetAction && !isRepeat) {
         this.gesture.progress = Math.min(this.gesture.progress + 5, 100); // 加快触发速度
      } else {
         this.gesture.progress = Math.max(this.gesture.progress - 8, 0);   // 快速衰减
      }

      // 2. 触发动作
      if (this.gesture.progress >= 100) {
        // 只有当 actionTrigger 改变或者需要强制触发时
        this.actionTrigger = { type: targetAction, timestamp: Date.now() };
        this.gesture.lastConfirmed = targetAction;
        
        // 触发后不立即归零，保持满状态给用户反馈，直到手势变化
        // 这里选择立即归零，让 UI 显示一次完成动画
        this.gesture.progress = 0; 
      }

      // 3. 旋转控制 (平滑处理)
      let targetRotation = 0;
      if (gesture === 'OPEN') {
        const wristX = landmarks[0].x; 
        // 增加死区 (Deadzone)，中间区域不旋转
        if (wristX < 0.35) {
          targetRotation = (0.35 - wristX) * 6.0; 
        } else if (wristX > 0.65) {
          targetRotation = (0.65 - wristX) * 6.0;
        }
      }
      
      // 使用 Lerp (线性插值) 让旋转速度变化更平滑，避免突然停止
      this.rotationFactor = this.lerp(this.rotationFactor, targetRotation, 0.1);
    },

    // 辅助工具：线性插值
    lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
    }
  }
});