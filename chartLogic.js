//
//  chartLogic.js
//
//
//  Created by Jenny Swift on 16/7/2025.
//

let bgChart;
let foodChart;
let bolusChart;
let workoutChart;
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
    const workoutCtx = document.getElementById("workoutChart").getContext("2d");
    const selectedDateInput = document.getElementById("selectedDate");
    
    fetch("https://dl.dropboxusercontent.com/scl/fi/0udoq3x6gkchstkq2hqxg/glucoseData.json?rlkey=vllvwb6wlx2el12c9aqijw37p")
    .then((response) => response.json())
    .then((data) => {
        parseJSONData(data);
        //        console.log("📦 Raw data from JSON:", data);

        //        console.log("✅ Food Logs:", foodLogs);
        //
        
        const today = getSydneyStartOfToday();
        selectedDateInput.value = formatDateForInput(today);
        
        bgChart = createBGChart(ctx);
        foodChart = createFoodChart(foodCtx);
        basalChart = createBasalChart(basalCtx);
        bolusChart = createBolusChart(bolusCtx);
        workoutChart = createWorkoutChart(workoutCtx);

        updateChartForDate(today);

        setupEventListeners();
        setUpTabListeners();
    });
    
});

function updateVerticalLines(timestamp) {
    const charts = [bgChart, foodChart, bolusChart, basalChart, workoutChart];

    charts.forEach(chart => {
        if (
            chart &&
            chart.options.plugins.annotation?.annotations?.dynamicLine
        ) {
            chart.options.plugins.annotation.annotations.dynamicLine.value = timestamp;
            //"none" animation mode to avoid lag when dragging the line.
            chart.update("none");
        }
    });
}

function handleLogClick(timestamp) {
    const sydneyTime = parseAsSydneyDate(timestamp);
    jumpToTime(sydneyTime);

    // Highlight matching point in BG chart
    const bgDataset = bgChart.data.datasets[0].data;
    const bgIndex = bgDataset.findIndex(p =>
        Math.abs(parseAsSydneyDate(p.x) - sydneyTime) < 2 * 60 * 1000
    );
    if (bgIndex !== -1) {
        highlightChartPoint(bgChart, 0, bgIndex);
    }

    // Highlight matching point in Food chart
    const foodDataset = foodChart.data.datasets[0].data;
    const foodIndex = foodDataset.findIndex(p =>
        Math.abs(parseAsSydneyDate(p.x) - sydneyTime) < 2 * 60 * 1000
    );
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
    heading.textContent = formatDateInSydney(date);
}







