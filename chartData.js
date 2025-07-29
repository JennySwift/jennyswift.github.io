//
//  chartData.js
//
//
//  Created by Jenny Swift on 20/7/2025.
//

function parseJSONData(data) {
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
        protein: f.protein,
        fibre: f.fibre,
        totalCarbs: f.totalCarbs,
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
        endTime: new Date(w.endTime),
        source: w.source,
        elapsedTime: w.elapsedTime,
        averageHeartRate: w.averageHeartRate,
        notes: w.notes,
        kmPerHour: w.kmPerHour,
        minutesPerKm: w.minutesPerKm,
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
}

function createWorkoutDatasetForWorkoutChart(startOfDay, endOfDay) {
    const workoutsForDay = workouts.filter(w =>
        w.start >= startOfDay && w.start < endOfDay &&
        w.endTime && w.averageHeartRate
    );

    console.log("Workouts for day from createWorkoutDatasetForWorkoutChart:", workoutsForDay);

    const data = [];

    for (const w of workoutsForDay) {
        const avgHR = Math.round(w.averageHeartRate);
        data.push(
            {
                x: w.start,
                y: avgHR,
                segmentStart: w.start,
                segmentEnd: w.endTime,
                name: w.name,
                type: w.type,
                notes: w.notes,
                source: w.source,
                tags: w.tags || []
            },
            {
                x: w.endTime,
                y: avgHR,
                segmentStart: w.start,
                segmentEnd: w.endTime,
                name: w.name,
                type: w.type,
                notes: w.notes,
                source: w.source,
                tags: w.tags || []
            }
        );
    }

    console.log("[createWorkoutDatasetForWorkoutChart] Final data array:", data);

    return {
        label: "Workout",
        type: "line",
        data: data,
        stepped: "before",
        borderColor: "red",
        backgroundColor: "green",
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        parsing: false
    };
}

//function createWorkoutDatasetForWorkoutChart(startOfDay, endOfDay) {
//    const workoutsForDay = workouts.filter(w =>
//        w.start >= startOfDay && w.start < endOfDay &&
//        w.endTime && w.averageHeartRate
//    );
//    
//    console.log("Workouts for day from create workout dataset for workout chart:", workoutsForDay);
//
////    const data = [];
//    
//    const data = [
//        { x: new Date().setHours(8, 0, 0, 0), y: 150 },
//        { x: new Date().setHours(9, 0, 0, 0), y: 150 }
//    ]
//    
//    console.log("⏱ startOfDay:", startOfDay, typeof startOfDay);
//    console.log("🧠 First workout.start:", workouts[0]?.start, typeof workouts[0]?.start);
//
//    for (const w of workoutsForDay) {
//        const avgHR = Math.round(w.averageHeartRate);
////        data.push(
////            {
////                x: w.start,
////                y: avgHR,
////                segmentStart: w.start,
////                segmentEnd: w.endTime,
////                name: w.name,
////                type: w.type,
////                notes: w.notes,
////                source: w.source,
////                tags: w.tags || []
////            },
////            {
////                x: w.endTime,
////                y: avgHR,
////                segmentStart: w.start,
////                segmentEnd: w.endTime,
////                name: w.name,
////                type: w.type,
////                notes: w.notes,
////                source: w.source,
////                tags: w.tags || []
////            }
////        );
//    }
//
//    console.log("[createWorkoutDatasetForWorkoutChart] Data:", data);
//    
//    // ⚠️ SANITY CHECK: Force a visible red test line at 8–9am
//    return {
//        label: "Workout",
//        type: "line",
//        data: data,
//        stepped: "before",
//        borderColor: "red",
//        backgroundColor: "green",
//        borderWidth: 2,
//        pointRadius: 0,
//        fill: true,
//        parsing: false
//    };
//}



function createFoodDataset(startOfDay, endOfDay) {
    return {
        pointRadius: chartProps.pointRadius,
        pointHoverRadius: chartProps.pointHoverRadius,
        pointStyle: "circle",
        pointRadius: 6,
        pointHoverRadius: 10,
        backgroundColor: chartProps.foodBackgroundColor,
        borderColor: chartProps.foodBorderColor,
        borderWidth: 2,
        showLine: false,
        parsing: false
    }
}

function createBolusDatasetForBolusChart(startOfDay, endOfDay) {
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
        type: "bar",
        backgroundColor: "rgba(33, 150, 243, 0.9)",
        borderColor: "rgba(33, 150, 243, 0.9)",
        borderWidth: 6,
        showLine: false,
        parsing: false,
//        barPercentage: 0.6, // default is 0.9,
//        barThickness: 10, // in pixels
        maxBarThickness: 10,
//        datalabels: {
//            anchor: 'end',
//            align: 'top',
//            color: 'black',
//            font: {
//                weight: 'bold',
//                size: 14
//            },
//            formatter: (value) => value.amount?.toFixed(2).replace(/^0/, "")
//        }
    };
    
    console.log("📊 Bolus dataset being graphed:", bolusDataset.data.map(d => ({
        time: new Date(d.x).toLocaleTimeString(),
        amount: d.y
    })));
    
    return bolusDataset;
}

function createBolusDatasetForBGChart(startOfDay, endOfDay) {
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

function createGlucoseDataset(filteredReadings) {
    return {
        label: "BG",
        data: filteredReadings.map(r => ({ x: r.timestamp, y: r.value })),
        pointRadius: 0, // Hide the dots visually
        pointHoverRadius: 8, // Make them hoverable for tooltips
        borderColor: "rgba(128, 128, 128, 0.8)",
        borderWidth: 4,
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

