/**
 * SHA-256 hash utility.
 * Consolidates the repeated `crypto.createHash("sha256").update(value).digest("hex")` pattern.
 * @private — not exported from the package's public API.
 */

import crypto from 'crypto';

/**
 * Compute the SHA-256 hex digest of a string.
 * @param {string} value
 * @returns {string} Hex-encoded hash
 */
export function sha256Hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
