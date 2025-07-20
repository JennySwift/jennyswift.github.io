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
        
        console.log("Basal entries:", basalEntries);
        
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

function scaleHeartRateToBG(hr) {
    const heartRateMin = 80;
    const heartRateMax = 180;
    const bgMin = 2;
    const bgMax = 15;

    const clamped = Math.max(heartRateMin, Math.min(hr, heartRateMax));
    const ratio = (clamped - heartRateMin) / (heartRateMax - heartRateMin);
    return bgMin + ratio * (bgMax - bgMin);
}

function createWorkoutDataset(workouts) {
    const dataPoints = [];

    for (const workout of workouts) {
        if (!workout.start || !workout.endTime || !workout.averageHeartRate) continue;

        const fixedY = 7.5;

        dataPoints.push(
            { x: workout.start, y: fixedY, label: workout.name },
            { x: workout.endTime, y: fixedY, label: workout.name }
        );
    }

    console.log("[createWorkoutDataset] workout dataset:", dataPoints);
    
//    return {
//        label: "Workout",
//        type: "line",
//        yAxisID: "y",
//        data: workouts.flatMap(w => ([
//          { x: w.start, y: 7.5 },
//          { x: w.end, y: 7.5 },
//          { x: null, y: null } // this breaks the line between workouts
//        ])),
//        borderColor: "purple",
//        borderWidth: 6,
//        pointRadius: 0,
//        spanGaps: false,
//        parsing: false,
//        showLine: true
//    }
    return {
        label: "Workout",
        type: "scatter",
        data: workouts.map(w => {
            const heartRate = Math.round(w.averageHeartRate);
            return {
                x: w.start,
                y: scaleHeartRateToBG(heartRate),
                type: "workout",
                name: w.name,
                heartRate,
                duration: Math.round(w.duration / 60)
            };
        }),
        borderColor: "green",
        borderWidth: 2,
        backgroundColor: 'rgba(0, 0, 255, 0.6)',
        pointRadius: 10,
        pointHitRadius: 20,
        fill: false,
        tension: 0,
        parsing: false,
        yAxisID: 'y'
    };
    
//    return {
//        label: "Workout",
//        type: "scatter",
//        data: dataPoints,
//        borderColor: "green",
//        borderWidth: 2,
//        backgroundColor: 'rgba(0, 0, 255, 0.6)', // distinguishable color
//        pointRadius: 10,
////        pointStyle: 'rectRot',
//        fill: false,
//        tension: 0,
//        parsing: false,
//        yAxisID: 'y', // assumes you're using the main BG axis
//        segment: {
//            borderDash: ctx => ctx.p0DataIndex % 2 === 0 ? [] : [5, 5]
//        }
//    };
}

