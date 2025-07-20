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
