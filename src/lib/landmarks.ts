import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// MediaPipe FaceLandmarker 478-point mesh indices for the six landmark points
// around each eye, used to compute the Eye Aspect Ratio (EAR).
//
//   p1 = outer / inner corner
//   p2, p3 = upper eyelid
//   p4 = opposite corner
//   p5, p6 = lower eyelid
//
// EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
// A smaller EAR means the eye is more closed.

export const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 159] as const;
export const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const;

// Mouth landmark indices for Mouth Aspect Ratio (MAR).
//   13 = upper lip inner top
//   14 = lower lip inner bottom
//   78 = left mouth corner
//   308 = right mouth corner
//
// MAR = (||upper-lower||) / (||left-right||)
// A larger MAR means the mouth is more open (yawning).

export const MOUTH_INDICES = {
  upper: 13,
  lower: 14,
  left: 78,
  right: 308,
} as const;

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function computeEAR(landmarks: NormalizedLandmark[], indices: readonly number[]): number {
  const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0.3;
  const vertical1 = distance(p2, p6);
  const vertical2 = distance(p3, p5);
  const horizontal = distance(p1, p4);
  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2 * horizontal);
}

export function computeMAR(landmarks: NormalizedLandmark[]): number {
  const upper = landmarks[MOUTH_INDICES.upper];
  const lower = landmarks[MOUTH_INDICES.lower];
  const left = landmarks[MOUTH_INDICES.left];
  const right = landmarks[MOUTH_INDICES.right];
  if (!upper || !lower || !left || !right) return 0;
  const vertical = distance(upper, lower);
  const horizontal = distance(left, right);
  if (horizontal === 0) return 0;
  return vertical / horizontal;
}

export function averageEAR(landmarks: NormalizedLandmark[]): number {
  const left = computeEAR(landmarks, LEFT_EYE_INDICES);
  const right = computeEAR(landmarks, RIGHT_EYE_INDICES);
  return (left + right) / 2;
}

export function computeFaceVisibility(landmarks: NormalizedLandmark[]): number {
  // Nose tip is index 1
  // Left edge (image right) is index 454
  // Right edge (image left) is index 234
  const nose = landmarks[1];
  const leftEdge = landmarks[454];
  const rightEdge = landmarks[234];
  if (!nose || !leftEdge || !rightEdge) return 1.0;

  // Use 2D distances to measure projection
  const distLeft = distance(nose, leftEdge);
  const distRight = distance(nose, rightEdge);
  
  if (distLeft === 0 && distRight === 0) return 1.0;
  
  const min = Math.min(distLeft, distRight);
  const max = Math.max(distLeft, distRight);
  
  // Ratio from 0.0 (fully turned) to 1.0 (looking straight)
  return min / max;
}

export function computeEyeGaze(landmarks: NormalizedLandmark[]): number {
  // We use the Left Eye (image right) to estimate horizontal gaze
  // Iris center: 468
  // Eye inner: 133, Eye outer: 33
  const iris = landmarks[468];
  const inner = landmarks[133];
  const outer = landmarks[33];
  
  if (!iris || !inner || !outer) return 0.5;

  const eyeWidth = distance(inner, outer);
  if (eyeWidth === 0) return 0.5;

  const irisToInner = distance(iris, inner);
  
  // Ratio from 0.0 to 1.0 representing horizontal gaze
  // ~0.5 means looking straight ahead
  return irisToInner / eyeWidth;
}
