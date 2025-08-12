<script setup>
    import { onMounted, onBeforeUnmount, ref } from 'vue'
    import { fetchDashboardData } from '../helpers/dataService'

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

    onMounted(async () => {
        const ctx = canvasEl.value.getContext('2d')

        // Load your real dashboard JSON
        // Load your real dashboard JSON
        let points = []
        try {
            const data = await fetchDashboardData()
            const readings = Array.isArray(data?.glucoseReadings) ? data.glucoseReadings : []

            console.log('[BgChart:onMounted] sample reading:', readings[0])

            points = readings
                .map(r => {
                    // Timestamps we might see
                    const t =
                        r.timestamp ?? r.time ?? r.date ?? r.datetime ?? r.t ?? r.ts

                            // Values we might see
                            let y =
                            r.mgdl ?? r.mg ?? r.value ?? r.bg ?? r.sgv ?? r.glucose

                    // Handle nested shapes like { value: { mgdl: 123 } }
                    if (y == null && r.value && typeof r.value === 'object') {
                        y = r.value.mgdl ?? r.value.bg ?? r.value.v ?? null
                    }

                    if (!t || y == null) return null

                    const x = typeof t === 'number' ? new Date(t) : new Date(t)
                    return { x, y: Number(y) }
                })
                .filter(Boolean)
                .sort((a, b) => a.x - b.x)

            console.log('[BgChart:onMounted] mapped points:', points.length)
        } catch (err) {
            console.error('[BgChart:onMounted] fetch failed:', err)
        }

        // Fallback if nothing loaded (keeps UI working)
        if (!points.length) {
            const now = Date.now()
            points = Array.from({ length: 24 }, (_, i) => ({
                x: now - (24 - i) * 60 * 60 * 1000,
                y: 80 + Math.round(Math.sin(i / 3) * 20)
            }))
            console.warn('[BgChart:onMounted] using demo data (0 real points)')
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'BG',
                        data: points,
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
                        grid: { color: '#e5e7eb' },
                        ticks: { color: '#111111', maxRotation: 0 }
                    },
                    y: {
                        title: { display: true, text: 'BG' },
                        grid: { color: '#e5e7eb' },
                        ticks: { color: '#111111' }
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