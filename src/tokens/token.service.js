/**
 * Token service — public API for JWT access/refresh token operations.
 * Extracted from the old auth.controller.js login, refreshToken, getMe handlers.
 * All signing algorithms and logic preserved exactly as-is.
 */

import jwt from 'jsonwebtoken';
import { getConfig, getModels } from '../config/store.js';
import { sha256Hash } from '../utils/hash.js';

/**
 * Sign a JWT access token.
 *
 * @param {Object} payload - Data to encode (e.g. { id, sessionId })
 * @returns {string} Signed JWT
 */
export function issueAccessToken(payload) {
  const config = getConfig();
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenExpiry });
}

/**
 * Sign a JWT refresh token.
 *
 * @param {Object} payload - Data to encode (e.g. { id })
 * @returns {string} Signed JWT
 */
export function issueRefreshToken(payload) {
  const config = getConfig();
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.refreshTokenExpiry });
}

/**
 * Verify and decode a JWT access token.
 *
 * @param {string} token - JWT string
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export function verifyAccessToken(token) {
  const config = getConfig();
  return jwt.verify(token, config.jwtSecret);
}

/**
 * Rotate a refresh token: verify the old one, create a new access + refresh token pair,
 * and update the session in the database.
 *
 * Same logic as the original refreshToken controller handler.
 *
 * @param {string} refreshToken - The current refresh token (from cookie)
 * @returns {Promise<{ accessToken: string, newRefreshToken: string, session: Object }>}
 * @throws {Error} If refresh token is invalid or session not found / revoked
 */
export async function refreshAccessToken(refreshToken) {
  const config = getConfig();
  const { Session } = getModels();

  const decoded = jwt.verify(refreshToken, config.jwtSecret);

  const refreshTokenHash = sha256Hash(refreshToken);

  const session = await Session.findOne({ refreshTokenHash, revoked: false });

  if (!session) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = jwt.sign(
    { id: decoded.id },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  const newRefreshToken = jwt.sign(
    { id: decoded.id },
    config.jwtSecret,
    { expiresIn: config.refreshTokenExpiry }
  );

  const newRefreshTokenHash = sha256Hash(newRefreshToken);
  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();

  return { accessToken, newRefreshToken, session };
}
