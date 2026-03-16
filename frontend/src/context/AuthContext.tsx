import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types/models';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const tokenStorageKey = 'masterticket_token';
const userStorageKey = 'masterticket_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenStorageKey));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const rawUser = localStorage.getItem(userStorageKey);
    return rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login: (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
        localStorage.setItem(tokenStorageKey, nextToken);
        localStorage.setItem(userStorageKey, JSON.stringify(nextUser));
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(tokenStorageKey);
        localStorage.removeItem(userStorageKey);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
