import { useState, useMemo, useEffect, useCallback } from "react";
import {
  fetchBlockedAndWorkHoursRequest,
  fetchShopAppointmentsAdminRequest,
  patchAppointmentStatusRequest,
  blockDateRequest,
  unblockDateRequest,
  updateWorkHoursRequest,
  type ShopAppointmentRow,
  type WorkHourRow,
} from "@/lib/api";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const DOW_LABEL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function defaultWorkWeek(): WorkHourRow[] {
  return [2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "18:00",
    isActive: true,
  }));
}

function padYmd(year: number, month0: number, day: number) {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [appointments, setAppointments] = useState<ShopAppointmentRow[]>([]);
  const [workHoursDraft, setWorkHoursDraft] = useState<WorkHourRow[]>(defaultWorkWeek);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSavedMsg, setHoursSavedMsg] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [apts, blockedPayload] = await Promise.all([
        fetchShopAppointmentsAdminRequest(),
        fetchBlockedAndWorkHoursRequest(),
      ]);
      setAppointments(apts);
      setBlockedSet(new Set(blockedPayload.blocked.map((b) => b.date)));
      if (blockedPayload.workHours?.length) {
        setWorkHoursDraft(blockedPayload.workHours.map((h) => ({ ...h })));
      } else {
        setWorkHoursDraft(defaultWorkWeek());
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load calendar");
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const getDateStr = (day: number) =>
    padYmd(currentMonth.getFullYear(), currentMonth.getMonth(), day);

  const appointmentsByDate = useMemo(() => {
    const m = new Map<string, ShopAppointmentRow[]>();
    for (const a of appointments) {
      const list = m.get(a.date) ?? [];
      list.push(a);
      m.set(a.date, list);
    }
    return m;
  }, [appointments]);

  const dayBookings = selectedDate ? appointmentsByDate.get(selectedDate) ?? [] : [];

  const onBlockToggle = async () => {
    if (!selectedDate) return;
    setBlocking(true);
    try {
      if (blockedSet.has(selectedDate)) {
        await unblockDateRequest(selectedDate);
        setBlockedSet((prev) => {
          const n = new Set(prev);
          n.delete(selectedDate);
          return n;
        });
      } else {
        await blockDateRequest(selectedDate, "Blocked by admin");
        setBlockedSet((prev) => new Set(prev).add(selectedDate));
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to update block");
    } finally {
      setBlocking(false);
    }
  };

  const saveWorkHours = async () => {
    setSavingHours(true);
    setHoursSavedMsg(null);
    try {
      const saved = await updateWorkHoursRequest(workHoursDraft);
      setWorkHoursDraft(saved.map((h) => ({ ...h })));
      setHoursSavedMsg("Work hours saved.");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to save work hours");
    } finally {
      setSavingHours(false);
    }
  };

  const updateHourRow = (dayOfWeek: number, patch: Partial<WorkHourRow>) => {
    setWorkHoursDraft((rows) => {
      const idx = rows.findIndex((r) => r.dayOfWeek === dayOfWeek);
      if (idx === -1) {
        return [...rows, { dayOfWeek, startTime: "09:00", endTime: "18:00", isActive: true, ...patch }];
      }
      const next = [...rows];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const rowForDay = (dow: number): WorkHourRow => {
    const found = workHoursDraft.find((r) => r.dayOfWeek === dow);
    return found ?? { dayOfWeek: dow, startTime: "09:00", endTime: "18:00", isActive: false };
  };

  const onStatus = async (id: string, status: "approved" | "cancelled" | "completed") => {
    try {
      await patchAppointmentStatusRequest(id, status);
      await loadAll();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to update status");
    }
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
    <div>
      <h1 className="heading-display text-3xl font-bold mb-6">Calendar & Availability</h1>

      {loadError && (
        <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg mb-4">{loadError}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                }
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display text-lg font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                }
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
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
                const dateStr = getDateStr(day);
                const bookings = appointmentsByDate.get(dateStr) ?? [];
                const blocked = blockedSet.has(dateStr);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all relative ${
                      selectedDate === dateStr ? "ring-2 ring-accent" : ""
                    } ${blocked ? "bg-destructive/10 text-destructive" : "hover:bg-muted"}`}
                  >
                    {day}
                    {bookings.length > 0 && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          {selectedDate ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button type="button" onClick={() => setSelectedDate(null)} aria-label="Close">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {dayBookings.length > 0 ? (
                <div className="space-y-3">
                  {dayBookings.map((b) => (
                    <div key={b.id} className="bg-muted rounded-lg p-3 text-sm space-y-2">
                      <div className="font-medium">{b.customerName}</div>
                      <div className="text-muted-foreground">
                        {b.styleName} · {b.time} ·{" "}
                        <span className="capitalize">{b.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {b.status === "pending" && (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-md bg-accent/20 text-foreground"
                            onClick={() => void onStatus(b.id, "approved")}
                          >
                            Approve
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "approved") && (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-md bg-destructive/15 text-destructive"
                            onClick={() => void onStatus(b.id, "cancelled")}
                          >
                            Cancel
                          </button>
                        )}
                        {b.status === "approved" && (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-md bg-muted-foreground/20"
                            onClick={() => void onStatus(b.id, "completed")}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings for this day.</p>
              )}
              <button
                type="button"
                disabled={blocking}
                onClick={() => void onBlockToggle()}
                className={`w-full text-center text-sm font-medium py-2 rounded-lg transition-colors ${
                  blockedSet.has(selectedDate) ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                }`}
              >
                {blocking ? "…" : blockedSet.has(selectedDate) ? "Unblock This Day" : "Block This Day"}
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">
                Select a date to view bookings or manage availability.
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5 mt-4 space-y-4">
            <h3 className="font-display font-semibold">Work Hours</h3>
            <p className="text-xs text-muted-foreground">
              Set one row per weekday (0 = Sunday … 6 = Saturday). Inactive days stay closed on the public
              booking calendar.
            </p>
            <div className="space-y-3 text-sm max-h-[420px] overflow-y-auto pr-1">
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                const r = rowForDay(dow);
                return (
                  <div
                    key={dow}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border/60 pb-3 last:border-0"
                  >
                    <label className="flex items-center gap-2 w-36 shrink-0">
                      <input
                        type="checkbox"
                        checked={r.isActive}
                        onChange={(e) => updateHourRow(dow, { isActive: e.target.checked })}
                      />
                      <span>{DOW_LABEL[dow]}</span>
                    </label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        className="bg-background border border-input rounded-md px-2 py-1 text-xs flex-1"
                        value={r.startTime}
                        disabled={!r.isActive}
                        onChange={(e) => updateHourRow(dow, { startTime: e.target.value })}
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="time"
                        className="bg-background border border-input rounded-md px-2 py-1 text-xs flex-1"
                        value={r.endTime}
                        disabled={!r.isActive}
                        onChange={(e) => updateHourRow(dow, { endTime: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              disabled={savingHours}
              onClick={() => void saveWorkHours()}
              className="btn-gold w-full text-center text-sm py-2"
            >
              {savingHours ? "Saving…" : "Save work hours"}
            </button>
            {hoursSavedMsg && <p className="text-xs text-accent text-center">{hoursSavedMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
