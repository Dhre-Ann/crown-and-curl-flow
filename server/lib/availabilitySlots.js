/**
 * Availability helpers: parse shop work-hour strings, build slot labels, and detect overlap.
 * We use a fixed slot step so the storefront grid stays predictable; booking still reserves the
 * full style durationMax window server-side to prevent double booking.
 */
const SLOT_STEP_MINUTES = 30;

/**
 * Parse times like "09:00" (seed/work hours) or "9:00 AM" (customer-facing labels) to minutes from midnight.
 */
function parseTimeToMinutes(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const m24 = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (m24) {
    const h = Number(m24[1]);
    const mi = Number(m24[2]);
    if (Number.isFinite(h) && Number.isFinite(mi) && h >= 0 && h < 24 && mi >= 0 && mi < 60) {
      return h * 60 + mi;
    }
    return null;
  }

  const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s);
  if (m12) {
    let h = Number(m12[1]);
    const mi = Number(m12[2]);
    const ap = m12[3].toUpperCase();
    if (!Number.isFinite(h) || !Number.isFinite(mi) || mi < 0 || mi >= 60) return null;
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    if (h < 0 || h > 23) return null;
    return h * 60 + mi;
  }

  return null;
}

function formatMinutesAs12h(totalMin) {
  const wrapped = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  let h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const pd = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${pd}`;
}

/** Calendar YYYY-MM-DD → JS Sunday=0 weekday, aligned with Prisma WorkHour.dayOfWeek. */
function dayOfWeekFromYmd(ymd) {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d) return null;
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

function ymdFromDateUtc(d) {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/**
 * Returns [startMin, endMin) from work hours row, or null if inactive / invalid.
 * end is exclusive for generating slot starts where [start, start + bookingSpan) fits in [open, close].
 */
function workWindowMinutes(workHourRow) {
  if (!workHourRow || !workHourRow.isActive) return null;
  const start = parseTimeToMinutes(workHourRow.startTime);
  const end = parseTimeToMinutes(workHourRow.endTime);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

function rangesOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/**
 * Busy intervals in minutes-from-midnight for each existing appointment (pending/approved).
 * Uses each style's durationMax (hours) so partial overlap is detected, not just identical start times.
 */
function busyIntervalsFromAppointments(appointments) {
  const out = [];
  for (const apt of appointments) {
    const start = parseTimeToMinutes(apt.time);
    if (start == null) continue;
    const hours = apt.style?.durationMax ?? 1;
    const durMin = Math.max(1, Number(hours) * 60);
    out.push({ start, end: start + durMin });
  }
  return out;
}

/**
 * Minimum minutes from slot start S such that a new booking could need — driven by style or shop max.
 */
function buildSlotsForDay({
  openStartMin,
  openEndMin,
  bookingSpanMin,
  busyIntervals,
}) {
  const slots = [];
  for (let s = openStartMin; s + bookingSpanMin <= openEndMin; s += SLOT_STEP_MINUTES) {
    const slotEnd = s + bookingSpanMin;
    const clash = busyIntervals.some((b) => rangesOverlap(s, slotEnd, b.start, b.end));
    if (!clash) {
      slots.push(formatMinutesAs12h(s));
    }
  }
  return slots;
}

module.exports = {
  SLOT_STEP_MINUTES,
  parseTimeToMinutes,
  formatMinutesAs12h,
  dayOfWeekFromYmd,
  ymdFromDateUtc,
  workWindowMinutes,
  busyIntervalsFromAppointments,
  buildSlotsForDay,
  rangesOverlap,
};
