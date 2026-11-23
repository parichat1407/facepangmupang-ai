import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Connection } from './landmarker';

export type MeshSettings = { level: number; opacity: number; pointSize: number };
export const MESH_POINTS = 468;

export function drawMesh(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number, s: MeshSettings, tess: Connection[], contours: Connection[]) {
  const unit = Math.max(w, h) / 1000;
  const line = (conns: Connection[], color: string, width: number) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    for (const { start, end } of conns) {
      const a = landmarks[start], b = landmarks[end];
      if (!a || !b) continue;
      ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h);
    }
    ctx.stroke();
  };
  ctx.save();
  ctx.globalAlpha = s.opacity;
  if (s.level >= 3) line(tess, 'rgba(255,255,255,0.55)', Math.max(0.6, unit * 0.7));
  if (s.level >= 2) line(contours, '#d9bf8c', Math.max(1, unit * 1.6));
  ctx.fillStyle = s.level >= 3 ? '#f4e6c8' : '#e2c792';
  const r = Math.max(0.6, unit * s.pointSize);
  for (let i = 0; i < Math.min(MESH_POINTS, landmarks.length); i++) {
    const p = landmarks[i];
    ctx.beginPath(); ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Horizontal guide lines for the three facial zones (mesh top, glabella, subnasale, chin). */
export function drawThirds(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], w: number, h: number) {
  const unit = Math.max(w, h) / 1000;
  const xs = [234, 454].map(i => landmarks[i].x * w);
  const left = Math.min(...xs) - 40 * unit, right = Math.max(...xs) + 40 * unit;
  ctx.save();
  ctx.strokeStyle = '#e9d6ad'; ctx.lineWidth = Math.max(1, unit * 1.4); ctx.setLineDash([6 * unit, 5 * unit]);
  for (const i of [10, 9, 2, 152]) {
    const y = landmarks[i].y * h;
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
  }
  ctx.restore();
}
