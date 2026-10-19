// Browser-side helpers for the instant try-on: load the photo, find the face,
// and draw the wig overlay aligned to it.

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { OverlayAnchors, Point } from "./products";

// Must match the installed @mediapipe/tasks-vision version.
const MEDIAPIPE_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export const MAX_PHOTO_SIDE = 1024;

export type FaceAnchors = { leftEye: Point; rightEye: Point; forehead: Point; chin: Point };

export type Adjustments = { scale: number; x: number; y: number; rotate: number };
export const NO_ADJUSTMENTS: Adjustments = { scale: 1, x: 0, y: 0, rotate: 0 };

let landmarker: Promise<FaceLandmarker> | null = null;

function getLandmarker() {
  landmarker ??= (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
    return FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      numFaces: 2,
    });
  })().catch((e) => {
    landmarker = null;
    throw e;
  });
  return landmarker;
}

/** Start downloading the face model early so it's ready when a photo arrives. */
export function preloadFaceModel() {
  getLandmarker().catch(() => {});
}

/** Decode a photo (respecting EXIF rotation) and shrink it to at most MAX_PHOTO_SIDE. */
export async function loadPhoto(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export class FaceError extends Error {}

export async function detectFace(photo: HTMLCanvasElement): Promise<FaceAnchors> {
  const lm = await getLandmarker();
  const faces = lm.detect(photo).faceLandmarks;
  if (faces.length === 0) {
    throw new FaceError("We couldn't find a face. Try a well-lit, front-facing photo.");
  }
  if (faces.length > 1) {
    throw new FaceError("We found more than one face. Please use a photo of just you.");
  }
  const face = faces[0];
  // 33 / 263: outer eye corners, 10: top of forehead, 152: chin.
  const pt = (i: number): Point => [face[i].x * photo.width, face[i].y * photo.height];
  const anchors = { leftEye: pt(33), rightEye: pt(263), forehead: pt(10), chin: pt(152) };
  const eyeDist = Math.hypot(anchors.rightEye[0] - anchors.leftEye[0], anchors.rightEye[1] - anchors.leftEye[1]);
  if (eyeDist < photo.width * 0.06) {
    throw new FaceError("Your face is quite small in this photo. Try one taken closer up.");
  }
  return anchors;
}

const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const angle = (a: Point, b: Point) => Math.atan2(b[1] - a[1], b[0] - a[0]);

/**
 * Draws the photo with the wig overlay on top, mapping the overlay's eye line
 * onto the customer's eye line (scale + rotation + position), and stretching
 * vertically so the hairline lands on their forehead.
 */
export function drawFitted(
  canvas: HTMLCanvasElement,
  photo: HTMLCanvasElement,
  face: FaceAnchors,
  overlay: HTMLImageElement,
  ref: OverlayAnchors,
  adj: Adjustments,
) {
  canvas.width = photo.width;
  canvas.height = photo.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(photo, 0, 0);

  const userEyes = dist(face.leftEye, face.rightEye);
  const refEyes = dist(ref.leftEye, ref.rightEye);
  const scale = (userEyes / refEyes) * adj.scale;

  const userMid = mid(face.leftEye, face.rightEye);
  const refMid = mid(ref.leftEye, ref.rightEye);
  const userForehead = dist(userMid, face.forehead) / userEyes;
  const refForehead = dist(refMid, ref.forehead) / refEyes;
  const stretchY = Math.min(1.2, Math.max(0.85, userForehead / refForehead));

  // Overlay pixels are in the reference photo's resolution.
  const overlayScale = overlay.naturalWidth / ref.width;

  ctx.save();
  ctx.translate(userMid[0] + adj.x * userEyes, userMid[1] + adj.y * userEyes);
  ctx.rotate(angle(face.leftEye, face.rightEye) - angle(ref.leftEye, ref.rightEye) + (adj.rotate * Math.PI) / 180);
  ctx.scale(scale, scale * stretchY);
  ctx.translate(-refMid[0], -refMid[1]);
  ctx.drawImage(overlay, 0, 0, overlay.naturalWidth / overlayScale, overlay.naturalHeight / overlayScale);
  ctx.restore();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.9) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode image"))), type, quality),
  );
}
