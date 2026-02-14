import * as React from "react";
import { nanoid } from "nanoid";
import { ensureDemoAdmin, findUserByEmail, getSession, setSession, upsertUser, type User } from "@/lib/authStore";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(() => {
    ensureDemoAdmin();
    return getSession();
  });

  const login = async (email: string, password: string) => {
    const u = findUserByEmail(email);
    if (!u || u.password !== password) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const session: User = {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAtISO: u.createdAtISO,
    };
    setSession(session);
    setUserState(session);
  };

  const register = async (name: string, email: string, password: string) => {
    const exists = findUserByEmail(email);
    if (exists) throw new Error("EMAIL_EXISTS");
    const u = {
      id: nanoid(),
      email,
      name,
      role: "user" as const,
      createdAtISO: new Date().toISOString(),
      password,
    };
    upsertUser(u);
    const session: User = {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAtISO: u.createdAtISO,
    };
    setSession(session);
    setUserState(session);
  };

  const logout = () => {
    setSession(null);
    setUserState(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
