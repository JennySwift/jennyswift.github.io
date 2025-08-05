

//Set the y value to change depending on what BG is at the time of the note so that the note icon doesn't cover up the BG graph
function getNotesXYPoints(yValue) {
    return notes.map(note => {
        const noteTime = note.timestamp; // Already a Date from parseJSONData
        let closestReading = glucoseReadings[0];
        let smallestDiff = Math.abs(glucoseReadings[0].timestamp - noteTime);

        for (let i = 1; i < glucoseReadings.length; i++) {
            const reading = glucoseReadings[i];
            const readingTime = reading.timestamp; // Already a Date
            const diff = Math.abs(readingTime - noteTime);
            if (diff < smallestDiff) {
                closestReading = reading;
                smallestDiff = diff;
            }
        }

        const safeOffset = 5;
        const bgY = closestReading.value;
        // Nudge icon slightly above or below BG line depending on where it sits
        const iconY = bgY >= 6 ? bgY - safeOffset : bgY + safeOffset;

        return {
            x: noteTime,
            y: iconY,
            text: note.text,
            type: "note"
        };
    });
}

function getBolusXYPoints() {
    return bolusDoses.map((dose) => {
        const closestReading = glucoseReadings.reduce((closest, current) => {
            const currentTime = parseAsSydneyDate(current.timestamp);
            const diff = Math.abs(currentTime - dose.timestamp);
            const closestDiff = Math.abs(parseAsSydneyDate(closest.timestamp) - dose.timestamp);
            return diff < closestDiff ? current : closest;
        }, glucoseReadings[0]);

        const safeOffset = 3;
        const bgY = closestReading?.value ?? 6;
        const dotY = bgY >= 6 ? bgY + safeOffset : bgY - safeOffset;

        return {
            x: dose.timestamp,
            y: dotY,
            type: "bolus",
            amount: dose.amount
        };
    });
}
