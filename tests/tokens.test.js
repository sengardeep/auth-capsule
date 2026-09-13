/**
 * Tests for token issuance, verification, expiry, and refresh flow.
 */

import { jest } from '@jest/globals';

// We need to mock mongoose before importing the modules
const mockSession = {
  refreshTokenHash: 'old-hash',
  revoked: false,
  save: jest.fn().mockResolvedValue(true),
};

const mockModels = {
  User: {},
  Session: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
  Otp: {},
};

// Mock the store module
jest.unstable_mockModule('../src/config/store.js', () => ({
  init: jest.fn(),
  getConfig: jest.fn(() => ({
    jwtSecret: 'test-secret-key-for-jwt-signing-12345',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  })),
  getModels: jest.fn(() => mockModels),
}));

// Now import the module under test (after mocks are set up)
const { issueAccessToken, issueRefreshToken, verifyAccessToken, refreshAccessToken } =
  await import('../src/tokens/token.service.js');
const jwt = (await import('jsonwebtoken')).default;

const TEST_SECRET = 'test-secret-key-for-jwt-signing-12345';

describe('Token Service', () => {
  describe('issueAccessToken', () => {
    it('should return a valid JWT string', () => {
      const token = issueAccessToken({ id: 'user123', sessionId: 'sess456' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should encode the payload correctly', () => {
      const payload = { id: 'user123', sessionId: 'sess456' };
      const token = issueAccessToken(payload);
      const decoded = jwt.verify(token, TEST_SECRET);

      expect(decoded.id).toBe('user123');
      expect(decoded.sessionId).toBe('sess456');
      expect(decoded.exp).toBeDefined();
    });

    it('should set the correct expiry (15m default)', () => {
      const token = issueAccessToken({ id: 'user123' });
      const decoded = jwt.verify(token, TEST_SECRET);

      const expectedExpiry = decoded.iat + 15 * 60; // 15 minutes in seconds
      expect(decoded.exp).toBe(expectedExpiry);
    });
  });

  describe('issueRefreshToken', () => {
    it('should return a valid JWT string', () => {
      const token = issueRefreshToken({ id: 'user123' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should set the correct expiry (7d default)', () => {
      const token = issueRefreshToken({ id: 'user123' });
      const decoded = jwt.verify(token, TEST_SECRET);

      const expectedExpiry = decoded.iat + 7 * 24 * 60 * 60; // 7 days in seconds
      expect(decoded.exp).toBe(expectedExpiry);
    });
  });

  describe('verifyAccessToken', () => {
    it('should decode a valid token', () => {
      const token = issueAccessToken({ id: 'user123', role: 'admin' });
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe('user123');
      expect(decoded.role).toBe('admin');
    });

    it('should throw on an invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.string')).toThrow();
    });

    it('should throw on a token signed with a different secret', () => {
      const token = jwt.sign({ id: 'user123' }, 'wrong-secret', { expiresIn: '15m' });
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should throw on an expired token', () => {
      const token = jwt.sign({ id: 'user123' }, TEST_SECRET, { expiresIn: '0s' });
      // Need a tiny delay for the token to actually expire
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access and refresh tokens on valid refresh', async () => {
      const refreshToken = issueRefreshToken({ id: 'user123' });

      mockModels.Session.findOne.mockResolvedValue(mockSession);
      mockSession.save.mockResolvedValue(true);

      const result = await refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.newRefreshToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.newRefreshToken).toBe('string');

      // Verify the new access token is valid
      const decoded = jwt.verify(result.accessToken, TEST_SECRET);
      expect(decoded.id).toBe('user123');
    });

    it('should throw when session is not found', async () => {
      const refreshToken = issueRefreshToken({ id: 'user123' });

      mockModels.Session.findOne.mockResolvedValue(null);

      await expect(refreshAccessToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw on an invalid refresh token', async () => {
      await expect(refreshAccessToken('totally-invalid-token')).rejects.toThrow();
    });

    it('should update the session with the new refresh token hash', async () => {
      const refreshToken = issueRefreshToken({ id: 'user123' });

      mockModels.Session.findOne.mockResolvedValue(mockSession);
      mockSession.save.mockResolvedValue(true);

      await refreshAccessToken(refreshToken);

      // Session should have been updated with a new hash
      expect(mockSession.refreshTokenHash).not.toBe('old-hash');
      expect(mockSession.save).toHaveBeenCalled();
    });
  });
});
