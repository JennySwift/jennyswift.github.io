//
//  chartData.js
//
//
//  Created by Jenny Swift on 20/7/2025.
//

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

