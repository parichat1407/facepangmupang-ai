'use client';
import { useEffect, useRef } from 'react';
import type { DetectedFace } from './FaceMeshStudio';
import { drawMesh, drawThirds } from '@/lib/face/draw';
import { meshConnections } from '@/lib/face/landmarker';

/** Photo cropped to the face, with the 468-point mesh and facial-thirds guides. */
export default function MeshCanvas({ image, face, label }: { image: string; face: DetectedFace; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      const c = canvas.current; if (cancelled || !c) return;
      const { landmarks, width: W, height: H } = face;
      const xs = landmarks.map(l => l.x * W), ys = landmarks.map(l => l.y * H);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const pad = (maxY - minY) * 0.22;
      const sx = Math.max(0, minX - pad), sy = Math.max(0, minY - pad * 1.3);
      const sw = Math.min(W - sx, maxX - minX + pad * 2), sh = Math.min(H - sy, maxY - minY + pad * 2.3);
      const scale = Math.min(1, 900 / Math.max(sw, sh));
      c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      // Re-project landmarks into the crop.
      const local = landmarks.map(l => ({ ...l, x: (l.x * W - sx) / sw, y: (l.y * H - sy) / sh }));
      drawMesh(ctx, local, c.width, c.height, { level: 2, opacity: 0.9, pointSize: 1.2 }, meshConnections.tess, meshConnections.contours);
      drawThirds(ctx, local, c.width, c.height);
    };
    img.src = image;
    return () => { cancelled = true; };
  }, [image, face]);
  return <canvas ref={canvas} className="mesh-canvas" aria-label={label} />;
}
