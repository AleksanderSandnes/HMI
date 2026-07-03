import { describe, expect, it } from "vitest";

import { extractExtension } from "@/lib/file";

describe("extractExtension", () => {
  it("takes the lowercase extension from the filename", () => {
    expect(extractExtension(new File([], "avatar.PNG", { type: "image/png" }))).toBe("png");
    expect(extractExtension(new File([], "a.b.jpeg", { type: "image/jpeg" }))).toBe("jpeg");
  });

  it("falls back to the mime subtype without a usable extension", () => {
    expect(extractExtension(new File([], "noext", { type: "image/webp" }))).toBe("webp");
    expect(extractExtension(new File([], ".hidden", { type: "image/webp" }))).toBe("webp");
  });

  it("defaults to jpg when neither name nor type helps", () => {
    expect(extractExtension(new File([], "noext", { type: "" }))).toBe("jpg");
  });
});
