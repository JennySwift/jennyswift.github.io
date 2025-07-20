//
//  annotationZones.swift
//  
//
//  Created by Jenny Swift on 20/7/2025.
//

function getAnnotationZones() {
    return {
        lowZone: {
            type: "box",
            yMin: 0,
            yMax: 4,
            backgroundColor: chartProps.lowColor,
            borderWidth: chartProps.lineWidth,
            borderColor: chartProps.annotationBorderColor,
        },
        inRangeZone: {
            type: "box",
            yMin: 4,
            yMax: 6,
            backgroundColor: chartProps.inRangeColor,
            borderWidth: chartProps.lineWidth,
            borderColor: chartProps.annotationBorderColor,
        },
        highYellowZone: {
            type: "box",
            yMin: 8,
            yMax: 10,
            backgroundColor: chartProps.highYellowColor,
            borderWidth: chartProps.lineWidth,
            borderColor: chartProps.annotationBorderColor,
        },
        veryHighZone: {
            type: "box",
            yMin: 10,
            yMax: 20,
            backgroundColor: chartProps.veryHighColor,
            borderWidth: chartProps.lineWidth,
            borderColor: chartProps.annotationBorderColor,
        },
        dynamicLine: getDynamicLineAnnotation(),
    };
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
