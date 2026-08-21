import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaceLandmarker,
  ObjectDetector,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { averageEAR, computeMAR, computeFaceVisibility, computeEyeGaze } from '@/lib/landmarks';
import { logSessionReport, type SessionEvent } from '@/lib/storage';
import { getSession } from '@/lib/auth';
import { startAlarm, stopAlarm, speak, resumeAudio } from '@/lib/audio';

export type DriverStatus = 'awake' | 'drowsy' | 'yawning' | 'no-face' | 'obscured' | 'distracted';

export type DetectionSettings = {
  earThreshold: number;
  closedFrameLimit: number;
  severeFrameLimit: number;
  marThreshold: number;
  yawnFrameLimit: number;
  alarmEnabled: boolean;
  voiceEnabled: boolean;
};

export type DetectionState = {
  status: DriverStatus;
  ear: number;
  mar: number;
  closedFrames: number;
  yawnFrames: number;
  faceDetected: boolean;
  isObscured: boolean;
};

export type SessionStats = {
  drowsyCount: number;
  severeCount: number;
  yawnCount: number;
  totalFrames: number;
  obscuredCount: number;
  distractedCount: number;
  startTime: number | null;
};

const DEFAULT_SETTINGS: DetectionSettings = {
  earThreshold: 0.22,
  closedFrameLimit: 20,
  severeFrameLimit: 40,
  marThreshold: 0.6,
  yawnFrameLimit: 15,
  obscuredFrameLimit: 15,
  alarmEnabled: true,
  voiceEnabled: true,
};

const DEFAULT_STATE: DetectionState = {
  status: 'no-face',
  ear: 0,
  mar: 0,
  closedFrames: 0,
  yawnFrames: 0,
  faceDetected: false,
  isObscured: false,
};

const DEFAULT_STATS: SessionStats = {
  drowsyCount: 0,
  severeCount: 0,
  yawnCount: 0,
  obscuredCount: 0,
  distractedCount: 0,
  totalFrames: 0,
  startTime: null,
};

