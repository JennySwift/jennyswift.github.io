<!-- FoodLogsChart.vue -->
<script setup>
    import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
    import { DateTime } from 'luxon'
    import { getStartAndEndOfDay } from '../../helpers/dateHelpers'

    import {
        Chart, BarController, BarElement, LinearScale, TimeScale, Tooltip
    } from 'chart.js'
    import 'chartjs-adapter-luxon'
    import annotationPlugin from 'chartjs-plugin-annotation'

    Chart.register(BarController, BarElement, LinearScale, TimeScale, Tooltip, annotationPlugin)

    const props = defineProps({
        foodLogs: { type: Array, default: () => [] },
        selectedDate: { type: Date, required: true }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    function cssVarRGBA(name, alpha, fallback = '#000000') {
        const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
        const fullHex = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex
        const intVal = parseInt(fullHex.slice(1), 16)
        const r = (intVal >> 16) & 255, g = (intVal >> 8) & 255, b = intVal & 255
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const groupedByTimestamp = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const groups = new Map()

        for (const log of props.foodLogs) {
            const ts = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
            if (ts < startOfDay || ts >= endOfDay) continue

            const timeKey = ts.getTime()
            const carbs = Number(log.netCarbs ?? 0)
            const desc = log.foodName || log.description || '(no name)'

            if (!groups.has(timeKey)) {
                groups.set(timeKey, { x: timeKey, y: 0, logs: [] })
            }

            const entry = groups.get(timeKey)
            entry.y += carbs
            entry.logs.push({
                name: log.foodName,
                quantity: log.quantity,
                isUnfinished: log.isUnfinished
            })
        }

        return Array.from(groups.values()).sort((a, b) => a.x - b.x)
    })

    function computeYBounds(points) {
        const maxY = Math.max(1, ...points.map(p => p.y))
        const roundedMax = Math.ceil(maxY / 20) * 20
        //Always at least 100 because when the y labels had unpredicated number of digits it messed up the vertical lines aligning across charts
        return { min: 0, max: Math.max(100, roundedMax) }
    }

    function handleMouseLeave() {
        window.dispatchEvent(new CustomEvent('chart-hover', {
            detail: { hide: true, source: 'foodLogs', foodLogs: null }
        }))
    }

    function handleChartHover(e) {
        if (!chartInstance) return
        const x = e?.detail?.x
        const annos = chartInstance.options.plugins?.annotation?.annotations
        if (annos?.dynamicLine != null) {
            annos.dynamicLine.value = x
            chartInstance.update('none')
        }
    }

    function buildOptions(xRange, yBounds) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
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
                            source: 'foodLogs',
                            foodLogs: {
                                logs: d.logs,
                                netCarbs: d.y
                            }
                        }
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
                        maxRotation: 0,
                        minRotation: 0,
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
                y: {
                    position: 'right',
                    min: yBounds.min,
                    max: yBounds.max,
                    beginAtZero: true,
                    grid: { display: true, color: '#888', lineWidth: 1 },
                    title: { display: true, text: 'Net Carbs' },
                    // ticks: {
                    //     display: false
                    // },

                    ticks: {
                        stepSize: 20,
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
            }
        }
    }

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')
        const pts = groupedByTimestamp.value
        const start = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const end = start + 86_400_000
        const rawBounds = computeYBounds(pts)
        const bounds = {
            min: rawBounds.min,
            max: Math.max(100, rawBounds.max)  // ✅ Enforce at least 100 here so vertical lines line up across charts
        }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: [{
                    label: 'Net Carbs',
                    data: pts,
                    //If any of the logs are unfinished, colour the bar grey
                    backgroundColor: pts.map(p => {
                        const hasUnfinished = p.logs.some(l => l?.isUnfinished)
                        return hasUnfinished
                            ? cssVarRGBA('--color-food-unfinished', 0.6)  // grey for unfinished
                            : cssVarRGBA('--color-food', 0.6)
                    }),
                    // backgroundColor: cssVarRGBA('--color-food', 0.6, '#10b981'),
                    barThickness: 10,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: '#065f46', // very dark green
                    // borderSkipped: false,
                }]
            },
            options: buildOptions({ min: start, max: end }, bounds)
        })
    }

    function updateChart() {
        if (!chartInstance) return
        const pts = groupedByTimestamp.value
        const start = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const end = start + 86_400_000
        const bounds = computeYBounds(pts)

        chartInstance.data.datasets[0].data = pts
        chartInstance.data.datasets[0].backgroundColor = pts.map(p => {
            const hasUnfinished = p.logs.some(l => l?.isUnfinished)
            return hasUnfinished
                ? cssVarRGBA('--color-food-unfinished', 0.6)
                : cssVarRGBA('--color-food', 0.6)
        })
        chartInstance.options.scales.x.min = start
        chartInstance.options.scales.x.max = end
        chartInstance.options.scales.y.min = bounds.min
        chartInstance.options.scales.y.max = Math.max(100, bounds.max)  // <- ✅ force 100 here again so that vertical lines are in alignment across charts
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

    watch([() => props.foodLogs, () => props.selectedDate], updateChart)
</script>

<template>
    <div class="chartContainer">
        <canvas ref="canvasRef" aria-label="Food chart" />
    </div>
</template>