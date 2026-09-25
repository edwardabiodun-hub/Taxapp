// src/lib/greeting.ts
/** Maps an hour (0-23, local time) to a time-of-day greeting word. */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}
