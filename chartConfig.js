
// === Global Chart Styling Properties ===
const chartProps = {
    lineWidth: 1,
    pointRadius: 8,
    pointHoverRadius: 12,
    annotationBorderColor: "rgba(0, 0, 0, 0.4)",
    inRangeColor: "rgba(0, 255, 0, 0.5)",
    highYellowColor: "rgba(0, 255, 0, 0.4)",
    lowColor: "rgba(255, 0, 0, 0.6)",
    veryHighColor: "rgba(255, 0, 0, 0.6)",
    foodLogColor: "green",
    xGridColor: "#ccc",
    yGridColor: "#888",
    backgroundZoneColor: "rgba(255, 0, 0, 0.4)",
    basalBackgroundZoneColor: "rgba(0, 255, 0, 0.4)",
    foodBackgroundColor: "#ffa726",
    foodBorderColor: "#ef6c00",
    workoutBackgroundColor: "red",
    workoutBorderColor: "#red",
    chartAreaBackgroundColour: "rgba(100, 100, 100, 0.4)"
};

//const highlightChartArea = {
//  id: 'highlightChartArea',
//  beforeDraw(chart, args, options) {
//    const { ctx, chartArea } = chart;
//    if (!chartArea) return;
//
//    const highlightX = options?.x || chart.tooltip?.caretX;
//    const highlightWidth = options?.width || 2;
//
//    if (!highlightX) return;
//
//    ctx.save();
//    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
//    ctx.fillRect(highlightX - highlightWidth / 2, chartArea.top, highlightWidth, chartArea.height);
//    ctx.restore();
//  }
//};

//const highlightChartArea = {
//  id: 'highlightChartArea',
//  beforeDraw(chart) {
//    const { ctx, chartArea } = chart;
//    ctx.save();
//    ctx.strokeStyle = 'red';
//    ctx.lineWidth = 1;
//    ctx.strokeRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
//    ctx.restore();
//  }
//};

const chartAreaBackground = {
    id: 'chartAreaBackground',
    beforeDraw(chart, args, options) {
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.fillStyle = options.color || 'white'; // fallback
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
        ctx.restore();
    }
};

const reusableXTicks = {
    source: "auto",
    autoSkip: false,
    maxTicksLimit: 12
};

const reusableXGrid = {
    display: true,
    color: chartProps.xGridColor,
    lineWidth: chartProps.lineWidth,
    drawTicks: true,
    drawBorder: true,
    drawOnChartArea: true
};

const reusableYGrid = {
    display: true,
    color: chartProps.yGridColor,
    lineWidth: chartProps.lineWidth,
    drawTicks: true,
    drawBorder: true
};

const sharedTooltipStyle = {
    titleFont: { size: 18 },
    bodyFont: { size: 18 },
    footerFont: { size: 14 },
    padding: 14,
    usePointStyle: true,
    labelPointStyle: {
        pointStyle: "circle",
        rotation: 0,
    },
    displayColors: false
};

const bolusChartTooltipCallbacks = {
    title: (context) => {
        const timestamp = context[0].parsed.x;
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }).toLowerCase();
    },
    label: (context) => {
        const point = context.raw;
        
        return [
                `💉 ${point.y.toFixed(2)}U bolus`
        ];
    }
};

const foodChartTooltipCallbacks = {
    title: (context) => {
        const timestamp = context[0].parsed.x;
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }).toLowerCase();
    },
    label: (context) => {
        const point = context.raw;
        return [
            `🍽 ${point.foodName}`,
            `🔥 ${Math.round(point.calories)} cal`,
            `🍌 ${point.netCarbs}g net carbs`,
            `🥑 ${point.fat}g fat`
        ];
    }
};

const tooltipCallbacks = {
    //This is the heading in the tooltip
    title: (context) => {
        const timestamp = context[0].parsed.x;
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }).toLowerCase();
    },
    label: (context) => {
        const dataset = context.dataset;
        const point = context.raw;
        
        if (point?.type === "note") {
            const text = point?.text ?? "(no text)";
            return `📝 ${text}`;
        }
        
        if (point?.type === "foodLog") {
            return [
                `🍽 ${point.foodName}`,
                `🔥 ${point.calories} cal`,
                `🍌 ${point.netCarbs}g net carbs`,
                `🥑 ${point.fat}g fat`
            ];
        }
        
        if (point?.type === "bolus") {
            return `💉 ${point.y.toFixed(2)}U bolus`;
        }
        //        if (point?.type === "bolus") {
        //            return `💉 ${point.amount.toFixed(2)}U bolus`;
        //        }
        
        if (point?.type === "workout") {
                return [
                    `🏋️ ${point.name || "Workout"}`,
                    `❤️ Avg HR: ${point.heartRate ?? "?"} bpm`,
                    `⏱️ Duration: ${point.duration ?? "?"} min`
                ];
            }
        
        
        // Default for BG readings
        const mmol = context.parsed.y;
        const mgdl = Math.round(mmol * 18);
        return [
            `🩸 ${mmol.toFixed(1)} mmol/L`,
            `🩸 ${mgdl} mg/dL`
        ];
    }
};




function getChartData() {
    return {
        datasets: [{
            label: "BG (mmol/L)",
            data: [],
            borderColor: "black",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            tension: 0.3,
            fill: false,
            borderWidth: 2.5,
            pointRadius: 0,
        }],
    };
}







