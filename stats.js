//
//  stats.js
//  
//
//  Created by Jenny Swift on 20/7/2025.
//

function calculateTotalBasalForDay(startOfDay, endOfDay) {
    const dayEntries = basalEntries
        .filter(entry =>
            entry.startTime < endOfDay && // starts before end of day
            (entry.endTime === undefined || entry.endTime > startOfDay) // ends after day starts
        )
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    let totalUnits = 0;

    for (const entry of dayEntries) {
        const start = new Date(Math.max(new Date(entry.startTime), startOfDay));
        const end = entry.endTime
            ? new Date(Math.min(new Date(entry.endTime), endOfDay))
            : endOfDay;

        const durationMinutes = (end - start) / (1000 * 60);
        if (durationMinutes > 0) {
            const delivered = entry.rate * (durationMinutes / 60);
            totalUnits += delivered;
        }
    }

    return totalUnits;
}
