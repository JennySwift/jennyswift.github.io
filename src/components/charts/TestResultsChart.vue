//TestResultsChart.vue
<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend } from 'chart.js'
    import 'chartjs-adapter-luxon'
    import { parseAsSydneyDate, formatShortDateInSydney } from '../../helpers/dateHelpers'

    Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend)

    const props = defineProps({
        testResults: { type: Array, default: () => [] }, // [{ test_date, hba1c }],
        metricKey:   { type: String, required: true },
        label:       { type: String, required: true }
    })

    const canvasRef = ref(null)
    let chartInstance = null

    const xExtent = computed(() => {
        const xs = points.value.map(p => p.x)
        if (!xs.length) return null
        return { min: Math.min(...xs), max: Math.max(...xs) }
    })

    const yExtent = computed(() => {
        const ys = points.value.map(p => p.y).filter(v => Number.isFinite(v))
        if (!ys.length) return null
        const min = Math.min(...ys)
        const max = Math.max(...ys)
        const padTop = Math.max(1, (max - min) * 0.1) // a little headroom only on top
        return {
            min: Math.max(0, min),     // clamp at 0 → no negative ticks for positive labs
            max: max + padTop
        }
    })

    const points = computed(() => {
        const validPoints = (props.testResults ?? [])
            .map(r => {
                const date = parseAsSydneyDate(r.test_date || r.testDate)
                const raw = r?.[props.metricKey]

                // Skip if no date or no value provided
                if (!date) return null
                if (raw === null || raw === undefined || raw === '') return null

                // Parse number without coercing null/'' to 0
                const value = typeof raw === 'number' ? raw : parseFloat(String(raw))
                if (!Number.isFinite(value)) return null

                return { x: date.getTime(), y: value }
            })
            .filter(Boolean)
            .sort((a, b) => a.x - b.x)

        console.log(`[TestResultsChart] ${props.metricKey} data:`, validPoints)
        return validPoints
    })

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: props.label,
                        data: points.value,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 2,
                        tension: 0.2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        spanGaps: true,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const t = items?.[0]?.parsed?.x
                                return t ? formatShortDateInSydney(new Date(t)) : ''
                            },
                            label: (ctx) => `${props.label}: ${ctx.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'year' },
                        ticks: {
                            autoSkip: true,
                            callback: (val) => new Date(val).getFullYear().toString()
                        },
                        grid: { color: '#eee' },
                        min: xExtent.value?.min,
                        max: xExtent.value?.max
                    },

                    y: {
                        beginAtZero: false,
                        grid: { color: '#f2f2f2' },
                        title: { display: true, text: props.label },
                        suggestedMin: yExtent.value?.min,
                        suggestedMax: yExtent.value?.max
                    }

                }
            }
        })
    }

    function updateChart() {
        if (!chartInstance) return
        chartInstance.data.datasets[0].data = points.value
        chartInstance.data.datasets[0].label = props.label
        chartInstance.options.scales.y.title.text = props.label

        // X range = first→last actual point
        chartInstance.options.scales.x.min = xExtent.value?.min
        chartInstance.options.scales.x.max = xExtent.value?.max

        // Y range = no padding below 0, small padding on top
        chartInstance.options.scales.y.suggestedMin = yExtent.value?.min
        chartInstance.options.scales.y.suggestedMax = yExtent.value?.max
        chartInstance.update('none')
    }

    onMounted(createChart)
    onBeforeUnmount(() => chartInstance?.destroy())
    watch([() => props.testResults, () => props.metricKey, () => props.label], updateChart, { deep: true })
</script>

<template>
    <div class="chartContainer">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
    .chartContainer {
        width: 100%;
        height: 100px;
    }
</style>