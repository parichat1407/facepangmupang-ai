/**
 * Turns MediaPipe Face Mesh landmarks (468/478 points, normalised 0..1) into
 * proportion metrics. Pure functions — no DOM, easy to test.
 *
 * Index reference (subject's right = image left):
 *  10 mesh top (upper forehead, below hairline) · 9 glabella · 168 nasion · 2 subnasale · 1 nose tip · 152 chin
 *  234/454 cheek edge · 54/284 forehead edge · 172/397 jaw angle
 *  33/133 right eye outer/inner · 362/263 left eye inner/outer · 159/145 & 386/374 eyelids
 *  70,105,107 right brow (outer, peak, inner) · 300,334,336 left brow
 *  129/358 nose alar · 61/291 mouth corners · 0 upper lip top · 13/14 lip inner · 17 lower lip bottom
 */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond';

export type FaceMetrics = {
  faceShape: FaceShape;
  symmetry: number;            // 0..100
  yaw: number;                 // nose-tip offset from cheek centre / cheek width (|yaw| > 0.07 = head turned)
  lengthToWidth: number;       // estimated full face length / cheekbone width
  foreheadToCheek: number;     // forehead width / cheekbone width
  jawToCheek: number;          // jaw-angle width / cheekbone width
  thirds: { upper: number; middle: number; lower: number }; // fractions summing to 1 (upper is estimated)
  eyeSpacing: number;          // inner-corner gap / eye width (mesh typical ≈ 1.25)
  eyeOpenness: number;         // eye height / eye width
  canthalTilt: number;         // degrees, + = outer corner higher
  browGap: number;             // gap between inner brows / eye width
  browToEye: number;           // brow-peak-to-upper-lid / eye width
  browLength: number;          // brow span / eye width
  noseWidth: number;           // alar width / inner-corner gap (mesh typical ≈ 1.2)
  noseLength: number;          // nasion→subnasale / estimated face length
  bridgeHeight: number;        // nasion depth vs inner eye corners / cheek width (higher = taller bridge)
  mouthToNose: number;         // mouth width / alar width (ideal ≈ 1.5)
  lipRatio: number;            // lower lip / upper lip thickness (ideal ≈ 1.6)
  mouthCornerLift: number;     // corner height vs lip centre / mouth width (+ = upturned)
  philtrum: number;            // philtrum / lower third
  chinLength: number;          // lower lip bottom → chin / lower third
  chinProjection: number;      // chin vs lower-lip depth / cheek width (typical -0.10..-0.17; higher = more projected)
};

type P = { x: number; y: number; z: number };

// Mesh top (10) sits below the hairline; this factor estimates the full upper third.
const UPPER_THIRD_FACTOR = 1.6;

