import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCustomerTechsRequest,
  fetchMyAppointmentsRequest,
  getShopStorefrontHref,
  type CustomerTech,
  type MyAppointment,
} from "@/lib/api";
import { Calendar, Clock, Star } from "lucide-react";

const statusColors: Record<string, string> = {
  approved: "bg-accent/20 text-accent",
  pending: "bg-gold-light/20 text-warm-brown-light",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [techs, setTechs] = useState<CustomerTech[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const [apts, t] = await Promise.all([fetchMyAppointmentsRequest(), fetchCustomerTechsRequest()]);
        if (!cancelled) {
          setAppointments(apts);
          setTechs(t);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = appointments.filter((a) => a.status === "pending" || a.status === "approved");
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-3xl">
        <h1 className="heading-display text-3xl font-bold mb-2">
          Welcome back, <span className="text-gold-gradient">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground mb-8">Here's what's coming up.</p>

        {loadError && (
          <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg mb-6">{loadError}</p>
        )}

        <h2 className="font-display text-xl font-semibold mb-4">My Techs</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm mb-10">Loading…</p>
        ) : techs.length === 0 ? (
          <p className="text-muted-foreground text-sm mb-10">
            After you book with a shop, they will appear here. Open a shop’s site to book — in local dev, set{" "}
            <code className="text-xs bg-muted px-1 rounded">VITE_SHOP_SLUG</code> to that shop’s slug and restart
            the dev server.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 mb-10">
            {techs.map((t) => (
              <a
                key={t.slug}
                href={getShopStorefrontHref(t.slug)}
                className="bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-colors block"
              >
                <h3 className="font-semibold">{t.shopName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t.slug}</p>
                <p className="text-xs text-muted-foreground mt-2">Last visit: {t.lastAppointmentDate}</p>
              </a>
            ))}
          </div>
        )}

        <h2 className="font-display text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm mb-10">Loading…</p>
        ) : upcoming.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
            <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
            <Link to="/services" className="btn-gold text-sm">
              Book a Style
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {upcoming.map((apt) => (
              <div
                key={apt.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-lg">{apt.style.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {apt.shop.name}{" "}
                    <span className="text-xs opacity-80">({apt.shop.slug})</span>
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(apt.date + "T12:00:00").toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {apt.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Deposit paid: ${apt.depositAmount.toFixed(2)}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[apt.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-xl font-semibold mb-4">Past Appointments</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : past.length === 0 ? (
          <p className="text-muted-foreground text-sm">No past appointments yet.</p>
        ) : (
          <div className="space-y-4">
            {past.map((apt) => (
              <div
                key={apt.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold">{apt.style.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {apt.shop.name} ({apt.shop.slug})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(apt.date + "T12:00:00").toLocaleDateString()} at {apt.time}
                  </p>
                </div>
                {apt.status === "completed" ? (
                  <Link
                    to="/customer/reviews/new"
                    className="flex items-center gap-1 text-sm text-accent font-medium hover:underline"
                  >
                    <Star className="w-4 h-4" /> Leave a Review
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground capitalize">{apt.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
