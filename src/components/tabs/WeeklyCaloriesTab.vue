//WeeklyCaloriesTab.vue
<script setup>
    import {computed} from 'vue'
    import {DateTime} from 'luxon'
    import {parseAsSydneyDate, toInstant} from '../../helpers/dateHelpers'

    const props = defineProps({
        // [{ timestamp, calories }]  (timestamp = Date | ISO string | epoch)
        foodLogs: {type: Array, default: () => []},

        // 'monday' (ISO default) or 'sunday'
        weekStartsOn: {type: String, default: 'monday'},

        // Timezone to align days with
        tz: {type: String, default: 'Australia/Sydney'},

        weights: {type: Array, default: () => []},

        dailyActivity: {type: Array, default: () => []}
    })

    const LB_PER_KG = 2.2046226218

    function averageActivityForRange(start, end) {
        let sumActive = 0, nActive = 0
        let sumRest = 0, nRest = 0
        let sumTotal = 0, nTotal = 0
        let sumMins = 0, nMins = 0

        for (const r of props.dailyActivity) {
            const dt = DateTime.fromFormat(r.sydney_date, 'yyyy-LL-dd', {zone: props.tz})
            if (!dt.isValid) continue
            if (dt < start || dt >= end) continue

            const a = Number(r.active_calories)
            if (Number.isFinite(a)) {
                sumActive += a;
                nActive += 1
            }

            const rest = Number(r.resting_calories)
            if (Number.isFinite(rest)) {
                sumRest += rest;
                nRest += 1
            }

            const tot = Number(r.total_calories)
            if (Number.isFinite(tot)) {
                sumTotal += tot;
                nTotal += 1
            }

            const mins = Number(r.exercise_minutes)
            if (Number.isFinite(mins)) {
                sumMins += mins;
                nMins += 1
            }
        }

        return {
            avgActive: nActive ? (sumActive / nActive) : null,
            avgResting: nRest ? (sumRest / nRest) : null,
            avgTotalEnergy: nTotal ? (sumTotal / nTotal) : null,
            avgExerciseMin: nMins ? (sumMins / nMins) : null,
        }
    }

    function averageWeightForRange(start, end) {
        let sum = 0
        let count = 0
        for (const w of props.weights) {
            const js = parseAsSydneyDate(w.timestamp)
            const dt = DateTime.fromJSDate(js, {zone: props.tz})
            if (!dt.isValid) continue
            if (dt >= start && dt < end) {
                const kg = Number(w.value)
                if (Number.isFinite(kg)) {
                    sum += kg;
                    count += 1
                }
            }
        }
        return count ? (sum / count) : null
    }

    function startOfWeek(dt, mode) {
        if (mode === 'monday') return dt.startOf('week') // ISO Monday
        // Sunday start: shift back to Sunday (weekday: Mon=1..Sun=7; we remap to 0..6 with Sun=0)
        const weekday0 = dt.weekday % 7
        return dt.minus({days: weekday0}).startOf('day')
    }

    function endOfWeekFrom(start) {
        return start.plus({days: 7})
    }

    function weekLabel(start, zone) {
        const end = endOfWeekFrom(start).minus({seconds: 1})
        return `${start.setZone(zone).toFormat('ccc d LLL')} – ${end.setZone(zone).toFormat('ccc d LLL')}`
    }

    // 1) Sum calories per calendar day
    const caloriesByDay = computed(() => {
        const map = new Map()
        for (const f of props.foodLogs) {
            const js = parseAsSydneyDate(f.timestamp)
            const dt = DateTime.fromJSDate(js, {zone: props.tz})

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
            .map(([k, v]) => ({day: k, kcal: v}))
            .sort((a, b) => a.day.localeCompare(b.day))
    })


    // 2) Build rows for all weeks from first to last day we have data
    const rows = computed(() => {
        const keys = [...caloriesByDay.value.keys()].sort()
        if (!keys.length) return []

        const first = DateTime.fromFormat(keys[0], 'yyyy-LL-dd', {zone: props.tz})
        const last = DateTime.fromFormat(keys[keys.length - 1], 'yyyy-LL-dd', {zone: props.tz})

        let cursor = startOfWeek(first, props.weekStartsOn)
        const stop = endOfWeekFrom(startOfWeek(last, props.weekStartsOn))

        const today = DateTime.now().setZone(props.tz).startOf('day')
        const out = []

        while (cursor < stop) {
            const weekStart = cursor
            const weekEnd = endOfWeekFrom(cursor) // exclusive
            const dayKeys = Array.from({length: 7}, (_, i) =>
                weekStart.plus({days: i}).toFormat('yyyy-LL-dd')
            )

            const perDay = dayKeys.map(k => caloriesByDay.value.get(k) ?? 0)
            const weekTotal = perDay.reduce((s, v) => s + v, 0)

            // Is this the current week (contains today)?
            const isCurrentWeek = weekStart <= today && today < weekEnd

            // For current week, divide by number of days WITH data (>0). Otherwise divide by 7.
            const daysWithData = perDay.filter(v => v > 0).length
            const denom = isCurrentWeek ? (daysWithData || 1) : 7
            const avgPerDay = weekTotal / denom
            const avgWeight = averageWeightForRange(weekStart, weekEnd)
            const avgWeightLb = avgWeight != null ? avgWeight * LB_PER_KG : null
            const act = averageActivityForRange(weekStart, weekEnd)

            out.push({
                weekStart,
                weekEnd,
                label: weekLabel(weekStart, props.tz),
                total: weekTotal,
                avgPerDay,
                avgWeight,
                avgWeightLb,
                avgActive: act.avgActive,
                avgResting: act.avgResting,
                avgTotalEnergy: act.avgTotalEnergy,
                avgExerciseMin: act.avgExerciseMin,
            })

            cursor = weekEnd
        }

        // compute deltas vs previous week (chronological order)
        for (let i = 0; i < out.length; i++) {
            const prev = i > 0 ? out[i - 1] : null
            out[i].deltaAvg = prev ? out[i].avgPerDay - prev.avgPerDay : null
            out[i].deltaTotal = prev ? out[i].total - prev.total : null
            out[i].deltaWeight = (prev && out[i].avgWeight != null && prev.avgWeight != null)
                ? out[i].avgWeight - prev.avgWeight
                : null
            out[i].deltaWeightLb = out[i].deltaWeight != null ? out[i].deltaWeight * LB_PER_KG : null

            out[i].deltaActive = (prev && out[i].avgActive != null && prev.avgActive != null)
                ? out[i].avgActive - prev.avgActive : null

            out[i].deltaResting = (prev && out[i].avgResting != null && prev.avgResting != null)
                ? out[i].avgResting - prev.avgResting : null

            out[i].deltaTotalEnergy = (prev && out[i].avgTotalEnergy != null && prev.avgTotalEnergy != null)
                ? out[i].avgTotalEnergy - prev.avgTotalEnergy : null

            out[i].deltaExerciseMin = (prev && out[i].avgExerciseMin != null && prev.avgExerciseMin != null)
                ? out[i].avgExerciseMin - prev.avgExerciseMin : null
        }

        // show newest first
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
                <th class="num">Avg active (kcal/day)</th>
                <th class="num">Avg weight (kg)</th>
                <th class="num">Avg weight (lb)</th>

                <!--<th class="num">Avg resting kcal/day</th>-->
                <!--<th class="num">Avg total expenditure (kcal/day)</th>-->
                <!--<th class="num">Avg exercise (min/day)</th>-->
            </tr>
            </thead>
            <tbody>
            <tr v-for="w in rows" :key="w.weekStart.toISO()">
                <td>{{ w.label }}</td>
                <td class="num">
                    {{ Math.round(w.avgPerDay).toLocaleString('en-AU') }}
                    <span v-if="w.deltaAvg != null" :class="['delta', w.deltaAvg >= 0 ? 'up' : 'down']">
        {{ w.deltaAvg >= 0 ? '▲' : '▼' }}
        ({{ Math.abs(Math.round(w.deltaAvg)).toLocaleString('en-AU') }})
      </span>
                </td>

                <td class="num">
                    {{ Math.round(w.total).toLocaleString('en-AU') }}
                    <span v-if="w.deltaTotal != null" :class="['delta', w.deltaTotal >= 0 ? 'up' : 'down']">
        {{ w.deltaTotal >= 0 ? '▲' : '▼' }}
        ({{ Math.abs(Math.round(w.deltaTotal)).toLocaleString('en-AU') }})
      </span>
                </td>

                <td class="num">
                    {{ w.avgActive != null ? Math.round(w.avgActive).toLocaleString('en-AU') : '—' }}
                    <span
                            v-if="w.deltaActive != null"
                            :class="['delta', 'neutral']">
    {{ w.deltaActive >= 0 ? '▲' : '▼' }}
    ({{ Math.abs(Math.round(w.deltaActive)).toLocaleString('en-AU') }})
  </span>
                </td>

                <td class="num">
                    {{ w.avgWeight != null ? w.avgWeight.toFixed(2) : '—' }}
                    <span v-if="w.deltaWeight != null" :class="['delta', w.deltaWeight >= 0 ? 'up' : 'down']">
        {{ w.deltaWeight >= 0 ? '▲' : '▼' }}
        ({{ Math.abs(w.deltaWeight).toFixed(2) }})
      </span>
                </td>

                <td class="num">
                    {{ w.avgWeightLb != null ? w.avgWeightLb.toFixed(2) : '—' }}
                    <span v-if="w.deltaWeightLb != null" :class="['delta', w.deltaWeightLb >= 0 ? 'up' : 'down']">
        {{ w.deltaWeightLb >= 0 ? '▲' : '▼' }}
        ({{ Math.abs(w.deltaWeightLb).toFixed(2) }})
      </span>
                </td>





                <!--<td class="num">-->
                    <!--{{ w.avgResting != null ? Math.round(w.avgResting).toLocaleString('en-AU') : '—' }}-->
                    <!--<span v-if="w.deltaResting != null" :class="['delta', w.deltaResting >= 0 ? 'up' : 'down']">-->
    <!--{{ w.deltaResting >= 0 ? '▲' : '▼' }}-->
    <!--({{ Math.abs(Math.round(w.deltaResting)).toLocaleString('en-AU') }})-->
  <!--</span>-->
                <!--</td>-->

                <!--<td class="num">-->
                    <!--{{ w.avgTotalEnergy != null ? Math.round(w.avgTotalEnergy).toLocaleString('en-AU') : '—' }}-->
                    <!--<span v-if="w.deltaTotalEnergy != null" :class="['delta', w.deltaTotalEnergy >= 0 ? 'up' : 'down']">-->
    <!--{{ w.deltaTotalEnergy >= 0 ? '▲' : '▼' }}-->
    <!--({{ Math.abs(Math.round(w.deltaTotalEnergy)).toLocaleString('en-AU') }})-->
  <!--</span>-->
                <!--</td>-->

                <!--<td class="num">-->
                    <!--{{ w.avgExerciseMin != null ? Math.round(w.avgExerciseMin).toLocaleString('en-AU') : '—' }}-->
                    <!--<span v-if="w.deltaExerciseMin != null" :class="['delta', w.deltaExerciseMin >= 0 ? 'down' : 'up']">-->
    <!--{{ w.deltaExerciseMin >= 0 ? '▼' : '▲' }}-->
    <!--({{ Math.abs(Math.round(w.deltaExerciseMin)).toLocaleString('en-AU') }})-->
  <!--</span>-->
                <!--</td>-->
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
    .weekly-table {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th, td {
        padding: 8px 10px;
        border-bottom: 1px solid #e5e7eb;
    }

    th {
        text-align: left;
        font-weight: 700;
        color: #374151;
    }

    .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    .empty {
        text-align: center;
        color: #6b7280;
    }

    .delta {
        margin-left: 6px;
        font-weight: 600;
    }

    .delta.up {
        color: #dc2626;
    }

    /* red when value went up */
    .delta.down {
        color: #16a34a;
    }
    .delta.neutral {
        color: #6b7280; /* Tailwind’s gray-500 */
    }

</style>