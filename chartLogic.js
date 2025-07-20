//
//  chartLogic.js
//
//
//  Created by Jenny Swift on 16/7/2025.
//

let bgChart;
let foodChart;
let bolusChart;
let glucoseReadings = [];
let foodLogs = [];
let notes = [];
let bolusDoses = [];
let basalEntries = [];
let workouts = [];
let fasts = [];
let basalChart;

document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("bgChart").getContext("2d");
    const foodCtx = document.getElementById("foodChart").getContext("2d");
    const basalCtx = document.getElementById("basalChart").getContext("2d");
    const bolusCtx = document.getElementById("bolusChart").getContext("2d");
    const selectedDateInput = document.getElementById("selectedDate");
    
    fetch("https://dl.dropboxusercontent.com/scl/fi/0udoq3x6gkchstkq2hqxg/glucoseData.json?rlkey=vllvwb6wlx2el12c9aqijw37p")
    .then((response) => response.json())
    .then((data) => {
        parseJSONData(data);
        //        console.log("📦 Raw data from JSON:", data);

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
        bolusChart = createBolusChart(bolusCtx);

        updateChartForDate(today);

        setupEventListeners();
    });
    
});

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

function scaleHeartRateToBG(hr) {
    const heartRateMin = 80;
    const heartRateMax = 180;
    const bgMin = 2;
    const bgMax = 15;

    const clamped = Math.max(heartRateMin, Math.min(hr, heartRateMax));
    const ratio = (clamped - heartRateMin) / (heartRateMax - heartRateMin);
    return bgMin + ratio * (bgMax - bgMin);
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
    const bolusDataset = createBolusDatasetForBGChart(startOfDay, endOfDay);
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
//        bolusDataset,
        workoutDataset
    ];
    console.log("[updateChart] Final dataset being used:", bgChart.data.datasets);
    
    bgChart.update();
    
    bolusChart.data.datasets = [
        createBolusDatasetForBolusChart(startOfDay, endOfDay)
    ];
    bolusChart.options.scales.x.min = startOfDay;
    bolusChart.options.scales.x.max = endOfDay;
    bolusChart.update();
    
    
    const basalDataForDay = buildBasalDataForDay(startOfDay, endOfDay);
    
    basalChart.data.datasets[0].data = basalDataForDay;
    basalChart.options.scales.x.min = startOfDay;
    basalChart.options.scales.x.max = endOfDay;
    basalChart.update();
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
//    bgChart.options.scales.y.max = Math.max(10, Math.ceil(Math.max(...glucoseValues)));
//    //Always show at least down to 4 but lower if BG is lower than 4
//    bgChart.options.scales.y.min = Math.min(4, Math.floor(Math.min(...glucoseValues)));
}

function setFoodChartYScales(netCarbValues) {
    foodChart.options.scales.y.min = 0;
    foodChart.options.scales.y.max = Math.max(40, Math.ceil(Math.max(...netCarbValues)));
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
