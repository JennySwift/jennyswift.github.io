//
//  dynamicLine.js
//  
//
//  Created by Jenny Swift on 21/7/2025.
//

function getDynamicLineAnnotation() {
    return {
        type: "line",
        scaleID: "x",
        borderColor: chartProps.dynamicLineColor,
        borderWidth: chartProps.lineWidth,
        //This wasn't there before refactor
        value: null,  // Start hidden
        display: ctx => ctx.chart.options.plugins.annotation.annotations.dynamicLine?.value !== null,
        label: { display: false },
    };
}


