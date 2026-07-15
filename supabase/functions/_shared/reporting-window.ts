export interface ReportingWindow {
  start: Date
  endExclusive: Date
  startDate: string
  endDate: string
}

export const REPORT_TIME_ZONE = 'America/Los_Angeles'

function dateInTimeZone(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function timeZoneOffsetMilliseconds(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  )
  return asUtc - date.getTime()
}

function zonedMidnight(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day))
  const firstPass = new Date(utcGuess.getTime() - timeZoneOffsetMilliseconds(utcGuess))
  return new Date(utcGuess.getTime() - timeZoneOffsetMilliseconds(firstPass))
}

export function reportingWindow(days: number, now = new Date()): ReportingWindow {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('Reporting window days must be a positive integer')
  }

  const today = dateInTimeZone(now)
  const endExclusive = zonedMidnight(today)
  const startCalendar = new Date(`${today}T12:00:00.000Z`)
  startCalendar.setUTCDate(startCalendar.getUTCDate() - days)
  const startDate = dateInTimeZone(startCalendar)
  const start = zonedMidnight(startDate)
  const endCalendar = new Date(`${today}T12:00:00.000Z`)
  endCalendar.setUTCDate(endCalendar.getUTCDate() - 1)

  return {
    start,
    endExclusive,
    startDate,
    endDate: dateInTimeZone(endCalendar),
  }
}

export function previousReportingWindow(
  days: number,
  currentWindow: ReportingWindow
): ReportingWindow {
  return reportingWindow(days, currentWindow.start)
}
