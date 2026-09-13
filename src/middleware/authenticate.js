/**
 * Express authentication middleware.
 * Extracted from the old getMe controller's token-checking logic.
 *
 * Verifies the Bearer token from the Authorization header,
 * fetches the user from the database, and attaches it to req.user.
 */

import { verifyAccessToken } from '../tokens/token.service.js';
import { getModels } from '../config/store.js';

/**
 * Returns an Express middleware that authenticates requests via JWT Bearer tokens.
 *
 * Usage:
 *   app.get('/protected', ytAuth.authenticate(), (req, res) => { ... })
 *
 * @returns {Function} Express middleware (req, res, next)
 */
export function authenticate() {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Token not found' });
      }

      const decoded = verifyAccessToken(token);
      const { User } = getModels();
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
