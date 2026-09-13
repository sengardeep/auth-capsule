/**
 * Internal configuration store — singleton.
 * All other modules import getConfig() from here instead of reading process.env.
 * @private
 */

import { createUserModel } from '../models/user.model.js';
import { createSessionModel } from '../models/session.model.js';
import { createOtpModel } from '../models/otp.model.js';

let _config = null;
let _models = null;

/**
 * Initialize the auth package. Must be called before using any other function.
 *
 * @param {Object} options
 * @param {import('mongoose')} options.mongoose         - A connected Mongoose instance (required)
 * @param {string}             options.jwtSecret        - Secret key for signing JWTs (required)
 * @param {Function}           options.emailAdapter     - async (to, subject, text, html) => void (required)
 * @param {string}            [options.accessTokenExpiry='15m']  - Access token lifetime
 * @param {string}            [options.refreshTokenExpiry='7d']  - Refresh token lifetime
 * @param {Object}            [options.cookieOptions]   - Cookie options for refresh token
 */
export function init(options = {}) {
  // Validate required fields
  if (!options.mongoose) {
    throw new Error('auth-capsule init(): "mongoose" is required — pass a connected Mongoose instance.');
  }
  if (!options.jwtSecret) {
    throw new Error('auth-capsule init(): "jwtSecret" is required.');
  }
  if (!options.emailAdapter || typeof options.emailAdapter !== 'function') {
    throw new Error('auth-capsule init(): "emailAdapter" is required and must be a function — async (to, subject, text, html) => void.');
  }

  _config = {
    mongoose: options.mongoose,
    jwtSecret: options.jwtSecret,
    emailAdapter: options.emailAdapter,
    accessTokenExpiry: options.accessTokenExpiry || '15m',
    refreshTokenExpiry: options.refreshTokenExpiry || '7d',
    cookieOptions: options.cookieOptions || {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  // Register Mongoose models on the provided instance
  _models = {
    User: createUserModel(_config.mongoose),
    Session: createSessionModel(_config.mongoose),
    Otp: createOtpModel(_config.mongoose),
  };

  return _config;
}

/**
 * Get the current config. Throws if init() has not been called.
 * @returns {Object}
 * @private
 */
export function getConfig() {
  if (!_config) {
    throw new Error('auth-capsule: init() must be called before using any auth functions.');
  }
  return _config;
}

/**
 * Get the registered Mongoose models. Throws if init() has not been called.
 * @returns {{ User: import('mongoose').Model, Session: import('mongoose').Model, Otp: import('mongoose').Model }}
 */
export function getModels() {
  if (!_models) {
    throw new Error('auth-capsule: init() must be called before accessing models.');
  }
  return _models;
}
