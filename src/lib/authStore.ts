// Design contract (Constructivist Techno‑Swiss)
// - Keep auth minimal & local-first for demo; avoid fake server data

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAtISO: string;
}

export interface StoredUser extends User {
  password: string; // demo only
}

const USERS_KEY = "yeoso.users";
const SESSION_KEY = "yeoso.session";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_KEY, []);
}

export function upsertUser(user: StoredUser) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  writeJson(USERS_KEY, users);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function setSession(user: User | null) {
  if (!user) localStorage.removeItem(SESSION_KEY);
  else writeJson(SESSION_KEY, user);
}

export function getSession(): User | null {
  return readJson<User | null>(SESSION_KEY, null);
}

export function ensureDemoAdmin() {
  const demoEmail = "admin@yeoso.demo";
  if (findUserByEmail(demoEmail)) return;
  upsertUser({
    id: "demo-admin",
    email: demoEmail,
    name: "Demo Admin",
    role: "admin",
    createdAtISO: new Date().toISOString(),
    password: "admin123",
  });
}
