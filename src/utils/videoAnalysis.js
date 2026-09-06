import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * GrabIt Video Analysis Engine
 * Uses MediaPipe for real-time facial landmarking and eye tracking.
 */
class VideoAnalysisEngine {
  constructor() {
    this.faceLandmarker = null;
    this.isLoaded = false;
  }

  async init() {
    if (this.isLoaded) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });

      this.isLoaded = true;
      console.log("[VideoAnalysis] MediaPipe Face Landmarker loaded successfully.");
    } catch (error) {
      console.error("[VideoAnalysis] Failed to load MediaPipe:", error);
    }
  }

  /**
   * Process a single video frame and return behavioral metrics.
   */
  async analyzeFrame(videoElement, timestamp) {
    if (!this.isLoaded || !this.faceLandmarker) return null;

    const result = this.faceLandmarker.detectForVideo(videoElement, timestamp);
    
    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      const landmarks = result.faceLandmarks[0];
      const blendshapes = result.faceBlendshapes[0]?.categories || [];

      // 1. Eye Contact Analysis (Simplified)
      // Check if iris landmarks are centered
      const leftIris = landmarks[468]; // Simplified iris index
      const rightIris = landmarks[473];
      
      // Calculate head rotation (yaw/pitch) based on nose and ears
      // For now, we'll use a simplified confidence score based on blendshapes
      const eyeLookInLeft = blendshapes.find(b => b.categoryName === "eyeLookInLeft")?.score || 0;
      const eyeLookInRight = blendshapes.find(b => b.categoryName === "eyeLookInRight")?.score || 0;
      const eyeLookOutLeft = blendshapes.find(b => b.categoryName === "eyeLookOutLeft")?.score || 0;
      const eyeLookOutRight = blendshapes.find(b => b.categoryName === "eyeLookOutRight")?.score || 0;

      // Higher "Look In/Out" scores mean the user is looking away
      const eyeContactScore = Math.max(0, 100 - (eyeLookInLeft + eyeLookInRight + eyeLookOutLeft + eyeLookOutRight) * 150);

      // 2. Emotional Stability (Blink frequency and Brow movement)
      const eyeBlinkLeft = blendshapes.find(b => b.categoryName === "eyeBlinkLeft")?.score || 0;
      const eyeBlinkRight = blendshapes.find(b => b.categoryName === "eyeBlinkRight")?.score || 0;
      const browDownLeft = blendshapes.find(b => b.categoryName === "browDownLeft")?.score || 0;
      const browDownRight = blendshapes.find(b => b.categoryName === "browDownRight")?.score || 0;

      const nervousnessScore = (eyeBlinkLeft + eyeBlinkRight + browDownLeft + browDownRight) * 25;
      const stabilityScore = Math.max(0, 100 - nervousnessScore);

      // 3. Confidence (Jaw open, smiling, etc.)
      const jawOpen = blendshapes.find(b => b.categoryName === "jawOpen")?.score || 0;
      const smile = blendshapes.find(b => b.categoryName === "mouthSmileLeft")?.score || 0;
      const confidenceScore = 60 + (smile * 40) - (jawOpen * 20);

      return {
        eyeContact: Math.min(100, Math.round(eyeContactScore)),
        stability: Math.min(100, Math.round(stabilityScore)),
        confidence: Math.min(100, Math.round(confidenceScore)),
        landmarks: landmarks // For optional debug rendering
      };
    }

    return {
      eyeContact: 0,
      stability: 0,
      confidence: 0,
      noFaceDetected: true
    };
  }
}

export const videoEngine = new VideoAnalysisEngine();
