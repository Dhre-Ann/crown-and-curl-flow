import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useCustomerPreviewReadOnly } from "@/context/ShopAdminPreviewContext";
import { useAuth } from "@/context/AuthContext";
import {
  createAppointmentRequest,
  fetchStyleById,
  withShopSearch,
} from "@/lib/api";
import type { CatalogStyle } from "@/types/style";
import { useCustomerFlowHrefFn } from "@/hooks/useCustomerFlowHref";
import type { BookCheckoutState } from "@/pages/public/Book";
import { Check, ShieldCheck, CalendarCheck } from "lucide-react";

function parseBooking(
  state: unknown,
  params: URLSearchParams
): BookCheckoutState | null {
  const s = state as BookCheckoutState | null;
  if (s?.styleId && s.date && s.time && Array.isArray(s.optionIds)) {
    return s;
  }
  const styleId = params.get("style") || "";
  const date = params.get("date") || "";
  const time = params.get("time") || "";
  const optionIds = (params.get("optionIds") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!styleId || !date || !time) return null;
  return {
    styleId,
    optionIds,
    partSize: params.get("partSize") || "",
    length: params.get("length") || "",
    color: params.get("color") || "",
    estimateTotal: Number(params.get("total") || "0") || 0,
    date,
    time,
  };
}

export default function Checkout() {
  const readOnlyPreview = useCustomerPreviewReadOnly();
  const { user, loading: authLoading } = useAuth();
  const customerFlowTo = useCustomerFlowHrefFn();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const booking = useMemo(
    () => parseBooking(location.state, params),
    [location.state, params]
  );

  const styleId = booking?.styleId || "";
  const partSize = booking?.partSize || "";
  const length = booking?.length || "";
  const color = booking?.color || "";
  const total = booking?.estimateTotal ?? 0;
  const date = booking?.date || "";
  const time = booking?.time || "";
  const optionIds = booking?.optionIds ?? [];

  const [style, setStyle] = useState<CatalogStyle | null>(null);
  const [policies, setPolicies] = useState({ late: false, cancel: false, noshow: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    id: string;
    totalPrice: number;
    depositAmount: number;
  } | null>(null);

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

  useEffect(() => {
    if (!confirmed || readOnlyPreview) return;
    const t = window.setTimeout(() => navigate("/customer/dashboard"), 4500);
    return () => window.clearTimeout(t);
  }, [confirmed, readOnlyPreview, navigate]);

  const depositEstimate = Math.round(total * 0.3 * 100) / 100;
  const allChecked = policies.late && policies.cancel && policies.noshow;

  const loginHref = "/login";

  const handlePay = async () => {
    if (readOnlyPreview || !booking || !user) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const apt = await createAppointmentRequest({
        styleId: booking.styleId,
        date: booking.date,
        time: booking.time,
        selectedOptions: booking.optionIds,
        totalPrice: booking.estimateTotal,
      });
      setConfirmed({
        id: apt.id,
        totalPrice: apt.totalPrice,
        depositAmount: apt.depositAmount,
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking && !authLoading) {
    return (
      <div className="section-padding">
        <div className="container mx-auto max-w-lg text-center">
          <h1 className="heading-display text-2xl font-bold mb-4">No booking to review</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Start from a style, choose options, then pick a date and time.
          </p>
          <Link to={customerFlowTo(withShopSearch("/services"))} className="btn-gold inline-block text-center">
            Browse styles
          </Link>
        </div>
      </div>
    );
  }

  if (confirmed && !readOnlyPreview) {
    const bal = Math.round((confirmed.totalPrice - confirmed.depositAmount) * 100) / 100;
    return (
      <div className="section-padding">
        <div className="container mx-auto max-w-lg text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <CalendarCheck className="w-10 h-10 text-accent" />
          </div>
          <h1 className="heading-display text-3xl font-bold mb-3">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-2 text-sm">
            Appointment ID: <span className="font-mono text-foreground">{confirmed.id}</span>
          </p>
          <p className="text-muted-foreground mb-8 text-sm">
            Your appointment is saved. Totals below are confirmed by the server.
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
                {new Date(date + "T12:00:00").toLocaleDateString()} at {time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">${confirmed.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit (30%)</span>
              <span className="font-bold text-accent">${confirmed.depositAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance due at appointment</span>
              <span>${bal.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6">Redirecting to your dashboard in a few seconds…</p>
          <button
            type="button"
            className="mt-4 btn-gold w-full max-w-xs mx-auto block text-center"
            onClick={() => navigate("/customer/dashboard")}
          >
            Go to my dashboard
          </button>
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

        {readOnlyPreview ? (
          <p className="mb-6 rounded-lg border border-border bg-secondary/80 px-4 py-3 text-sm text-muted-foreground">
            Preview mode — payments and booking confirmation are disabled.
          </p>
        ) : null}

        {!readOnlyPreview && !authLoading && !user && (
          <div className="mb-6 rounded-lg border border-border bg-secondary/80 px-4 py-3 text-sm">
            <p className="text-muted-foreground mb-2">Sign in to complete your booking.</p>
            <Link
              to={loginHref}
              className="text-accent font-medium underline"
              onClick={() => {
                try {
                  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
                  let path = window.location.pathname;
                  if (base && base !== "/" && path.startsWith(base)) {
                    path = path.slice(base.length) || "/";
                  }
                  sessionStorage.setItem(
                    "crownReturnAfterLogin",
                    `${path}${window.location.search}`
                  );
                } catch {
                  /* ignore */
                }
              }}
            >
              Log in or create an account
            </Link>
          </div>
        )}

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
                  <span>{date && new Date(date + "T12:00:00").toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span>{time}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold">Total (estimate)</span>
                  <span className="font-bold text-lg">${Number(total.toFixed(2))}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The server recalculates price from the catalog — the amount above may differ slightly from what you pay.
              </p>
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
                  <label
                    key={key}
                    className={`flex items-start gap-3 group ${readOnlyPreview ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <div
                      onClick={() => {
                        if (!readOnlyPreview) setPolicies((p) => ({ ...p, [key]: !p[key] }));
                      }}
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
                  <span className="text-muted-foreground">Total (estimate)</span>
                  <span>${Number(total.toFixed(2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit (30%, estimate)</span>
                  <span className="font-bold text-accent">${depositEstimate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due at appointment (estimate)</span>
                  <span>${Number((total - depositEstimate).toFixed(2))}</span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 mb-4 space-y-3 opacity-90">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Card (placeholder)</p>
                <input
                  type="text"
                  placeholder="Card number"
                  readOnly={readOnlyPreview}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                  defaultValue="4242 4242 4242 4242"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    readOnly={readOnlyPreview}
                    className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                    defaultValue="12/28"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    readOnly={readOnlyPreview}
                    className="bg-background border border-input rounded-md px-3 py-2 text-sm"
                    defaultValue="123"
                  />
                </div>
              </div>

              {submitError && (
                <p className="text-destructive text-xs mb-3">{submitError}</p>
              )}

              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={
                  readOnlyPreview ||
                  !allChecked ||
                  !user ||
                  submitting ||
                  authLoading ||
                  !booking
                }
                className="btn-gold w-full text-center disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? "Saving…" : `Pay $${depositEstimate.toFixed(2)} deposit (placeholder)`}
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
