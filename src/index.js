/**
 * yt-auth — Configurable OTP + JWT authentication package for Express/Mongoose apps.
 *
 * Single entry point. Exports only the public API surface.
 */

// Config
export { init, getModels } from './config/store.js';

// OTP
export { generateOtp, verifyOtp } from './otp/otp.service.js';

// Tokens
export {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  refreshAccessToken,
} from './tokens/token.service.js';

// Middleware
export { authenticate } from './middleware/authenticate.js';

// Convenience Router
export { createAuthRouter } from './routes/auth.routes.js';

// Default export — all functions on a single object for `import ytAuth from 'yt-auth'` usage
import { init, getModels } from './config/store.js';
import { generateOtp, verifyOtp } from './otp/otp.service.js';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  refreshAccessToken,
} from './tokens/token.service.js';
import { authenticate } from './middleware/authenticate.js';
import { createAuthRouter } from './routes/auth.routes.js';

export default {
  init,
  getModels,
  generateOtp,
  verifyOtp,
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  refreshAccessToken,
  authenticate,
  createAuthRouter,
};
