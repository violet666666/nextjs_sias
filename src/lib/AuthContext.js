"use client";
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({ user: null, setUser: () => {} });

function getInitialUser() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 