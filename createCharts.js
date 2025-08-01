//
//  createCharts.js
//  
//
//  Created by Jenny Swift on 20/7/2025.
//

function createWorkoutChart(ctx) {
    return new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                data: [], // {x: start, y: avgHR, segmentStart, segmentEnd}
                stepped: "before",
//                borderWidth: 0,
//                borderColor: chartProps.workoutBorderColor,
//                backgroundColor: chartProps.workoutBackgroundColor,
                pointRadius: 0,
                fill: true
            }]
        },
        options: {
            ...sharedChartOptions,
            interaction: {
                mode: "nearest",
                intersect: false
            },
            hover: {
                mode: "nearest",
                intersect: false
            },
            parsing: false,
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        displayFormats: { hour: "h:mm a" }
                    },
                    min: new Date().setHours(0, 0, 0, 0),
                    max: new Date().setHours(24, 0, 0, 0),
                    ticks: reusableXTicks,
                    grid: reusableXGrid
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Avg Heart Rate (bpm)"
                    },
                    ticks: {
                        font: { size: 14 },
                        padding: 8
                    },
                    grace: '5%',
                    grid: reusableYGrid
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        dynamicLine: getDynamicLineAnnotation()
                    }
                },
                datalabels: {
                    display: false
                },
                chartAreaBackground: {
                    color: chartProps.chartAreaBackgroundColour
                },
                tooltip: {
                    ...sharedTooltipStyle,
                    callbacks: {
                        title: function (context) {
                            const point = context[0].raw;
                            const start = point.segmentStart ? new Date(point.segmentStart) : null;
                            const end = point.segmentEnd ? new Date(point.segmentEnd) : null;

                            const formatTime = (d) => d.toLocaleTimeString([], {
                                hour: "numeric", minute: "2-digit", hour12: true
                            }).toLowerCase().replace(' ', '');

                            const name = point.name || "Unnamed workout";
                            const avgHR = point.y ? `❤️ ${point.y.toFixed(0)} bpm` : "";
                            const durationMins = (start && end)
                                ? `🕓 ${Math.round((end - start) / 60000)} min`
                                : "";
                            const timeStr = (start && end)
                                ? `🕒 ${formatTime(start)} → ${formatTime(end)}`
                                : "";
                            const calories = point.activeCalories
                                ? `🔥 ${Math.round(point.activeCalories)} kcal`
                                : "";

                            return [
                                name,
                                avgHR,
                                durationMins,
                                timeStr,
                                calories
                            ].filter(Boolean); // remove empty lines
                        },
                        label: function () {
                            return ""; // move everything into title so label is blank
                        }
                    }
                },
                legend: { display: false }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createBolusChart(ctx) {
    return new Chart(ctx, {
        type: "bar",
        data: {
            datasets: [{
                data: [],
                //Update the other properties in createBolusDatasetForBolusChart
            }]
        },
        options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        displayFormats: { hour: "h:mm a" }
                    },
//                    title: { display: true, text: "Time" },
                    min: new Date().setHours(0, 0, 0, 0),
                    max: new Date().setHours(24, 0, 0, 0),
                    ticks: reusableXTicks,
                    grid: reusableXGrid
                },
                y: {
//                    title: { display: true, text: "Units" },
//                    ticks: { stepSize: 10 },
                    grid: reusableYGrid,
                    ticks: {
                        font: { size: 14 },   // Force same size
                        padding: 8 ,
//                        callback: function(value) {
//                            return value.toFixed(0);
//                          }// Ensure consistent tick padding
                      },
                      grace: '5%',            // Optional: avoids crowding
                      title: {
                        display: true,
                        text: "Bolus Units" // e.g. "mmol/L" or "Units"
                      },
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        dynamicLine: getDynamicLineAnnotation()
                    }
                },
                chartAreaBackground: {
                        color: chartProps.chartAreaBackgroundColour
                      },
                tooltip: {
                    ...sharedTooltipStyle,
                    callbacks: bolusChartTooltipCallbacks
                },
                legend: { display: false },
                datalabels: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false
        },
        plugins: [
            chartAreaBackground,
//            highlightChartArea
        ]
    });
}

function createBasalChart(ctx) {
    return new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                data: [], // will be populated in updateChartForDate
//                borderColor: "rgba(76, 175, 80, 0.6)",
//                backgroundColor: "rgba(76, 175, 80, 0.2)",
                borderWidth: 0,
                stepped: "before", // 👈 this makes it a step line
                pointRadius: 0,
                fill: true,
//                z: 10,
                backgroundColor: chartProps.foodBackgroundColor,
                borderColor: chartProps.foodBorderColor,
                
            }]
        },
