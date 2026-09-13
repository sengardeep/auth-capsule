/**
 * OTP model factory.
 * Accepts a Mongoose instance and returns the compiled Otp model.
 */

/**
 * @param {import('mongoose')} mongoose
 * @returns {import('mongoose').Model}
 */
export function createOtpModel(mongoose) {
  const otpSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: [true, 'Email is required'],
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'User is required'],
      },
      otpHash: {
        type: String,
        required: [true, 'OTP hash is required'],
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.model('otps', otpSchema);
}