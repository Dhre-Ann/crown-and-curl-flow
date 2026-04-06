import { useEffect, useState } from "react";
import {
  fetchShopBookingPreferencesRequest,
  updateShopBookingPreferencesRequest,
} from "@/lib/api";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    businessName: "Crown Studio",
    contactEmail: "hello@crownstudio.com",
    contactPhone: "(555) 123-4567",
    depositPercent: "30",
    latePolicy: "A $25 late fee applies after a 15-minute grace period.",
    cancelPolicy: "Cancellations require at least 48 hours notice. Late cancellations forfeit the deposit.",
    noshowPolicy: "No-shows result in forfeiture of the deposit. Repeat no-shows may result in booking restrictions.",
  });
  const [saved, setSaved] = useState(false);
  const [upcomingWeeks, setUpcomingWeeks] = useState(1);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPrefsError(null);
      setPrefsLoading(true);
      try {
        const p = await fetchShopBookingPreferencesRequest();
        if (!cancelled) setUpcomingWeeks(p.upcomingBookingWeeks);
      } catch (e) {
        if (!cancelled) {
          setPrefsError(e instanceof Error ? e.message : "Could not load booking preferences");
        }
      } finally {
        if (!cancelled) setPrefsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveBookingPreferences = async () => {
    setPrefsSaving(true);
    setPrefsSaved(false);
    setPrefsError(null);
    try {
      const p = await updateShopBookingPreferencesRequest(upcomingWeeks);
      setUpcomingWeeks(p.upcomingBookingWeeks);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch (e) {
      setPrefsError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="heading-display text-3xl font-bold mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Booking</h2>
          <p className="text-sm text-muted-foreground">
            Control how far ahead upcoming appointments appear on your admin dashboard (from today through the
            end of the selected window).
          </p>
          {prefsError && <p className="text-destructive text-sm">{prefsError}</p>}
          {prefsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block" htmlFor="upcoming-weeks">
                  Upcoming bookings range
                </label>
                <select
                  id="upcoming-weeks"
                  className="w-full sm:w-56 bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
                  value={upcomingWeeks}
                  onChange={(e) => setUpcomingWeeks(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} week{n === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => void saveBookingPreferences()}
                disabled={prefsSaving}
                className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {prefsSaving ? "Saving…" : "Save range"}
              </button>
            </div>
          )}
          {prefsSaved && <p className="text-sm text-accent">Dashboard range saved.</p>}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Business Info</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Business Name</label>
            <input
              value={settings.businessName}
              onChange={(e) => setSettings((s) => ({ ...s, businessName: e.target.value }))}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                value={settings.contactEmail}
                onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <input
                value={settings.contactPhone}
                onChange={(e) => setSettings((s) => ({ ...s, contactPhone: e.target.value }))}
                className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Deposits (display)</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Deposit Percentage (%)</label>
            <input
              type="number"
              value={settings.depositPercent}
              onChange={(e) => setSettings((s) => ({ ...s, depositPercent: e.target.value }))}
              className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shown for reference only — actual deposit rules are set in your booking flow.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Policies</h2>
          {[
            { key: "latePolicy" as const, label: "Late Fee Policy" },
            { key: "cancelPolicy" as const, label: "Cancellation Policy" },
            { key: "noshowPolicy" as const, label: "No-Show Policy" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-medium mb-1 block">{label}</label>
              <textarea
                value={settings[key]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                rows={2}
                className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm resize-none"
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={handleSave} className="btn-gold">
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
