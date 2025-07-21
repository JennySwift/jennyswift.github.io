////
////  annotationZones.swift
////  
////
////  Created by Jenny Swift on 20/7/2025.
////
//

const zoneBoundaries = {
    lowMax: 4,
    inRangeMax: 8,
    highYellowMax: 10,
};

function createZone(yMin, yMax, colorKey) {
    return {
        type: "box",
        yMin,
        yMax,
        backgroundColor: chartProps[colorKey],
        borderWidth: chartProps.lineWidth,
        borderColor: chartProps.annotationBorderColor,
    };
}

function getAnnotationZones() {
    return {
        lowZone: createZone(0, zoneBoundaries.lowMax, "lowColor"),
        inRangeZone: createZone(zoneBoundaries.lowMax, zoneBoundaries.inRangeMax, "inRangeColor"),
        highYellowZone: createZone(zoneBoundaries.inRangeMax, zoneBoundaries.highYellowMax, "highYellowColor"),
        veryHighZone: createZone(zoneBoundaries.highYellowMax, 20, "veryHighColor")
    };
}

function updateAnnotationZonesFromYScale() {
    const yScale = bgChart.scales.y;
    if (!yScale) return;

    const annotations = bgChart.options.plugins.annotation.annotations;

    annotations.lowZone.yMin = yScale.min;
    annotations.lowZone.yMax = zoneBoundaries.lowMax;

    annotations.inRangeZone.yMin = zoneBoundaries.lowMax;
    annotations.inRangeZone.yMax = zoneBoundaries.inRangeMax;

    annotations.highYellowZone.yMin = zoneBoundaries.inRangeMax;
    annotations.highYellowZone.yMax = zoneBoundaries.highYellowMax;

    annotations.veryHighZone.yMin = zoneBoundaries.highYellowMax;
    annotations.veryHighZone.yMax = yScale.max;
}
