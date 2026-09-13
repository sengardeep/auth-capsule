/**
 * User model factory.
 * Accepts a Mongoose instance and returns the compiled User model.
 */

/**
 * @param {import('mongoose')} mongoose
 * @returns {import('mongoose').Model}
 */
export function createUserModel(mongoose) {
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: [true, 'Username must be unique'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Email must be unique'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
  });

  return mongoose.model('users', userSchema);
}