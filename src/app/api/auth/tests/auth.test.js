/**
 * Jest Test Suite: MODULE AUTHENTICATION
 * 
 * Test Cases:
 * TC-01: Login email+pwd valid (FR-001 - Positive)
 * TC-02: Login password salah (FR-001 - Negative)
 * TC-03: Logout & session hapus (FR-002 - Positive)
 * TC-04: Register email baru (FR-003 - Positive)
 * TC-05: Register email duplikat (FR-003 - Negative)
 * TC-06: Refresh token (FR-004 - Positive/Negative)
 * TC-07: Verify token (FR-005 - Positive/Negative)
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Mock modules
jest.mock('@/lib/db', () => jest.fn());
jest.mock('@/lib/auditLogger', () => ({
    logAuthAction: jest.fn(),
    logCRUDAction: jest.fn(),
}));
jest.mock('@/lib/authMiddleware', () => ({
    authenticateAndAuthorize: jest.fn(),
    verifyToken: jest.fn(),
}));

// Mock userModel
const mockUser = {
    _id: 'user123',
    nama: 'Test User',
    email: 'test@example.com',
    password_hash: '$2a$10$hashedpassword',
    role: 'siswa',
    comparePassword: jest.fn(),
};

jest.mock('@/lib/models/userModel', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

// Import after mocks
import userModel from '@/lib/models/userModel';
import { authenticateAndAuthorize, verifyToken } from '@/lib/authMiddleware';

// Helper: Create mock request
const createMockRequest = (body = {}, headers = {}, cookies = {}) => ({
    json: jest.fn().mockResolvedValue(body),
    headers: {
        get: jest.fn((key) => headers[key] || null),
    },
    cookies: {
        get: jest.fn((key) => cookies[key] ? { value: cookies[key] } : undefined),
    },
});

// ========================
// A. MODULE AUTHENTICATION
// ========================

describe('A. MODULE AUTHENTICATION', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------
    // TC-01: Login email+pwd valid (FR-001 - Positive)
    // --------------------------------
    describe('TC-01: Login email+pwd valid (FR-001 - Positive)', () => {
        it('berhasil login dengan kredensial valid dan mengembalikan JWT', async () => {
            // Arrange
            const mockRequest = createMockRequest({
                email: 'test@example.com',
                password: 'Password123!',
            });

            mockUser.comparePassword.mockResolvedValue(true);
            userModel.findOne.mockResolvedValue(mockUser);

            // Act
            const { POST } = await import('@/app/api/auth/login/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data.token).toBeDefined();
            expect(data.user.email).toBe('test@example.com');
            expect(data.message).toBe('Login successful');
        });
    });

    // --------------------------------
    // TC-02: Login password salah (FR-001 - Negative)
    // --------------------------------
    describe('TC-02: Login password salah (FR-001 - Negative)', () => {
        it('gagal login jika password salah', async () => {
            // Arrange
            const mockRequest = createMockRequest({
                email: 'test@example.com',
                password: 'WrongPassword',
            });

            mockUser.comparePassword.mockResolvedValue(false);
            userModel.findOne.mockResolvedValue(mockUser);

            // Act
            const { POST } = await import('@/app/api/auth/login/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data.message).toBe('Invalid email or password');
        });
    });

    // --------------------------------
    // TC-03: Logout & session hapus (FR-002 - Positive)
    // --------------------------------
    describe('TC-03: Logout & session hapus (FR-002 - Positive)', () => {
        it('berhasil logout dan menghapus cookie refresh token', async () => {
            // Arrange
            const validToken = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
            const mockRequest = createMockRequest({}, {
                'authorization': `Bearer ${validToken}`,
            }, {
                'refreshToken': validToken,
            });

            verifyToken.mockReturnValue({ success: true, decoded: { id: 'user123' } });

            // Act
            const { POST } = await import('@/app/api/auth/logout/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data.message).toBe('Logged out successfully');
            // Cookie should be cleared (maxAge: 0)
        });
    });

    // --------------------------------
    // TC-04: Register email baru (FR-003 - Positive)
    // --------------------------------
    describe('TC-04: Register email baru (FR-003 - Positive)', () => {
        it('berhasil registrasi user baru', async () => {
            // Arrange
            const newUser = {
                nama: 'New User',
                email: 'newuser@example.com',
                password: 'Password123!',
                role: 'siswa',
            };
            const mockRequest = createMockRequest(newUser);

            authenticateAndAuthorize.mockResolvedValue({
                user: { id: 'admin123', role: 'admin' },
            });
            userModel.findOne.mockResolvedValue(null); // No existing user
            userModel.create.mockResolvedValue({
                _id: 'newuser123',
                nama: 'New User',
                email: 'newuser@example.com',
                role: 'siswa',
            });

            // Act
            const { POST } = await import('@/app/api/auth/register/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(201);
            expect(data.message).toBe('User created');
            expect(data.user.email).toBe('newuser@example.com');
        });
    });

    // --------------------------------
    // TC-05: Register email duplikat (FR-003 - Negative)
    // --------------------------------
    describe('TC-05: Register email duplikat (FR-003 - Negative)', () => {
        it('gagal registrasi jika email duplikat', async () => {
            // Arrange
            const existingUser = {
                nama: 'Existing User',
                email: 'existing@example.com',
                password: 'Password123!',
            };
            const mockRequest = createMockRequest(existingUser);

            authenticateAndAuthorize.mockResolvedValue({
                user: { id: 'admin123', role: 'admin' },
            });
            userModel.findOne.mockResolvedValue({ email: 'existing@example.com' }); // User exists

            // Act
            const { POST } = await import('@/app/api/auth/register/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(409);
            expect(data.message).toBe('User already exists');
        });
    });

    // --------------------------------
    // TC-06: Refresh token (FR-004 - Positive/Negative)
    // --------------------------------
    describe('TC-06: Refresh token (FR-004 - Positive)', () => {
        it('berhasil generate token baru jika refresh token valid', async () => {
            // Arrange
            const refreshToken = jwt.sign(
                { id: 'user123', nama: 'Test', email: 'test@example.com', role: 'siswa' },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );
            const mockRequest = createMockRequest({}, {}, {
                'refreshToken': refreshToken,
            });

            // Act
            const { POST } = await import('@/app/api/auth/refresh/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data.token).toBeDefined();
        });

        it('gagal (401) jika refresh token tidak ada', async () => {
            // Arrange
            const mockRequest = createMockRequest({}, {}, {});

            // Act
            const { POST } = await import('@/app/api/auth/refresh/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data.error).toBe('Refresh token tidak ditemukan.');
        });

        it('gagal (401) jika refresh token tidak valid', async () => {
            // Arrange
            const mockRequest = createMockRequest({}, {}, {
                'refreshToken': 'invalid-token',
            });

            // Act
            const { POST } = await import('@/app/api/auth/refresh/route');
            const response = await POST(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data.error).toBe('Refresh token tidak valid.');
        });
    });

    // --------------------------------
    // TC-07: Verify token (FR-005 - Positive/Negative)
    // --------------------------------
    describe('TC-07: Verify token (FR-005 - Positive)', () => {
        it('berhasil mengembalikan data user & role jika JWT valid', async () => {
            // Arrange
            const validToken = jwt.sign(
                { id: 'user123', nama: 'Test User', email: 'test@example.com', role: 'siswa' },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            const mockRequest = createMockRequest({}, {
                'authorization': `Bearer ${validToken}`,
            });

            // Act
            const { GET } = await import('@/app/api/auth/verify/route');
            const response = await GET(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data.id).toBe('user123');
            expect(data.email).toBe('test@example.com');
            expect(data.role).toBe('siswa');
        });

        it('gagal (401) jika token tidak ada', async () => {
            // Arrange
            const mockRequest = createMockRequest({}, {});

            // Act
            const { GET } = await import('@/app/api/auth/verify/route');
            const response = await GET(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('gagal (401) jika token tidak valid', async () => {
            // Arrange
            const mockRequest = createMockRequest({}, {
                'authorization': 'Bearer invalid-token',
            });

            // Act
            const { GET } = await import('@/app/api/auth/verify/route');
            const response = await GET(mockRequest);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data.error).toBe('Invalid token');
        });
    });
});