//        plugins: [highlightChartArea],
        options: {
            interaction: {
                mode: "nearest",
                intersect: false
            },
            hover: {
                mode: "nearest",
                intersect: false
            },
            parsing: false,
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        displayFormats: { hour: "h:mm a" }
                    },
                    min: new Date().setHours(0, 0, 0, 0),
                    max: new Date().setHours(24, 0, 0, 0),
                    ticks: reusableXTicks,
                    grid: reusableXGrid,
//                    title: {
//                        display: true,
//                        text: "Time"
//                      }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Basal Rate"
                    },
                    grid: reusableYGrid,
                    
                    ticks: {
                        font: { size: 14 },   // Force same size
                        padding: 8,
//                        callback: function(value) {
//                            return value.toFixed(0);
//                          }
                      },
                      grace: '5%'         // Optional: avoids crowding
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        dynamicLine: getDynamicLineAnnotation()
                    }
                },
                datalabels: {
                    display: false
                },
                
                legend: { display: false },
                tooltip: {
                    ...sharedTooltipStyle,
                    callbacks: {
                        title: function (context) {
                            const point = context[0].raw;
                            const start = point.segmentStart ? new Date(point.segmentStart) : null;
                            const end = point.segmentEnd ? new Date(point.segmentEnd) : null;
                            
                            const formatTime = (d) => d.toLocaleTimeString([], {
                                hour: "numeric", minute: "2-digit", hour12: true
                            }).toLowerCase().replace(' ', '');
                            
                            const startStr = start ? formatTime(start) : "unknown";
                            const endStr = end ? formatTime(end) : "ongoing";
                            
                            return `⏱ ${startStr} to ${endStr}`;
                        },
                        label: function (context) {
                            const rate = context.parsed.y;
                            return `💧 ${rate.toFixed(2)} U/hr`;
                        }
                    }
                    
                },
                chartAreaBackground: {
                        color: chartProps.chartAreaBackgroundColour
                      },
            },
            responsive: true,
            //Needed for my CSS that sets the height to work
            maintainAspectRatio: false
        }
    });
}

