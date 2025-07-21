
//To try to make the tooltip disappear on phone when clicking away
function setUpHideTooltip() {
    document.addEventListener('touchstart', function(event) {
      if (!event.target.closest('canvas')) {
        Chart.helpers.each(Chart.instances, function(instance) {
          instance.tooltip?.setActiveElements([], { x: 0, y: 0 });
          instance.update();
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

    // Hide tooltip + vertical line when tapping outside chart on iPhone
    document.addEventListener("touchstart", (e) => {
        const chartEl = document.getElementById("bgChart");
        if (!chartEl.contains(e.target)) {
            bgChart.setActiveElements([]);
            bgChart.options.plugins.annotation.annotations.dynamicLine.value = null;
            bgChart.update();
        }
    });

    document.getElementById("jumpInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            jumpToTime();
        }
    });

    attachChartMousemoveSync(bgChart, "bgChart");
    attachChartMousemoveSync(foodChart, "foodChart");
    setUpHideTooltip()
}

//    Hide the vertical line when mouse leaves chart
function attachChartMouseleaveClear() {
    ["bgChart", "foodChart"].forEach((chartId) => {
        const el = document.getElementById(chartId);
        el.addEventListener("mouseleave", () => {
            if (bgChart) {
                bgChart.options.plugins.annotation.annotations.dynamicLine.value = null;
                bgChart.update("none");
            }
            if (foodChart) {
                foodChart.options.plugins.annotation.annotations.dynamicLine.value = null;
                foodChart.update("none");
            }
        });
    });
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

//    document.getElementById("bgChart").addEventListener("mousemove", (evt) => {
//        if (!bgChart) return;
//
//        const points = bgChart.getElementsAtEventForMode(evt, "nearest", { intersect: false }, false);
//        if (points.length > 0) {
//            const index = points[0].index;
//            const label = bgChart.data.datasets[0].data[index]?.x;
//            bgChart.options.plugins.annotation.annotations.dynamicLine.value = label;
//            bgChart.update("none");
//        }
//    });
