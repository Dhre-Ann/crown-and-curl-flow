import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import { LayoutDashboard, Scissors, CalendarDays, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Home" },
  { to: "/admin/services", icon: Scissors, label: "Services" },
  { to: "/admin/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/admin/reviews", icon: Star, label: "Reviews" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const { isAdmin, isLoggedIn } = useAuth();
  const { pathname } = useLocation();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to view this page.</p>
        <Link to="/" className="btn-gold">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
        <Outlet />
      </main>
      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border flex justify-around py-2 z-50">
        {mobileLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-0.5 text-xs px-2 py-1 rounded transition-colors",
              pathname === to ? "text-sidebar-primary" : "text-sidebar-foreground/60"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
