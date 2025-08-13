<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../helpers/dateHelpers'

    // Chart.js core + time adapter + annotation plugin
    import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler } from 'chart.js'
    import annotationPlugin from 'chartjs-plugin-annotation'
    import 'chartjs-adapter-date-fns'

    // Register once (safe to call multiple times)
    Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler, annotationPlugin)

    const props = defineProps({
        glucoseReadings: { type: Array, default: () => [] }, // [{ timestamp: Date|string, value: number }]
        selectedDate:    { type: Date,  required: true }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    // Filter + sort the day’s readings
    const readingsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.glucoseReadings
            .filter(r => {
                const t = r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp)
                return t >= startOfDay && t < endOfDay
            })
            .map(r => ({
                x: r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp),
                y: Number(r.value)
            }))
            .sort((a, b) => a.x - b.x)
    })

    // Build the dataset
    function createGlucoseDataset(points) {
        return {
            label: 'BG (mmol/L)',
            data: points,
            pointRadius: 0,
            pointHoverRadius: 6,
            borderColor: 'rgba(80, 80, 80, 0.9)',
            borderWidth: 3,
            tension: 0.15,
            fill: false,
        }
    }

    // Reasonable y‑axis bounds (show zones clearly but adapt to data)
    function computeYBounds(points) {
        if (!points.length) return { min: 2, max: 12 }
        const values = points.map(p => p.y)
        const vMin = Math.min(...values)
        const vMax = Math.max(...values)
        // pad a bit
        let min = Math.floor(Math.min(4, vMin) - 1)
        let max = Math.ceil(Math.max(10, vMax) + 1)
        // don’t let it get silly
        min = Math.max(0, min)
        max = Math.min(30, Math.max(12, max))
        if (min >= max) { min = 2; max = 12 }
        return { min, max }
    }

    function buildOptions(xRange, yBounds) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'hour', displayFormats: { hour: 'h:mm a' } },
                    ticks: { source: 'auto', autoSkip: false, maxTicksLimit: 12 },
                    grid: { color: '#ccc', lineWidth: 1 },
                    min: xRange?.min,
                    max: xRange?.max,
                },
                y: {
                    min: yBounds.min,
                    max: yBounds.max,
                    grid: { color: '#888', lineWidth: 1 },
                    ticks: { stepSize: 2 },
                    title: { display: true, text: 'mmol/L' },
                }
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {
                        inRangeBand: {
                            type: 'box',
                            yMin: 4,
                            yMax: 6,
                            backgroundColor: 'rgba(0, 128, 255, 0.12)', // light, readable tint
                            borderWidth: 0,
                        },
                    }
                },
                tooltip: {
                    callbacks: {
                        title(items) {
                            // Show the time only
                            const v = items?.[0]?.parsed?.x
                            return v ? new Date(v).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
                        },
                        label(ctx) {
                            const y = ctx.parsed?.y
                            return y != null ? `BG: ${Number(y).toFixed(2)} mmol/L` : ''
                        }
                    }
                }
            }
        }
    }

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')

        const points = readingsForDay.value
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const yBounds = computeYBounds(points)

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: [createGlucoseDataset(points)] },
            options: buildOptions({ min: startOfDay, max: endOfDay }, yBounds),
        })
    }

    function updateChart() {
        if (!chartInstance) return
        const points = readingsForDay.value
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const yBounds = computeYBounds(points)

        // update data
        chartInstance.data.datasets = [createGlucoseDataset(points)]

        // update scales
        chartInstance.options.scales.x.min = startOfDay
        chartInstance.options.scales.x.max = endOfDay
        chartInstance.options.scales.y.min = yBounds.min
        chartInstance.options.scales.y.max = yBounds.max

        chartInstance.update('none')
    }

    onMounted(createChart)
    onBeforeUnmount(() => {
        if (chartInstance) {
            chartInstance.destroy()
            chartInstance = null
        }
    })

    // Re-render whenever the date or day’s points change
    watch([() => props.selectedDate, readingsForDay], updateChart)
</script>

<template>
    <div class="chartContainer" style="height: 180px;">
        <canvas ref="canvasRef" aria-label="Blood glucose chart"></canvas>
    </div>
</template>