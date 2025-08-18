<script setup>
    import { ref, computed } from 'vue'
    import { DateTime } from 'luxon'
    import { parseAsSydneyDate } from '../../helpers/dateHelpers'

    // Props: pass in your exported basal entries and, optionally, pumpUploadTime
    const props = defineProps({
        basalEntries: { type: Array, default: () => [] },
        selectedDate: { type: [Date, String, Number], required: true },
    })

    // Core: compute totals per hour of day (0–23), in insulin units
    const totalsByHour = computed(() => {
        const totals = new Array(24).fill(0)

        // Selected day window in Australia/Sydney
        const base = props.selectedDate instanceof Date
            ? props.selectedDate
            : parseAsSydneyDate(props.selectedDate)
        let dayStart = DateTime.fromJSDate(base, { zone: 'Australia/Sydney' }).startOf('day')
        const dayEnd = dayStart.plus({ days: 1 })

        for (const e of props.basalEntries || []) {
            const jsStart = e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime)
            const jsEnd   = e.endTime   ? (e.endTime instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null
            if (!jsStart || !jsEnd || jsEnd <= jsStart) continue

            const ratePerHour = Number(e.rate) // U/h
            if (!Number.isFinite(ratePerHour) || ratePerHour <= 0) continue

            // Convert to Sydney and CLAMP to [dayStart, dayEnd)
            let cur = DateTime.fromJSDate(jsStart, { zone: 'Australia/Sydney' })
            let end = DateTime.fromJSDate(jsEnd,   { zone: 'Australia/Sydney' })

            if (end <= dayStart || cur >= dayEnd) continue // no overlap with selected day
            if (cur < dayStart) cur = dayStart
            if (end > dayEnd)   end = dayEnd

            // Walk hour buckets within the clamped range
            while (cur < end) {
                const bucketEnd = cur.startOf('hour').plus({ hours: 1 })
                const sliceEnd = end < bucketEnd ? end : bucketEnd

                const seconds = Math.max(0, sliceEnd.toSeconds() - cur.toSeconds())
                if (seconds > 0) {
                    const hourIdx = cur.hour // 0..23
                    totals[hourIdx] += ratePerHour * (seconds / 3600)
                }
                cur = sliceEnd
            }
        }

        return totals.map(v => Math.round(v * 1000) / 1000)
    })

    // Build rows for display: ["12:00 AM – 1:00 AM", value]
    const rows = computed(() => {
        const out = []
        for (let h = 0; h < 24; h++) {
            const start = DateTime.local().setZone('Australia/Sydney').startOf('day').plus({ hours: h })
            const end = start.plus({ hours: 1 })
            out.push({
                hour: h,
                label: `${start.toFormat('h:mm a')} – ${end.toFormat('h:mm a')}`,
                units: totalsByHour.value[h],
            })
        }
        return out
    })

    // Summary
    const totalPerDay = computed(() => totalsByHour.value.reduce((a, b) => a + b, 0))
</script>

<template>
    <section class="basal-by-hour">
        <h3 class="title">Basal Delivered by Hour</h3>

        <div class="summary">
            <div><strong>Total basal for the day:</strong> {{ totalPerDay.toFixed(2) }} U</div>
        </div>

        <div class="table-wrap">
            <table class="hour-table">
                <thead>
                <tr>
                    <th>Hour</th>
                    <th>Units</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="r in rows" :key="r.hour">
                    <td class="hour-label">{{ r.label }}</td>
                    <td class="units">{{ r.units.toFixed(3) }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<style scoped>
    .title { margin: 0.5rem 0 0.75rem; }
    .summary { margin-bottom: 0.75rem; color: #0f172a; }

    .table-wrap { max-width: 520px; }
    .hour-table {
        width: 100%;
        border-collapse: collapse;
        font-variant-numeric: tabular-nums;
    }
    .hour-table th, .hour-table td {
        border-bottom: 1px solid #e5e7eb;
        padding: 0.4rem 0.5rem;
        text-align: left;
    }
    .hour-table th { background: #f9fafb; }
    .hour-label { white-space: nowrap; }
    .units { text-align: right; }
</style>