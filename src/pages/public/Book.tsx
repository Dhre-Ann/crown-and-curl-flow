import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { mockStyles } from "@/data/mockStyles";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

const AVAILABLE_DAYS = [2, 3, 4, 5, 6]; // Tue-Sat
const TIME_SLOTS = ["9:00 AM", "1:00 PM", "5:00 PM"];

export default function Book() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const styleId = params.get("style") || "";
  const partSize = params.get("partSize") || "";
  const length = params.get("length") || "";
  const color = params.get("color") || "";
  const total = parseInt(params.get("total") || "0");
  const style = mockStyles.find(s => s.id === styleId);

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const isAvailable = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return AVAILABLE_DAYS.includes(d.getDay());
  };

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    const cp = new URLSearchParams({
      style: styleId, partSize, length, color,
      total: total.toString(), date: dateStr, time: selectedTime,
    });
    navigate(`/checkout?${cp.toString()}`);
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="section-padding">
      <div className="container mx-auto max-w-5xl">
        <h1 className="heading-display text-3xl sm:text-4xl font-bold mb-8">
          Pick Your <span className="text-gold-gradient">Date & Time</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-display text-lg font-semibold">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const avail = isAvailable(day);
                  const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isSelected = selectedDate?.toDateString() === dateObj.toDateString();
                  return (
                    <button
                      key={i}
                      disabled={!avail}
                      onClick={() => { setSelectedDate(dateObj); setSelectedTime(null); }}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-md"
                          : avail
                            ? "hover:bg-muted text-foreground"
                            : "text-muted-foreground/30 cursor-not-allowed"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Available Times
                  </h4>
                  <div className="flex gap-3">
                    {TIME_SLOTS.map(time => (
                      <button
                        key={time}
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

          {/* Summary */}
          <div>
            <div className="bg-card rounded-xl border border-border p-6 sticky top-20">
              <h3 className="font-display text-lg font-semibold mb-4">Booking Summary</h3>
              {style ? (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Style</span><span className="font-medium">{style.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Part Size</span><span>{partSize}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Length</span><span>{length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Color</span><span>{color}</span></div>
                    {selectedDate && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{selectedDate.toLocaleDateString()}</span></div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{selectedTime}</span></div>
                    )}
                  </div>
                  <div className="border-t border-border mt-4 pt-4 flex justify-between">
                    <span className="font-display font-bold">Total</span>
                    <span className="font-display text-xl font-bold text-accent">${total}</span>
                  </div>
                  <button
                    onClick={handleProceed}
                    disabled={!selectedDate || !selectedTime}
                    className="btn-gold w-full mt-6 text-center disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Review & Pay
                  </button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No style selected. <Link to="/services" className="text-accent underline">Browse styles</Link></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
