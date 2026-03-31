import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "shop_admin" || user?.role === "super_admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
          Crown <span className="text-gold-gradient">Studio</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Services
          </Link>
          {isLoggedIn && !isAdmin && (
            <Link to="/customer/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              My Appointments
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {user?.name}
              </span>
              <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-gold text-sm !py-2 !px-6">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 space-y-3">
          <Link to="/services" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Services</Link>
          {isLoggedIn && !isAdmin && (
            <Link to="/customer/dashboard" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">My Appointments</Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Dashboard</Link>
          )}
          {isLoggedIn ? (
            <button onClick={() => { handleLogout(); setOpen(false); }} className="block py-2 text-sm text-muted-foreground">Sign Out</button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-accent">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
