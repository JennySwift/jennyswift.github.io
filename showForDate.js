//
//  showForDate.js
//  
//
//  Created by Jenny Swift on 20/7/2025.
//

function showNotesForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const notesContainer = document.getElementById("notesContainer");
    notesContainer.innerHTML = ""; // clear old notes
    
    console.log("Notes:", notes);
    
    const notesForDay = notes.filter(note => note.timestamp >= startOfDay && note.timestamp < endOfDay);
    
    console.log("Notes for day:", notesForDay);
    
    if (notesForDay.length === 0) {
        notesContainer.textContent = "No notes for this day.";
        return;
    }
    
    notesForDay.forEach(note => {
        const div = document.createElement("div");
        div.classList.add("note-log-block");
        
        const time = formatTime12hCompact(note.timestamp);
        const tags = note.tags?.map(tag => `<span class="note-tag">${tag}</span>`).join(" ") ?? "";
        
        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("note-log-body");
        bodyDiv.innerHTML = `<strong>${time}</strong>: ${note.text.replace(/\n/g, "<br>")}`;
        
        const tagsDiv = document.createElement("div");
        tagsDiv.classList.add("note-tags");
        tagsDiv.innerHTML = tags;
        
        div.appendChild(bodyDiv);
        if (tags) div.appendChild(tagsDiv);
        
        notesContainer.appendChild(div);
    });
}

function updateFoodChartForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const foodLogsForDay = foodLogs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);

    const data = foodLogsForDay.map(log => ({
        x: log.timestamp,
        y: log.netCarbs,
        foodName: log.foodName,
        calories: log.calories,
        netCarbs: log.netCarbs,
        fat: log.fat
    }));

    foodChart.data.datasets[0].data = data;
    
    foodChart.options.scales.x.min = startOfDay;
    foodChart.options.scales.x.max = endOfDay;

    const netCarbValues = foodLogsForDay.map(log => log.netCarbs);
    setFoodChartYScales(netCarbValues);

    foodChart.update();
}

function showFoodLogsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const foodLogsContainer = document.getElementById("foodLogsContainer");
    foodLogsContainer.innerHTML = ""; // clear old food logs
    
    //    console.log("Food logs:", foodLogs);
    
    const foodLogsForDay = foodLogs.filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay);
    
        console.log("Food Logs for day:", foodLogsForDay);
    
    if (foodLogsForDay.length === 0) {
        foodLogsContainer.textContent = "No food logs for this day.";
        return;
    }
    
    foodLogsForDay.forEach(log => {
        const div = document.createElement("div");
        div.classList.add("log-block");
        
        const time = formatTime12hCompact(log.timestamp);
        
        div.innerHTML = `
            <strong>${time}</strong>: ${log.foodName}
            <div class="log-details">
                <span>🍌 Net Carbs: ${log.netCarbs}g</span>
                <span>🍌 Total Carbs: ${log.totalCarbs}g</span>
                <span>🥑 Fat: ${log.fat}g</span>
                <span>🫘 Protein: ${log.protein}g</span>
                <span>🌿 Fibre: ${log.fibre}g</span>
                <span>🔥 Calories: ${log.calories}</span>
            </div>
        `;
        div.setAttribute("data-timestamp", log.timestamp.toISOString());
        div.style.cursor = "pointer";
        
        div.addEventListener("click", () => {
            handleLogClick(new Date(log.timestamp));
        });
        
        
        foodLogsContainer.appendChild(div);
    });
}

function showWorkoutsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const container = document.getElementById("workoutsContainer");
    container.innerHTML = "";
    
    const workoutsForDay = workouts.filter(w => w.start >= startOfDay && w.start < endOfDay);
    
    console.log("workouts:", workouts);
    console.log("workouts for day:", workoutsForDay);
    
    if (workoutsForDay.length === 0) {
        container.textContent = "No workouts for this day.";
        return;
    }
    
    workoutsForDay.forEach((w) => {
        const div = document.createElement("div");
        div.classList.add("log-block");
        
        const startTime = formatTimeFromString(w.start);
        const endTime = formatTimeFromString(w.endTime);
        const elapsedMinutes = Math.round(w.elapsedTime / 60);
        const elapsedStr = `${elapsedMinutes} min`;
        
        const durationMinutes = Math.round(w.duration / 60);
        const durationStr = `${durationMinutes} min`;
        
        const distanceStr = w.distance ? `<div><strong>Distance:</strong> ${w.distance.toFixed(2)} km</div>` : "";
        
        const activeCaloriesStr = Math.round(w.activeCalories);
        const averageHeartRateStr = Math.round(w.averageHeartRate);
        
        div.innerHTML = `
            <div class="log-title">${w.name}</div>
            <div><strong>Duration:</strong> ${durationStr}</div>
            <div><strong>Average H/R:</strong> ${averageHeartRateStr}bpm</div>
            <div><strong>Max H/R:</strong> ${w.maxHeartRate}bpm</div>
            <div><strong>Calories:</strong> ${activeCaloriesStr}</div>
            <div><strong>Start:</strong> ${startTime}</div>
            <div><strong>End:</strong> ${endTime}</div>
            <div><strong>Elapsed Time:</strong> ${elapsedStr}</div>
            
            ${distanceStr}
        `;
        
        workoutsContainer.appendChild(div);
    });
}

function showFastsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const container = document.getElementById("fastsContainer");
    container.innerHTML = "";
    
    const fastsForDay = fasts.filter(f => {
        const start = new Date(f.startTime);
        const end = f.endTime ? new Date(f.endTime) : null;
        
        return (
                (start >= startOfDay && start < endOfDay) || // started today
                (end && end >= startOfDay && end < endOfDay) || // ended today
                (start < startOfDay && (!end || end > endOfDay)) // spanned entire day
                );
    });
    
    const totalSeconds = fastsForDay.reduce((sum, f) => sum + (f.duration || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (fastsForDay.length === 0) {
        container.textContent = "No fasts for this day.";
        return;
    }
    
    fastsForDay.forEach(fast => {
        const div = document.createElement("div");
        div.classList.add("fast-block");
        
        // Heading label based on whether start/end is on the selected date
        const isStartToday = isSameDay(fast.startTime, date);
        const isEndToday = fast.endTime && isSameDay(fast.endTime, date);
        
        let label = "Continued";
        if (isStartToday && isEndToday) {
            label = "Started and Ended";
        } else if (isStartToday) {
            label = "Started fast:";
        } else if (isEndToday) {
            label = "Ended fast:";
        }
        
        const start = formatDateTime(fast.startTime);
        const end = fast.endTime ? formatDateTime(fast.endTime) : "Ongoing";
        
        const duration = fast.duration
        ? `${Math.floor(fast.duration / 3600)}h ${Math.floor((fast.duration % 3600) / 60)}m`
        : "";
        
        div.innerHTML = `
            <div class="fast-label">${label}</div>
            ${duration ? `<div><strong>Duration:</strong> ${duration}</div>` : ""}
            <div><strong>Start:</strong> ${start}</div>
            <div><strong>End:</strong> ${end}</div>
            ${fast.notes ? `<div class="fast-notes">📝 ${fast.notes}</div>` : ""}
        `;
        fastsContainer.appendChild(div);
    });
}

function showBolusesForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const container = document.getElementById("bolusContainer");
    container.innerHTML = "";
    
    const bolusesForDay = bolusDoses.filter(b => b.timestamp >= startOfDay && b.timestamp < endOfDay);
    
    const totalUnits = bolusesForDay.reduce((sum, b) => sum + (b.amount || 0), 0);
    
    if (bolusesForDay.length === 0) {
        container.textContent = "No bolus doses for this day.";
        return;
    }
    
    
    
    bolusesForDay.forEach(bolus => {
        const div = document.createElement("div");
        div.classList.add("bolus-block");
        
        const time = formatTime12hCompact(bolus.timestamp);
        const amount = bolus.amount?.toFixed(2) ?? "?";
        
        let extra = "";
        if (bolus.carbRatioUsed) {
            extra += ` · Ratio: 1:${bolus.carbRatioUsed}`;
        }
        if (bolus.notes) {
            extra += ` · ${bolus.notes}`;
        }
        
        div.innerHTML = `<strong>${time}</strong>: 💉 ${amount}U ${extra}`;
        container.appendChild(div);
    });
}
