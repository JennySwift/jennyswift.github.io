//
//  chartPlugins.swift
//  
//
//  Created by Jenny Swift on 20/7/2025.
//

const noteIcon = new Image();
noteIcon.src = 'icons/note-icon.png';
let noteIconLoaded = false;


noteIcon.onerror = () => {
    console.error("❌ Failed to load note icon from:", noteIcon.src);
};

noteIcon.onload = () => {
    noteIconLoaded = true;
    console.log("✅ Note icon loaded successfully");
    if (bgChart) bgChart.update();
};
const drawNoteIconsPlugin = {
    id: 'drawNoteIcons',
    afterDatasetsDraw(chart, args, options) {
        if (!noteIconLoaded) return;
        
        const {ctx, scales} = chart;
        const dataset = chart.data.datasets.find(d => d.label === "Notes");
        if (!dataset) return;
        
        dataset.data.forEach((point) => {
            const x = scales.x.getPixelForValue(point.x);
            const y = scales.y.getPixelForValue(point.y) - 30; // ⬆️ shift icon up by 10px
            const iconSize = 100;
            
            ctx.drawImage(noteIcon, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
        });
    }
};
Chart.register(drawNoteIconsPlugin);
