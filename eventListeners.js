
//To try to make the tooltip disappear on phone when clicking away
function setUpHideTooltip() {
    document.addEventListener("touchstart", (e) => {
        const chartEls = [
            document.getElementById("bgChart"),
            document.getElementById("foodChart"),
            document.getElementById("bolusChart"),
            document.getElementById("basalChart")
        ];

        const touchedInsideAnyChart = chartEls.some(chartEl => chartEl?.contains(e.target));

        if (!touchedInsideAnyChart) {
            [bgChart, foodChart, bolusChart, basalChart].forEach(chart => {
                if (chart?.options.plugins.annotation?.annotations?.dynamicLine) {
                    chart.options.plugins.annotation.annotations.dynamicLine.value = null;
                }

                chart?.setActiveElements?.([]);
                chart?.tooltip?.setActiveElements?.([], { x: 0, y: 0 });
                chart?.update?.("none");
            });
        }
    });
}

function setUpTabListeners() {
    const buttons = document.querySelectorAll(".tab-button");
      const tabs = document.querySelectorAll(".tab-content");

      buttons.forEach(button => {
        button.addEventListener("click", () => {
          const target = button.getAttribute("data-tab");
            
            if (target === "all-notes") {
              showAllNotes();
            }

          buttons.forEach(btn => btn.classList.remove("active"));
          button.classList.add("active");

          tabs.forEach(tab => {
            tab.classList.remove("active-tab");
            if (tab.id === `${target}Container` || tab.id === target) {
              tab.classList.add("active-tab");
            }
          });
        });
      });
}

function setupEventListeners() {
    const selectedDateInput = document.getElementById("selectedDate");

    selectedDateInput.addEventListener("change", () => {
        const selected = selectedDateInput.valueAsDate;
        updateChartForDate(selected);
    });

    document.getElementById("jumpInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            jumpToTime();
        }
    });
    
    setUpVerticalLineMouseTracking();
    
    setUpHideTooltip()
    
    setUpAllNotesTab()

}

function setUpAllNotesTab() {
    document.getElementById("noteSearchInput")?.addEventListener("input", () => {
        showAllNotes();
    });
    
    const allNotesSearch = document.getElementById("all-notes-search");

    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => {
            const selectedTab = button.getAttribute("data-tab");

            // Show or hide the search field based on selected tab
            if (selectedTab === "all-notes") {
                allNotesSearch.style.display = "block";
                showAllNotes(); // Refresh with latest search filter
            } else {
                allNotesSearch.style.display = "none";
            }
        });
    });

    // Initially hide the search bar
    allNotesSearch.style.display = "none";
}

function setUpVerticalLineMouseTracking() {
    attachChartMousemoveSync(bgChart, "bgChart");
    attachChartMousemoveSync(foodChart, "foodChart");
    attachChartMousemoveSync(bolusChart, "bolusChart");
    attachChartMousemoveSync(basalChart, "basalChart");
    attachChartMousemoveSync(workoutChart, "workoutChart");
}

function attachChartMousemoveSync(chartInstance, chartElementId) {
    const el = document.getElementById(chartElementId);
    el.addEventListener("mousemove", (evt) => {
        if (!chartInstance) return;

        const points = chartInstance.getElementsAtEventForMode(evt, "nearest", { intersect: false }, false);
        if (points.length > 0) {
            const index = points[0].index;
            const label = chartInstance.data.datasets[0].data[index]?.x;
            updateVerticalLines(label);
        }
    });
}
