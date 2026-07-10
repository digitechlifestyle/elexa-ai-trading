import crypto from "node:crypto";

/**
 * AES-256-GCM encryption for storing user-supplied broker API credentials at
 * rest (broker_connections table). Separate key from Supabase/Stripe — a
 * leak of the DB alone (backup, misconfigured RLS, etc.) shouldn't also
 * hand over every user's live brokerage credentials in plaintext.
 */

function getKey(): Buffer {
  const raw = process.env.BROKER_CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "BROKER_CREDENTIALS_ENCRYPTION_KEY not configured — required to store broker credentials"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "BROKER_CREDENTIALS_ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32)"
    );
  }
  return key;
}

/** Returns base64(iv[12] || authTag[16] || ciphertext). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
