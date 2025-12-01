import { useAuth as useAuthContext } from './AuthContext';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function useAuth() {
  return useAuthContext();
}

export async function verifyToken(token) {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function generateToken(payload) {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
} 