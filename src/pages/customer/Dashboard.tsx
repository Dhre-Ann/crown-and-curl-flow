import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { mockAppointments } from "@/data/mockAppointments";
import { Calendar, Clock, Star } from "lucide-react";

const statusColors: Record<string, string> = {
  confirmed: "bg-accent/20 text-accent",
  pending: "bg-gold-light/20 text-warm-brown-light",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const myAppointments = mockAppointments.filter(a => a.customerEmail === user?.email);
  const upcoming = myAppointments.filter(a => a.status === "confirmed" || a.status === "pending");
  const past = myAppointments.filter(a => a.status === "completed");

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-3xl">
        <h1 className="heading-display text-3xl font-bold mb-2">
          Welcome back, <span className="text-gold-gradient">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground mb-8">Here's what's coming up.</p>

        {/* Upcoming */}
        <h2 className="font-display text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
            <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
            <Link to="/services" className="btn-gold text-sm">Book a Style</Link>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {upcoming.map(apt => (
              <div key={apt.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{apt.styleName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(apt.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{apt.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {apt.customizations.partSize} · {apt.customizations.length} · {apt.customizations.color}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[apt.status]}`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Past */}
        <h2 className="font-display text-xl font-semibold mb-4">Past Appointments</h2>
        {past.length === 0 ? (
          <p className="text-muted-foreground text-sm">No past appointments yet.</p>
        ) : (
          <div className="space-y-4">
            {past.map(apt => (
              <div key={apt.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{apt.styleName}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
                </div>
                <Link to="/customer/reviews/new" className="flex items-center gap-1 text-sm text-accent font-medium hover:underline">
                  <Star className="w-4 h-4" /> Leave a Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
