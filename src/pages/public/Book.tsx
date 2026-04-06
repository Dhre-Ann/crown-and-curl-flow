import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useCustomerPreviewReadOnly } from "@/context/ShopAdminPreviewContext";
import { useCustomerFlowHrefFn } from "@/hooks/useCustomerFlowHref";
import {
  appendActiveShopSlugToParams,
  fetchAvailabilityMonthRequest,
  fetchAvailabilitySlotsRequest,
  fetchStyleById,
  withShopSearch,
} from "@/lib/api";
import type { CatalogStyle } from "@/types/style";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function padYmd(year: number, month0: number, day: number) {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface BookCheckoutState {
  styleId: string;
  optionIds: string[];
  partSize: string;
  length: string;
  color: string;
  estimateTotal: number;
  date: string;
  time: string;
}

export default function Book() {
  const readOnlyPreview = useCustomerPreviewReadOnly();
  const customerFlowTo = useCustomerFlowHrefFn();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const styleId = params.get("style") || "";
  const partSize = params.get("partSize") || "";
  const length = params.get("length") || "";
  const color = params.get("color") || "";
  const total = Number(params.get("total") || "0") || 0;
  const optionIdsParam = params.get("optionIds") || "";
  const optionIds = useMemo(
    () => optionIdsParam.split(",").map((s) => s.trim()).filter(Boolean),
    [optionIdsParam]
  );

  const [style, setStyle] = useState<CatalogStyle | null>(null);
  const [styleLoading, setStyleLoading] = useState(Boolean(styleId));

  useEffect(() => {
    if (!styleId) {
      setStyle(null);
      setStyleLoading(false);
      return;
    }
    let cancelled = false;
    setStyleLoading(true);
    (async () => {
      try {
        const row = await fetchStyleById(styleId);
        if (!cancelled) setStyle(row);
      } catch {
        if (!cancelled) setStyle(null);
      } finally {
        if (!cancelled) setStyleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [styleId]);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [monthMeta, setMonthMeta] = useState<Awaited<ReturnType<typeof fetchAvailabilityMonthRequest>> | null>(
    null
  );
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const mk = monthKey(currentMonth);

  useEffect(() => {
    let cancelled = false;
    setMonthLoading(true);
    setMonthError(null);
    (async () => {
      try {
        const data = await fetchAvailabilityMonthRequest(mk);
        if (!cancelled) setMonthMeta(data);
      } catch (e) {
        if (!cancelled) {
          setMonthMeta(null);
          setMonthError(e instanceof Error ? e.message : "Failed to load calendar");
        }
      } finally {
        if (!cancelled) setMonthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mk]);

  const dayMetaByDate = useMemo(() => {
    const m = new Map<string, { blocked: boolean; hasWorkHours: boolean }>();
    if (!monthMeta?.days) return m;
    for (const d of monthMeta.days) {
      m.set(d.date, { blocked: d.blocked, hasWorkHours: d.hasWorkHours });
    }
    return m;
  }, [monthMeta]);

  const loadSlots = useCallback(
    async (ymd: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const list = await fetchAvailabilitySlotsRequest(ymd, styleId || undefined);
        setSlots(list);
      } catch (e) {
        setSlots([]);
        setSlotsError(e instanceof Error ? e.message : "Failed to load times");
      } finally {
        setSlotsLoading(false);
      }
    },
    [styleId]
  );

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    const ymd = padYmd(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    void loadSlots(ymd);
  }, [selectedDate, loadSlots]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  const isDaySelectable = (day: number) => {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (dateObj.getTime() < todayStart) return false;
    const ymd = padYmd(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const meta = dayMetaByDate.get(ymd);
    if (!meta) return false;
    return meta.hasWorkHours && !meta.blocked;
  };

  const handleProceed = () => {
    if (readOnlyPreview) return;
    if (!selectedDate || !selectedTime || !styleId) return;
    const dateStr = padYmd(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const state: BookCheckoutState = {
      styleId,
      optionIds,
      partSize,
      length,
      color,
      estimateTotal: total,
      date: dateStr,
      time: selectedTime,
    };
    const cp = new URLSearchParams({
      style: styleId,
      partSize,
      length,
      color,
      total: String(total),
      date: dateStr,
      time: selectedTime,
      optionIds: optionIds.join(","),
    });
    appendActiveShopSlugToParams(cp);
    navigate(`${customerFlowTo(`/checkout?${cp.toString()}`)}`, { state });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-5xl">
        <h1 className="heading-display text-3xl sm:text-4xl font-bold mb-8">
          Pick Your <span className="text-gold-gradient">Date & Time</span>
        </h1>

        {monthError && (
          <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg mb-6">{monthError}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-display text-lg font-semibold">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {monthLoading && (
                <p className="text-sm text-muted-foreground mb-4">Loading availability…</p>
              )}

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const ymd = padYmd(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const meta = dayMetaByDate.get(ymd);
                  const blocked = meta?.blocked ?? false;
                  const noHours = meta && !meta.hasWorkHours;
                  const past = dateObj.getTime() < todayStart;
                  const selectable = isDaySelectable(day);
                  const isSelected = selectedDate?.toDateString() === dateObj.toDateString();
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!selectable}
                      title={
                        blocked
                          ? "Blocked"
                          : noHours
                            ? "Closed"
                            : past
                              ? "Past"
                              : selectable
                                ? "Available"
                                : ""
                      }
                      onClick={() => {
                        setSelectedDate(dateObj);
                        setSelectedTime(null);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-md"
                          : selectable
                            ? "hover:bg-muted text-foreground"
                            : blocked
                              ? "bg-destructive/10 text-destructive/80 line-through"
                              : "text-muted-foreground/30 cursor-not-allowed"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Available Times
                  </h4>
                  {slotsLoading && (
                    <p className="text-sm text-muted-foreground">Loading times…</p>
                  )}
                  {slotsError && (
                    <p className="text-destructive text-sm">{slotsError}</p>
                  )}
                  {!slotsLoading && !slotsError && slots.length === 0 && (
                    <p className="text-sm text-muted-foreground">No open slots this day.</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {slots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                          selectedTime === time
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-card rounded-xl border border-border p-6 sticky top-20">
              <h3 className="font-display text-lg font-semibold mb-4">Booking Summary</h3>
              {styleLoading ? (
                <p className="text-muted-foreground text-sm">Loading booking details…</p>
              ) : style ? (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Style</span>
                      <span className="font-medium">{style.name}</span>
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
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span>{selectedDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span>{selectedTime}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border mt-4 pt-4 flex justify-between">
                    <span className="font-display font-bold">Total</span>
                    <span className="font-display text-xl font-bold text-accent">
                      ${Number(total.toFixed(2))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Price shown is an estimate — the server confirms the final total at checkout.
                  </p>
                  {readOnlyPreview ? (
                    <p className="text-sm text-muted-foreground text-center mt-6">Preview mode — checkout is disabled.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceed}
                      disabled={!selectedDate || !selectedTime}
                      className="btn-gold w-full mt-6 text-center disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Review & Pay
                    </button>
                  )}
                </>
              ) : styleId ? (
                <p className="text-muted-foreground text-sm">
                  This style is unavailable or was removed.{" "}
                  <Link to={customerFlowTo(withShopSearch("/services"))} className="text-accent underline">
                    Browse styles
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No style selected.{" "}
                  <Link to={customerFlowTo(withShopSearch("/services"))} className="text-accent underline">
                    Browse styles
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
