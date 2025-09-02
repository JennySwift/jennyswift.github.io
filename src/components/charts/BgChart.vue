//BgChart.vue
<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import { DateTime } from 'luxon'
    import 'chartjs-adapter-luxon'

    // Chart.js core + time adapter + annotation plugin
    import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler } from 'chart.js'
    import annotationPlugin from 'chartjs-plugin-annotation'



    // Register once (safe to call multiple times)
    Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler, annotationPlugin)

    const props = defineProps({
        glucoseReadings: { type: Array, default: () => [] }, // [{ timestamp: Date|string, value: number }]
        selectedDate:    { type: Date,  required: true }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    let verticalLineXValue = null

    // Filter + sort the day’s readings
    const readingsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.glucoseReadings
            .filter(r => {
                 const t = (typeof r.timestamp === 'string'
                       ? (/Z|[+\-]\d{2}:?\d{2}$/.test(r.timestamp)
                           ? DateTime.fromISO(r.timestamp)
                           : DateTime.fromISO(r.timestamp, { zone: 'Australia/Sydney' }))
                           .toJSDate()
                       : (r.timestamp instanceof Date ? r.timestamp : new Date(Number(r.timestamp))))
                return t >= startOfDay && t < endOfDay
            })
            .map(r => ({
                 x: (typeof r.timestamp === 'string'
             ? (/Z|[+\-]\d{2}:?\d{2}$/.test(r.timestamp)
                     ? DateTime.fromISO(r.timestamp)
                     : DateTime.fromISO(r.timestamp, { zone: 'Australia/Sydney' }))
                     .toMillis()
             : (r.timestamp instanceof Date ? r.timestamp.getTime() : Number(r.timestamp))),
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

    function handleMouseLeave() {
        window.dispatchEvent(new CustomEvent('chart-hover', {
            detail: { hide: true, source: 'bg' }
        }))
    }

    function handleChartHover(e) {
        if (!chartInstance) return;
        const x = e?.detail?.x ?? null;
        const annos = chartInstance.options?.plugins?.annotation?.annotations;
        if (annos?.dynamicLine != null) {
            annos.dynamicLine.value = x;
            chartInstance.update('none');
        }
    }

    //
    function computeYBounds(points) {
        if (!points.length) return { min: 4, max: 10 }
        const values = points.map(p => p.y)
        const rawMin = Math.floor(Math.min(...values))
        const rawMax = Math.ceil(Math.max(...values))
        return {
            min: Math.min(4, rawMin),  // go lower if readings dip below 4, else 4
            max: Math.max(10, rawMax), // go higher if readings exceed 10, else 10
        }
    }

    function buildOptions(xRange, yBounds) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },

            // ✅ Hover handler at the root of options
            onHover: (evt, _actives, chart) => {
                const els = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false)
                if (els.length) {
                    const { datasetIndex, index } = els[0]
                    const xVal = chart.data.datasets[datasetIndex].data[index].x

                    // update this chart’s line…
                    chart.options.plugins.annotation.annotations.dynamicLine.value = xVal
                    chart.update('none')

                    // compute X in canvas coordinates
                    const canvasRect = chart.canvas.getBoundingClientRect()
                    const clientX = evt?.native?.clientX ?? evt.clientX
                    const px = clientX - canvasRect.left

                    // broadcast
                    window.dispatchEvent(new CustomEvent('chart-hover', {
                        detail: { x: xVal, px, source: 'bg' }
                    }))
                }
            },

            scales: {
                x: {
                    type: 'time',
                    time: { zone: 'Australia/Sydney', unit: 'hour', displayFormats: { hour: 'h:mm a' } },
                    ticks: {
                        source: 'auto',
                        autoSkip: false,
                        maxTicksLimit: 12,
                        callback: (val) =>
                            DateTime.fromMillis(Number(val))
                                .setZone('Australia/Sydney')
                                .toFormat('h a')
                    },
                    // ticks: { source: 'auto', autoSkip: false, maxTicksLimit: 12 },
                    grid: { color: '#ccc', lineWidth: 1 },
                    min: xRange?.min,
                    max: xRange?.max,
                },
                // x: {
                //     type: 'time',
                //     time: { unit: 'hour', displayFormats: { hour: 'h:mm a' } },
                //     adapters: { date: { zone: 'Australia/Sydney' } },
                //     ticks: { source: 'auto', autoSkip: false, maxTicksLimit: 12 },
                //     grid: { color: '#ccc', lineWidth: 1 },
                //     min: xRange?.min,
                //     max: xRange?.max,
                // },
                y: {
                    position: 'right',
                    min: yBounds.min,
                    max: yBounds.max,
                    grid: { color: '#888', lineWidth: 1 },
                    title: { display: true, text: 'mmol/L' },


                    ticks: {
                        stepSize: 2,
                        // padding: 12,      // space between tick and chart area
                        // callback: (val) => val, // normal labels
                    },
                    // afterFit: function(scaleInstance) {
                    //     // Force exact width of Y-axis space
                    //     scaleInstance.width = 60  // or whatever fixed width you decide
                    // },
                }
            },

            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                // tooltip: {
                //     callbacks: {
                //         title(items) {
                //             const v = items?.[0]?.parsed?.x
                //             return v ? new Date(v).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
                //         },
                //         label(ctx) {
                //             const y = ctx.parsed?.y
                //             return y != null ? `BG: ${Number(y).toFixed(2)} mmol/L` : ''
                //         }
                //     }
                // },
                // ✅ merged annotation config into one object
                annotation: {
                    annotations: {
                        inRangeBand: {
                            type: 'box',
                            yMin: 4,
                            yMax: 6,
                            backgroundColor: 'rgba(100, 149, 237, 0.5)',
                            borderWidth: 0,
                        },
                        dynamicLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: verticalLineXValue,
                            borderColor: 'rgba(100, 100, 100, 0.85)',
                            borderWidth: 2,
                            display: ctx => ctx.chart.options.plugins.annotation.annotations.dynamicLine.value !== null
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
        const dayStartMs = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000
        const yBounds = computeYBounds(points)

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: [createGlucoseDataset(points)] },
            options: buildOptions({ min: dayStartMs, max: dayEndMs }, yBounds),
        })
    }

    function updateChart() {
        if (!chartInstance) return
        const points = readingsForDay.value
        const dayStartMs = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000
        const yBounds = computeYBounds(points)

        // update data
        chartInstance.data.datasets = [createGlucoseDataset(points)]

        // update scales
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

    // Re-render whenever the date or day’s points change
    watch([() => props.selectedDate, readingsForDay], updateChart)
</script>

<template>
    <div class="chartContainer">
        <canvas ref="canvasRef" aria-label="Blood glucose chart"></canvas>
    </div>
</template>