<script setup>
    import { onMounted, onBeforeUnmount, ref } from 'vue'

    // Chart.js + plugins
    import {
        Chart,
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        TimeScale,
        Tooltip,
        Legend,
        Filler
    } from 'chart.js'
    import annotationPlugin from 'chartjs-plugin-annotation'
    import datalabels from 'chartjs-plugin-datalabels'
    import 'chartjs-adapter-date-fns'

    // Register once per app
    Chart.register(
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        TimeScale,
        Tooltip,
        Legend,
        Filler,
        annotationPlugin,
        datalabels
    )

    const canvasEl = ref(null)
    let chart // hold instance so we can destroy on unmount

    onMounted(() => {
        const ctx = canvasEl.value.getContext('2d')

        // Minimal working example data (replace with your real data next)
        const now = Date.now()
        const demo = Array.from({ length: 24 }, (_, i) => ({
            x: now - (24 - i) * 60 * 60 * 1000,
            y: 80 + Math.round(Math.sin(i / 3) * 20)
        }))

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'BG',
                        data: demo,
                        fill: false,
                        borderWidth: 2,
                        borderColor: '#2d6cdf',
                        pointRadius: 0,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                parsing: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'hour' },
                        ticks: { maxRotation: 0 },
                        grid: { color: '#e5e7eb' },
                        ticks: { color: '#111111', maxRotation: 0 },
                    },
                    y: {
                        title: { display: true, text: 'mg/dL' },
                        grid: { color: '#e5e7eb' },
                        ticks: { color: '#111111' },
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { intersect: false, mode: 'index' },
                    datalabels: { display: false },
                    annotation: { annotations: {} }
                }
            }
        })
    })

    onBeforeUnmount(() => {
        if (chart) {
            chart.destroy()
            chart = null
        }
    })
</script>

<template>
    <div style="height: 300px;">
        <canvas ref="canvasEl"></canvas>
    </div>
</template>