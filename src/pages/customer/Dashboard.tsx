import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCustomerTechsRequest,
  fetchMyAppointmentsRequest,
  shopServicesPath,
  type CustomerTech,
  type MyAppointment,
} from "@/lib/api";
import { Calendar, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const statusColors: Record<string, string> = {
  approved: "bg-accent/20 text-accent",
  pending: "bg-gold-light/20 text-warm-brown-light",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const RETURN_KEY = "crownReturnAfterLogin";
const APT_NOTES_KEY = "crownAppointmentNotesV1";

function readAppointmentNotes(): Record<string, string> {
  try {
    const r = localStorage.getItem(APT_NOTES_KEY);
    if (!r) return {};
    const o = JSON.parse(r) as unknown;
    return typeof o === "object" && o !== null && !Array.isArray(o) ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function persistAppointmentNote(aptId: string, text: string) {
  const all = readAppointmentNotes();
  const t = text.trim();
  if (!t) delete all[aptId];
  else all[aptId] = text;
  localStorage.setItem(APT_NOTES_KEY, JSON.stringify(all));
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [techs, setTechs] = useState<CustomerTech[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [techOpen, setTechOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<CustomerTech | null>(null);

  const [aptOpen, setAptOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<MyAppointment | null>(null);
  const [aptNote, setAptNote] = useState("");

  const openTech = (t: CustomerTech) => {
    setSelectedTech(t);
    setTechOpen(true);
  };

  const openApt = (a: MyAppointment) => {
    setSelectedApt(a);
    const notes = readAppointmentNotes();
    setAptNote(notes[a.id] ?? "");
    setAptOpen(true);
  };

  const saveAptNote = useCallback(() => {
    if (!selectedApt) return;
    persistAppointmentNote(selectedApt.id, aptNote);
    toast.success("Note saved on this device");
  }, [selectedApt, aptNote]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RETURN_KEY);
      if (raw && raw.startsWith("/checkout")) {
        sessionStorage.removeItem(RETURN_KEY);
        navigate(raw);
        return;
      }
    } catch {
      /* ignore */
    }
  }, [navigate]);

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

  const startOfToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  };
  const todayTs = startOfToday();
  const aptDayTs = (a: MyAppointment) => new Date(`${a.date}T12:00:00`).setHours(0, 0, 0, 0);

  const upcoming = appointments
    .filter(
      (a) =>
        (a.status === "pending" || a.status === "approved") && aptDayTs(a) >= todayTs
    )
    .sort((a, b) => aptDayTs(a) - aptDayTs(b) || a.time.localeCompare(b.time));
  const past = appointments.filter((a) => !upcoming.some((u) => u.id === a.id));

  const balanceDue = (a: MyAppointment) =>
    Math.round((a.totalPrice - a.depositAmount) * 100) / 100;

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
            When you book with a stylist, they will show up here so you can find them again easily.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 mb-10">
            {techs.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => openTech(t)}
                className="text-left bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-colors"
              >
                <h3 className="font-semibold">{t.shopName}</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {t.totalAppointments} appointment{t.totalAppointments === 1 ? "" : "s"} · Last visit:{" "}
                  {t.lastAppointmentDate}
                </p>
                <p className="text-xs text-accent mt-2">Tap for details</p>
              </button>
            ))}
          </div>
        )}

        <h2 className="font-display text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm mb-10">Loading…</p>
        ) : upcoming.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center mb-8">
            <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
            <Link to="/shops" className="btn-gold text-sm">
              Browse shops
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {upcoming.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => openApt(apt)}
                className="w-full text-left bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-accent/30 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-lg">{apt.style.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{apt.shop.name}</p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Deposit: ${apt.depositAmount.toFixed(2)} · Balance due: ${balanceDue(apt).toFixed(2)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${statusColors[apt.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {apt.status}
                </span>
              </button>
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
                className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-accent/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => openApt(apt)}
                  className="text-left flex-1 min-w-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <h3 className="font-semibold">{apt.style.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {apt.shop.name} · {new Date(apt.date + "T12:00:00").toLocaleDateString()} at {apt.time}
                  </p>
                  <p className="text-xs text-accent mt-1">View details</p>
                </button>
                {apt.status === "completed" ? (
                  <Link
                    to="/customer/reviews/new"
                    className="flex items-center gap-1 text-sm text-accent font-medium hover:underline shrink-0"
                  >
                    <Star className="w-4 h-4" /> Leave a Review
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground capitalize shrink-0">{apt.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={techOpen} onOpenChange={setTechOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTech?.shopName}</DialogTitle>
            <DialogDescription>
              {selectedTech?.totalAppointments} appointment
              {selectedTech?.totalAppointments === 1 ? "" : "s"} with this stylist. Last visit:{" "}
              {selectedTech?.lastAppointmentDate}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTechOpen(false)}>
              Close
            </Button>
            {selectedTech ? (
              <Button type="button" asChild>
                <Link to={shopServicesPath(selectedTech.slug)} onClick={() => setTechOpen(false)}>
                  Book again
                </Link>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aptOpen} onOpenChange={setAptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedApt?.style.name}</DialogTitle>
            <DialogDescription>{selectedApt?.shop.name}</DialogDescription>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(selectedApt.date + "T12:00:00").toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Time</span>
                <span>{selectedApt.time}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{selectedApt.status}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">${selectedApt.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Deposit paid</span>
                <span className="font-medium text-accent">${selectedApt.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Balance due</span>
                <span className="font-medium">${balanceDue(selectedApt).toFixed(2)}</span>
              </div>
              <div className="pt-2 space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="apt-note">
                  Your note (saved on this device only)
                </label>
                <Textarea
                  id="apt-note"
                  rows={3}
                  value={aptNote}
                  onChange={(e) => setAptNote(e.target.value)}
                  placeholder="e.g. bring reference photos…"
                  className="resize-none text-sm"
                />
                <Button type="button" variant="secondary" size="sm" onClick={saveAptNote}>
                  Save note
                </Button>
              </div>
              {selectedApt.status === "approved" ? (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Pay part or all of your balance before the appointment (optional).
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() =>
                      toast.message("Prepayment is not available yet", {
                        description: "You can pay the balance when you arrive. Card processing will be added in a future update.",
                      })
                    }
                  >
                    Pay in advance (coming soon)
                  </Button>
                </div>
              ) : selectedApt.status === "pending" ? (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Prepayment opens after the stylist approves your appointment.
                </p>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAptOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
