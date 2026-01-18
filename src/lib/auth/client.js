'use client';

import jwt from 'jsonwebtoken';
import { canAccessRoute } from './roles';

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return false;

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) return false;

    return true;
  } catch (error) {
    return false;
  }
}

export function getUser() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

export function checkAccess(path) {
  const user = getUser();
  if (!user) return false;
  return canAccessRoute(user.role, path);
} 