import { formatInTimeZone } from 'date-fns-tz';

export function todayDate(tz) {
  // Format current time in tz to YYYY-MM-DD
  return formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
}

export function nowUtcMs() {
  return Date.now();
}
