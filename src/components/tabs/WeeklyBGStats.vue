//WeeklyBGStats.vue

<script setup>
    import { ref, onMounted } from 'vue'
    import { fetchGlucoseReadingsBetween } from '../../supabase/supabaseBG'
    import { getSydneyStartOfToday, formatDayAndMonthInSydney, toInstant } from '../../helpers/dateHelpers'
    import { DateTime } from 'luxon'

    const weeklyStats = ref([])
    const loading = ref(true)



    // Compute time spent in each BG range from a list of readings
    function computeTimeInRangeFromReadings(readings) {
        if (!Array.isArray(readings) || readings.length < 2) {
            return {
                days: 0,
                timeBelow4: 0,
                timeBetween4and6: 0,
                timeBetween6and8: 0,
                timeBetween8and10: 0,
                timeAbove10: 0,
                totalMinutes: 0,
            }
        }

        let timeBelow4 = 0
        let timeBetween4and6 = 0
        let timeBetween6and8 = 0
        let timeBetween8and10 = 0
        let timeAbove10 = 0
        let totalMinutes = 0

        for (let i = 1; i < readings.length; i++) {
            const prev = readings[i - 1]
            const curr = readings[i]

            const t1 = toInstant(prev.timestamp)
            const t2 = toInstant(curr.timestamp)

            const minutes = Math.max(0, Math.round(t2.diff(t1).as('minutes')))
            totalMinutes += minutes

            const value = Number(prev.value)
            if (value < 4) timeBelow4 += minutes
            else if (value < 6) timeBetween4and6 += minutes
            else if (value < 8) timeBetween6and8 += minutes
            else if (value < 10) timeBetween8and10 += minutes
            else timeAbove10 += minutes
        }

        // Estimate number of days covered
        const first = toInstant(readings[0].timestamp).setZone('Australia/Sydney')
        const last = toInstant(readings.at(-1).timestamp).setZone('Australia/Sydney')
        const days = Math.max(1, last.diff(first, 'days').days)

        return {
            days,
            timeBelow4,
            timeBetween4and6,
            timeBetween6and8,
            timeBetween8and10,
            timeAbove10,
            totalMinutes,
        }
    }

    onMounted(async () => {
        const firstDate = new Date('2025-07-07')
        const today = getSydneyStartOfToday()
        const results = []

        for (let d = new Date(firstDate); d < today; d.setDate(d.getDate() + 7)) {
            const start = new Date(d)
            const end = new Date(d)
            end.setDate(end.getDate() + 7)

            const readings = await fetchGlucoseReadingsBetween(start, end)
            const stats = computeTimeInRangeFromReadings(readings)

            results.push({
                startDate: new Date(start),
                days: stats.days || 0,
                timeBetween4and6: stats.timeBetween4and6 || 0,
                timeBetween6and8: stats.timeBetween6and8 || 0,
                timeBetween8and10: stats.timeBetween8and10 || 0,
                timeAbove10: stats.timeAbove10 || 0,
                timeBelow4: stats.timeBelow4 || 0,
                totalMinutes: stats.totalMinutes || 0
            })
        }

        weeklyStats.value = results
        loading.value = false
    })
</script>

<template>
    <div class="weekly-bg-stats">
        <h3>Weekly BG Time in Range</h3>
        <p v-if="loading">Calculating...</p>

        <div v-if="!loading" class="weekly-stats-grid">
            <div class="grid-header">
                <div>Week Start</div>
                <div>&lt;4<br>(72)</div>
                <div>4–6<br>(72–108)</div>
                <div>6–8<br>(108–144)</div>
                <div>8–10<br>(144–180)</div>
                <div>&gt;10<br>(180)</div>
            </div>

            <div
                    v-for="week in [...weeklyStats].reverse()"
                    :key="week.startDate.toISOString()"
                    class="grid-row"
            >
                <div class="date-cell">{{ formatDayAndMonthInSydney(week.startDate) }}</div>
                <div>{{ Math.round((week.timeBelow4 / week.totalMinutes) * 100) }}%</div>
                <div>{{ Math.round((week.timeBetween4and6 / week.totalMinutes) * 100) }}%</div>
                <div>{{ Math.round((week.timeBetween6and8 / week.totalMinutes) * 100) }}%</div>
                <div>{{ Math.round((week.timeBetween8and10 / week.totalMinutes) * 100) }}%</div>
                <div>{{ Math.round((week.timeAbove10 / week.totalMinutes) * 100) }}%</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .weekly-stats-grid {
        display: grid;
        grid-template-columns: 1fr repeat(5, 80px);
        gap: 4px;
        font-size: 0.9rem;
        margin-top: 1rem;

        div {
            font-variant-numeric: tabular-nums;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            white-space: nowrap;
        }
    }

    .grid-header {
        display: contents;

        div {
            font-weight: 600;
            background: #f3f4f6;
            border-bottom: 1px solid #ccc;
            padding: 4px 8px;
            text-align: right;
            font-size: 0.8rem;
        }
    }

    .grid-row {
        display: contents;

        div {
            padding: 6px 8px;
            text-align: right;
            border-bottom: 1px solid #eee;
        }
    }
</style>