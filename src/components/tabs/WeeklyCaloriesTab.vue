//WeeklyCaloriesTab.vue
<script setup>
    import { computed } from 'vue'
    import { DateTime } from 'luxon'
    import { parseAsSydneyDate, toInstant } from '../../helpers/dateHelpers'

    const props = defineProps({
        // [{ timestamp, calories }]  (timestamp = Date | ISO string | epoch)
        foodLogs: { type: Array, default: () => [] },

        // 'monday' (ISO default) or 'sunday'
        weekStartsOn: { type: String, default: 'monday' },

        // Timezone to align days with
        tz: { type: String, default: 'Australia/Sydney' },
    })

    function startOfWeek(dt, mode) {
        if (mode === 'monday') return dt.startOf('week') // ISO Monday
        // Sunday start: shift back to Sunday (weekday: Mon=1..Sun=7; we remap to 0..6 with Sun=0)
        const weekday0 = dt.weekday % 7
        return dt.minus({ days: weekday0 }).startOf('day')
    }

    function endOfWeekFrom(start) {
        return start.plus({ days: 7 })
    }

    function weekLabel(start, zone) {
        const end = endOfWeekFrom(start).minus({ seconds: 1 })
        return `${start.setZone(zone).toFormat('ccc d LLL')} – ${end.setZone(zone).toFormat('ccc d LLL')}`
    }

    // 1) Sum calories per calendar day
    const caloriesByDay = computed(() => {
        const map = new Map()
        for (const f of props.foodLogs) {
            const js = parseAsSydneyDate(f.timestamp)
            const dt = DateTime.fromJSDate(js, { zone: props.tz })

            if (!dt?.isValid) continue
            const key = dt.toFormat('yyyy-LL-dd')
            const kcals = Number(f.calories ?? f.kcal ?? 0)
            if (!Number.isFinite(kcals)) continue
            map.set(key, (map.get(key) ?? 0) + kcals)
        }
        return map
    })

    const debugDays = computed(() => {
        // Return a sorted array of { day: 'yyyy-LL-dd', kcal } so you can eyeball them.
        return [...caloriesByDay.value.entries()]
            .map(([k, v]) => ({ day: k, kcal: v }))
            .sort((a, b) => a.day.localeCompare(b.day))
    })

    // 2) Build rows for all weeks from first to last day we have data
    const rows = computed(() => {
        const keys = [...caloriesByDay.value.keys()].sort()
        if (!keys.length) return []

        const first = DateTime.fromFormat(keys[0], 'yyyy-LL-dd', { zone: props.tz })
        const last  = DateTime.fromFormat(keys[keys.length - 1], 'yyyy-LL-dd', { zone: props.tz })

        let cursor = startOfWeek(first, props.weekStartsOn)
        const stop  = endOfWeekFrom(startOfWeek(last, props.weekStartsOn))

        const today = DateTime.now().setZone(props.tz).startOf('day')
        const out = []

        while (cursor < stop) {
            const weekStart = cursor
            const weekEnd   = endOfWeekFrom(cursor) // exclusive
            const dayKeys = Array.from({ length: 7 }, (_, i) =>
                weekStart.plus({ days: i }).toFormat('yyyy-LL-dd')
            )

            const perDay = dayKeys.map(k => caloriesByDay.value.get(k) ?? 0)
            const weekTotal = perDay.reduce((s, v) => s + v, 0)

            // Is this the current week (contains today)?
            const isCurrentWeek = weekStart <= today && today < weekEnd

            // For current week, divide by number of days WITH data (>0). Otherwise divide by 7.
            const daysWithData = perDay.filter(v => v > 0).length
            const denom = isCurrentWeek ? (daysWithData || 1) : 7
            const avgPerDay = weekTotal / denom

            out.push({
                weekStart,
                weekEnd,
                label: weekLabel(weekStart, props.tz),
                total: weekTotal,
                avgPerDay,
            })

            cursor = weekEnd
        }

        return out.reverse()
    })
</script>

<template>
    <div class="weekly-table">
        <table>
            <thead>
            <tr>
                <th>Week</th>
                <th class="num">Avg kcal/day</th>
                <th class="num">Total kcal</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="w in rows" :key="w.weekStart.toISO()">
                <td>{{ w.label }}</td>
                <td class="num">{{ Math.round(w.avgPerDay).toLocaleString('en-AU') }}</td>
                <td class="num">{{ Math.round(w.total).toLocaleString('en-AU') }}</td>
            </tr>
            <tr v-if="!rows.length">
                <td colspan="3" class="empty">No data</td>
            </tr>
            </tbody>
        </table>

        <!-- Debug: remove later -->
        <!--<div style="margin-top:8px; font-size:12px; color:#374151;">-->
            <!--<strong>Daily totals used:</strong>-->
            <!--<div v-for="d in debugDays" :key="d.day">-->
                <!--{{ d.day }} — {{ Math.round(d.kcal).toLocaleString() }} kcal-->
            <!--</div>-->
        <!--</div>-->
    </div>
</template>

<style scoped>
    .weekly-table { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
    th { text-align: left; font-weight: 700; color: #374151; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .empty { text-align: center; color: #6b7280; }
</style>