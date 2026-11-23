'use client';
import type { FaceLandmarker, ImageSegmenter } from '@mediapipe/tasks-vision';

export type Connection = { start: number; end: number };
export type MeshConnections = { tess: Connection[]; contours: Connection[] };

// MediaPipe's wasm prints harmless INFO lines (e.g. "Created TensorFlow Lite XNNPACK delegate for CPU.")
// through console.error, which the Next.js dev overlay shows as errors. Drop only those lines.
let consoleFiltered = false;
function filterMediapipeInfo() {
  if (consoleFiltered || typeof console === 'undefined') return;
  consoleFiltered = true;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && /^(INFO|W\d{4}|I\d{4}): /.test(args[0])) return;
    original(...args);
  };
}

// Models and wasm are served by this app, so no photo ever leaves the browser for analysis.
let filesetPromise: ReturnType<typeof import('@mediapipe/tasks-vision').FilesetResolver.forVisionTasks> | null = null;
async function getVision() {
  filterMediapipeInfo();
  const vision = await import('@mediapipe/tasks-vision');
  filesetPromise ??= vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
  return { vision, fileset: await filesetPromise };
}

// One shared landmarker, loaded lazily.
let landmarkerPromise: Promise<{ lm: FaceLandmarker } & MeshConnections> | null = null;
let currentRunningMode: 'IMAGE' | 'VIDEO' = 'IMAGE';
export let meshConnections: MeshConnections = { tess: [], contours: [] };

export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { vision: { FaceLandmarker }, fileset } = await getVision();
      const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate },
        runningMode: 'IMAGE' as const,
        numFaces: 1,
      });
      let lm: FaceLandmarker;
      try { lm = await FaceLandmarker.createFromOptions(fileset, options('GPU')); }
      catch { lm = await FaceLandmarker.createFromOptions(fileset, options('CPU')); }
      currentRunningMode = 'IMAGE';
      meshConnections = { tess: FaceLandmarker.FACE_LANDMARKS_TESSELATION, contours: FaceLandmarker.FACE_LANDMARKS_CONTOURS };
      return { lm, ...meshConnections };
    })().catch(err => { landmarkerPromise = null; throw err; });
  }
  return landmarkerPromise;
}

export async function switchRunningMode(lm: FaceLandmarker, mode: 'IMAGE' | 'VIDEO') {
  if (currentRunningMode !== mode) { await lm.setOptions({ runningMode: mode }); currentRunningMode = mode; }
}

// Person/background segmenter, used to trace the side-profile silhouette.
let segmenterPromise: Promise<ImageSegmenter> | null = null;
export function loadSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { vision: { ImageSegmenter }, fileset } = await getVision();
      const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: '/models/selfie_segmenter.tflite', delegate },
        runningMode: 'IMAGE' as const,
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
      try { return await ImageSegmenter.createFromOptions(fileset, options('GPU')); }
      catch { return await ImageSegmenter.createFromOptions(fileset, options('CPU')); }
    })().catch(err => { segmenterPromise = null; throw err; });
  }
  return segmenterPromise;
}

/** Person mask as 0/1 bytes at the mask's own resolution. */
export async function personMask(img: HTMLImageElement | HTMLCanvasElement) {
  const seg = await loadSegmenter();
  const result = seg.segment(img);
  const mask = result.confidenceMasks?.[0];
  if (!mask) { result.close(); throw new Error('no mask'); }
  const conf = mask.getAsFloat32Array();
  const data = new Uint8Array(conf.length);
  for (let i = 0; i < conf.length; i++) data[i] = conf[i] > 0.5 ? 1 : 0;
  const out = { data, width: mask.width, height: mask.height };
  result.close();
  return out;
}
