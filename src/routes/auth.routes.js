/**
 * Convenience Express Router factory.
 * Creates a pre-wired auth router with all 7 original routes.
 * Consumers can mount this directly or build their own routes using the service functions.
 *
 * Route handlers are thin glue that parse req/res and delegate to services.
 * All original auth logic is preserved exactly.
 */

import { Router } from 'express';
import { getConfig, getModels } from '../config/store.js';
import { sha256Hash } from '../utils/hash.js';
import { generateOtp, verifyOtp } from '../otp/otp.service.js';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  refreshAccessToken,
} from '../tokens/token.service.js';

/**
 * Create an Express Router with all auth routes pre-wired.
 *
 * Routes:
 *   POST   /register       - Register a new user + send OTP
 *   POST   /login           - Login with email/password → access + refresh tokens
 *   GET    /get-me          - Get current user (requires Bearer token)
 *   GET    /refresh-token   - Rotate refresh token → new access + refresh tokens
 *   GET    /logout          - Revoke current session
 *   GET    /logout-all      - Revoke all user sessions
 *   GET    /verify-email    - Verify email with OTP
 *
 * @returns {import('express').Router}
 */
export function createAuthRouter() {
  const router = Router();

  /**
   * POST /register
   */
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const { User } = getModels();

      const isAlreadyRegistered = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (isAlreadyRegistered) {
        return res.status(409).json({
          message: 'Username or email already exists',
        });
      }

      const hashedPassword = sha256Hash(password);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      await generateOtp(email, user._id);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          username: user.username,
          email: user.email,
          verified: user.verified,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /login
   */
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const config = getConfig();
      const { User, Session } = getModels();

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.verified) {
        return res.status(401).json({ message: 'Email not verified' });
      }

      const hashedPassword = sha256Hash(password);
      const isPasswordValid = hashedPassword === user.password;

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const refreshToken = issueRefreshToken({ id: user._id });
      const refreshTokenHash = sha256Hash(refreshToken);

      const session = await Session.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const accessToken = issueAccessToken({
        id: user._id,
        sessionId: session._id,
      });

      res.cookie('refreshToken', refreshToken, config.cookieOptions);

      res.status(200).json({
        message: 'Logged in successfully',
        user: {
          username: user.username,
          email: user.email,
        },
        accessToken,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /get-me
   */
  router.get('/get-me', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Token not found' });
      }

      const decoded = verifyAccessToken(token);
      const { User } = getModels();
      const user = await User.findById(decoded.id);

      res.status(200).json({
        message: 'User fetched successfully',
        user: {
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  });

  /**
   * GET /refresh-token
   */
  router.get('/refresh-token', async (req, res) => {
    try {
      const currentRefreshToken = req.cookies.refreshToken;

      if (!currentRefreshToken) {
        return res.status(401).json({ message: 'Refresh token not found' });
      }

      const config = getConfig();
      const { accessToken, newRefreshToken } = await refreshAccessToken(currentRefreshToken);

      res.cookie('refreshToken', newRefreshToken, config.cookieOptions);

      res.status(200).json({
        message: 'Access token refreshed successfully',
        accessToken,
      });
    } catch (error) {
      const status = error.statusCode || 401;
      res.status(status).json({ message: error.message });
    }
  });

  /**
   * GET /logout
   */
  router.get('/logout', async (req, res) => {
    try {
      const currentRefreshToken = req.cookies.refreshToken;

      if (!currentRefreshToken) {
        return res.status(400).json({ message: 'Refresh token not found' });
      }

      const refreshTokenHash = sha256Hash(currentRefreshToken);
      const { Session } = getModels();

      const session = await Session.findOne({ refreshTokenHash, revoked: false });

      if (!session) {
        return res.status(400).json({ message: 'Invalid refresh token' });
      }

      session.revoked = true;
      await session.save();

      res.clearCookie('refreshToken');

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /logout-all
   */
  router.get('/logout-all', async (req, res) => {
    try {
      const currentRefreshToken = req.cookies.refreshToken;

      if (!currentRefreshToken) {
        return res.status(400).json({ message: 'Refresh token not found' });
      }

      const config = getConfig();
      const decoded = verifyAccessToken(currentRefreshToken);
      const { Session } = getModels();

      await Session.updateMany(
        { user: decoded.id, revoked: false },
        { revoked: true }
      );

      res.clearCookie('refreshToken');

      res.status(200).json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /verify-email
   */
  router.get('/verify-email', async (req, res) => {
    try {
      const { otp, email } = req.body;

      const result = await verifyOtp(email, otp);

      if (!result.success) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      res.status(200).json({
        message: 'Email verified successfully',
        user: result.user,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
}