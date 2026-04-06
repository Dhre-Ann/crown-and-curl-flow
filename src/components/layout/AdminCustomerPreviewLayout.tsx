import { useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CustomerPreviewReadOnlyProvider } from "@/context/ShopAdminPreviewContext";
import { setCustomerPreviewShopSlug } from "@/lib/api";

/**
 * Nested under /admin/preview/* — same BrowserRouter as the rest of the app (no nested Router).
 * Sets tenant slug so catalog/booking requests stay scoped to the admin's shop.
 */
export default function AdminCustomerPreviewLayout() {
  const { user, shop } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "shop_admin" && shop?.slug) {
      setCustomerPreviewShopSlug(shop.slug);
      return () => setCustomerPreviewShopSlug(null);
    }
    setCustomerPreviewShopSlug(null);
    return undefined;
  }, [user?.role, shop?.slug]);

  if (user?.role !== "shop_admin") {
    return <Navigate to="/admin" replace />;
  }
  if (!shop?.slug) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CustomerPreviewReadOnlyProvider>
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <div
          role="status"
          className="sticky top-0 z-40 border-b border-border bg-secondary/95 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm font-medium text-foreground">
            Previewing as Customer — <span className="text-accent">{shop.name}</span>
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="text-sm font-medium rounded-lg border border-border bg-card px-4 py-2 hover:bg-muted transition-colors"
          >
            Exit customer view
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </CustomerPreviewReadOnlyProvider>
  );
}
