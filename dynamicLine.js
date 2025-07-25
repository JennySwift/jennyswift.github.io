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
        borderColor: "rgba(100, 100, 100, 0.8)",
        borderWidth: 2,
        //This wasn't there before refactor
        value: null,  // Start hidden
        display: ctx => ctx.chart.options.plugins.annotation.annotations.dynamicLine?.value !== null,
        label: { display: false },
    };
}


