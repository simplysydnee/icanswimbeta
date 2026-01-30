// Test the timezone offset calculation
function getPacificOffsetMs(date) {
  // Use Intl.DateTimeFormat to get the offset for America/Los_Angeles
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'longOffset'
  });
  const parts = formatter.formatToParts(date);
  console.log('Parts:', parts.map(p => ({ type: p.type, value: p.value })));
  const offsetPart = parts.find(part => part.type === 'timeZoneName');
  if (offsetPart) {
    // Parse offset like "GMT-8" or "GMT-7"
    console.log('offsetPart.value:', offsetPart.value);
    const match = offsetPart.value.match(/GMT([+-])(\d+)/);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const hours = parseInt(match[2], 10);
      const offset = sign * hours * 60 * 60 * 1000;
      console.log('Parsed offset:', { sign: match[1], hours, offset, offsetHours: offset / (60 * 60 * 1000) });
      return offset;
    }
  }
  // Fallback to UTC-8 (standard time)
  const fallback = -8 * 60 * 60 * 1000;
  console.log('Using fallback:', fallback);
  return fallback;
}

// Test with current date
const now = new Date();
console.log('Current date UTC:', now.toISOString());
console.log('Current date local:', now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

const offset = getPacificOffsetMs(now);
console.log('Offset ms:', offset);
console.log('Offset hours:', offset / (60 * 60 * 1000));

// Test with a date in summer (DST)
const summerDate = new Date('2026-07-01T12:00:00Z');
console.log('\nSummer date UTC:', summerDate.toISOString());
console.log('Summer date local:', summerDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
const summerOffset = getPacificOffsetMs(summerDate);
console.log('Summer offset hours:', summerOffset / (60 * 60 * 1000));

// Test toPacificTime
function toPacificTime(date) {
  const offset = getPacificOffsetMs(date);
  const pacificDate = new Date(date.getTime() + offset);
  console.log('toPacificTime:', {
    inputUTC: date.toISOString(),
    offsetHours: offset / (60 * 60 * 1000),
    outputUTC: pacificDate.toISOString(),
    outputLocal: pacificDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  });
  return pacificDate;
}

console.log('\n--- Testing conversion ---');
// Example: Session at 2pm Pacific on 2026-01-30
// Pacific time 2pm = 22:00 UTC (if PST)
const sessionPacific = new Date('2026-01-30T14:00:00-08:00'); // Pacific time with offset -8
console.log('Session Pacific:', sessionPacific.toISOString());
const sessionUTC = new Date(sessionPacific.getTime() + 8 * 60 * 60 * 1000); // convert to UTC
console.log('Session UTC (stored):', sessionUTC.toISOString());
const convertedBack = toPacificTime(sessionUTC);
console.log('Converted back hour:', convertedBack.getHours());