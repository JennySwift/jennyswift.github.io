<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { DateTime } from 'luxon'
    import 'chartjs-adapter-luxon'

    import {
        Chart,
        LineController, LineElement, PointElement,
        LinearScale, TimeScale, Tooltip, Legend, Filler
    } from 'chart.js'
    import annotationPlugin from 'chartjs-plugin-annotation'

    Chart.register(
        LineController, LineElement, PointElement,
        LinearScale, TimeScale, Tooltip, Legend, Filler,
        annotationPlugin
    )

    const props = defineProps({
        // Array of 24 numbers (units delivered in each hour bucket 0..23)
        hourlyTotals: { type: Array, default: () => [] },
        // Selected day anchor (used for x-axis and hour labels)
        selectedDate: { type: [Date, String, Number], required: true },
    })

    const canvasRef = ref(null)
    let chartInstance = null

    // Build stepped points from hourly totals: for each hour, draw a flat segment
    // from [hourStart, hourEnd) at y = totals[h]
    const pointsForDay = computed(() => {
        if (!props.selectedDate || !Array.isArray(props.hourlyTotals)) return []

        const base = props.selectedDate instanceof Date
            ? props.selectedDate
            : new Date(props.selectedDate)

        const dayStart = DateTime.fromJSDate(base).setZone('Australia/Sydney').startOf('day')
        const pts = []

        for (let h = 0; h < 24; h++) {
            const val = Number(props.hourlyTotals[h] ?? 0)
            const segStart = dayStart.plus({ hours: h }).toMillis()
            const segEnd   = dayStart.plus({ hours: h + 1 }).toMillis()

            // Push two points so stepped line renders a flat segment
            pts.push({ x: segStart, y: val, _segStart: segStart, _segEnd: segEnd, _val: val })
            pts.push({ x: segEnd,   y: val, _segStart: segStart, _segEnd: segEnd, _val: val })
        }

        return pts
    })

    function handleMouseLeave() {
        window.dispatchEvent(new CustomEvent('chart-hover', {
            detail: { hide: true, source: 'basal-hourly' }
        }))
    }

    function handleChartHover(e) {
        if (!chartInstance) return
        const x = e?.detail?.x ?? null
        const annos = chartInstance.options?.plugins?.annotation?.annotations
        if (annos?.dynamicLine != null) {
            annos.dynamicLine.value = x
            chartInstance.update('none')
        }
    }

    // Y axis bounds from totals
    function computeYBounds(pts) {
        if (!pts.length) return { min: 0, max: 1 }
        const maxVal = Math.max(0, ...pts.map(p => Number(p.y) || 0))
        const max = Math.max(1, Math.ceil(maxVal + 0.2))
        return { min: 0, max }
    }

    function createDataset(pts) {
        return {
            label: 'Basal (units/hour bucket)',
            data: pts,
            stepped: 'before',
            pointRadius: 0,
            pointHoverRadius: 6,
            borderWidth: 2,
            // keep styling consistent with your BasalChart
            backgroundColor: 'rgba(100, 149, 237, 0.5)',
            borderColor: 'rgba(100, 149, 237, 0.7)',
            fill: true,
        }
    }

    function buildOptions(xRange, yBounds) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            onHover: (evt, _actives, chart) => {
                const els = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false)
                if (els.length) {
                    const { datasetIndex, index } = els[0]
                    const xVal = chart.data.datasets[datasetIndex].data[index].x

                    // Update this chart’s vertical line…
                    chart.options.plugins.annotation.annotations.dynamicLine.value = xVal
                    chart.update('none')

                    // Compute X in canvas coordinates to keep your shared tooltip aligned
                    const canvasRect = chart.canvas.getBoundingClientRect()
                    const clientX = evt?.native?.clientX ?? evt.clientX
                    const px = clientX - canvasRect.left

                    // Broadcast (source identifies this chart)
                    window.dispatchEvent(new CustomEvent('chart-hover', {
                        detail: { x: xVal, px, source: 'basal-hourly' }
                    }))
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'hour', displayFormats: { hour: 'h:mm a' } },
                    ticks: {
                        source: 'auto',
                        autoSkip: false,
                        maxTicksLimit: 12,
                        callback: (val) =>
                            DateTime.fromMillis(Number(val))
                                .setZone('Australia/Sydney')
                                .toFormat('h a')
                    },
                    grid: { color: '#ddd', lineWidth: 1 },
                    min: xRange?.min,
                    max: xRange?.max,
                },
                y: {
                    min: yBounds.min,
                    max: yBounds.max,
                    beginAtZero: true,
                    grid: { color: '#eee', lineWidth: 1 },
                    ticks: { stepSize: 0.5 }, // tweak if you prefer
                    title: { display: true, text: 'Units / Hour' },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }, // keep consistent with your BasalChart
                annotation: {
                    annotations: {
                        dynamicLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: null,
                            borderColor: 'rgba(100, 100, 100, 0.85)',
                            borderWidth: 2,
                            display: ctx =>
                                ctx.chart.options.plugins.annotation.annotations.dynamicLine.value !== null
                        }
                    }
                }
            }
        }
    }

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')

        const pts = pointsForDay.value
        const dayStartMs = DateTime.fromJSDate(
            props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate)
        ).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000
        const yBounds = computeYBounds(pts)

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: [createDataset(pts)] },
            options: buildOptions({ min: dayStartMs, max: dayEndMs }, yBounds),
        })
    }

    function updateChart() {
        if (!chartInstance) return

        const pts = pointsForDay.value
        const dayStartMs = DateTime.fromJSDate(
            props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate)
        ).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000
        const yBounds = computeYBounds(pts)

        chartInstance.data.datasets = [createDataset(pts)]
        chartInstance.options.scales.x.min = dayStartMs
        chartInstance.options.scales.x.max = dayEndMs
        chartInstance.options.scales.y.min = yBounds.min
        chartInstance.options.scales.y.max = yBounds.max

        chartInstance.update('none')
    }

    onMounted(() => {
        createChart()
        window.addEventListener('chart-hover', handleChartHover)
        canvasRef.value?.addEventListener('mouseleave', handleMouseLeave)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('chart-hover', handleChartHover)
        canvasRef.value?.removeEventListener('mouseleave', handleMouseLeave)
        chartInstance?.destroy(); chartInstance = null
    })

    watch([() => props.selectedDate, pointsForDay], updateChart)
</script>

<template>
    <div class="chartContainer">
        <canvas ref="canvasRef" aria-label="Hourly basal (totals) chart"></canvas>
    </div>
</template>

<style scoped>
    .chartContainer { width: 100%; height: 180px; } /* match your other chart heights if needed */
</style>