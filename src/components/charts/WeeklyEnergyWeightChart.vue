<!-- src/components/charts/WeeklyEnergyWeightChart.vue -->
<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { DateTime } from 'luxon'
    import { cssVarToRgba } from '../../helpers/colorHelpers'

    import {
        Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler
    } from 'chart.js'
    import 'chartjs-adapter-luxon'
    import annotationPlugin from 'chartjs-plugin-annotation'

    Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler, annotationPlugin)

    const props = defineProps({
        // Expect rows like your WeeklyCaloriesTab: { weekStart: DateTime, avgPerDay, avgActive, avgWeight }
        rows: { type: Array, default: () => [] },
        tz:   { type: String, default: 'Australia/Sydney' }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    // X values (ms) — keep Luxon across the wire, convert here
    const labelsMs = computed(() => props.rows.map(w => (w?.weekStart?.toMillis?.() ?? null)).filter(v => v !== null))

    // Series — spanGaps so nulls don't draw
    const seriesCalories = computed(() =>
        props.rows.map(w => (Number.isFinite(w?.avgPerDay) ? Math.round(w.avgPerDay) : null))
    )
    const seriesActive = computed(() =>
        props.rows.map(w => (Number.isFinite(w?.avgActive) ? Math.round(w.avgActive) : null))
    )
    const seriesWeightKg = computed(() =>
        props.rows.map(w => (Number.isFinite(w?.avgWeight) ? Number(w.avgWeight) : null))
    )

    function createDatasets() {
        return [
            {
                label: 'Avg Calories Consumed Per Day',
                data: labelsMs.value.map((x, i) => ({ x, y: seriesCalories.value[i] })),
                spanGaps: true,
                pointRadius: 2,
                pointHoverRadius: 6,
                pointStyle: 'circle',
                borderWidth: 2,
                backgroundColor: cssVarToRgba('--color-food', 0.18),
                borderColor: cssVarToRgba('--color-food', 0.95),
                fill: true,
                yAxisID: 'kcal',
                order: 2
            },
            {
                label: 'Avg Active Calories Per Day',
                data: labelsMs.value.map((x, i) => ({ x, y: seriesActive.value[i] })),
                spanGaps: true,
                pointRadius: 2,
                pointHoverRadius: 6,
                pointStyle: 'circle',
                borderWidth: 2,
                backgroundColor: cssVarToRgba('--color-workout', 0.08),
                borderColor: cssVarToRgba('--color-workout', 0.95),
                fill: true, // outline only for clearer contrast
                yAxisID: 'kcal',
                order: 3
            },
            {
                label: 'Avg Weight',
                data: labelsMs.value.map((x, i) => ({ x, y: seriesWeightKg.value[i] })),
                spanGaps: true,
                pointRadius: 3,
                pointHoverRadius: 7,
                pointStyle: 'rectRot',           // diamond markers
                borderWidth: 3,                  // thicker line
                borderDash: [8, 4],              // dashed pattern
                backgroundColor: 'rgba(0,0,0,0)',// no fill
                borderColor: '#111111',          // near-black (dark grey)
                fill: false,
                yAxisID: 'kg',
                order: 1                         // drawn on top
            }
        ]
    }

    function buildOptions() {
        // derive x-range from data
        const xs = labelsMs.value
        const minX = xs.length ? Math.min(...xs) : undefined
        const maxX = xs.length ? Math.max(...xs) : undefined

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            onHover: (evt, _actives, chart) => {
                const els = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: false }, false)
                if (els.length) {
                    const { datasetIndex, index } = els[0]
                    const xVal = chart.data.datasets[datasetIndex].data[index].x

                    // move vertical hover line
                    chart.options.plugins.annotation.annotations.dynamicLine.value = xVal
                    chart.update('none')

                    // broadcast (matches your Basal/Bolus pattern)
                    const canvasRect = chart.canvas.getBoundingClientRect()
                    const clientX = evt?.native?.clientX ?? evt.clientX
                    const px = clientX - canvasRect.left
                    window.dispatchEvent(new CustomEvent('chart-hover', {
                        detail: { x: xVal, px, source: 'weekly-ew' }
                    }))
                }
            },
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        title(items) {
                            const t = items?.[0]?.parsed?.x
                            if (!t) return ''
                            const start = DateTime.fromMillis(Number(t)).setZone(props.tz)
                            const end = start.plus({ days: 6 })
                            return `${start.toFormat('ccc d LLL')} – ${end.toFormat('ccc d LLL')}`
                        },
                        label(ctx) {
                            const dsLabel = ctx.dataset?.label ?? ''
                            const val = ctx.parsed?.y ?? null
                            return val != null ? `${dsLabel}: ${val.toLocaleString()}`
                                : `${dsLabel}: —`
                        }
                    }
                },
                annotation: {
                    annotations: {
                        dynamicLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: null,
                            borderColor: 'rgba(100, 100, 100, 0.85)',
                            borderWidth: 2,
                            display: ctx => ctx.chart.options.plugins.annotation.annotations.dynamicLine.value !== null
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'week', displayFormats: { week: 'dd LLL' } },
                    ticks: {
                        source: 'auto',
                        autoSkip: true,
                        callback: (val) =>
                            DateTime.fromMillis(Number(val)).setZone(props.tz).toFormat('dd LLL'),
                    },
                    grid: { color: '#ddd', lineWidth: 1 },
                    min: minX,
                    max: maxX
                },
                kcal: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: '#eee', lineWidth: 1 },
                    title: { display: true, text: 'kcal / day' },
                    beginAtZero: true
                },
                kg: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'kg' }
                }
            }
        }
    }

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: createDatasets() },
            options: buildOptions()
        })
    }

    function updateChart() {
        if (!chartInstance) return
        chartInstance.data.datasets = createDatasets()

        const xs = labelsMs.value
        const minX = xs.length ? Math.min(...xs) : undefined
        const maxX = xs.length ? Math.max(...xs) : undefined
        chartInstance.options.scales.x.min = minX
        chartInstance.options.scales.x.max = maxX

        chartInstance.update('none')
    }

    onMounted(createChart)
    onBeforeUnmount(() => { chartInstance?.destroy(); chartInstance = null })
    watch([() => props.rows, () => props.tz], updateChart, { deep: true })
</script>

<template>
    <div class="chartContainer" aria-label="Weekly calories, active energy, and weight">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
    .chartContainer {
        width: 100%;
        height: 280px;
    }
</style>