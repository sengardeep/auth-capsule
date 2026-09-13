# auth-capsule

Configurable OTP + JWT authentication package for Express/Mongoose apps.

Provides email-based OTP verification, JWT access/refresh token management, session tracking, and Express middleware — all without hardcoded secrets, database connections, or email providers.

## Installation

```bash
npm install auth-capsule
```

### Peer Dependencies

You must install these in your consuming app:

```bash
npm install express mongoose
```

## Quick Start

```js
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import ytAuth from 'auth-capsule';

// 1. Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/myapp');

// 2. Set up your email transport (any provider)
const transporter = nodemailer.createTransport({ /* your config */ });

// 3. Initialize yt-auth
ytAuth.init({
  mongoose,
  jwtSecret: process.env.JWT_SECRET,
  emailAdapter: async (to, subject, text, html) => {
    await transporter.sendMail({ from: '"My App" <noreply@myapp.com>', to, subject, text, html });
  },
  // Optional overrides:
  // accessTokenExpiry: '15m',
  // refreshTokenExpiry: '7d',
  // cookieOptions: { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 604800000 }
});

// 4. Create Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// 5. Mount the convenience auth router
const authRouter = ytAuth.createAuthRouter();
app.use('/api/auth', authRouter);

// 6. Protect routes with authenticate() middleware
app.get('/api/profile', ytAuth.authenticate(), (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## API Reference

### `init(options)`

Must be called once before using any other function.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `mongoose` | `Mongoose` | ✅ | — | A connected Mongoose instance |
| `jwtSecret` | `string` | ✅ | — | Secret key for signing JWTs |
| `emailAdapter` | `Function` | ✅ | — | `async (to, subject, text, html) => void` |
| `accessTokenExpiry` | `string` | ❌ | `'15m'` | Access token lifetime (e.g. `'1h'`, `'30m'`) |
| `refreshTokenExpiry` | `string` | ❌ | `'7d'` | Refresh token lifetime (e.g. `'30d'`) |
| `cookieOptions` | `Object` | ❌ | `{ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 604800000 }` | Cookie options for refresh token |

---

### OTP Functions

#### `generateOtp(email, userId)`

Generates a 6-digit OTP, stores its hash in the database, and sends it via the configured `emailAdapter`.

- **Returns:** `Promise<{ otp: string, otpHash: string }>`

#### `verifyOtp(email, otp)`

Verifies an OTP against stored hashes. On success, marks the user as verified and deletes all OTP records for that user.

- **Returns:** `Promise<{ success: boolean, user?: { username, email, verified } }>`

---

### Token Functions

#### `issueAccessToken(payload)`

Signs a JWT access token with the configured secret and expiry.

- **Returns:** `string` — Signed JWT

#### `issueRefreshToken(payload)`

Signs a JWT refresh token with the configured secret and expiry.

- **Returns:** `string` — Signed JWT

#### `verifyAccessToken(token)`

Verifies and decodes a JWT access token.

- **Returns:** `Object` — Decoded payload
- **Throws:** `JsonWebTokenError`, `TokenExpiredError`

#### `refreshAccessToken(refreshToken)`

Rotates a refresh token: verifies the old one, creates a new access + refresh token pair, and updates the session in the database.

- **Returns:** `Promise<{ accessToken: string, newRefreshToken: string, session: Object }>`
- **Throws:** `Error` with `statusCode: 401` if token is invalid or session is revoked

---

### Middleware

#### `authenticate()`

Returns an Express middleware that:
1. Extracts the Bearer token from the `Authorization` header
2. Verifies the JWT
3. Fetches the user from the database
4. Attaches `req.user` with `{ id, username, email, verified }`

```js
app.get('/protected', ytAuth.authenticate(), (req, res) => {
  res.json({ user: req.user });
});
```

---

### Convenience Router

#### `createAuthRouter()`

Returns a pre-wired Express Router with these routes:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new user + send OTP |
| POST | `/login` | Login → access token + refresh token cookie |
| GET | `/get-me` | Get current user (requires Bearer token) |
| GET | `/refresh-token` | Rotate tokens (requires refresh token cookie) |
| GET | `/logout` | Revoke current session |
| GET | `/logout-all` | Revoke all user sessions |
| GET | `/verify-email` | Verify email with OTP |

---

### Models

#### `getModels()`

Returns the Mongoose models registered during `init()`:

```js
const { User, Session, Otp } = ytAuth.getModels();
```

---

## Using Individual Functions (Without the Router)

You can skip the convenience router and call service functions directly:

```js
import { init, generateOtp, verifyOtp, issueAccessToken, authenticate } from 'auth-capsule';

// After init()...

app.post('/signup', async (req, res) => {
  // Create user your way, then:
  const { otp } = await generateOtp(user.email, user._id);
  res.json({ message: 'OTP sent' });
});

app.post('/verify', async (req, res) => {
  const result = await verifyOtp(req.body.email, req.body.otp);
  res.json(result);
});

app.get('/dashboard', authenticate(), (req, res) => {
  res.json({ welcome: req.user.username });
});
```

## License

MIT
