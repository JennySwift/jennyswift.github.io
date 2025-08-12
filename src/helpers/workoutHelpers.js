export function formatMinutesPerKm(value) {
    const minutes = Math.floor(value);
    const seconds = Math.round((value - minutes) * 60);
    return `${minutes} min ${seconds.toString().padStart(2, '0')} sec/km`;
}

export function formatKmPerHour(value) {
    return `${value.toFixed(1)} km/h`;
}

export function formatDistance(meters) {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
}