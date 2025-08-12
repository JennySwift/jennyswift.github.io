// Sydney-aware date helpers

export function getSydneyStartOfToday() {
    const sydneyTime = new Date(new Date().toLocaleString("en-US", {
        timeZone: "Australia/Sydney"
    }));
    sydneyTime.setHours(0, 0, 0, 0);
    return sydneyTime;
}

export function formatDateForInput(date) {
    // Produce YYYY-MM-DD *in Australia/Sydney*, regardless of viewer location
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date); // en-CA => "YYYY-MM-DD"
}

let sydneyCallCount = 0;

export function parseAsSydneyDate(dateStr) {
    sydneyCallCount++;
    if (sydneyCallCount % 100 === 0) {
        console.log(`[parseAsSydneyDate] called ${sydneyCallCount} times`);
    }

    return new Date(new Date(dateStr).toLocaleString("en-US", {
        timeZone: "Australia/Sydney"
    }));
}

export function formatDateInSydney(date) {
    return date.toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Australia/Sydney"
    });
}

export function formatTimeInSydney(date) {
    return date.toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Australia/Sydney"
    });
}

export function formatMinutesAsHM(minutes) {
    const total = Math.round(minutes);
    const h = Math.floor(total / 60);
    const m = total % 60;

    if (h > 0 && m > 0) return `${h}h${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

export function getStartAndEndOfDay(date) {
    const startOfDay = parseAsSydneyDate(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return { startOfDay, endOfDay };
}

export function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

export function formatTimeFromString(dateStr) {
    const date = parseAsSydneyDate(dateStr);
    return formatTime12hCompact(date);
}

export function formatTime12hCompact(date) {
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).toLowerCase().replace(' ', '');
}

export function formatDateTime(dateStr) {
    const d = parseAsSydneyDate(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-AU", { month: "long", timeZone: "Australia/Sydney" });

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    const time = `${hours}:${minutes}${ampm}`;

    return `${day} ${month}, ${time}`;
}

export function parseFlexibleTime(input, baseDate) {
    if (!baseDate) return null;

    const timeParts = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!timeParts) return null;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2] ?? "0");
    const meridian = timeParts[3]?.toLowerCase();

    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;

    const result = parseAsSydneyDate(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
}
