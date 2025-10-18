<script setup>
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
    import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend } from 'chart.js'
    import 'chartjs-adapter-luxon'
    import { parseAsSydneyDate, formatShortDateInSydney } from '../../helpers/dateHelpers'

    Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend)

    const props = defineProps({
        testResults: { type: Array, default: () => [] } // [{ test_date, hba1c }]
    })

    const canvasRef = ref(null)
    let chartInstance = null

    // Convert test results into Chart.js-friendly points
    const points = computed(() =>
        props.testResults
            .map(r => {
                const date = parseAsSydneyDate(r.test_date || r.testDate)
                const value = Number(r.hba1c)
                if (!date || isNaN(value)) return null
                return { x: date.getTime(), y: value }
            })
            .filter(Boolean)
    )

    function createChart() {
        if (!canvasRef.value) return
        const ctx = canvasRef.value.getContext('2d')

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'HbA1c (%)',
                        data: points.value,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 2,
                        tension: 0.2,
                        pointRadius: 3,
                        pointHoverRadius: 6
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
                            label: (ctx) => `HbA1c: ${ctx.parsed.y}%`
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'year' },
                        ticks: {
                            autoSkip: true,
                            callback: (val) => {
                                return formatShortDateInSydney(new Date(val))
                            }
                        },
                        grid: { color: '#eee' }
                    },
                    y: {
                        beginAtZero: false,
                        grid: { color: '#f2f2f2' },
                        title: { display: true, text: 'HbA1c (%)' }
                    }
                }
            }
        })
    }

    function updateChart() {
        if (!chartInstance) return
        chartInstance.data.datasets[0].data = points.value
        chartInstance.update('none')
    }

    onMounted(createChart)
    onBeforeUnmount(() => chartInstance?.destroy())
    watch(() => props.testResults, updateChart, { deep: true })
</script>

<template>
    <div class="chartContainer">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
    .chartContainer {
        width: 100%;
        height: 260px;
    }
</style>