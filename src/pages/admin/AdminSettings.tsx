import { useState } from "react";

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="heading-display text-3xl font-bold mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Business Info</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Business Name</label>
            <input value={settings.businessName} onChange={e => setSettings(s => ({ ...s, businessName: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input value={settings.contactEmail} onChange={e => setSettings(s => ({ ...s, contactEmail: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <input value={settings.contactPhone} onChange={e => setSettings(s => ({ ...s, contactPhone: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Booking</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Deposit Percentage (%)</label>
            <input type="number" value={settings.depositPercent} onChange={e => setSettings(s => ({ ...s, depositPercent: e.target.value }))} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm max-w-[120px]" />
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
              <textarea value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} rows={2} className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-sm resize-none" />
            </div>
          ))}
        </div>

        <button onClick={handleSave} className="btn-gold">
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
