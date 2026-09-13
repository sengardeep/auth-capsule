/**
 * OTP service — public API for OTP generation and verification.
 * Extracted from the old auth.controller.js register + verifyEmail handlers.
 * Auth logic is preserved exactly as-is.
 */

import { getConfig, getModels } from '../config/store.js';
import { sha256Hash } from '../utils/hash.js';
import { generateRandomOtp, getOtpHtml } from './otp.utils.js';

/**
 * Generate an OTP for a user, store its hash in the database, and send it via email.
 *
 * @param {string} email      - Recipient email address
 * @param {string} userId     - Mongoose ObjectId of the user
 * @returns {Promise<{ otp: string, otpHash: string }>}
 */
export async function generateOtp(email, userId) {
  const config = getConfig();
  const { Otp } = getModels();

  const otp = generateRandomOtp();
  const html = getOtpHtml(otp);
  const otpHash = sha256Hash(otp);

  await Otp.create({
    email,
    user: userId,
    otpHash,
  });

  await config.emailAdapter(email, 'OTP Verification', `Your OTP code is ${otp}`, html);

  return { otp, otpHash };
}

/**
 * Verify an OTP against the stored hash, mark the user as verified, and clean up OTP records.
 *
 * @param {string} email - The email the OTP was sent to
 * @param {string} otp   - The plaintext OTP to verify
 * @returns {Promise<{ success: boolean, user?: Object }>}
 */
export async function verifyOtp(email, otp) {
  const { User, Otp } = getModels();

  const otpHash = sha256Hash(otp);

  const otpDoc = await Otp.findOne({ email, otpHash });

  if (!otpDoc) {
    return { success: false };
  }

  const user = await User.findByIdAndUpdate(otpDoc.user, { verified: true }, { new: true });

  await Otp.deleteMany({ user: otpDoc.user });

  return {
    success: true,
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  };
}
