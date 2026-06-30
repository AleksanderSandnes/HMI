/**
 * Crypto Utilities
 * Handles encryption/decryption of sensitive data like API credentials
 */

const crypto = require("crypto");

// Use environment variable for encryption key, fallback to default for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here!";
// Ensure key is exactly 32 bytes for AES-256
const KEY = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt sensitive text
 */
function encrypt(text) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt sensitive text
 */
function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encrypted = parts.join(":");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Create MD5 hash (for Growatt API)
 * Growatt API requires passwords to be MD5 hashed
 */
function md5Hash(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

module.exports = {
  encrypt,
  decrypt,
  md5Hash,
};
