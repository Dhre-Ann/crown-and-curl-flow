import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchShopAppointmentsAdminRequest,
  fetchShopBookingPreferencesRequest,
  patchAppointmentStatusRequest,
  type ShopAppointmentRow,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Calendar, DollarSign, Clock, Users, Check, X, Eye } from "lucide-react";

function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addWeeksYmdLocal(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ymdInCurrentMonth(ymd: string): boolean {
  const [y, mo, day] = ymd.split("-").map(Number);
  if (!y || !mo || !day) return false;
  const now = new Date();
  return y === now.getFullYear() && mo === now.getMonth() + 1;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<ShopAppointmentRow[]>([]);
  const [upcomingWeeks, setUpcomingWeeks] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [apts, prefs] = await Promise.all([
        fetchShopAppointmentsAdminRequest(),
        fetchShopBookingPreferencesRequest(),
      ]);
      setAppointments(apts);
      setUpcomingWeeks(prefs.upcomingBookingWeeks);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load dashboard");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalBookings = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  const revenueThisMonth = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled" && ymdInCurrentMonth(a.date))
        .reduce((sum, a) => sum + a.totalPrice, 0),
    [appointments]
  );

  const upcomingBookings = useMemo(() => {
    const start = todayYmdLocal();
    const end = addWeeksYmdLocal(upcomingWeeks);
    return appointments
      .filter((a) => {
        if (a.status === "cancelled" || a.status === "completed") return false;
        return a.date >= start && a.date <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [appointments, upcomingWeeks]);

  const updateStatus = async (id: string, status: "approved" | "cancelled" | "completed") => {
    try {
      await patchAppointmentStatusRequest(id, status);
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const statusColors: Record<string, string> = {
    approved: "bg-accent/20 text-accent",
    pending: "bg-gold-light/20 text-warm-brown-light",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="heading-display text-3xl font-bold">Dashboard</h1>
        {user?.role === "shop_admin" ? (
          <button
            type="button"
            onClick={() => navigate("/admin/preview/services")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
            Customer view
          </button>
        ) : null}
      </div>

      {loadError && (
        <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg mb-4">{loadError}</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bookings", value: loading ? "…" : totalBookings, icon: Calendar, color: "text-accent" },
          { label: "Pending Approvals", value: loading ? "…" : pendingCount, icon: Clock, color: "text-gold" },
          {
            label: "Revenue This Month",
            value: loading ? "…" : `$${revenueThisMonth.toFixed(2)}`,
            icon: DollarSign,
            color: "text-accent",
          },
          { label: "New Reviews", value: "—", icon: Users, color: "text-gold" },
        ].map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <span className="font-display text-2xl font-bold">{card.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="font-display text-xl font-semibold">Upcoming Bookings</h2>
        <p className="text-xs text-muted-foreground">
          Next {upcomingWeeks} week{upcomingWeeks === 1 ? "" : "s"} (change under Settings → Booking)
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Time</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-muted-foreground text-center">
                    Loading…
                  </td>
                </tr>
              ) : upcomingBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-muted-foreground text-center">
                    No upcoming bookings in this range.
                  </td>
                </tr>
              ) : (
                upcomingBookings.map((apt) => (
                  <tr key={apt.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{apt.customerName}</td>
                    <td className="p-4">{apt.styleName}</td>
                    <td className="p-4">{new Date(apt.date + "T12:00:00").toLocaleDateString()}</td>
                    <td className="p-4">{apt.time}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[apt.status] ?? "bg-muted"}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {apt.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void updateStatus(apt.id, "approved")}
                            className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateStatus(apt.id, "cancelled")}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
