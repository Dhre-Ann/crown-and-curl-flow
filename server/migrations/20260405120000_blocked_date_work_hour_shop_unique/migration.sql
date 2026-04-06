-- Drop global unique on BlockedDate.date so each shop can block the same calendar date independently.
DROP INDEX IF EXISTS "BlockedDate_date_key";

-- One block record per shop per calendar day.
CREATE UNIQUE INDEX "BlockedDate_shopId_date_key" ON "BlockedDate"("shopId", "date");

-- One work-hour row per shop per weekday (admin PUT replaces the set; prevents duplicate weekdays).
CREATE UNIQUE INDEX "WorkHour_shopId_dayOfWeek_key" ON "WorkHour"("shopId", "dayOfWeek");