export function useDrowsinessDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
) {
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<DetectionState>(DEFAULT_STATE);
  const [stats, setStats] = useState<SessionStats>(DEFAULT_STATS);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const streamRef = useRef<MediaStream | null>(null);

  // Mutable refs for loop logic so the animation frame closure stays fresh.
  const closedFramesRef = useRef(0);
  const yawnFramesRef = useRef(0);
  const obscuredFramesRef = useRef(0);
  const distractedFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>('');
  const alarmActiveRef = useRef(false);
  const settingsRef = useRef(settings);
  const isRunningRef = useRef(false);
  const loggedSevereRef = useRef(false);
  const statsRef = useRef<SessionStats>(DEFAULT_STATS);
  
  const drowsyCountRef = useRef(0);
  const severeCountRef = useRef(0);
  const yawnCountRef = useRef(0);
  const obscuredCountRef = useRef(0);
  const distractedCountRef = useRef(0);
  const eventsRef = useRef<SessionEvent[]>([]);
  const obscuredStartRef = useRef<number | null>(null);
  const obscuredObjectNameRef = useRef<string | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    const fileset = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
    );
    const landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
    });
    landmarkerRef.current = landmarker;
    
    if (!objectDetectorRef.current) {
      objectDetectorRef.current = await ObjectDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        scoreThreshold: 0.3,
      });
    }

    return landmarker;
  }, []);

  const drawResults = useCallback(
    (result: FaceLandmarkerResult, width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      const landmarks = result.faceLandmarks[0];
      if (!landmarks) return;

      // Draw face mesh points subtly.
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      for (const lm of landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw bounding box around the face using outermost landmark extents.
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      for (const lm of landmarks) {
        if (lm.x < minX) minX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y > maxY) maxY = lm.y;
      }
      const pad = 20;
      const bx = minX * width - pad;
      const by = minY * height - pad;
      const bw = (maxX - minX) * width + pad * 2;
      const bh = (maxY - minY) * height + pad * 2;

      const s = settingsRef.current;
      const isAlert = closedFramesRef.current >= s.closedFrameLimit || yawnFramesRef.current >= s.yawnFrameLimit || obscuredFramesRef.current >= (s.obscuredFrameLimit ?? 15);
      ctx.strokeStyle = isAlert ? '#f87171' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);
      
      // We could draw objects here too, but we'll do that in processFrame
    },
    [canvasRef],
  );

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || !isRunningRef.current) return;

    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const width = video.videoWidth;
      const height = video.videoHeight;

      drawResults(result, width, height);

      const landmarks = result.faceLandmarks[0];
      const s = settingsRef.current;

      if (landmarks) {
        const ear = averageEAR(landmarks);
        const mar = computeMAR(landmarks);
        const eyesClosed = ear < s.earThreshold;
        const mouthOpen = mar > s.marThreshold;
        
        const visibility = computeFaceVisibility(landmarks);
        const gaze = computeEyeGaze(landmarks);
        const isDistracted = visibility < 0.2 || Math.abs(gaze - 0.5) > 0.2;

        if (eyesClosed) {
          closedFramesRef.current += 1;
        } else {
          closedFramesRef.current = 0;
        }

        if (mouthOpen) {
          yawnFramesRef.current += 1;
        } else {
          if (yawnFramesRef.current >= s.yawnFrameLimit) {
            yawnCountRef.current += 1;
            setStats((prev) => ({ ...prev, yawnCount: yawnCountRef.current }));
            eventsRef.current.push({ type: 'yawn', timestamp: new Date().toISOString() });
            if (s.voiceEnabled) speak('Yawn detected. Please take a break if you feel tired.');
          }
          yawnFramesRef.current = 0;
        }

        if (isDistracted && !eyesClosed) {
          distractedFramesRef.current += 1;
        } else {
          distractedFramesRef.current = 0;
        }

        // Object overlap check
        let isFaceObscured = false;
        if (objectDetectorRef.current) {
          const objResult = objectDetectorRef.current.detectForVideo(video, performance.now());
          // Draw object boxes
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              for (const detection of objResult.detections) {
                const bb = detection.boundingBox;
                if (!bb) continue;
                
                // Convert relative to absolute
                // MediaPipe returns pixels here!
                const bx2 = bb.originX;
                const by2 = bb.originY;
                const bw2 = bb.width;
                const bh2 = bb.height;
                // Calculate face bounding box in pixels
                let fMinX = 1, fMinY = 1, fMaxX = 0, fMaxY = 0;
                for (const lm of landmarks) {
                  if (lm.x < fMinX) fMinX = lm.x;
                  if (lm.y < fMinY) fMinY = lm.y;
                  if (lm.x > fMaxX) fMaxX = lm.x;
                  if (lm.y > fMaxY) fMaxY = lm.y;
                }
                const pad = 20;
                const fX = fMinX * width - pad;
                const fY = fMinY * height - pad;
                const fW = (fMaxX - fMinX) * width + pad * 2;
                const fH = (fMaxY - fMinY) * height + pad * 2;

                const name = detection.categories[0]?.categoryName;
                if (name !== 'person') {
                  // Always draw the detection box
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(bx2, by2, bw2, bh2);

                  // Only trigger alarm/obscured state if it overlaps with the face
                  if (
                    bx2 < fX + fW &&
                    bx2 + bw2 > fX &&
                    by2 < fY + fH &&
                    by2 + bh2 > fY
                  ) {
                    isFaceObscured = true;
                  }
                }
              }
            }
          }
        }

        if (isFaceObscured) {
          obscuredFramesRef.current += 1;
        } else {
          if (obscuredFramesRef.current >= (s.obscuredFrameLimit ?? 15) && obscuredStartRef.current) {
            // Re-opened / clear
            eventsRef.current.push({
              type: 'obscured',
              timestamp: new Date(obscuredStartRef.current).toISOString(),
              endTime: new Date().toISOString(),
              details: undefined
            });
            obscuredStartRef.current = null;
            obscuredObjectNameRef.current = null;
          }
          obscuredFramesRef.current = 0;
        }

        // Determine status.
        let status: DriverStatus = 'awake';
        if (obscuredFramesRef.current >= (s.obscuredFrameLimit ?? 15)) {
          status = 'obscured';
          if (!obscuredStartRef.current) {
            obscuredStartRef.current = Date.now();
          }
          if (!alarmActiveRef.current) {
            alarmActiveRef.current = true;
            obscuredCountRef.current += 1;
            setStats((prev) => ({ ...prev, obscuredCount: obscuredCountRef.current }));
            if (s.alarmEnabled) startAlarm();
            if (s.voiceEnabled) speak('Warning: Camera view is blocked.');
          }
        } else if (closedFramesRef.current >= s.closedFrameLimit) {
          status = 'drowsy';
          if (!alarmActiveRef.current) {
            alarmActiveRef.current = true;
            drowsyCountRef.current += 1;
            setStats((prev) => ({ ...prev, drowsyCount: drowsyCountRef.current }));
            eventsRef.current.push({ type: 'drowsy', timestamp: new Date().toISOString() });
            // Only speak for drowsy, no 'ting ting' alarm
            if (s.voiceEnabled) speak('Warning: Please keep your eyes on the road.');
          }
          if (closedFramesRef.current >= s.severeFrameLimit && !loggedSevereRef.current) {
            loggedSevereRef.current = true;
            severeCountRef.current += 1;
            setStats((prev) => ({ ...prev, severeCount: severeCountRef.current }));
            eventsRef.current.push({ type: 'severe', timestamp: new Date().toISOString() });
            if (s.voiceEnabled) speak('Severe drowsiness detected. Pull over safely.');
          }
        } else if (distractedFramesRef.current >= (s.obscuredFrameLimit ?? 15)) {
          status = 'distracted';
          // If we reach the frame limit for distraction, trigger alert once
          if (!alarmActiveRef.current) {
            alarmActiveRef.current = true;
            distractedCountRef.current += 1;
            setStats((prev) => ({ ...prev, distractedCount: distractedCountRef.current }));
            
            const message = visibility < 0.2 ? 'Face turned sideways.' : 'Keep the eye on the road.';
            eventsRef.current.push({ type: 'distracted', timestamp: new Date().toISOString(), details: message });
            
            if (s.alarmEnabled) startAlarm();
            if (s.voiceEnabled) speak(`Warning: ${message}`);
          }
        } else if (yawnFramesRef.current >= s.yawnFrameLimit) {
          status = 'yawning';
        }

        if (status === 'awake' || status === 'yawning') {
          if (alarmActiveRef.current) {
            stopAlarm();
            alarmActiveRef.current = false;
            loggedSevereRef.current = false;
          }
        }

        setState({
          status,
          ear,
          mar,
          closedFrames: closedFramesRef.current,
          yawnFrames: yawnFramesRef.current,
          faceDetected: true,
          isObscured: obscuredFramesRef.current >= (s.obscuredFrameLimit ?? 15),
        });
      } else {
        // No face detected — reset counters.
        if (closedFramesRef.current >= s.closedFrameLimit || obscuredFramesRef.current >= (s.obscuredFrameLimit ?? 15)) {
          stopAlarm();
          alarmActiveRef.current = false;
          loggedSevereRef.current = false;
        }
        if (obscuredFramesRef.current >= (s.obscuredFrameLimit ?? 15) && obscuredStartRef.current) {
            eventsRef.current.push({
              type: 'obscured',
              timestamp: new Date(obscuredStartRef.current).toISOString(),
              endTime: new Date().toISOString(),
              details: undefined
            });
            obscuredStartRef.current = null;
            obscuredObjectNameRef.current = null;
        }
        closedFramesRef.current = 0;
        yawnFramesRef.current = 0;
        obscuredFramesRef.current = 0;
        distractedFramesRef.current = 0;
        setState({ ...DEFAULT_STATE, status: 'no-face' });
      }

      totalFramesRef.current += 1;
      if (totalFramesRef.current % 15 === 0) {
        setStats((prev) => ({ ...prev, totalFrames: totalFramesRef.current }));
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, canvasRef, drawResults]);

  const start = useCallback(async () => {
    setError(null);
    setIsInitializing(true);
    try {
      resumeAudio();
      await initLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Video element not ready');
      video.srcObject = stream;
      await video.play();

      sessionIdRef.current = crypto.randomUUID();
      startTimeRef.current = Date.now();
      closedFramesRef.current = 0;
      yawnFramesRef.current = 0;
      obscuredFramesRef.current = 0;
      distractedFramesRef.current = 0;
      totalFramesRef.current = 0;
      drowsyCountRef.current = 0;
      severeCountRef.current = 0;
      yawnCountRef.current = 0;
      obscuredCountRef.current = 0;
      distractedCountRef.current = 0;
      eventsRef.current = [];
      obscuredStartRef.current = null;
      alarmActiveRef.current = false;
      loggedSevereRef.current = false;
      isRunningRef.current = true;
      setStats({ ...DEFAULT_STATS, startTime: startTimeRef.current });
      setState(DEFAULT_STATE);
      setIsRunning(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start camera';
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [initLandmarker, processFrame, videoRef]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopAlarm();
    alarmActiveRef.current = false;
    
    // Log the session report before clearing
    if (startTimeRef.current && sessionIdRef.current) {
      const session = getSession();
      void logSessionReport(
        sessionIdRef.current,
        startTimeRef.current,
        Date.now(),
        totalFramesRef.current,
        drowsyCountRef.current,
        severeCountRef.current,
        yawnCountRef.current,
        obscuredCountRef.current,
        distractedCountRef.current,
        eventsRef.current,
        session?.id ?? 'unknown'
      );
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRunning(false);
    setState(DEFAULT_STATE);
  }, [videoRef]);

  const updateSettings = useCallback((patch: Partial<DetectionSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      stopAlarm();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    isRunning,
    isInitializing,
    error,
    settings,
    state,
    stats,
    start,
    stop,
    updateSettings,
  };
}
