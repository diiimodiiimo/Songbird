/**
 * Get the current date in the user's local timezone as YYYY-MM-DD
 * This ensures dates are calculated based on the user's timezone, not UTC
 */
export function getLocalDateString(date?: Date): string {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the start of day in the user's local timezone
 */
export function getLocalStartOfDay(date?: Date): Date {
  const d = date || new Date()
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  return localDate
}

/**
 * Get the end of day in the user's local timezone
 */
export function getLocalEndOfDay(date?: Date): Date {
  const d = date || new Date()
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  return localDate
}

/**
 * Check if a date string (YYYY-MM-DD) is today in the user's local timezone
 */
export function isToday(dateString: string): boolean {
  return dateString === getLocalDateString()
}

/**
 * Parse a date string (YYYY-MM-DD) and return a Date object at midnight in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}



