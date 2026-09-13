/**
 * Session model factory.
 * Accepts a Mongoose instance and returns the compiled Session model.
 */

/**
 * @param {import('mongoose')} mongoose
 * @returns {import('mongoose').Model}
 */
export function createSessionModel(mongoose) {
  const sessionSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'User is required'],
      },
      refreshTokenHash: {
        type: String,
        required: [true, 'Refresh token hash is required'],
      },
      ip: {
        type: String,
        required: [true, 'IP address is required'],
      },
      userAgent: {
        type: String,
        required: [true, 'User agent is required'],
      },
      revoked: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.model('sessions', sessionSchema);
}