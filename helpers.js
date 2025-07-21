//
//  helpers.js
//  
//
//  Created by Jenny Swift on 16/7/2025.
//

function formatMinutesAsHM(minutes) {
    const total = Math.round(minutes);
    const h = Math.floor(total / 60);
    const m = total % 60;

    if (h > 0 && m > 0) return `${h}h${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function getStartAndEndOfDay(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    return { startOfDay, endOfDay };
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function formatTimeFromString(dateStr) {
    const date = new Date(dateStr);
    return formatTime12hCompact(date)
}

function formatTime12hCompact(date) {
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).toLowerCase().replace(' ', '');
}

function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-AU", { month: "long" }); // e.g. "July"
    
    // Get time parts
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    
    const time = `${hours}:${minutes}${ampm}`;
    
    return `${day} ${month}, ${time}`;
}

function parseFlexibleTime(input, baseDate) {
    if (!baseDate) return null;

    const timeParts = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!timeParts) return null;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2] ?? "0");
    const meridian = timeParts[3]?.toLowerCase();

    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;

    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
}