const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function measureFace(landmarks: NormalizedLandmark[], width: number, height: number): FaceMetrics {
  // To pixel space, then de-rotate so the eye line is horizontal (removes head roll).
  const raw = landmarks.map(l => ({ x: l.x * width, y: l.y * height, z: l.z * width }));
  const angle = Math.atan2(raw[263].y - raw[33].y, raw[263].x - raw[33].x);
  const cx = (raw[33].x + raw[263].x) / 2, cy = (raw[33].y + raw[263].y) / 2;
  const cos = Math.cos(-angle), sin = Math.sin(-angle);
  const p: P[] = raw.map(q => ({ x: cx + (q.x - cx) * cos - (q.y - cy) * sin, y: cy + (q.x - cx) * sin + (q.y - cy) * cos, z: q.z }));

  const cheekW = dist(p[234], p[454]);
  const upperMesh = p[9].y - p[10].y;
  const upper = upperMesh * UPPER_THIRD_FACTOR;
  const middle = p[2].y - p[9].y;
  const lower = p[152].y - p[2].y;
  const faceLen = upper + middle + lower;

  const eyeW = (dist(p[33], p[133]) + dist(p[362], p[263])) / 2;
  const eyeH = (dist(p[159], p[145]) + dist(p[386], p[374])) / 2;
  const innerGap = dist(p[133], p[362]);
  // Image-left eye is the subject's right: outer corner 33 is left of inner 133.
  const tiltR = Math.atan2(p[133].y - p[33].y, p[133].x - p[33].x);
  const tiltL = Math.atan2(p[263].y - p[362].y, p[263].x - p[362].x);
  const canthalTilt = ((tiltR - tiltL) / 2) * (180 / Math.PI);

  const alarW = dist(p[129], p[358]);
  const mouthW = dist(p[61], p[291]);
  const upperLip = Math.max(1e-3, p[13].y - p[0].y);
  const lowerLip = Math.max(1e-3, p[17].y - p[14].y);
  const lipMidY = (p[13].y + p[14].y) / 2;
  const cornerY = (p[61].y + p[291].y) / 2;

  // Symmetry: mirror distance from the midline for paired points.
  const mid = { a: p[10], b: p[152] };
  const mx = (y: number) => mid.a.x + ((y - mid.a.y) / (mid.b.y - mid.a.y)) * (mid.b.x - mid.a.x);
  const pairs = [[33, 263], [133, 362], [61, 291], [234, 454], [172, 397], [105, 334], [129, 358], [159, 386], [70, 300], [54, 284]];
  let asymH = 0, asymV = 0;
  for (const [r, l] of pairs) {
    asymH += Math.abs((mx(p[r].y) - p[r].x) - (p[l].x - mx(p[l].y))) / cheekW;
    asymV += Math.abs(p[r].y - p[l].y) / cheekW;
  }
  // Horizontal differences are dominated by head turn, so they weigh less than vertical ones.
  const symmetry = clamp(100 - (asymV / pairs.length) * 600 - (asymH / pairs.length) * 250, 60, 98);
  const yaw = (p[1].x - (p[234].x + p[454].x) / 2) / cheekW;

  const m: Omit<FaceMetrics, 'faceShape'> = {
    symmetry: Math.round(symmetry),
    yaw,
    lengthToWidth: faceLen / cheekW,
    foreheadToCheek: dist(p[54], p[284]) / cheekW,
    jawToCheek: dist(p[172], p[397]) / cheekW,
    thirds: { upper: upper / faceLen, middle: middle / faceLen, lower: lower / faceLen },
    eyeSpacing: innerGap / eyeW,
    eyeOpenness: eyeH / eyeW,
    canthalTilt,
    browGap: dist(p[107], p[336]) / eyeW,
    browToEye: ((p[159].y - p[105].y) + (p[386].y - p[334].y)) / 2 / eyeW,
    browLength: (dist(p[70], p[107]) + dist(p[300], p[336])) / 2 / eyeW,
    noseWidth: alarW / innerGap,
    noseLength: (p[2].y - p[168].y) / faceLen,
    bridgeHeight: ((p[133].z + p[362].z) / 2 - p[168].z) / cheekW,
    mouthToNose: mouthW / alarW,
    lipRatio: lowerLip / upperLip,
    mouthCornerLift: (lipMidY - cornerY) / mouthW,
    philtrum: (p[0].y - p[2].y) / lower,
    chinLength: (p[152].y - p[17].y) / lower,
    chinProjection: (p[17].z - p[152].z) / cheekW,
  };
  return { ...m, faceShape: classifyShape(m) };
}

// Thresholds calibrated on MediaPipe mesh output (mesh ratios are narrower than textbook ratios).
function classifyShape(m: Omit<FaceMetrics, 'faceShape'>): FaceShape {
  const L = m.lengthToWidth, F = m.foreheadToCheek, J = m.jawToCheek;
  if (L >= 1.5) return 'long';
  if (J >= 0.83) return 'square';
  if (F - J > 0.085 && m.chinLength < 0.44) return 'heart';
  if (F < 0.845 && J < 0.795) return 'diamond';
  if (L < 1.36) return 'round';
  return 'oval';
}

/** Closeness to a classical reference ratio, as a 50..98 "balance" index for charts. */
export function balanceIndex(value: number, ideal: number, tolerance: number) {
  return Math.round(clamp(98 - (Math.abs(value - ideal) / tolerance) * 30, 50, 98));
}

export function featureBalance(m: FaceMetrics) {
  return {
    eyes: balanceIndex(m.eyeSpacing, 1.25, 0.2),
    nose: balanceIndex(m.noseWidth, 1.2, 0.2),
    lips: balanceIndex(m.lipRatio, 1.6, 0.6),
    chin: balanceIndex(m.chinLength, 0.47, 0.1),
    jaw: balanceIndex(m.jawToCheek, 0.8, 0.06),
    forehead: balanceIndex(m.thirds.upper, 1 / 3, 0.06),
  };
}
