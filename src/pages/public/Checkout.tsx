import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchStyleById } from "@/lib/api";
import type { CatalogStyle } from "@/types/style";
import { Check, ShieldCheck, CalendarCheck } from "lucide-react";

export default function Checkout() {
  const [params] = useSearchParams();
  const styleId = params.get("style") || "";
  const partSize = params.get("partSize") || "";
  const length = params.get("length") || "";
  const color = params.get("color") || "";
  const total = Number(params.get("total") || "0") || 0;
  const date = params.get("date") || "";
  const time = params.get("time") || "";

  const [style, setStyle] = useState<CatalogStyle | null>(null);

  useEffect(() => {
    if (!styleId) {
      setStyle(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchStyleById(styleId);
        if (!cancelled) setStyle(row);
      } catch {
        if (!cancelled) setStyle(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [styleId]);

  const deposit = Math.round(total * 0.3 * 100) / 100;

  const [policies, setPolicies] = useState({ late: false, cancel: false, noshow: false });
  const [paid, setPaid] = useState(false);

  const allChecked = policies.late && policies.cancel && policies.noshow;

  if (paid) {
    return (
      <div className="section-padding">
        <div className="container mx-auto max-w-lg text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <CalendarCheck className="w-10 h-10 text-accent" />
          </div>
          <h1 className="heading-display text-3xl font-bold mb-3">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Your appointment has been scheduled. We can't wait to see you!
          </p>
          <div className="bg-card border border-border rounded-xl p-6 text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Style</span>
              <span className="font-medium">{style?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customization</span>
              <span>
                {partSize} · {length} · {color}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span>
                {new Date(date).toLocaleDateString()} at {time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">${Number(total.toFixed(2))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit Paid</span>
              <span className="font-bold text-accent">${deposit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Due</span>
              <span>${Number((total - deposit).toFixed(2))}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-3xl">
        <h1 className="heading-display text-3xl sm:text-4xl font-bold mb-8">
          Review & <span className="text-gold-gradient">Pay</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style</span>
                  <span className="font-medium">{style?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Part Size</span>
                  <span>{partSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length</span>
                  <span>{length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color</span>
                  <span>{color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{date && new Date(date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span>{time}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">${Number(total.toFixed(2))}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" /> Policies
              </h3>
              <div className="space-y-4">
                {[
                  {
                    key: "late" as const,
                    text: "I understand there is a 15-minute grace period. A $25 late fee applies after.",
                  },
                  {
                    key: "cancel" as const,
                    text: "I understand cancellations require 48 hours notice.",
                  },
                  {
                    key: "noshow" as const,
                    text: "I understand that a no-show means my deposit is forfeited.",
                  },
                ].map(({ key, text }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => setPolicies((p) => ({ ...p, [key]: !p[key] }))}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                        policies[key] ? "bg-accent border-accent" : "border-input group-hover:border-muted-foreground"
                      }`}
                    >
                      {policies[key] && <Check className="w-3 h-3 text-accent-foreground" />}
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
              <h3 className="font-display text-lg font-semibold mb-4">Deposit</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span>${Number(total.toFixed(2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit (30%)</span>
                  <span className="font-bold text-accent">${deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due at appointment</span>
                  <span>${Number((total - deposit).toFixed(2))}</span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Card number"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                  defaultValue="4242 4242 4242 4242"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                    defaultValue="12/28"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                    defaultValue="123"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaid(true)}
                disabled={!allChecked}
                className="btn-gold w-full text-center disabled:opacity-40 disabled:pointer-events-none"
              >
                Pay ${deposit} Deposit
              </button>
              {!allChecked && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Please accept all policies to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
