import { useState } from "react";
import { mockAppointments, Appointment } from "@/data/mockAppointments";
import { Calendar, DollarSign, Clock, Users, Check, X } from "lucide-react";

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

  const totalBookings = appointments.length;
  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const revenue = appointments.filter(a => a.status !== "cancelled").reduce((sum, a) => sum + a.totalPrice, 0);

  const updateStatus = (id: string, status: Appointment["status"]) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const statusColors: Record<string, string> = {
    confirmed: "bg-accent/20 text-accent",
    pending: "bg-gold-light/20 text-warm-brown-light",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <h1 className="heading-display text-3xl font-bold mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bookings", value: totalBookings, icon: Calendar, color: "text-accent" },
          { label: "Pending Approvals", value: pendingCount, icon: Clock, color: "text-gold" },
          { label: "Revenue This Month", value: `$${revenue}`, icon: DollarSign, color: "text-accent" },
          { label: "New Reviews", value: 4, icon: Users, color: "text-gold" },
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

      {/* Upcoming bookings table */}
      <h2 className="font-display text-xl font-semibold mb-4">Upcoming Bookings</h2>
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
              {appointments.filter(a => a.status !== "completed").map(apt => (
                <tr key={apt.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{apt.customerName}</td>
                  <td className="p-4">{apt.styleName}</td>
                  <td className="p-4">{new Date(apt.date).toLocaleDateString()}</td>
                  <td className="p-4">{apt.time}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[apt.status]}`}>{apt.status}</span>
                  </td>
                  <td className="p-4">
                    {apt.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(apt.id, "confirmed")} className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(apt.id, "cancelled")} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
