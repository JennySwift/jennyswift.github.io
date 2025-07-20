//
//  chartLogic.js
//
//
//  Created by Jenny Swift on 16/7/2025.
//

let bgChart;
let foodChart;
let glucoseReadings = [];
let foodLogs = [];
let notes = [];
let bolusDoses = [];
let basalEntries = [];
let workouts = [];
let fasts = [];
let basalChart;

const noteIcon = new Image();
noteIcon.src = 'icons/note-icon.png';
let noteIconLoaded = false;


noteIcon.onerror = () => {
    console.error("❌ Failed to load note icon from:", noteIcon.src);
};

noteIcon.onload = () => {
    noteIconLoaded = true;
    console.log("✅ Note icon loaded successfully");
    if (bgChart) bgChart.update();
};
const drawNoteIconsPlugin = {
    id: 'drawNoteIcons',
    afterDatasetsDraw(chart, args, options) {
        if (!noteIconLoaded) return;
        
        const {ctx, scales} = chart;
        const dataset = chart.data.datasets.find(d => d.label === "Notes");
        if (!dataset) return;
        
        dataset.data.forEach((point) => {
            const x = scales.x.getPixelForValue(point.x);
            const y = scales.y.getPixelForValue(point.y) - 30; // ⬆️ shift icon up by 10px
            const iconSize = 100;
            
            ctx.drawImage(noteIcon, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
        });
    }
};
Chart.register(drawNoteIconsPlugin);

function updateVerticalLines(timestamp) {
    //    console.log("📏 Setting dynamicLine value to:", timestamp);  // ← Add this
    if (bgChart) {
        bgChart.options.plugins.annotation.annotations.dynamicLine.value = timestamp;
        bgChart.update();
    }
    if (foodChart) {
        foodChart.options.plugins.annotation.annotations.dynamicLine.value = timestamp;
        foodChart.update();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("bgChart").getContext("2d");
    const foodCtx = document.getElementById("foodChart").getContext("2d");
    const basalCtx = document.getElementById("basalChart").getContext("2d");
    const selectedDateInput = document.getElementById("selectedDate");
    
    fetch("https://dl.dropboxusercontent.com/scl/fi/0udoq3x6gkchstkq2hqxg/glucoseData.json?rlkey=vllvwb6wlx2el12c9aqijw37p")
    .then((response) => response.json())
    .then((data) => {
        //        console.log("📦 Raw data from JSON:", data);
        glucoseReadings = data.glucoseReadings.map((r) => ({
            timestamp: new Date(r.timestamp),
            value: r.value,
        }));
        
        foodLogs = data.foodLogs?.map((f) => ({
            timestamp: new Date(f.timestamp),
            foodName: f.foodName,
            netCarbs: f.netCarbs,
            calories: f.calories,
            fat: f.fat,
        })) || [];
        
        notes = data.notes?.map((n) => ({
            timestamp: new Date(n.startTime),
            text: n.text,
            tags: n.tags || [],
        })) || [];
        
        fasts = data.fasts?.map((f) => {
            const startTime = new Date(f.startTime);
            const endTime = f.endTime ? new Date(f.endTime) : null;
            const duration = endTime ? (endTime - startTime) / 1000 : null; // in seconds
            
            return {
                startTime,
                endTime,
                duration,
                notes: f.notes
            };
        }) || [];
        
        workouts = data.workouts?.map((w) => ({
            start: new Date(w.startTime),
            name: w.name,
            type: w.type,
            duration: w.duration,
            distance: w.distance,
            activeCalories: w.activeCalories,
            maxHeartRate: w.maxHeartRate,
            endTime: w.endTime,
            source: w.source,
            elapsedTime: w.elapsedTime,
            averageHeartRate: w.averageHeartRate,
            notes: w.notes,
            tags: w.tags || []
        })) || [];
        
        basalEntries = data.basalEntries?.map(b => ({
            startTime: new Date(b.startTime),
            endTime: b.endTime ? new Date(b.endTime) : null,
            rate: b.rate,
            mode: b.mode,
            notes: b.notes
        })) || [];
        
        bolusDoses = data.bolusDoses?.map((b) => ({
            timestamp: new Date(b.timestamp),
            amount: b.amount,
            duration: b.duration,
            type: b.type,
            notes: b.notes,
            carbRatioUsed: b.carbRatioUsed,
            source: b.source,
            tags: b.tags || []
        })) || [];
        
        //        console.log("✅ Food Logs:", foodLogs);
        //
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        selectedDateInput.value = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
        
        bgChart = createBGChart(ctx);
        foodChart = createFoodChart(foodCtx);
        basalChart = createBasalChart(basalCtx);
        
        updateChartForDate(today);
        
        attachChartMousemoveSync(bgChart, "bgChart");
        attachChartMousemoveSync(foodChart, "foodChart");
        
        
        //        attachChartMouseleaveClear();
        
    });
    
    
    
    selectedDateInput.addEventListener("change", () => {
        const selected = selectedDateInput.valueAsDate;
        updateChartForDate(selected);
    });
    
    // Hide tooltip + vertical line when tapping outside chart on iPhone
    document.addEventListener("touchstart", (e) => {
        const chartEl = document.getElementById("bgChart");
        if (!chartEl.contains(e.target)) {
            bgChart.setActiveElements([]);
            bgChart.options.plugins.annotation.annotations.dynamicLine.value = null;
            bgChart.update();
        }
    });
    
    document.getElementById("jumpInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            jumpToTime();
        }
    });
    
    
    
    //    document.getElementById("bgChart").addEventListener("mousemove", (evt) => {
    //        if (!bgChart) return;
    //
    //        const points = bgChart.getElementsAtEventForMode(evt, "nearest", { intersect: false }, false);
    //        if (points.length > 0) {
    //            const index = points[0].index;
    //            const label = bgChart.data.datasets[0].data[index]?.x;
    //            bgChart.options.plugins.annotation.annotations.dynamicLine.value = label;
    //            bgChart.update("none");
    //        }
    //    });
    
    
    
});