function createBGChart(ctx) {
    Chart.register(ChartDataLabels);
    return new Chart(ctx, {
        type: "line",
        data: getChartData(),
//        plugins: [highlightChartArea],
        options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        displayFormats: {
                            hour: "h:mm a"
                        }
                    },
                    ticks: reusableXTicks,
                    grid: {
                        display: true,
                        color: chartProps.xGridColor,
                        lineWidth: chartProps.lineWidth,
                        drawTicks: true,
                        drawBorder: true,
                    },
//                    title: { display: true, text: "Time" }
                },
                y: {
//                    min: 2,
//                    max: 12,
                    title: { display: true, text: "mmol/L" },
                    grid: {
                        display: true,
                        color: chartProps.yGridColor,
                        lineWidth: chartProps.lineWidth,
                        drawTicks: true,
                        drawBorder: true,
                    },
                    ticks: {
                        font: { size: 14 },   // Force same size
                        padding: 8,
                        stepSize: 2,
                        beginAtZero: false,
//                        callback: function(value) {
//                            return value.toFixed(0);
//                          }
                      },
                      grace: '5%',            // Optional: avoids crowding
                      title: {
                        display: true,
                        text: "mmol/L" 
                      },
                },
                //Create second y axis
//                yBolus: {
//                    position: "right",
//                    title: { display: true, text: "Bolus (U)" },
//                    grid: { display: false }, // optional: turn off bolus grid lines
//                    min: 0,
//                    max: 10, // adjust based on your typical max bolus
//                }
            },
            plugins: {
                tooltip: {
                    ...sharedTooltipStyle,
                    callbacks: tooltipCallbacks,
                    // This will make the tooltip hide if no point is hovered
                          // or if you tap away (especially useful on mobile)
                          events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove']
                },
                chartAreaBackground: {
                        color: chartProps.chartAreaBackgroundColour
                      },
                legend: { display: false },
                annotation: {
                    annotations: {
//                        ...getAnnotationZones(chartProps.lineWidth),
                        zone_4_to_6: {
                            type: "box",
                            yMin: 4,
                            yMax: 6,
                            backgroundColor: "rgba(0, 128, 255, 0.6)", // light blue with transparency
                            borderWidth: 0
                        },
                        dynamicLine: getDynamicLineAnnotation()
                    }
                },
                drawNoteIcons: drawNoteIconsPlugin,
                
                
                datalabels: {
                    display: (context) => context.dataset.label === "Bolus",
                    anchor: 'end',
                    align: 'top',
                    color: 'black',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value, context) => value.amount?.toFixed(2).replace(/^0/, ""),  // Remove leading 0
                    //                    rotation: 90,
                    offset: (context) => {
                        const i = context.dataIndex;
                        return (i % 2 === 0) ? 10 : 30; // stagger labels vertically so they fit
                        
                    }
                }
                
            },
            responsive: true,
            //Needed for my CSS that sets the height to work
            maintainAspectRatio: false,
            //This is the most strict and precise configuration:
            //You must actually hover the point or bar.
            //Each dataset will show its tooltip independently.
            //No shared tooltips across x-axis.
            //Fixes your issue where hovering a bar shows a tooltip from 12:04 am, or mixes in notes/BG values.
            // Tooltip + Interaction Mode Guide:
            // ─────────────────────────────────────────────
            // interaction.mode options:
            //   "point"   → Only show tooltip when directly hovering a point/bar. (✔️ Precise)
            //   "nearest" → Show tooltip for nearest visible point even if not hovered directly.
            //   "index"   → Show tooltips for all datasets aligned at the same x position.
            //   "dataset" → Show tooltip for all points in the same dataset closest to cursor.
            //   "x"       → Tooltip for closest point with matching x (used with intersect: false).
            //   "y"       → Tooltip for closest point with matching y (used with intersect: false).
            //
            // interaction.intersect:
            //   true  → Tooltip only shows when cursor is directly over a point/bar.
            //   false → Tooltip shows when cursor is in the same x/y position, even if not over the point.
            //
            // Your current setup for precise tooltips:
            //   interaction: { mode: "point", intersect: true },
            //   hover: { mode: "point", intersect: true }
            //
            // Tip: For line charts, make sure `pointRadius` > 0 to allow hovering.
            interaction: {
                mode: "nearest",    // Show tooltip for closest point on the x-axis
                intersect: false,   // Don’t require the mouse to be *on* the point
            },
            hover: {
                mode: "nearest",
                intersect: false
            },
            
            //            interaction: {
            //                mode: "point",
            //                intersect: true //true: must actually hover the point/bar. false: triggers tooltip even when you’re just aligned on the x or y axis (depending on mode).
            //            },
            //            hover: {
            //                mode: "point",
            //                intersect: true
            //            },
            animation: {
                onComplete: () => {
//                    updateAnnotationZonesFromYScale();
                    bgChart.update();
                }
            },
            resizeDelay: 0,
            onResize: () => {
                if (bgChart && bgChart.scales?.y) {
//                    updateAnnotationZonesFromYScale();
                    bgChart.update();
                }
            },
        },
    });
}

function createFoodChart(ctx) {
    return new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [{
                data: [],
                label: "Food Log",
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
            }]
        },
//        plugins: [highlightChartArea],
        options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        displayFormats: { hour: "h:mm a" }
                    },
                    title: { display: true, text: "Time" },
                    min: new Date().setHours(0, 0, 0, 0),
                    max: new Date().setHours(24, 0, 0, 0),
                    ticks: reusableXTicks,
                    grid: reusableXGrid
                },
                y: {
                    title: { display: true, text: "Net Carbs (g)" },
                    
                    ticks: {
                        stepSize: 10,
                        font: { size: 14 },   // Force same size
                        padding: 8  ,
//                        callback: function(value) {
//                            return value.toFixed(0);
//                          }// Ensure consistent tick padding
                      },
                      grace: '5%',
                    grid: reusableYGrid
                }
            },
            plugins: {
                tooltip: {
                    ...sharedTooltipStyle,
                    callbacks: foodChartTooltipCallbacks
                },
                chartAreaBackground: {
                        color: chartProps.chartAreaBackgroundColour
                      },
                legend: { display: false },
                annotation: {
                    annotations: {
                        dynamicLine: getDynamicLineAnnotation(),
                        backgroundZone: {
                            type: "box",
                            xMin: null,
                            xMax: null,
                            yMin: 0,
                            yMax: 100,
                            backgroundColor: chartProps.backgroundZoneColor
                        }
                    }
                },
                datalabels: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
