-- Admin dashboard: configurable horizon for "upcoming" appointments (weeks).
ALTER TABLE "Shop" ADD COLUMN "upcomingBookingWeeks" INTEGER NOT NULL DEFAULT 1;