//    Hide the vertical line when mouse leaves chart
function attachChartMouseleaveClear() {
    ["bgChart", "foodChart"].forEach((chartId) => {
        const el = document.getElementById(chartId);
        el.addEventListener("mouseleave", () => {
            if (bgChart) {
                bgChart.options.plugins.annotation.annotations.dynamicLine.value = null;
                bgChart.update("none");
            }
            if (foodChart) {
                foodChart.options.plugins.annotation.annotations.dynamicLine.value = null;
                foodChart.update("none");
            }
        });
    });
}

function attachChartMousemoveSync(chartInstance, chartElementId) {
    const el = document.getElementById(chartElementId);
    el.addEventListener("mousemove", (evt) => {
        if (!chartInstance) return;
        
        const points = chartInstance.getElementsAtEventForMode(evt, "nearest", { intersect: false }, false);
        if (points.length > 0) {
            const index = points[0].index;
            const label = chartInstance.data.datasets[0].data[index]?.x;
            updateVerticalLines(label);
        }
    });
}



function updateAnnotationZonesFromYScale() {
    const yScale = bgChart.scales.y;
    if (!yScale) return;
    
    const annotations = bgChart.options.plugins.annotation.annotations;
    
    annotations.lowZone.yMin = yScale.min;
    annotations.lowZone.yMax = 4;
    
    annotations.inRangeZone.yMin = 4;
    annotations.inRangeZone.yMax = 8;
    
    annotations.highYellowZone.yMin = 8;
    annotations.highYellowZone.yMax = 10;
    
    annotations.veryHighZone.yMin = 10;
    annotations.veryHighZone.yMax = yScale.max;
}

//To fix the background colours not being in the right zones on page load
function updateAnnotationZonesFromYMax(yMax) {
    const annotations = chart.options.plugins.annotation.annotations;
    annotations.lowZone.yMax = 4;
    annotations.inRangeZone.yMin = 4;
    annotations.inRangeZone.yMax = 8;
    annotations.highYellowZone.yMin = 8;
    annotations.highYellowZone.yMax = 10;
    annotations.veryHighZone.yMin = 10;
    annotations.veryHighZone.yMax = yMax;
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

function handleLogClick(timestamp) {
    jumpToTime(new Date(timestamp));
    
    // Highlight matching point in BG chart
    const bgDataset = bgChart.data.datasets[0].data;
    const bgIndex = bgDataset.findIndex(p => Math.abs(new Date(p.x) - timestamp) < 2 * 60 * 1000);
    if (bgIndex !== -1) {
        highlightChartPoint(bgChart, 0, bgIndex);
    }
    
    // Highlight matching point in Food chart
    const foodDataset = foodChart.data.datasets[0].data;
    const foodIndex = foodDataset.findIndex(p => Math.abs(new Date(p.x) - timestamp) < 2 * 60 * 1000);
    if (foodIndex !== -1) {
        highlightChartPoint(foodChart, 0, foodIndex);
    }
}

function showFoodLogsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const foodLogsContainer = document.getElementById("foodLogsContainer");
    foodLogsContainer.innerHTML = ""; // clear old food logs
    
    //    console.log("Food logs:", foodLogs);
    
    const foodLogsForDay = foodLogs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);
    
    //    console.log("Food Logs for day:", foodLogsForDay);
    
    if (foodLogsForDay.length === 0) {
        foodLogsContainer.textContent = "No food logs for this day.";
        return;
    }
    
    foodLogsForDay.forEach(log => {
        const div = document.createElement("div");
        div.classList.add("log-block");
        
        const time = formatTime12hCompact(log.timestamp);
        
        div.innerHTML = `
            <strong>${time}</strong>: ${log.foodName}
            <div class="log-details">
                <span>🍌 Net Carbs: ${log.netCarbs}g</span>
                <span>🥑 Fat: ${log.fat}g</span>
                <span>🔥 Calories: ${log.calories}</span>
            </div>
        `;
        div.setAttribute("data-timestamp", log.timestamp.toISOString());
        div.style.cursor = "pointer";
        
        div.addEventListener("click", () => {
            handleLogClick(new Date(log.timestamp));
        });
        
        
        foodLogsContainer.appendChild(div);
    });
}

function showWorkoutsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const container = document.getElementById("workoutsContainer");
    container.innerHTML = "";
    
    const workoutsForDay = workouts.filter(w => w.start >= startOfDay && w.start < endOfDay);
    
    console.log("workouts:", workouts);
    console.log("workouts for day:", workoutsForDay);
    
    if (workoutsForDay.length === 0) {
        container.textContent = "No workouts for this day.";
        return;
    }
    
    workoutsForDay.forEach((w) => {
        const div = document.createElement("div");
        div.classList.add("log-block");
        
        const startTime = formatTimeFromString(w.start);
            const endTime = formatTimeFromString(w.endTime);
        const elapsedMinutes = Math.round(w.elapsedTime / 60);
        const elapsedStr = `${elapsedMinutes} min`;
        
        const durationMinutes = Math.round(w.duration / 60);
        const durationStr = `${durationMinutes} min`;
        
        const distanceStr = w.distance ? `<div><strong>Distance:</strong> ${w.distance.toFixed(2)} km</div>` : "";
        
        const activeCaloriesStr = Math.round(w.activeCalories);
            const averageHeartRateStr = Math.round(w.averageHeartRate);
        
        div.innerHTML = `
            <div class="log-title">${w.name}</div>
            <div><strong>Duration:</strong> ${durationStr}</div>
            <div><strong>Average H/R:</strong> ${averageHeartRateStr}bpm</div>
            <div><strong>Max H/R:</strong> ${w.maxHeartRate}bpm</div>
            <div><strong>Calories:</strong> ${activeCaloriesStr}</div>
            <div><strong>Start:</strong> ${startTime}</div>
            <div><strong>End:</strong> ${endTime}</div>
            <div><strong>Elapsed Time:</strong> ${elapsedStr}</div>
            
            ${distanceStr}
        `;
        
        workoutsContainer.appendChild(div);
    });
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function showFastsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const container = document.getElementById("fastsContainer");
    container.innerHTML = "";
    
    const fastsForDay = fasts.filter(f => {
        const start = new Date(f.startTime);
        const end = f.endTime ? new Date(f.endTime) : null;
        
        return (
                (start >= startOfDay && start < endOfDay) || // started today
                (end && end >= startOfDay && end < endOfDay) || // ended today
                (start < startOfDay && (!end || end > endOfDay)) // spanned entire day
                );
    });
    
    const totalSeconds = fastsForDay.reduce((sum, f) => sum + (f.duration || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (fastsForDay.length === 0) {
        container.textContent = "No fasts for this day.";
        return;
    }
    
    fastsForDay.forEach(fast => {
        const div = document.createElement("div");
        div.classList.add("fast-block");
        
        // Heading label based on whether start/end is on the selected date
        const isStartToday = isSameDay(fast.startTime, date);
        const isEndToday = fast.endTime && isSameDay(fast.endTime, date);
        
        let label = "Continued";
        if (isStartToday && isEndToday) {
            label = "Started and Ended";
        } else if (isStartToday) {
            label = "Started fast:";
        } else if (isEndToday) {
            label = "Ended fast:";
        }
        
        const start = formatDateTime(fast.startTime);
        const end = fast.endTime ? formatDateTime(fast.endTime) : "Ongoing";
        
        const duration = fast.duration
        ? `${Math.floor(fast.duration / 3600)}h ${Math.floor((fast.duration % 3600) / 60)}m`
        : "";
        
        div.innerHTML = `
            <div class="fast-label">${label}</div>
            ${duration ? `<div><strong>Duration:</strong> ${duration}</div>` : ""}
            <div><strong>Start:</strong> ${start}</div>
            <div><strong>End:</strong> ${end}</div>
            ${fast.notes ? `<div class="fast-notes">📝 ${fast.notes}</div>` : ""}
        `;
        fastsContainer.appendChild(div);
    });
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

//function formatDateTime(dateStr) {
//    const d = new Date(dateStr);
//    const day = d.getDate();
//    const month = d.toLocaleString("en-AU", { month: "long" }); // "July"
//    const time = d.toLocaleTimeString("en-AU", {
//        hour: "numeric",
//        minute: "2-digit",
//        hour12: true,
//    }).toLowerCase(); // "2:30pm"
//    return `${day} ${month}, ${time}`;
//}

function showBolusesForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const container = document.getElementById("bolusContainer");
    container.innerHTML = "";
    
    const summary = document.getElementById("bolusSummary");
    const bolusesForDay = bolusDoses.filter(b => b.timestamp >= startOfDay && b.timestamp < endOfDay);
    
    const totalUnits = bolusesForDay.reduce((sum, b) => sum + (b.amount || 0), 0);
    summary.textContent = `💉 Total Bolus: ${totalUnits.toFixed(2)}U`;
    
    if (bolusesForDay.length === 0) {
        summary.textContent = "💉 Total Bolus: 0U";
        container.textContent = "No bolus doses for this day.";
        return;
    }
    
    
    
    bolusesForDay.forEach(bolus => {
        const div = document.createElement("div");
        div.classList.add("bolus-block");
        
        const time = formatTime12hCompact(bolus.timestamp);
        const amount = bolus.amount?.toFixed(2) ?? "?";
        
        let extra = "";
        if (bolus.carbRatioUsed) {
            extra += ` · Ratio: 1:${bolus.carbRatioUsed}`;
        }
        if (bolus.notes) {
            extra += ` · ${bolus.notes}`;
        }
        
        div.innerHTML = `<strong>${time}</strong>: 💉 ${amount}U ${extra}`;
        container.appendChild(div);
    });
}

function showNotesForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const notesContainer = document.getElementById("notesContainer");
    notesContainer.innerHTML = ""; // clear old notes
    
    console.log("Notes:", notes);
    
    const notesForDay = notes.filter(note => note.timestamp >= startOfDay && note.timestamp < endOfDay);
    
    console.log("Notes for day:", notesForDay);
    
    if (notesForDay.length === 0) {
        notesContainer.textContent = "No notes for this day.";
        return;
    }
    
    notesForDay.forEach(note => {
        const div = document.createElement("div");
        div.classList.add("note-log-block");
        
        const time = formatTime12hCompact(note.timestamp);
        const tags = note.tags?.map(tag => `<span class="note-tag">${tag}</span>`).join(" ") ?? "";
        
        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("note-log-body");
        bodyDiv.innerHTML = `<strong>${time}</strong>: ${note.text.replace(/\n/g, "<br>")}`;
        
        const tagsDiv = document.createElement("div");
        tagsDiv.classList.add("note-tags");
        tagsDiv.innerHTML = tags;
        
        div.appendChild(bodyDiv);
        if (tags) div.appendChild(tagsDiv);
        
        notesContainer.appendChild(div);
    });
}

function updateFoodChartForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const foodLogsForDay = foodLogs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);
    
    const data = foodLogsForDay.map(log => ({
        x: log.timestamp,
        y: log.netCarbs,
        foodName: log.foodName,
        calories: log.calories,
        netCarbs: log.netCarbs,
        fat: log.fat
    }));
    
    foodChart.data.datasets[0].data = data;
    foodChart.options.scales.x.min = startOfDay;
    foodChart.options.scales.x.max = endOfDay;
    
    const netCarbValues = foodLogsForDay.map(log => log.netCarbs);
    setFoodChartYScales(netCarbValues);
    
    foodChart.update();
}

//For BG chart
function updateChartForDate(date) {
    showNotesForDate(date);
    showFoodLogsForDate(date);
    showBolusesForDate(date);
    showWorkoutsForDate(date);
    showFastsForDate(date);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    setChartXScales(startOfDay, endOfDay);
    
    const heading = document.getElementById("dateHeading");
    heading.textContent = startOfDay.toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    
    const filtered = glucoseReadings.filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay);
    
    const bolusesForDay = bolusDoses.filter(dose => dose.timestamp >= startOfDay && dose.timestamp < endOfDay);
    
    
    
    const bgXYValues = filtered.map(r => ({ x: r.timestamp, y: r.value }));
    const glucoseValues = filtered.map(r => r.value);
    
    setChartYScales(glucoseValues);
    
    
    
    const noteDataset = {
        label: "Notes",
        data: getNotesXYPoints(bgChart.options.scales.y.min),
        //        pointStyle: noteIcon,
        pointRadius: 10,
        showLine: false,
        backgroundColor: "transparent", // optional if your icon has transparency
        borderColor: "transparent"      // same here
    };
    
    const glucoseDataset = {
        label: "BG",
        data: bgXYValues,
        pointRadius: 0,          // Hide the dots visually
        pointHoverRadius: 8,     // Make them hoverable for tooltips
        borderColor: "red",
        tension: 0.1, //controls how curved or straight the lines between points are
        fill: false
    };
    
    
    
    const bolusDataset = {
        label: "Bolus",
        data: bolusesForDay.map(dose => ({
            x: dose.timestamp,
            y: dose.amount,
            amount: dose.amount,
            notes: dose.notes,
            source: dose.source,
            //            y: dose.amount,
            type: "bolus"
        })),
        yAxisID: "yBolus",
        type: "bar",
        backgroundColor: "#1976d2",
        borderColor: "black",
        borderWidth: 2,
        barThickness: 10,
        maxBarThickness: 24,
        datalabels: {
            anchor: 'end',
            align: 'top',
            color: 'black',
            font: {
                weight: 'bold',
                size: 14
            },
            formatter: (value) => value.amount?.toFixed(2).replace(/^0/, "")
        }
    };
    
    //    const bolusDataset = {
    //        label: "Bolus",
    //        data: getBolusXYPoints(),
    //        backgroundColor: "#7f00ff",
    //        borderColor: "#4b0082",
    //        pointRadius: 7,
    //        pointHoverRadius: 10,
    //        showLine: false,
    //        parsing: false
    //    };
    
    bgChart.data.datasets = [
        glucoseDataset,
        noteDataset,
        bolusDataset
    ];
    
    console.log("📊 Bolus data being graphed:", bolusDoses.map(b => ({
        x: b.timestamp,
        xStr: b.timestamp.toLocaleTimeString(),
        y: b.amount
    })));
    
    
    bgChart.update();
    updateFoodChartForDate(date);
    
    const basalDataForDay = [];
    const dayEntries = basalEntries
    .filter(entry =>
            (entry.startTime >= startOfDay && entry.startTime < endOfDay) ||
            (entry.endTime && entry.endTime > startOfDay && entry.endTime <= endOfDay)
            )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    let lastEnd = startOfDay;
    
    for (const entry of dayEntries) {
        if (!entry.endTime) continue;
        
        // If there is a gap between lastEnd and this entry's start, fill with zero
        if (entry.startTime > lastEnd) {
            basalDataForDay.push(
                                 { x: lastEnd, y: 0 },
                                 { x: entry.startTime, y: 0 }
                                 );
        }
        
        // Push the actual segment
        basalDataForDay.push(
                             { x: entry.startTime, y: entry.rate, segmentStart: entry.startTime, segmentEnd: entry.endTime },
                             { x: entry.endTime, y: entry.rate, segmentStart: entry.startTime, segmentEnd: entry.endTime }
                             );
        
        lastEnd = entry.endTime;
    }
    
    // Fill to end of day if needed
    if (lastEnd < endOfDay) {
        basalDataForDay.push(
                             { x: lastEnd, y: 0 },
                             { x: endOfDay, y: 0 }
                             );
    }
    
    
    //This worked for manual entries but not for tidepool entries
    //    const basalDataForDay = [];
    //
    //    basalEntries
    //        .filter(entry => entry.startTime >= startOfDay && entry.startTime < endOfDay)
    //        .forEach(entry => {
    //            if (!entry.endTime) return; // skip if no end time
    //
    //            basalDataForDay.push(
    //                {
    //                    x: entry.startTime,
    //                    y: entry.rate,
    //                    segmentStart: entry.startTime,
    //                    segmentEnd: entry.endTime
    //                },
    //                {
    //                    x: entry.endTime,
    //                    y: entry.rate,
    //                    segmentStart: entry.startTime,
    //                    segmentEnd: entry.endTime
    //                }
    //            );
    //        });
    
    //    const basalDataForDay = basalEntries
    //        .filter(entry => entry.startTime >= startOfDay && entry.startTime < endOfDay)
    //        .map(entry => ({
    //            x: entry.startTime,
    //            end: entry.endTime,
    //            notes: entry.notes,
    //            y: entry.rate
    //        }));
    
    basalChart.data.datasets[0].data = basalDataForDay;
    basalChart.options.scales.x.min = startOfDay;
    basalChart.options.scales.x.max = endOfDay;
    basalChart.update();
    
    
    
    console.log("💉 Bolus doses for day:", bolusesForDay.map(dose => ({
        time: dose.timestamp.toLocaleTimeString(),
        amount: dose.amount
    })));
    
    //debug
    if (bolusDataset) {
        console.log("📊 Bolus dataset being graphed:", bolusDataset.data.map(d => ({
            time: new Date(d.x).toLocaleTimeString(),
            amount: d.y
        })));
    } else {
        console.warn("⚠️ No Bolus dataset found in chart");
    }
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

