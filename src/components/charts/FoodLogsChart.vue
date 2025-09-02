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
                quantity: log.quantity
            })
        }

        return Array.from(groups.values()).sort((a, b) => a.x - b.x)
    })

    function computeYBounds(points) {
        const max = Math.max(1, Math.ceil(Math.max(...points.map(p => p.y)) + 1))
        return { min: 0, max }
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
                    time: { unit: 'hour', displayFormats: { hour: 'h:mm a' } },
                    ticks: {
                        source: 'auto',
                        callback: val => DateTime.fromMillis(Number(val)).setZone('Australia/Sydney').toFormat('h a')
                    },
                    grid: { color: '#ddd', lineWidth: 1 },
                    min: xRange.min,
                    max: xRange.max
                },
                y: {
                    min: yBounds.min,
                    max: yBounds.max,
                    beginAtZero: true,
                    grid: { color: '#eee' },
                    title: { display: true, text: 'Net Carbs (g)' }
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
        const bounds = computeYBounds(pts)

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: [{
                    label: 'Net Carbs',
                    data: pts,
                    backgroundColor: cssVarRGBA('--color-food', 0.6, '#10b981'),
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
        chartInstance.options.scales.x.min = start
        chartInstance.options.scales.x.max = end
        chartInstance.options.scales.y.min = bounds.min
        chartInstance.options.scales.y.max = bounds.max
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