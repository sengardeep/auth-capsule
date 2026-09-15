/**
 * API layer — all fetch calls to the auth-capsule backend.
 * Base URL is read from NEXT_PUBLIC_API_URL env variable.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
}

export interface UserInfo {
  username: string;
  email: string;
  verified?: boolean;
}

export interface AuthResponse {
  message: string;
  user?: UserInfo;
  accessToken?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as ApiError).message ?? 'Something went wrong');
  }
  return data as T;
}

// ─── Auth API calls ───────────────────────────────────────────────────────────

/**
 * POST /register
 * Register a new user. Backend sends OTP email automatically.
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * POST /login
 * Login with email + password. Returns access token and sets refresh-token cookie.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * GET /get-me
 * Fetch current authenticated user. Requires Bearer access token.
 */
export async function getMe(accessToken: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/get-me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * GET /refresh-token
 * Rotate the refresh token. Uses HttpOnly cookie automatically.
 * Returns a new access token.
 */
export async function refreshToken(): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/refresh-token`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * GET /logout
 * Revoke the current session. Uses HttpOnly refresh-token cookie.
 */
export async function logout(): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/logout`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * GET /logout-all
 * Revoke all sessions for the current user.
 */
export async function logoutAll(): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/logout-all`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse<AuthResponse>(res);
}

/**
 * GET /verify-email
 * Verify email using OTP sent during registration.
 */
export async function verifyEmail(email: string, otp: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/verify-email`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, otp }),
  });
  return handleResponse<AuthResponse>(res);
}
