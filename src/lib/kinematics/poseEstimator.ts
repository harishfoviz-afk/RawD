// src/lib/kinematics/poseEstimator.ts
import { PoseFrame } from "./kinematics";

// Lazy-load MediaPipe Pose Landmarker from CDN to ensure zero-dependency local build
export class MediaPipePoseEstimator {
  private poseLandmarker: any = null;
  private isLoaded = false;

  async init(): Promise<boolean> {
    if (this.isLoaded) return true;

    try {
      // Import the MediaPipe Tasks Vision files dynamically in the browser
      const vision = await import("@mediapipe/tasks-vision");
      const { FilesetResolver, PoseLandmarker } = vision;

      const visionFiles = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(visionFiles, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize MediaPipe Pose Landmarker:", error);
      return false;
    }
  }

  // Processes a HTMLVideoElement and returns a list of PoseFrame objects
  // analyzes the video at intervals (e.g. 5 frames per second or full 30fps)
  async analyzeVideo(
    videoElement: HTMLVideoElement,
    onProgress?: (progress: number) => void
  ): Promise<PoseFrame[]> {
    if (!this.isLoaded || !this.poseLandmarker) {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error("MediaPipe Pose Landmarker is not initialized.");
      }
    }

    const duration = videoElement.duration || 10;
    const frames: PoseFrame[] = [];
    
    // Configure analysis: analyze frames at 100ms intervals (10 fps) to balance accuracy and browser speed
    const interval = 0.1; // 100ms
    let currentTime = 0;

    // Save the original playback state of the video
    const originalTime = videoElement.currentTime;
    const isPaused = videoElement.paused;

    // Pause video for processing
    videoElement.pause();

    while (currentTime <= duration) {
      videoElement.currentTime = currentTime;
      
      // Wait for the video frame to seek/buffer
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoElement.removeEventListener("seeked", onSeeked);
          resolve();
        };
        videoElement.addEventListener("seeked", onSeeked);
      });

      // Run MediaPipe Pose prediction on the current video frame
      // Timestamp must be in milliseconds for MediaPipe Pose
      const result = this.poseLandmarker.detectForVideo(videoElement, currentTime * 1000);
      
      if (result && result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0]; // Take first detected pose
        
        // Map to our Landmark type
        const landmarks = rawLandmarks.map((lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility || 1.0,
        }));

        frames.push({
          timestamp: currentTime,
          landmarks,
        });
      }

      currentTime += interval;
      
      if (onProgress) {
        onProgress(Math.min(99, Math.round((currentTime / duration) * 100)));
      }
    }

    // Restore video state
    videoElement.currentTime = originalTime;
    if (!isPaused) {
      videoElement.play().catch(() => {});
    }

    if (onProgress) {
      onProgress(100);
    }

    return frames;
  }
}
export const poseEstimator = new MediaPipePoseEstimator();
