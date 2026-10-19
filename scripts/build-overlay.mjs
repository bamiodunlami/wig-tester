// Cuts the hair out of a front-facing product photo and records where the
// eyes sit, producing the transparent overlay used by the instant try-on.
//
// Usage:
//   node scripts/build-overlay.mjs <input.jpg> <output.png> <models-dir>
//
// <models-dir> must contain:
//   face_landmarker.task             https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
//   selfie_multiclass_256x256.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
//
// Prints the overlay anchors as JSON; paste them into src/lib/products.ts.
// Needs a Chromium binary: set CHROMIUM_PATH or PLAYWRIGHT_BROWSERS_PATH.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const [input, output, modelsDir] = process.argv.slice(2);
if (!input || !output || !modelsDir) {
  console.error("Usage: node scripts/build-overlay.mjs <input.jpg> <output.png> <models-dir>");
  process.exit(1);
}

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root) return undefined;
  const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
  const bin = dir && path.join(root, dir, "chrome-linux", "chrome");
  return bin && existsSync(bin) ? bin : undefined;
}

const visionDir = path.resolve("node_modules/@mediapipe/tasks-vision");
const files = {
  "/vision_bundle.mjs": [path.join(visionDir, "vision_bundle.mjs"), "text/javascript"],
  "/wasm/vision_wasm_internal.js": [path.join(visionDir, "wasm/vision_wasm_internal.js"), "text/javascript"],
  "/wasm/vision_wasm_internal.wasm": [path.join(visionDir, "wasm/vision_wasm_internal.wasm"), "application/wasm"],
  "/face_landmarker.task": [path.join(modelsDir, "face_landmarker.task"), "application/octet-stream"],
  "/segmenter.tflite": [path.join(modelsDir, "selfie_multiclass_256x256.tflite"), "application/octet-stream"],
  "/input.jpg": [path.resolve(input), "image/jpeg"],
  "/": [null, "text/html"],
};

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();
page.on("console", (m) => console.error("[browser]", m.text()));
await page.route("http://overlay.local/**", async (route) => {
  const { pathname } = new URL(route.request().url());
  const entry = files[pathname];
  if (!entry) return route.fulfill({ status: 404 });
  const [file, contentType] = entry;
  const body = file ? await readFile(file) : "<!doctype html><title>overlay</title>";
  await route.fulfill({ body, contentType });
});
await page.goto("http://overlay.local/");

const result = await page.evaluate(async () => {
  const { FilesetResolver, FaceLandmarker, ImageSegmenter } = await import("/vision_bundle.mjs");
  const fileset = await FilesetResolver.forVisionTasks("/wasm");
  const img = new Image();
  img.src = "/input.jpg";
  await img.decode();

  const landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/face_landmarker.task", delegate: "CPU" },
    runningMode: "IMAGE",
    numFaces: 1,
  });
  const face = landmarker.detect(img).faceLandmarks[0];
  if (!face) throw new Error("No face found in the input photo");

  const segmenter = await ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/segmenter.tflite", delegate: "CPU" },
    runningMode: "IMAGE",
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
  // selfie_multiclass categories: 0 background, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 other
  const seg = segmenter.segment(img);
  const hairMask = seg.confidenceMasks[1];
  const mw = hairMask.width;
  const mh = hairMask.height;
  const hair = hairMask.getAsFloat32Array();

  // Upscale the mask to full resolution through a canvas so edges stay smooth.
  const maskCanvas = new OffscreenCanvas(mw, mh);
  const maskCtx = maskCanvas.getContext("2d");
  const maskData = maskCtx.createImageData(mw, mh);
  for (let i = 0; i < hair.length; i++) {
    // Sharpen the soft mask a little: drop weak edges, saturate the core.
    const a = Math.min(1, Math.max(0, (hair[i] - 0.25) / 0.5));
    maskData.data[i * 4 + 3] = Math.round(a * 255);
  }
  maskCtx.putImageData(maskData, 0, 0);

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const out = new OffscreenCanvas(w, h);
  const ctx = out.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(maskCanvas, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.drawImage(img, 0, 0);

  const blob = await out.convertToBlob({ type: "image/png" });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  // 33 / 263: outer eye corners, 10: top of forehead, 152: chin.
  const pt = (i) => [Math.round(face[i].x * w), Math.round(face[i].y * h)];
  return {
    png: btoa(binary),
    anchors: {
      width: w,
      height: h,
      leftEye: pt(33),
      rightEye: pt(263),
      forehead: pt(10),
      chin: pt(152),
    },
  };
});

await browser.close();
await writeFile(output, Buffer.from(result.png, "base64"));
console.log(JSON.stringify(result.anchors, null, 2));
