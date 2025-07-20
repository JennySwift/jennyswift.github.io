//
//  stats.js
//  
//
//  Created by Jenny Swift on 20/7/2025.
//
function updateStats(startOfDay, endOfDay) {
    const summaryRow = document.getElementById("summaryRow");
    summaryRow.innerHTML = ""; // Clear previous summary

    const foodLogsForDay = foodLogs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);
    
    const totalBolus = calculateTotalBolusForDay(startOfDay, endOfDay);
    const totalBasal = calculateTotalBasalForDay(startOfDay, endOfDay);
    const totalInsulin = totalBolus + totalBasal
    const totalNetCarbs = foodLogsForDay.reduce((sum, log) => sum + (log.netCarbs || 0), 0);

    appendBolusSummary(summaryRow, totalBolus);
    appendBasalSummary(summaryRow, totalBasal);
    appendTotalInsulinSummary(summaryRow, totalInsulin);
    appendNetCarbsToBolusRatio(summaryRow, totalBolus, totalNetCarbs);
    appendNetCarbsToTotalInsulinRatio(summaryRow, totalNetCarbs, totalInsulin);
    appendNetCarbsSummary(summaryRow, foodLogsForDay);
    appendTotalCarbsSummary(summaryRow, foodLogsForDay);
    appendFatSummary(summaryRow, foodLogsForDay);
    //I haven't entered protein data in my foods yet for this
//    appendProteinSummary(summaryRow, foodLogsForDay);
    appendFibreSummary(summaryRow, foodLogsForDay);
    appendCaloriesSummary(summaryRow, foodLogsForDay);
}

function appendNetCarbsToTotalInsulinRatio(container, totalNetCarbs, totalInsulin) {
    let ratioText = "N/A";
    if (totalInsulin > 0) {
        const ratio = totalNetCarbs / totalInsulin;
        ratioText = `${ratio.toFixed(2)}g/u`;
    }

    const item = createSummaryItem("summary-carb-to-insulin", `➗ Net Carbs/Total Insulin: ${ratioText}`);
    container.appendChild(item);
}

function appendNetCarbsToBolusRatio(container, totalBolus, totalNetCarbs) {
    let ratioText = "N/A";
    if (totalNetCarbs > 0 && totalBolus > 0) {
        const ratio = totalNetCarbs / totalBolus;
        ratioText = `${ratio.toFixed(2)}g/U`;
    }

    const item = createSummaryItem("summary-bolus-to-carb", `➗ Net Carbs / Bolus Insulin: ${ratioText}`);
    container.appendChild(item);
}

function appendBolusSummary(container, total) {
    const item = createSummaryItem("summary-bolus", `💉 Bolus: ${total.toFixed(2)}U`);
    container.appendChild(item);
}

function appendBasalSummary(container, total) {
    const item = createSummaryItem("summary-basal", `💉 Basal: ${total.toFixed(2)}U`);
    container.appendChild(item);
}

function appendTotalInsulinSummary(container, total) {
    const item = createSummaryItem("summary-total-insulin", `💉 Total Insulin: ${total.toFixed(2)}U`);
    container.appendChild(item);
}

function appendNetCarbsSummary(container, logs) {
    const total = logs.reduce((sum, log) => sum + (log.netCarbs || 0), 0);
    const item = createSummaryItem("summary-carbs", `🍌 Net Carbs: ${total.toFixed(1)}g`);
    container.appendChild(item);
}

function appendTotalCarbsSummary(container, logs) {
    const total = logs.reduce((sum, log) => sum + (log.totalCarbs || 0), 0);
    const item = createSummaryItem("summary-total-carbs", `🍌 Total Carbs: ${total.toFixed(1)}g`);
    container.appendChild(item);
}

function appendFatSummary(container, logs) {
    const total = logs.reduce((sum, log) => sum + (log.fat || 0), 0);
    const item = createSummaryItem("summary-fat", `🥑 Fat: ${total.toFixed(1)}g`);
    container.appendChild(item);
}

function appendProteinSummary(container, logs) {
    const total = logs.reduce((sum, log) => sum + (log.protein || 0), 0);
    const item = createSummaryItem("summary-protein", `🫘 Protein: ${total.toFixed(1)}g`);
    container.appendChild(item);
}

function appendFibreSummary(container, logs) {
    const total = logs.reduce((sum, log) => sum + (log.fibre || 0), 0);
    const item = createSummaryItem("summary-fibre", `🥦 Fibre: ${total.toFixed(1)}g`);
    container.appendChild(item);
}

function appendCaloriesSummary(container, logs) {
    const total = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const item = createSummaryItem("summary-calories", `🔥 Calories: ${total.toFixed(0)}`);
    container.appendChild(item);
}

function createSummaryItem(className, text) {
    const div = document.createElement("div");
    div.className = `summary-item ${className}`;
    div.textContent = text;
    return div;
}

function calculateTotalBolusForDay(startOfDay, endOfDay) {
    const bolusesForDay = bolusDoses.filter(b => b.timestamp >= startOfDay && b.timestamp < endOfDay);
    
    return bolusesForDay.reduce((sum, b) => sum + (b.amount || 0), 0);
}

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
