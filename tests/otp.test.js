/**
 * Tests for OTP generation, hashing, and verification flow.
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Mock email adapter
const mockEmailAdapter = jest.fn().mockResolvedValue(undefined);

// Mock Mongoose models
const mockOtpCreate = jest.fn().mockResolvedValue({});
const mockOtpFindOne = jest.fn();
const mockOtpDeleteMany = jest.fn().mockResolvedValue({});
const mockUserFindByIdAndUpdate = jest.fn();

const mockModels = {
  User: {
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
  },
  Session: {},
  Otp: {
    create: mockOtpCreate,
    findOne: mockOtpFindOne,
    deleteMany: mockOtpDeleteMany,
  },
};

// Mock the store module
jest.unstable_mockModule('../src/config/store.js', () => ({
  init: jest.fn(),
  getConfig: jest.fn(() => ({
    jwtSecret: 'test-secret',
    emailAdapter: mockEmailAdapter,
  })),
  getModels: jest.fn(() => mockModels),
}));

// Import modules after mocking
const { generateOtp, verifyOtp } = await import('../src/otp/otp.service.js');

// Also test the pure utility functions directly
const { generateRandomOtp, getOtpHtml } = await import('../src/otp/otp.utils.js');

describe('OTP Utilities', () => {
  describe('generateRandomOtp', () => {
    it('should return a 6-digit string', () => {
      const otp = generateRandomOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should return different values on successive calls', () => {
      const otps = new Set();
      for (let i = 0; i < 20; i++) {
        otps.add(generateRandomOtp());
      }
      // With 20 calls, we should have at least 2 distinct values
      // (probability of all 20 being identical is astronomically low)
      expect(otps.size).toBeGreaterThan(1);
    });

    it('should return values in the range 100000-999999', () => {
      for (let i = 0; i < 50; i++) {
        const otp = parseInt(generateRandomOtp(), 10);
        expect(otp).toBeGreaterThanOrEqual(100000);
        expect(otp).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('getOtpHtml', () => {
    it('should return an HTML string containing the OTP', () => {
      const html = getOtpHtml('123456');
      expect(html).toContain('123456');
      expect(html).toContain('<html');
      expect(html).toContain('OTP');
    });
  });
});

describe('OTP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should create an OTP document in the database', async () => {
      const result = await generateOtp('test@example.com', 'user-id-123');

      expect(mockOtpCreate).toHaveBeenCalledTimes(1);
      const createArg = mockOtpCreate.mock.calls[0][0];
      expect(createArg.email).toBe('test@example.com');
      expect(createArg.user).toBe('user-id-123');
      expect(createArg.otpHash).toBeDefined();
      expect(typeof createArg.otpHash).toBe('string');
    });

    it('should send an email via the emailAdapter', async () => {
      await generateOtp('test@example.com', 'user-id-123');

      expect(mockEmailAdapter).toHaveBeenCalledTimes(1);
      const [to, subject, text, html] = mockEmailAdapter.mock.calls[0];
      expect(to).toBe('test@example.com');
      expect(subject).toBe('OTP Verification');
      expect(text).toContain('OTP code');
      expect(html).toContain('<html');
    });

    it('should return the OTP and its hash', async () => {
      const result = await generateOtp('test@example.com', 'user-id-123');

      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.otpHash).toBeDefined();

      // Verify hash consistency
      const expectedHash = crypto.createHash('sha256').update(result.otp).digest('hex');
      expect(result.otpHash).toBe(expectedHash);
    });
  });

  describe('verifyOtp', () => {
    it('should return success and user data for a valid OTP', async () => {
      const mockUser = {
        _id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        verified: true,
      };

      mockOtpFindOne.mockResolvedValue({
        user: 'user-id-123',
        email: 'test@example.com',
      });
      mockUserFindByIdAndUpdate.mockResolvedValue(mockUser);
      mockOtpDeleteMany.mockResolvedValue({});

      const result = await verifyOtp('test@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        verified: true,
      });
    });

    it('should verify the OTP hash matches', async () => {
      mockOtpFindOne.mockResolvedValue(null);

      await verifyOtp('test@example.com', '123456');

      const expectedHash = crypto.createHash('sha256').update('123456').digest('hex');
      expect(mockOtpFindOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        otpHash: expectedHash,
      });
    });

    it('should return failure for an invalid OTP', async () => {
      mockOtpFindOne.mockResolvedValue(null);

      const result = await verifyOtp('test@example.com', '000000');

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
    });

    it('should delete all OTP records for the user after verification', async () => {
      mockOtpFindOne.mockResolvedValue({
        user: 'user-id-123',
        email: 'test@example.com',
      });
      mockUserFindByIdAndUpdate.mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        verified: true,
      });

      await verifyOtp('test@example.com', '123456');

      expect(mockOtpDeleteMany).toHaveBeenCalledWith({ user: 'user-id-123' });
    });

    it('should mark the user as verified', async () => {
      mockOtpFindOne.mockResolvedValue({
        user: 'user-id-123',
        email: 'test@example.com',
      });
      mockUserFindByIdAndUpdate.mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        verified: true,
      });

      await verifyOtp('test@example.com', '123456');

      expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
        'user-id-123',
        { verified: true },
        { new: true }
      );
    });
  });
});
