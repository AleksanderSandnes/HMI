#!/usr/bin/env node
// Renders the Google Play feature graphic (1024x500) and hi-res icon (512x512) from the
// app icon, listing title/tagline and a fictional-data phone screenshot.
//
//   node scripts/render-store-graphics.mjs        (after npm run store:screenshots)
//
// Output: store/android/graphics/{feature-graphic,icon-512}.png
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = {
  icon: "apps/mobile/assets/app-icon-source.png",
  screenshot: "store/screenshots/phone/en/01-dashboard.png",
  title: readFileSync(path.join(root, "store/android/listing/en-US/title.txt"), "utf8").trim(),
  tagline: readFileSync(
    path.join(root, "store/android/listing/en-US/short_description.txt"),
    "utf8",
  ).trim(),
  background: "linear-gradient(135deg, #0e1733 0%, #0a1124 55%, #06080f 100%)",
  accent: "#fbbf24",
};
const outDir = path.join(root, "store/android/graphics");

function dataUri(file) {
  return `data:image/png;base64,${readFileSync(path.join(root, file)).toString("base64")}`;
}

function featureHtml() {
  return `<!doctype html><html><body style="margin:0">
  <div style="width:1024px;height:500px;overflow:hidden;position:relative;background:${CONFIG.background};
    font-family:'Segoe UI',system-ui,sans-serif;color:#fff">
    <div style="position:absolute;left:64px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center;gap:22px">
      <img src="${dataUri(CONFIG.icon)}" style="width:112px;height:112px;border-radius:26px;box-shadow:0 12px 40px rgba(0,0,0,.35)">
      <div style="font-size:58px;font-weight:800;letter-spacing:-1px">${CONFIG.title}</div>
      <div style="font-size:26px;line-height:1.35;opacity:.86">${CONFIG.tagline}</div>
      <div style="width:72px;height:6px;border-radius:3px;background:${CONFIG.accent}"></div>
    </div>
    <img src="${dataUri(CONFIG.screenshot)}" style="position:absolute;right:56px;top:46px;width:300px;
      border-radius:34px;border:8px solid #111827;box-shadow:0 24px 60px rgba(0,0,0,.45);transform:rotate(-4deg)">
  </div></body></html>`;
}

function iconHtml() {
  return `<!doctype html><html><body style="margin:0">
  <img src="${dataUri(CONFIG.icon)}" style="display:block;width:512px;height:512px"></body></html>`;
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(featureHtml());
  await page.screenshot({ path: path.join(outDir, "feature-graphic.png") });
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(iconHtml());
  await page.screenshot({ path: path.join(outDir, "icon-512.png") });
} finally {
  await browser.close();
}
console.log(`Wrote ${path.relative(root, outDir)}/feature-graphic.png and icon-512.png`);
