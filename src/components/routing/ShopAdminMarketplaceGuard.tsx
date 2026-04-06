import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Shop admins use /admin (and /admin/preview/* for storefront preview), not the public marketplace.
 */
export default function ShopAdminMarketplaceGuard({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "shop_admin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
