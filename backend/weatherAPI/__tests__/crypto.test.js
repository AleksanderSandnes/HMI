const { encrypt, decrypt, md5Hash } = require("../utils/crypto");

describe("crypto utils", () => {
  describe("encrypt / decrypt round-trip", () => {
    it("decrypts back to the original plaintext", () => {
      const plain = "super-secret-api-key-123";
      const cipher = encrypt(plain);
      expect(decrypt(cipher)).toBe(plain);
    });

    it('produces output in the "<iv>:<ciphertext>" format', () => {
      const cipher = encrypt("hello");
      const parts = cipher.split(":");
      expect(parts).toHaveLength(2);
      // IV is 16 bytes -> 32 hex chars.
      expect(parts[0]).toMatch(/^[0-9a-f]{32}$/);
      expect(parts[1]).toMatch(/^[0-9a-f]+$/);
    });

    it("uses a random IV so the same plaintext yields different ciphertext", () => {
      const a = encrypt("same-value");
      const b = encrypt("same-value");
      expect(a).not.toBe(b);
      // ...but both still decrypt to the same plaintext.
      expect(decrypt(a)).toBe("same-value");
      expect(decrypt(b)).toBe("same-value");
    });

    it("round-trips unicode and empty strings", () => {
      expect(decrypt(encrypt(""))).toBe("");
      expect(decrypt(encrypt("æøå — 日本語"))).toBe("æøå — 日本語");
    });

    it("throws a friendly error on malformed ciphertext", () => {
      expect(() => decrypt("not-valid-cipher")).toThrow("Failed to decrypt data");
    });
  });

  describe("md5Hash", () => {
    it("produces the canonical MD5 hex digest", () => {
      // Known MD5 of the empty string and of "password".
      expect(md5Hash("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
      expect(md5Hash("password")).toBe("5f4dcc3b5aa765d61d8327deb882cf99");
    });

    it("is deterministic and 32 hex chars long", () => {
      const h = md5Hash("growatt-user");
      expect(h).toBe(md5Hash("growatt-user"));
      expect(h).toMatch(/^[0-9a-f]{32}$/);
    });
  });
});
