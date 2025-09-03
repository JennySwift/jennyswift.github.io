//WorkoutsChart.vue
<script setup>
    import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
    import { DateTime } from 'luxon'
    import { getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import { cssVarToRgba } from '../../helpers/colorHelpers'

    import {
        Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip
    } from 'chart.js'
    import 'chartjs-adapter-luxon'
    import annotationPlugin from 'chartjs-plugin-annotation'

    Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, annotationPlugin)

    const props = defineProps({
        workouts: { type: Array, default: () => [] },
        selectedDate: { type: Date, required: true }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    const workoutPoints = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        return props.workouts.flatMap(w => {
            const start = w.start instanceof Date ? w.start : new Date(w.start)
            const end   = w.endTime instanceof Date ? w.endTime : new Date(w.endTime)
            if (start >= endOfDay || end <= startOfDay) return []

            const clampedStart = Math.max(start.getTime(), startOfDay.getTime())
            const clampedEnd   = Math.min(end.getTime(), endOfDay.getTime())
            const avgHR = Number(w.averageHeartRate ?? 0)
            const workout = { ...w }

            return [
                { x: clampedStart, y: 0,      _workout: workout },
                { x: clampedStart, y: avgHR,  _workout: workout },
                { x: clampedEnd,   y: avgHR,  _workout: workout },
                { x: clampedEnd,   y: 0,      _workout: workout }
            ]
        }).sort((a, b) => a.x - b.x)
    })

    //This ensures that fake y: 0 points do not affect the chart bounds, so Y-min still starts at 80 unless needed lower.
    function computeYBounds(points) {
        const nonZeroY = points.map(p => p.y).filter(y => y > 0)
        if (!nonZeroY.length) return { min: 80, max: 120 }

        const minHR = Math.min(...nonZeroY)
        const maxHR = Math.max(...nonZeroY)

        const min = Math.floor(Math.min(minHR, 80) / 20) * 20
        const max = Math.ceil(Math.max(maxHR + 20, 120) / 20) * 20

        return { min, max }
    }



    function buildOptions(xRange, yBounds) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            // stepped: true,
            // spanGaps: false,
            // parsing: false,  // makes Chart.js use your raw {x, y} directly
            // normalized: true, // ensures X values are sorted
            onHover(evt, _actives, chart) {
                const els = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false)
                if (els.length) {
                    const { datasetIndex, index } = els[0]
                    const d = chart.data.datasets[datasetIndex].data[index]
                    chart.options.plugins.annotation.annotations.dynamicLine.value = d.x
                    chart.update('none')

                    const canvasRect = chart.canvas.getBoundingClientRect()
                    const clientX = evt?.native?.clientX ?? evt.clientX
                    const px = clientX - canvasRect.left

                    window.dispatchEvent(new CustomEvent('chart-hover', {
                        detail: {
                            x: d.x,
                            px,
                            source: 'workouts',
                            workout: d._workout ?? null
                        }
                    }))
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                annotation: {
                    annotations: {
                        dynamicLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: null,
                            borderColor: 'rgba(100, 100, 100, 0.85)',
                            borderWidth: 2,
                            display: ctx => ctx.chart.options.plugins.annotation.annotations.dynamicLine.value != null
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        zone: 'Australia/Sydney',
                        unit: 'hour',
                        displayFormats: { hour: 'h:mm a' }
                    },
                    ticks: {
                        source: 'auto',
                        autoSkip: false,
                        maxTicksLimit: 12,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: (val) =>
                            DateTime.fromMillis(Number(val))
                                .setZone('Australia/Sydney')
                                .toFormat('h a')
                    },
                    grid: { color: '#ccc', lineWidth: 1 },
                    min: xRange.min,
                    max: xRange.max,
                },
                y: {
                    position: 'right',
                    min: yBounds.min,
                    max: yBounds.max,
                    beginAtZero: true,
                    grid: { color: '#ddd' },
                    title: { display: true, text: 'Avg HR (bpm)' },
                    ticks: { stepSize: 20 }
                }
            }
        }
    }

    function createChart() {
        const borderColor = cssVarToRgba('--color-workout', 1)
        const fillColor   = cssVarToRgba('--color-workout', 0.85)

        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')
        const pts = workoutPoints.value

        const dayStart = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEnd = dayStart + 86_400_000
        const yBounds = computeYBounds(pts)

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Avg H/R',
                    data: pts,
                    stepped: 'before',
                    pointRadius: 0,
                    borderColor: borderColor,
                    backgroundColor: fillColor,
                    borderWidth: 2,
                    fill: 'origin',
                    spanGaps: false,
                    parsing: false,
                    normalized: true
                }]
            },
            options: buildOptions({ min: dayStart, max: dayEnd }, yBounds)
        })
    }

    function updateChart() {
        if (!chartInstance) return
        const pts = workoutPoints.value
        const dayStart = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEnd = dayStart + 86_400_000
        const yBounds = computeYBounds(pts)

        chartInstance.data.datasets[0].data = pts
        chartInstance.options.scales.x.min = dayStart
        chartInstance.options.scales.x.max = dayEnd
        chartInstance.options.scales.y.min = yBounds.min
        chartInstance.options.scales.y.max = yBounds.max
        chartInstance.update('none')
    }

    onMounted(() => {
        createChart()
        window.addEventListener('chart-hover', () => {})
    })

    onBeforeUnmount(() => {
        chartInstance?.destroy()
        chartInstance = null
    })

    watch([() => props.workouts, () => props.selectedDate], updateChart)
</script>

<template>
    <p v-if="workoutPoints.length === 0" class="no-workouts-msg">
        No workouts for the selected day.
    </p>
    <div class="workouts-chart" v-show="workoutPoints.length > 0">
        <canvas
                ref="canvasRef"
                aria-label="Workout chart"
        />
    </div>
</template>

<style scoped>
    .no-workouts-msg {
        margin: 1rem 0;
        font-style: italic;
        color: #666;
        text-align: center;
    }
</style>