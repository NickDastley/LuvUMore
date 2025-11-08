/**
 * Calculate relationship duration statistics
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} timezone - IANA timezone string
 * @returns {Object} Statistics object with all time units
 */
export function calculateRelationshipStats(startDate, timezone = 'Europe/Berlin') {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  
  // Total milliseconds difference
  const totalMs = now - start;
  
  // Calculate total units
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  // Calculate broken-down units (years, remaining days, etc.)
  const years = Math.floor(totalDays / 365.25);
  const remainingDaysAfterYears = Math.floor(totalDays - (years * 365.25));
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;
  const remainingSeconds = totalSeconds % 60;
  
  return {
    // Broken down
    breakdown: {
      years,
      days: remainingDaysAfterYears,
      hours: remainingHours,
      minutes: remainingMinutes,
      seconds: remainingSeconds
    },
    // Total counts
    totals: {
      days: totalDays,
      hours: totalHours,
      minutes: totalMinutes,
      seconds: totalSeconds
    },
    // Metadata
    startDate,
    timezone
  };
}

/**
 * Get relationship start date from environment
 * @returns {string} ISO date string
 */
export function getRelationshipStartDate() {
  return process.env.RELATIONSHIP_START_DATE || '2021-11-12';
}
