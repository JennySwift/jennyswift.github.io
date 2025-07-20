//Set the y value to change depending on what BG is at the time of the note so that the note icon doesn't cover up the BG graph
function getNotesXYPoints(yValue) {
    return notes.map(note => {
        const noteTime = note.timestamp;
        const closestReading = glucoseReadings.reduce((closest, current) => {
            const currentTime = new Date(current.timestamp);
            const diff = Math.abs(currentTime - noteTime);
            const closestDiff = Math.abs(new Date(closest.timestamp) - noteTime);
            return diff < closestDiff ? current : closest;
        }, glucoseReadings[0]);


        const safeOffset = 5;
        const bgY = closestReading.value;

        // Nudge icon slightly above or below BG line depending on where it sits
        const iconY = bgY >= 6 ? bgY - safeOffset : bgY + safeOffset;

        return {
            x: note.timestamp,
            y: iconY,
            text: note.text,
            type: "note"
        };
    });
}

function getBolusXYPoints() {
    return bolusDoses.map((dose) => {
        const closestReading = glucoseReadings.reduce((closest, current) => {
            const currentTime = new Date(current.timestamp);
            const diff = Math.abs(currentTime - dose.timestamp);
            const closestDiff = Math.abs(new Date(closest.timestamp) - dose.timestamp);
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