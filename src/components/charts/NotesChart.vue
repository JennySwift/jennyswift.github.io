<!-- src/components/charts/NotesChart.vue -->
<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { DateTime } from 'luxon'
    import { getStartAndEndOfDay } from '../../helpers/dateHelpers'

    // Chart.js (scatter points for icons)
    import {
        Chart, ScatterController, PointElement, LinearScale, TimeScale, Tooltip
    } from 'chart.js'
    import 'chartjs-adapter-luxon'

    Chart.register(ScatterController, PointElement, LinearScale, TimeScale, Tooltip)

    const props = defineProps({
        notes:        { type: Array, default: () => [] }, // [{ timestamp, text }]
        selectedDate: { type: Date,  required: true },
        noteIconUrl:  { type: String, default: '/note-icon.png' }, // your icon path
    })

    const canvasRef = ref(null)
    let chartInstance = null
    let noteImg = null

    // Normalize/shape notes for the day, map to X=timestamp, Y=0.5 (fixed lane)
    const pointsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        return (props.notes || [])
            .map(n => {
                // Accept Date | ISO string | epoch
                const ts =
                    n.timestamp instanceof Date
                        ? n.timestamp
                        : typeof n.timestamp === 'string'
                        ? DateTime.fromISO(n.timestamp).toJSDate()
                        : new Date(Number(n.timestamp))

                return { ts, text: n.text ?? '' }
            })
            .filter(n => n.ts >= startOfDay && n.ts < endOfDay)
            .sort((a, b) => a.ts - b.ts)
            .map(n => ({
                x: n.ts.getTime(),
                y: 0.5,           // fixed lane row (0..1)
                _note: {          // carry full note for tooltip/hover
                    text: n.text,
                    timestamp: n.ts,
                }
            }))
    })

    function buildOptions(xRange) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: true },
            events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
            onHover: (evt, actives, chart) => {
                if (!actives.length) {
                    // tell app/tooltips to hide IF this was the active chart
                    window.dispatchEvent(new CustomEvent('chart-hover', {
                        detail: { hide: true, source: 'note' }
                    }))
                    return
                }
                const { datasetIndex, index } = actives[0]
                const d = chart.data.datasets[datasetIndex].data[index]
                const xVal = d.x

                // pixel X position for clamped tooltip placement
                const canvasRect = chart.canvas.getBoundingClientRect()
                const clientX = evt?.native?.clientX ?? evt.clientX
                const px = clientX - canvasRect.left

                window.dispatchEvent(new CustomEvent('chart-hover', {
                    detail: {
                        x: xVal,
                        px,
                        source: 'note',
                        note: d._note // { text, timestamp }
                    }
                }))
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            layout: {
                padding: { top: 2, bottom: 2 } // a tiny breathing room inside the strip
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'hour', displayFormats: { hour: 'h:mm a' } },
                    adapters: { date: { zone: 'Australia/Sydney' } },
                    grid: { display: false },
                    ticks: { display: false },
                    min: xRange?.min,
                    max: xRange?.max,
                },
                // A dedicated Y scale [0..1] so notes always sit in their own lane
                y: {
                    min: 0,
                    max: 1,
                    grid: { display: false },
                    ticks: { display: false },
                    beginAtZero: true
                }
            }
        }
    }

    function createDataset(pts) {
        return {
            type: 'scatter',
            data: pts,
            pointRadius: 8,       // icon size (tweak)
            pointHoverRadius: 12,
            pointHitRadius: 18,    // easy to hover
            // pointBackgroundColor: 'transparent',
            // pointBorderColor: 'transparent',
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#f59e0b',
            borderWidth: 0,
            pointStyle: '📝',
            // pointStyle: 'triangle',
            // pointStyle: noteImg ?? 'circle',
        }
    }

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')

        const pts = pointsForDay.value
        const dayStartMs = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000

        chartInstance = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: [createDataset(pts)] },
            options: buildOptions({ min: dayStartMs, max: dayEndMs })
        })
    }

    function updateChart() {
        if (!chartInstance) return
        const pts = pointsForDay.value
        const dayStartMs = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000

        chartInstance.data.datasets = [createDataset(pts)]
        chartInstance.options.scales.x.min = dayStartMs
        chartInstance.options.scales.x.max = dayEndMs
        chartInstance.update('none')
    }

    onMounted(() => {
        //Load the custom PNG once; Chart.js accepts HTMLImageElement as pointStyle
        // noteImg = new Image()
        // noteImg.src = props.noteIconUrl
        // noteImg.onload = () => {
        //     // build after image is ready so icons render immediately
        //     createChart()
        // }
        createChart()
    })
    onBeforeUnmount(() => {
        chartInstance?.destroy()
        chartInstance = null
    })

    watch([() => props.selectedDate, pointsForDay], updateChart)
</script>

<template>
    <!-- Keep this strip short in its container (e.g., 28–36px) -->
    <canvas ref="canvasRef" aria-label="Notes lane"></canvas>
</template>

<style scoped>
    canvas { width: 100% !important; height: 100% !important; display:block; }
</style>