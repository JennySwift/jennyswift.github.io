<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { DateTime } from 'luxon'
    import { getStartAndEndOfDay } from '../../helpers/dateHelpers'

    import {
        Chart, BarController, BarElement, LinearScale, TimeScale, Tooltip, Legend
    } from 'chart.js'
    import 'chartjs-adapter-luxon'
    import annotationPlugin from 'chartjs-plugin-annotation'

    Chart.register(BarController, BarElement, LinearScale, TimeScale, Tooltip, Legend, annotationPlugin)

    const props = defineProps({
        boluses: { type: Array, default: () => [] }, // [{ timestamp: Date|string|number, amount: number, ... }]
        selectedDate: { type: Date, required: true },
    })

    const canvasRef = ref(null)
    let chartInstance = null

    // Helper to grab CSS var (falls back if not set)
    function cssVar(name, fallback) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        return v || fallback
    }

    // Filter/shape as bars (x = dose time, y = amount)
    const barsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        // doses that fall within the day window
        return (props.boluses || [])
            .map(d => ({
                ts: (d.timestamp instanceof Date) ? d.timestamp : new Date(d.timestamp),
                amt: Number(d.amount ?? 0),
            }))
            .filter(d => d.ts >= startOfDay && d.ts < endOfDay && d.amt > 0)
            .sort((a, b) => a.ts - b.ts)
            .map(d => ({ x: d.ts.getTime(), y: d.amt }))
    })

    function handleMouseLeave() {
        window.dispatchEvent(new CustomEvent('chart-hover', {
            detail: { hide: true, source: 'bolus', bolusAmount: null }
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

    function computeYBounds(pts) {
        if (!pts.length) return { min: 0, max: 1 }
        const maxAmt = Math.max(0, ...pts.map(p => p.y))
        const max = Math.max(1, Math.ceil(maxAmt + 0.2))
        return { min: 0, max }
    }

    function createDataset(pts) {
        const color = cssVar('--color-bolus', '#ef4444') // fallback red-500-ish
        return {
            label: 'Bolus (U)',
            data: pts,
            type: 'bar',
            borderWidth: 0,
            borderRadius: 2,
            barPercentage: 0.95,
            categoryPercentage: 1.0,
            // Chart.js supports CSS variables as strings
            backgroundColor: color,
            barThickness: 10,
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
                    const d = chart.data.datasets[datasetIndex].data[index]
                    const xVal = d.x
                    const amount = typeof d.y === 'number' ? d.y : Number(d.amt ?? 0)

                    // move this chart’s vertical line
                    chart.options.plugins.annotation.annotations.dynamicLine.value = xVal
                    chart.update('none')

                    // broadcast hover
                    const canvasRect = chart.canvas.getBoundingClientRect()
                    const clientX = evt?.native?.clientX ?? evt.clientX
                    const px = clientX - canvasRect.left
                    window.dispatchEvent(new CustomEvent('chart-hover', {
                        detail: { x: xVal, px, source: 'bolus', bolusAmount: amount }
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
                                .toFormat('h a'),
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
                    ticks: { stepSize: 1 }, // tweak if you like
                    title: { display: true, text: 'Bolus (U)' },
                },
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

        const pts = barsForDay.value
        const dayStartMs = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
        const dayEndMs = dayStartMs + 86_400_000
        const yBounds = computeYBounds(pts)

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: { datasets: [createDataset(pts)] },
            options: buildOptions({ min: dayStartMs, max: dayEndMs }, yBounds),
        })
    }

    function updateChart() {
        if (!chartInstance) return

        const pts = barsForDay.value
        const dayStartMs = DateTime.fromJSDate(props.selectedDate).setZone('Australia/Sydney').startOf('day').toMillis()
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

    watch([() => props.selectedDate, () => props.boluses], updateChart)
</script>

<template>
    <div class="chartContainer">
        <canvas ref="canvasRef" aria-label="Bolus chart"></canvas>
    </div>
</template>