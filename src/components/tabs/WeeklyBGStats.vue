//WeeklyBGStats.vue

<script setup>
    import { ref, onMounted } from 'vue'
    import { fetchGlucoseReadingsBetween } from '../../supabase/supabaseBG'
    import { getSydneyStartOfToday, formatDateInSydney, toInstant } from '../../helpers/dateHelpers'
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

        <table v-else class="weekly-stats-table">
            <thead>
            <tr>
                <th>Week Start</th>
                <th>&lt;4<br>(72)</th>
                <th>4–6<br>(72–108)</th>
                <th>6–8<br>(108–144)</th>
                <th>8–10<br>(144–180)</th>
                <th>&gt;10<br>(180)</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="week in [...weeklyStats].reverse()" :key="week.startDate.toISOString()">
                <td>{{ formatDateInSydney(week.startDate).replace(/^Monday /, '').replace(/,? 2025$/, '') }}</td>
                <td>{{ Math.round((week.timeBelow4 / week.totalMinutes) * 100) }}%</td>
                <td>{{ Math.round((week.timeBetween4and6 / week.totalMinutes) * 100) }}%</td>
                <td>{{ Math.round((week.timeBetween6and8 / week.totalMinutes) * 100) }}%</td>
                <td>{{ Math.round((week.timeBetween8and10 / week.totalMinutes) * 100) }}%</td>
                <td>{{ Math.round((week.timeAbove10 / week.totalMinutes) * 100) }}%</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped lang="scss">
    .weekly-stats-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        margin-top: 1rem;
    }

    .weekly-stats-table th,
    .weekly-stats-table td {
        padding: 6px 10px;
        border: 1px solid #ccc;
        text-align: center;
    }

    .weekly-stats-table thead th {
        background-color: #f3f4f6;
        font-weight: 600;
        font-size: 0.85rem;
        white-space: nowrap;
    }

    .weekly-stats-table tbody tr:nth-child(even) {
        background-color: #fafafa;
    }

    .weekly-stats-table td:first-child {
        text-align: left;
        font-weight: 500;
    }
</style>