function setChartXScales(start, end) {
    bgChart.options.scales.x.min = start;
    bgChart.options.scales.x.max = end;
    
    bgChart.options.scales.x.ticks.maxTicksLimit = 12;
    foodChart.options.scales.x.ticks.maxTicksLimit = 12;
}

//Automatically scale y-axis to fit data
function setChartYScales(glucoseValues) {
    //Always show at least up to 10 but higher if needed
    bgChart.options.scales.y.max = Math.max(10, Math.ceil(Math.max(...glucoseValues)));
    //Always show at least down to 4 but lower if BG is lower than 4
    bgChart.options.scales.y.min = Math.min(4, Math.floor(Math.min(...glucoseValues)));
}

function setFoodChartYScales(netCarbValues) {
    foodChart.options.scales.y.min = 0;
    foodChart.options.scales.y.max = Math.max(40, Math.ceil(Math.max(...netCarbValues)));
}

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

function logChartLabelsAndValues(labels, values) {
    console.log("📈 Chart data points for selected date:");
    for (let i = 0; i < labels.length; i++) {
        //        console.log(`→ ${labels[i]} = ${values[i]}`);
    }
}

function highlightChartPoint(chart, datasetIndex, pointIndex) {
    const dataset = chart.data.datasets[datasetIndex];
    
    const original = dataset._originalPointRadius ?? dataset.pointRadius ?? 3;
    if (!dataset._originalPointRadius) {
        dataset._originalPointRadius = original;
    }
    
    dataset.pointRadius = (ctx) => {
        return ctx.dataIndex === pointIndex ? 15 : original;
    };
    
    chart.update();
    
    setTimeout(() => {
        dataset.pointRadius = original;
        chart.update();
    }, 800);
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
    
    const dataset = bgChart.data.datasets[0].data;
    
    let closestIndex = 0;
    let closestDiff = Infinity;
    
    for (let i = 0; i < dataset.length; i++) {
        const dataTime = new Date(dataset[i].x);
        const diff = Math.abs(dataTime - parsed);
        if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
        }
    }
    
    const matchedLabel = dataset[closestIndex]?.x;
    const formattedTarget = parsed.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    
    console.log("⏩ Jumping to:", formattedTarget);
    console.log("🔍 Matched label:", matchedLabel);
    console.log("🩸 BG value at match:", dataset[closestIndex]?.y);
    
    const timestamp = bgChart.data.datasets[0].data[closestIndex]?.x ?? null;
    
    console.log("🧪 jumpToTime → dataset length:", dataset.length);
    console.log("🧪 jumpToTime → closestIndex:", closestIndex);
    console.log("🧪 jumpToTime → timestamp to jump to:", timestamp);
    
    updateVerticalLines(timestamp);
    
    bgChart.setActiveElements([{ datasetIndex: 0, index: closestIndex }]);
    bgChart.tooltip.setActiveElements([{ datasetIndex: 0, index: closestIndex }], { x: 0, y: 0 });
    bgChart.update();
    
    //    bgChart.options.plugins.annotation.annotations.dynamicLine.value = matchedLabel;
    //    bgChart.setActiveElements([{ datasetIndex: 0, index: closestIndex }]);
    //    bgChart.tooltip.setActiveElements([{ datasetIndex: 0, index: closestIndex }], { x: 0, y: 0 });
    //    bgChart.update();
}
