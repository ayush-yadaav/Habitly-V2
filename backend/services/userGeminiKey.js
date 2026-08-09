import crypto from "node:crypto";
import GeminiKey from "../models/GeminiKey.js";

function getEncryptionKey() {
  const secret = process.env.GEMINI_USER_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret === "dev_secret_change_me") {
    const error = new Error("User Gemini key encryption is not configured securely.");
    error.code = "USER_KEY_ENCRYPTION_NOT_CONFIGURED";
    throw error;
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    authTag: authTag.toString("base64url"),
  };
}

function decrypt(record) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(record.iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(record.authTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, "base64url")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export async function getUserGeminiKey(userId) {
  const record = await GeminiKey.findOne({ userId });
  if (!record) return null;
  return decrypt(record);
}

export async function getUserGeminiKeyStatus(userId) {
  const record = await GeminiKey.findOne({ userId }).select("fingerprint last4 updatedAt");
  if (!record) return { configured: false };
  return {
    configured: true,
    last4: record.last4,
    fingerprint: record.fingerprint,
    updatedAt: record.updatedAt,
  };
}

export async function saveUserGeminiKey(userId, apiKey) {
  const value = String(apiKey || "").trim();
  if (!value) {
    const error = new Error("Gemini API key is required.");
    error.code = "USER_KEY_INVALID";
    throw error;
  }
  if (value.length < 20 || value.length > 512 || /\s/.test(value)) {
    const error = new Error("That Gemini API key does not look valid. Paste the complete key without spaces.");
    error.code = "USER_KEY_INVALID";
    throw error;
  }

  const encrypted = encrypt(value);
  const fingerprint = crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
  const last4 = value.slice(-4);

  await GeminiKey.findOneAndUpdate(
    { userId },
    { $set: { ...encrypted, fingerprint, last4 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return getUserGeminiKeyStatus(userId);
}

export async function removeUserGeminiKey(userId) {
  await GeminiKey.deleteOne({ userId });
  return { configured: false };
}
