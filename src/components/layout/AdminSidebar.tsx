import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Scissors, CalendarDays, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/services", label: "Services", icon: Scissors },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6">
        <h2 className="font-display text-lg font-bold text-sidebar-primary">Manager Portal</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === to
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
