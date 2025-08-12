/**
 * Format seconds as mm:ss
 * @param seconds - Number of seconds to format
 * @returns Formatted time string in mm:ss format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as mm:ss, handling null values
 * @param seconds - Number of seconds to format (can be null)
 * @returns Formatted time string in mm:ss format, or empty string if null/NaN
 */
export function formatTimeNullable(seconds: number | null): string {
  if (seconds == null || isNaN(seconds)) return '';
  return formatTime(seconds);
}

/**
 * Parse mm:ss string to seconds
 * @param timeString - Time string in mm:ss format
 * @returns Number of seconds, or NaN if invalid format
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length !== 2) return NaN;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s) || s < 0 || s > 59 || m < 0) return NaN;
  return m * 60 + s;
}