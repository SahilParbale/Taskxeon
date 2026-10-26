/**
 * Centralized live date utility helpers for TaskFlow
 * Ensures all dates use the user's current live system date dynamically.
 */

// Formats a Date object to YYYY-MM-DD in local time
export const formatDateToYYYYMMDD = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Returns live today's date in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  return formatDateToYYYYMMDD(new Date());
};

// Formatted display for headers e.g. "Monday, Oct 26, 2026"
export const formatTodayDisplay = (): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());
};

// Checks if a YYYY-MM-DD date string is today
export const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dateStr === getTodayDateString();
};

// Checks if a YYYY-MM-DD date string is in the past (before today)
export const isPastDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dateStr < getTodayDateString();
};

// Checks if a YYYY-MM-DD date string is upcoming (after today)
export const isUpcomingDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dateStr > getTodayDateString();
};

// Formats any YYYY-MM-DD date string nicely, e.g. "Mon, Oct 26, 2026"
export const formatCustomDateLabel = (dateStr: string): string => {
  try {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return dateStr;
    }
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};
