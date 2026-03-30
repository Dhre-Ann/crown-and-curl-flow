import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Role = "customer" | "admin" | null;

interface User {
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, { password: string; name: string; role: Role }> = {
  "customer@demo.com": { password: "password", name: "Nia Johnson", role: "customer" },
  "admin@demo.com": { password: "password", name: "Crown Studio", role: "admin" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("braider_auth");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const mock = MOCK_USERS[email];
    if (mock && mock.password === password) {
      const u = { email, name: mock.name, role: mock.role };
      setUser(u);
      localStorage.setItem("braider_auth", JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("braider_auth");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin", isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
