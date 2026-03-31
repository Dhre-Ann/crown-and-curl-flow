import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearToken,
  getToken,
  loginRequest,
  meRequest,
  registerCustomerRequest,
  registerShopRequest,
  setToken,
  type ApiShop,
  type ApiUser,
} from "@/lib/api";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterCustomerPayload {
  name: string;
  email: string;
  password: string;
  shopSlug?: string;
}

interface RegisterShopPayload {
  name: string;
  email: string;
  password: string;
  shopName: string;
  shopSlug: string;
}

interface AuthContextType {
  user: ApiUser | null;
  shop: ApiShop | null;
  login: (payload: LoginPayload) => Promise<{ user: ApiUser; shop: ApiShop | null }>;
  registerCustomer: (payload: RegisterCustomerPayload) => Promise<{ user: ApiUser }>;
  registerShop: (payload: RegisterShopPayload) => Promise<{ user: ApiUser; shop: ApiShop }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [shop, setShop] = useState<ApiShop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await meRequest();
        setUser(me.user);
        setShop(me.shop ?? null);
      } catch {
        clearToken();
        setUser(null);
        setShop(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    setToken(response.token);
    setUser(response.user);
    setShop(response.shop ?? null);
    return { user: response.user, shop: response.shop ?? null };
  };

  const registerCustomer = async (payload: RegisterCustomerPayload) => {
    const response = await registerCustomerRequest(payload);
    setToken(response.token);
    setUser(response.user);
    setShop(null);
    return { user: response.user };
  };

  const registerShop = async (payload: RegisterShopPayload) => {
    const response = await registerShopRequest(payload);
    setToken(response.token);
    setUser(response.user);
    setShop(response.shop);
    return { user: response.user, shop: response.shop };
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setShop(null);
  };

  const value = useMemo(
    () => ({ user, shop, login, registerCustomer, registerShop, logout, loading }),
    [user, shop, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
