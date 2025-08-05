//
//  dateNavigation.swift
//
//
//  Created by Jenny Swift on 16/7/2025.
//

function handleNoteClick(timestamp) {
    const dateOnly = parseAsSydneyDate(timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    const dateInput = document.getElementById("selectedDate");
    if (dateInput) {
        dateInput.valueAsDate = dateOnly;
    }

    updateChartForDate(dateOnly);

    jumpToTime(parseAsSydneyDate(timestamp));
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showNearestTooltip(chart, parsedTime, maxDiffMs = 2 * 60 * 1000) {
    const dataset = chart.data.datasets[0]?.data ?? [];
    let closestIndex = -1;
    let closestDiff = Infinity;

    for (let i = 0; i < dataset.length; i++) {
        const pointTime = parseAsSydneyDate(dataset[i].x);
        const diff = Math.abs(pointTime - parsedTime);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
        }
    }

    if (closestDiff < maxDiffMs && closestIndex !== -1) {
        chart.setActiveElements([{ datasetIndex: 0, index: closestIndex }]);
        chart.tooltip.setActiveElements([{ datasetIndex: 0, index: closestIndex }], { x: 0, y: 0 });
        chart.update();
    }
}

function jumpToTime(inputTime) {
    let parsed;

    if (inputTime instanceof Date) {
        parsed = inputTime;
    } else {
        const input = document.getElementById("jumpInput").value.trim();
        if (!input) return;

        const selected = document.getElementById("selectedDate").valueAsDate;
        parsed = parseFlexibleTime(input, selected);
        if (!parsed) {
            alert("Couldn't understand that time. Try e.g. 2:30 PM or 14:00");
            return;
        }
    }

    const formattedTarget = parsed.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    console.log("⏩ Jumping to:", formattedTarget);

    updateVerticalLines(parsed);  // ✅ This syncs the vertical line across all charts

    // ✅ Highlight closest points in all charts
    showNearestTooltip(bgChart, parsed);
    showNearestTooltip(foodChart, parsed);
    showNearestTooltip(bolusChart, parsed);
//    showNearestTooltip(basalChart, parsed);
}

document.getElementById("prevDate").addEventListener("click", () => {
    const selected = document.getElementById("selectedDate");
    const date = parseAsSydneyDate(selected.value);
    date.setDate(date.getDate() - 1);
    selected.value = date.toISOString().split("T")[0];
    updateChartForDate(date);
    // showNotesForDate(date);
});

document.getElementById("nextDate").addEventListener("click", () => {
    const selected = document.getElementById("selectedDate");
    const date = parseAsSydneyDate(selected.value);
    date.setDate(date.getDate() + 1);
    selected.value = date.toISOString().split("T")[0];
    updateChartForDate(date);
    showNotesForDate(date);
});

function highlightIfToday(date) {
    const input = document.getElementById("selectedDate");

    const today = getSydneyStartOfToday();
    const selected = parseAsSydneyDate(date);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) {
        input.classList.add("today");
    } else {
        input.classList.remove("today");
    }
}

function updateForwardButtonState(date) {
    const forwardButton = document.getElementById("nextDate");

    const today = getSydneyStartOfToday();
    const selected = parseAsSydneyDate(date);
    selected.setHours(0, 0, 0, 0);

    forwardButton.disabled = selected.getTime() === today.getTime();
}