function updateDateHeading(date) {
    const heading = document.getElementById("dateHeading");
    heading.textContent = date.toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function createBolusDataset(startOfDay, endOfDay) {
    const bolusesForDay = bolusDoses.filter(dose =>
                                            dose.timestamp >= startOfDay && dose.timestamp < endOfDay
                                            );
    
    console.log("💉 Bolus doses for day:", bolusesForDay.map(dose => ({
        time: dose.timestamp.toLocaleTimeString(),
        amount: dose.amount
    })));
    
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
    
    console.log("📊 Bolus dataset being graphed:", bolusDataset.data.map(d => ({
        time: new Date(d.x).toLocaleTimeString(),
        amount: d.y
    })));
    
    return bolusDataset;
}

function updateStats(startOfDay, endOfDay) {
    const summaryRow = document.getElementById("summaryRow");
    summaryRow.innerHTML = ""; // Clear all previous summary items

    // 💉 Bolus total
    const bolusesForDay = bolusDoses.filter(b => b.timestamp >= startOfDay && b.timestamp < endOfDay);
    const totalBolus = bolusesForDay.reduce((sum, b) => sum + (b.amount || 0), 0);

    const bolusItem = document.createElement("div");
    bolusItem.className = "summary-item summary-bolus";
    bolusItem.textContent = `💉 Bolus: ${totalBolus.toFixed(2)}U`;
    summaryRow.appendChild(bolusItem);

    // 🩸 Basal total
    const totalBasal = calculateTotalBasalForDay(startOfDay, endOfDay);

    const basalItem = document.createElement("div");
    basalItem.className = "summary-item summary-basal";
    basalItem.textContent = `💉 Basal: ${totalBasal.toFixed(2)}U`;
    summaryRow.appendChild(basalItem);
    
    //Net carbs total
    const foodLogsForDay = foodLogs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);
    const totalNetCarbs = foodLogsForDay.reduce((sum, log) => sum + (log.netCarbs || 0), 0);

    const carbsItem = document.createElement("div");
    carbsItem.className = "summary-item summary-carbs";
    carbsItem.textContent = `🥕 Net Carbs: ${totalNetCarbs.toFixed(1)}g`;
    summaryRow.appendChild(carbsItem);
    
    //Total carbs
    const totalFat = foodLogsForDay.reduce((sum, log) => sum + (log.fat || 0), 0);

    const fatItem = document.createElement("div");
    fatItem.className = "summary-item summary-fat";
    fatItem.textContent = `🧈 Fat: ${totalFat.toFixed(1)}g`;
    summaryRow.appendChild(fatItem);
    
    //total calories
    const totalCalories = foodLogsForDay.reduce((sum, log) => sum + (log.calories || 0), 0);

    const caloriesItem = document.createElement("div");
    caloriesItem.className = "summary-item summary-calories";
    caloriesItem.textContent = `🔥 Calories: ${totalCalories.toFixed(0)}`;
    summaryRow.appendChild(caloriesItem);
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

function buildBasalDataForDay(startOfDay, endOfDay) {
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
    return basalDataForDay;
}

function createGlucoseDataset(filteredReadings) {
    return {
        label: "BG",
        data: filteredReadings.map(r => ({ x: r.timestamp, y: r.value })),
        pointRadius: 0, // Hide the dots visually
        pointHoverRadius: 8, // Make them hoverable for tooltips
        borderColor: "red",
        tension: 0.1, //controls how curved or straight the lines between points are
        fill: false
    };
}

function createNoteDataset(minY) {
    return {
        label: "Notes",
        data: getNotesXYPoints(minY),
        pointRadius: 10,
        showLine: false,
        backgroundColor: "transparent",
        borderColor: "transparent"
    };
}

function showInfoForDate(date) {
    showNotesForDate(date);
    showFoodLogsForDate(date);
    showBolusesForDate(date);
    showWorkoutsForDate(date);
    showFastsForDate(date);
    updateFoodChartForDate(date);
}

//For BG chart
function updateChartForDate(date) {
    showInfoForDate(date)
    
    const { startOfDay, endOfDay } = getStartAndEndOfDay(date);
    
    updateDateHeading(startOfDay);
    updateStats(startOfDay, endOfDay);
    
    
    const glucoseReadingsForDay = glucoseReadings.filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay);
    const bolusDataset = createBolusDataset(startOfDay, endOfDay);
    const glucoseValues = glucoseReadingsForDay.map(r => r.value);
    
    setChartXScales(startOfDay, endOfDay);
    setChartYScales(glucoseValues);
    
    const glucoseDataset = createGlucoseDataset(glucoseReadingsForDay);
    const noteDataset = createNoteDataset(bgChart.options.scales.y.min);
    
    const workoutsForDay = workouts.filter(w =>
        w.start >= startOfDay && w.start < endOfDay
    );
    const workoutDataset = createWorkoutDataset(workoutsForDay);
    
    bgChart.data.datasets = [
        glucoseDataset,
        noteDataset,
        bolusDataset,
        workoutDataset
    ];
    console.log("[updateChart] Final dataset being used:", bgChart.data.datasets);
    
    bgChart.update();
    
    
    const basalDataForDay = buildBasalDataForDay(startOfDay, endOfDay);
    
    basalChart.data.datasets[0].data = basalDataForDay;
    basalChart.options.scales.x.min = startOfDay;
    basalChart.options.scales.x.max = endOfDay;
    basalChart.update();
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
