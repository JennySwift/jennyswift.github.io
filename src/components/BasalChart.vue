<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../helpers/dateHelpers'

    import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler } from 'chart.js'
    import 'chartjs-adapter-date-fns'
    import annotationPlugin from 'chartjs-plugin-annotation'

    Chart.register(
        LineController, LineElement, PointElement,
        LinearScale, TimeScale, Tooltip, Legend, Filler,
        annotationPlugin
    )

    const props = defineProps({
        basalEntries: { type: Array, default: () => [] }, // [{ startTime, endTime|null, rate, ... }]
        selectedDate: { type: Date,  required: true }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    // Filter / clip to the day, and flatten entries to step points
    const pointsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        // entries that overlap the day at all
        const overlapping = props.basalEntries
            .filter(e => {
                const s = e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime)
                const end = e.endTime ? (e.endTime instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null
                return s < endOfDay && (!end || end > startOfDay)
            })
            // sort by start
            .sort((a, b) => {
                const sa = (a.startTime instanceof Date ? a.startTime : parseAsSydneyDate(a.startTime)).getTime()
                const sb = (b.startTime instanceof Date ? b.startTime : parseAsSydneyDate(b.startTime)).getTime()
                return sa - sb
            })

        // Flatten each entry to two points (clipped to [startOfDay, endOfDay])
        // If endTime is null, clip to endOfDay (the last entry often is open/ongoing).
        const pts = []
        for (const e of overlapping) {
            const rawStart = e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime)
            const rawEnd   = e.endTime ? (e.endTime instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null

            const segStart = rawStart < startOfDay ? startOfDay : rawStart
            const segEnd   = rawEnd ? (rawEnd > endOfDay ? endOfDay : rawEnd) : endOfDay
            const rate     = Number(e.rate ?? 0)

            // Two points per segment for a stepped line
            pts.push({ x: segStart, y: rate, _segStart: segStart, _segEnd: segEnd, _rate: rate })
            pts.push({ x: segEnd,   y: rate, _segStart: segStart, _segEnd: segEnd, _rate: rate })
        }

        return pts
    })

    function handleVerticalLineUpdate(e) {
        if (!chartInstance) return
        const x = e?.detail?.x ?? null
        const annos = chartInstance.options?.plugins?.annotation?.annotations
        if (annos?.dynamicLine != null) {
            annos.dynamicLine.value = x
            chartInstance.update('none')
        }
    }

    // Y axis: start at 0, pad to the max rate seen that day
    function computeYBounds(pts) {
        if (!pts.length) return { min: 0, max: 1 }
        const maxRate = Math.max(0, ...pts.map(p => p.y))
        // pad a touch so the fill isn’t glued to the top
        const max = Math.max(1, Math.ceil(maxRate + 0.2))
        return { min: 0, max }
    }

    function createDataset(pts) {
        return {
            label: 'Basal (U/hr)',
            data: pts,
            stepped: 'before',
            pointRadius: 0,
            pointHoverRadius: 6,
            borderWidth: 2,
            backgroundColor: 'rgba(100, 149, 237, 0.5)',  // cornflower blue, softer
            borderColor: 'rgba(100, 149, 237, 0.7)',
            fill: true,
        }
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
                    grid: { color: '#ddd', lineWidth: 1 },
                    min: xRange?.min,
                    max: xRange?.max,
                },
                y: {
                    min: yBounds.min,
                    max: yBounds.max,
                    beginAtZero: true,
                    grid: { color: '#eee', lineWidth: 1 },
                    ticks: { stepSize: 0.5 }, // adjust if you prefer whole numbers
                    title: { display: true, text: 'Basal Rate' },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title(items) {
                            const p = items?.[0]?.raw
                            const t = p?._segStart
                            if (!t) return ''
                            const sydneyDate = parseAsSydneyDate(t)
                            return sydneyDate.toLocaleTimeString('en-AU', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'Australia/Sydney'
                            })
                        },
                        label(ctx) {
                            const p = ctx.raw
                            const start = p?._segStart ? parseAsSydneyDate(p._segStart) : null
                            const end   = p?._segEnd   ? parseAsSydneyDate(p._segEnd)   : null
                            const rate  = p?._rate != null ? Number(p._rate).toFixed(3) : ctx.parsed?.y?.toFixed?.(3)

                            const range = (start && end)
                                ? `${start.toLocaleTimeString('en-AU', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                    timeZone: 'Australia/Sydney'
                                })} → ${end.toLocaleTimeString('en-AU', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                    timeZone: 'Australia/Sydney'
                                })}`
                                : ''

                            return [`Rate: ${rate} U/hr`, range].filter(Boolean)
                        }
                    }
                },
                annotation: {
                    annotations: {
                        dynamicLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: null, // start hidden
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
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const yBounds = computeYBounds(pts)

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: [createDataset(pts)] },
            options: buildOptions({ min: startOfDay, max: endOfDay }, yBounds),
        })
    }

    function updateChart() {
        if (!chartInstance) return

        const pts = pointsForDay.value
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const yBounds = computeYBounds(pts)

        chartInstance.data.datasets = [createDataset(pts)]
        chartInstance.options.scales.x.min = startOfDay
        chartInstance.options.scales.x.max = endOfDay
        chartInstance.options.scales.y.min = yBounds.min
        chartInstance.options.scales.y.max = yBounds.max

        chartInstance.update('none')
    }

    onMounted(() => {
        createChart()
        window.addEventListener('vertical-line:update', handleVerticalLineUpdate)
    })
    onBeforeUnmount(() => {
        window.removeEventListener('vertical-line:update', handleVerticalLineUpdate)
        chartInstance?.destroy()
        chartInstance = null
    })
    watch([() => props.selectedDate, pointsForDay], updateChart)
</script>

<template>
    <div class="chartContainer" style="height: 140px;">
        <canvas ref="canvasRef" aria-label="Basal rate chart"></canvas>
    </div>
</template>