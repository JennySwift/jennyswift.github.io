import { DateTime } from 'luxon'


// Sydney-local day's [start, end) as UTC ISO strings for DB filters
//dateLike just means “anything you can turn into a Date.”
export function sydneyDayRangeUtcISO(dateLike, { withMillis = false } = {}) {
    const base = dateLike instanceof Date ? dateLike : new Date(dateLike)
    if (Number.isNaN(base.getTime())) {
        throw new Error(`sydneyDayRangeUtcISO: invalid date (${String(dateLike)})`)
    }

    const startSydney = DateTime.fromJSDate(base, { zone: 'Australia/Sydney' }).startOf('day')
    const endSydney   = startSydney.plus({ days: 1 })

    const toISOOpts = withMillis ? {} : { suppressMilliseconds: true }
    return {
        startUtcISO: startSydney.toUTC().toISO(toISOOpts),
        endUtcISO:   endSydney.toUTC().toISO(toISOOpts),
    }
}

// “19 Aug 2025, 8:55pm” in Australia/Sydney
export function formatDateTimeInSydney(date) {
    return DateTime.fromJSDate(asJSDate(date))
        .setZone('Australia/Sydney')
        .toFormat('d LLL yyyy, h:mma')
        .toLowerCase()
}

// Midnight *today* in Australia/Sydney (JS Date)
export function getSydneyStartOfToday() {
    return DateTime.local().setZone('Australia/Sydney').startOf('day').toJSDate()
}

// YYYY-MM-DD for <input type="date">, in Australia/Sydney
export function formatDateForInput(date) {
    return DateTime.fromJSDate(asJSDate(date))
        .setZone('Australia/Sydney')
        .toFormat('yyyy-LL-dd')
}

// Interpret a value “as Sydney local time” when it’s an unzoned string.
// If the string has a timezone (Z or ±HH:MM), we respect it.
// If it's a JS Date or epoch ms, we keep the instant.
export function parseAsSydneyDate(value) {
    if (value instanceof Date) return value
    if (typeof value === 'number') return new Date(value)
    if (typeof value === 'string') {
        const hasTZ = /Z|[+\-]\d{2}:?\d{2}$/.test(value)
        const dt = hasTZ
            ? DateTime.fromISO(value) // use embedded zone/offset
            : DateTime.fromISO(value, { zone: 'Australia/Sydney' }) // treat as Sydney local
        return dt.toJSDate()
    }
    return null
}

// “Wednesday, 6 August 2025” in Australia/Sydney
export function formatDateInSydney(date) {
    return DateTime.fromJSDate(asJSDate(date))
        .setZone('Australia/Sydney')
        .toFormat('cccc d LLLL yyyy')
}

// “3:07pm” in Australia/Sydney
export function formatTimeInSydney(date) {
    return DateTime.fromJSDate(asJSDate(date))
        .setZone('Australia/Sydney')
        .toFormat('h:mma')
        .toLowerCase()
}

// Start (inclusive) and End (exclusive) of the Sydney day containing `date`
export function getStartAndEndOfDay(date) {
    const s = DateTime.fromJSDate(asJSDate(date)).setZone('Australia/Sydney').startOf('day')
    const e = s.plus({ days: 1 })
    return { startOfDay: s.toJSDate(), endOfDay: e.toJSDate() }
}

// Same calendar day in Sydney?
export function isSameDay(date1, date2) {
    const d1 = DateTime.fromJSDate(asJSDate(date1)).setZone('Australia/Sydney')
    const d2 = DateTime.fromJSDate(asJSDate(date2)).setZone('Australia/Sydney')
    return d1.hasSame(d2, 'day')
}

// “3:07pm” from a string timestamp, shown in Sydney
export function formatTimeFromString(dateStr) {
    const dt = toInstant(dateStr).setZone('Australia/Sydney')
    return dt.toFormat('h:mma').toLowerCase()
}

