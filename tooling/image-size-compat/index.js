"use strict";

// Metro 0.83 (bundled with Expo SDK 54) calls image-size with an asset *file path*, the
// v1 API. image-size v2 — the only line patched for GHSA-5p2g-fcmc-qvqq and
// GHSA-w3rx-r6r6-pgpr — accepts bytes only, so read the file first. Wired in through the
// nested `metro > image-size` override in the root package.json; remove it once Metro
// ships with image-size v2 support.
const fs = require("node:fs");
const { imageSize } = require("image-size-v2");

function compatImageSize(input) {
  return imageSize(typeof input === "string" ? fs.readFileSync(input) : input);
}

module.exports = compatImageSize;
module.exports.default = compatImageSize;
module.exports.imageSize = compatImageSize;
