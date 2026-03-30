import { useState, useMemo } from "react";
import { mockAppointments } from "@/data/mockAppointments";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const WORK_DAYS = [2, 3, 4, 5, 6]; // Tue-Sat

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const getDateStr = (day: number) => {
    const m = currentMonth.getMonth() + 1;
    const d = day;
    return `${currentMonth.getFullYear()}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  };

  const getBookingsForDate = (dateStr: string) => mockAppointments.filter(a => a.date === dateStr);

  const toggleBlock = (dateStr: string) => {
    setBlockedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
  };

  const isWorkDay = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return WORK_DAYS.includes(d.getDay());
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const dayBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  return (
    <div>
      <h1 className="heading-display text-3xl font-bold mb-6">Calendar & Availability</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-muted rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="font-display text-lg font-semibold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-muted rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = getDateStr(day);
                const bookings = getBookingsForDate(dateStr);
                const blocked = blockedDates.has(dateStr);
                const workDay = isWorkDay(day);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all relative ${
                      selectedDate === dateStr ? "ring-2 ring-accent" : ""
                    } ${blocked ? "bg-destructive/10 text-destructive" : workDay ? "hover:bg-muted" : "text-muted-foreground/30"}`}
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

        {/* Sidebar */}
        <div>
          {selectedDate ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">{new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
                <button onClick={() => setSelectedDate(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              {dayBookings.length > 0 ? (
                <div className="space-y-3">
                  {dayBookings.map(b => (
                    <div key={b.id} className="bg-muted rounded-lg p-3 text-sm">
                      <div className="font-medium">{b.customerName}</div>
                      <div className="text-muted-foreground">{b.styleName} · {b.time}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings for this day.</p>
              )}
              <button
                onClick={() => toggleBlock(selectedDate)}
                className={`w-full text-center text-sm font-medium py-2 rounded-lg transition-colors ${
                  blockedDates.has(selectedDate) ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                }`}
              >
                {blockedDates.has(selectedDate) ? "Unblock This Day" : "Block This Day"}
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground">Select a date to view bookings or manage availability.</p>
            </div>
          )}

          {/* Work hours */}
          <div className="bg-card border border-border rounded-xl p-5 mt-4">
            <h3 className="font-display font-semibold mb-3">Work Hours</h3>
            <div className="space-y-2 text-sm">
              {["Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day => (
                <div key={day} className="flex items-center justify-between">
                  <span>{day}</span>
                  <span className="text-muted-foreground">9:00 AM – 7:00 PM</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