// “6 August, 3:07pm” from a string timestamp, shown in Sydney
export function formatDateTime(dateStr) {
    const d = toInstant(dateStr).setZone('Australia/Sydney')
    return `${d.toFormat('d LLL')}, ${d.toFormat('h:mma').toLowerCase()}`
}

// Parse “9”, “9:30”, “9pm”, “9:30pm”, apply to the Sydney date of `baseDate`
export function parseFlexibleTime(input, baseDate) {
    if (!baseDate || typeof input !== 'string') return null
    const m = input.trim().match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i)
    if (!m) return null

    let hours = parseInt(m[1], 10)
    const minutes = parseInt(m[2] ?? '0', 10)
    const meridian = (m[3] || '').toLowerCase()

    if (meridian === 'pm' && hours < 12) hours += 12
    if (meridian === 'am' && hours === 12) hours = 0

    const day = DateTime.fromJSDate(asJSDate(baseDate)).setZone('Australia/Sydney').startOf('day')
    return day.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 }).toJSDate()
}

// Minutes overlap between [start, end?) and the Sydney day containing `day`
export function minutesOverlapWithinDay(start, end, day) {
    const dayStart = DateTime.fromJSDate(asJSDate(day)).setZone('Australia/Sydney').startOf('day')
    const dayEnd = dayStart.plus({ days: 1 })

    const s = toInstant(start)
    const e = end ? toInstant(end) : dayEnd

    const segStart = s < dayStart ? dayStart : s
    const segEnd = e > dayEnd ? dayEnd : e

    const ms = Math.max(0, segEnd.toMillis() - segStart.toMillis())
    return Math.round(ms / 60000)
}

// Minutes between start and end; if end missing, use end of Sydney day of `dayForFallback`
export function minutesBetweenOrEndOfDay(start, end, dayForFallback) {
    const s = toInstant(start)
    const e = end
        ? toInstant(end)
        : DateTime.fromJSDate(asJSDate(dayForFallback)).setZone('Australia/Sydney').startOf('day').plus({ days: 1 })
    const ms = Math.max(0, e.toMillis() - s.toMillis())
    return Math.round(ms / 60000)
}

// ──────────────────────────────────────────────────────────────────────────────
// no timezone dependency
// ──────────────────────────────────────────────────────────────────────────────

export function formatMinutesAsHM(minutes) {
    const total = Math.round(minutes || 0)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h > 0 && m > 0) return `${h}h${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
}

export function formatHM(totalMinutes) {
    const m = Math.max(0, Math.round(totalMinutes || 0))
    const h = Math.floor(m / 60)
    const rem = m % 60
    return h > 0 ? `${h}h ${rem}m` : `${rem}m`
}


// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers (not exported)
// ──────────────────────────────────────────────────────────────────────────────

// Ensure we’re working with a JS Date (pass-through for Date, convert numbers)
function asJSDate(v) {
    if (v instanceof Date) return v
    if (typeof v === 'number') return new Date(v)
    if (typeof v === 'string') {
        // Try ISO first; if not ISO, let Date parse as last resort
        const iso = DateTime.fromISO(v)
        return iso.isValid ? iso.toJSDate() : new Date(v)
    }
    return new Date(NaN)
}

// Parse any input to a Luxon DateTime representing the *instant in time*
// - strings with TZ/offset are respected
// - strings without TZ are assumed UTC (so epochs/ISO dates are stable)
//   (We only treat unzoned strings as Sydney *when explicitly using parseAsSydneyDate*)
function toInstant(v) {
    if (v instanceof Date) return DateTime.fromJSDate(v)
    if (typeof v === 'number') return DateTime.fromMillis(v)
    if (typeof v === 'string') {
        return /Z|[+\-]\d{2}:?\d{2}$/.test(v)
            ? DateTime.fromISO(v)
            : DateTime.fromISO(v, { zone: 'utc' })
    }
    return DateTime.invalid('Unknown input')
}