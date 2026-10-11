import { createHash, randomBytes } from "crypto";

/** Generate a cryptographically secure random opaque token as a hex string. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** SHA-256 hash of a string, hex encoded. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
