'use client';
import { loadLandmarker, switchRunningMode, personMask } from './landmarker';
import { detectProfile, type Facing, type ProfilePoints } from './profile';

/**
 * Auto-place profile points: silhouette from the person segmenter, plus a hint from the face
 * landmarker when it can still see the face (it only works up to roughly a 3/4 view).
 */
export async function autoProfile(img: HTMLImageElement): Promise<{ points: ProfilePoints; facing: Facing } | null> {
  let hint: { facing?: Facing; noseY?: number } | undefined;
  try {
    const { lm } = await loadLandmarker();
    await switchRunningMode(lm, 'IMAGE');
    const face = lm.detect(img).faceLandmarks[0];
    if (face) {
      const cheeks = (face[234].x + face[454].x) / 2;
      hint = { facing: face[1].x < cheeks ? 'left' : 'right', noseY: face[1].y };
    }
  } catch { /* landmarker is optional here */ }
  const mask = await personMask(img);
  return detectProfile(mask, img.naturalWidth, img.naturalHeight, hint);
}

/** Generic starting layout when nothing is detected — the user drags points into place. */
export function templateProfile(w: number, h: number, facing: Facing = 'right'): ProfilePoints {
  const cx = w * 0.5, s = Math.min(w, h) * 0.5;
  const f = facing === 'right' ? 1 : -1;
  const P = (dx: number, dy: number) => ({ x: cx + f * dx * s, y: h * 0.45 + dy * s });
  return {
    Fh: P(0.02, -0.55), G: P(0.06, -0.3), N: P(0.03, -0.2), Prn: P(0.2, 0.02), Cm: P(0.14, 0.07), Sn: P(0.08, 0.1),
    Ls: P(0.1, 0.2), Li: P(0.08, 0.3), Pog: P(0.06, 0.42), Me: P(-0.02, 0.5),
  };
}