function buildBasalDataForDay(startOfDay, endOfDay) {
    const basalDataForDay = [];
    const dayEntries = basalEntries
    .filter(entry =>
            (entry.startTime >= startOfDay && entry.startTime < endOfDay) ||
            (entry.endTime && entry.endTime > startOfDay && entry.endTime <= endOfDay)
            )
    .sort((a, b) => a.startTime - b.startTime);
    
    let lastEnd = startOfDay;
    
    for (const entry of dayEntries) {
        if (!entry.endTime) continue;
        
        // If there is a gap between lastEnd and this entry's start, fill with zero
        if (entry.startTime > lastEnd) {
            basalDataForDay.push(
                {
                    x: lastEnd,
                    y: 0,
                    segmentStart: lastEnd,
                    segmentEnd: entry.startTime
                },
                {
                    x: entry.startTime,
                    y: 0,
                    segmentStart: lastEnd,
                    segmentEnd: entry.startTime
                }
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
            {
                x: lastEnd,
                y: 0,
                segmentStart: lastEnd,
                segmentEnd: endOfDay
            },
            {
                x: endOfDay,
                y: 0,
                segmentStart: lastEnd,
                segmentEnd: endOfDay
            }
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

let updateCount = 0;
//For BG chart
function updateChartForDate(date) {
    console.trace("[updateChartForDate] trace");
    updateCount++;
        if (updateCount % 100 === 0) {
            console.log(`[updateChartForDate] called ${updateCount} times`);
        }
    
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
    
    bgChart.data.datasets = [
        glucoseDataset,
        noteDataset
    ];
    console.log("[updateChart] Final dataset being used:", bgChart.data.datasets);
    
    bgChart.update();
    
    bolusChart.data.datasets = [
        createBolusDatasetForBolusChart(startOfDay, endOfDay)
    ];
    bolusChart.options.scales.x.min = startOfDay;
    bolusChart.options.scales.x.max = endOfDay;
    bolusChart.update();
    
    updateWorkoutChartForDate(startOfDay, endOfDay);
    
    
    const basalDataForDay = buildBasalDataForDay(startOfDay, endOfDay);
    
    basalChart.data.datasets[0].data = basalDataForDay;
    
    basalChart.update();
}

function updateWorkoutChartForDate(startOfDay, endOfDay) {
    const workoutsForDay = workouts.filter(w =>
        w.start >= startOfDay && w.start < endOfDay
    );

    const avgHRs = workoutsForDay.map(w => w.averageHeartRate).filter(Boolean);
    const maxHR = Math.max(...avgHRs, 120); // fallback to 120

    const workoutDataset = createWorkoutDatasetForWorkoutChart(startOfDay, endOfDay);

    workoutChart.data.datasets = [workoutDataset];

    workoutChart.options.scales.x.min = startOfDay;
    workoutChart.options.scales.x.max = endOfDay;
    setWorkoutChartYAxis(workoutsForDay)

    workoutChart.update();
}

function setWorkoutChartYAxis(workoutsForDay) {
    const avgHRs = workoutsForDay.map(w => w.averageHeartRate).filter(Boolean);

    // Set realistic baseline bounds
    let yMin = 90;
    let yMax = 150;

    if (avgHRs.length > 0) {
        const minHR = Math.min(...avgHRs);
        const maxHR = Math.max(...avgHRs);

        if (minHR < yMin) yMin = Math.floor(minHR / 10) * 10;
        if (maxHR > yMax) yMax = Math.ceil(maxHR / 10) * 10;
    }

    workoutChart.options.scales.y.min = yMin;
//    workoutChart.options.scales.y.max = yMax;
}

//function updateWorkoutChartForDate(startOfDay, endOfDay) {
//    // Filter workouts in range
//    const workoutsForDay = workouts.filter(w =>
//        w.start >= startOfDay && w.start < endOfDay
//    );
//
//    // Calculate Y-axis scale
//    const avgHRs = workoutsForDay.map(w => w.averageHeartRate).filter(Boolean);
//    const maxHR = Math.max(...avgHRs, 120); // fallback to 120
//
//    // Assign dataset
//    workoutChart.data.datasets = [
//        createWorkoutDatasetForWorkoutChart(startOfDay, endOfDay)
//    ];
//
//    // Set X and Y scale bounds
//    workoutChart.options.scales.x.min = startOfDay;
//    workoutChart.options.scales.x.max = endOfDay;
//    workoutChart.options.scales.y.min = 0;
//    workoutChart.options.scales.y.max = Math.ceil(maxHR + 10);
//
//    workoutChart.update();
//}

function logChartAreas() {
  console.log("📏 chartArea widths:");
  console.log("BG:", bgChart.chartArea.width);
  console.log("Food:", foodChart.chartArea.width);
  console.log("Basal:", basalChart.chartArea.width);
  console.log("Bolus:", bolusChart.chartArea.width);
}

function setChartXScales(start, end) {
    bgChart.options.scales.x.min = start;
    bgChart.options.scales.x.max = end;
    
    basalChart.options.scales.x.min = start;
    basalChart.options.scales.x.max = end;
    
    foodChart.options.scales.x.min = start;
    foodChart.options.scales.x.max = end;
    
    bgChart.options.scales.x.ticks.maxTicksLimit = 12;
    foodChart.options.scales.x.ticks.maxTicksLimit = 12;
    bolusChart.options.scales.x.ticks.maxTicksLimit = 12;
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


