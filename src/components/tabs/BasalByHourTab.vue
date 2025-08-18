<script setup>
    import { computed } from 'vue'
    import { DateTime } from 'luxon'

    // Props: pass in your exported basal entries and, optionally, pumpUploadTime
    const props = defineProps({
        basalEntries: { type: Array, default: () => [] },
        hourlyBasalTotals: { type: Array, default: () => [] },
        selectedDate: { type: [Date, String, Number], required: true },
    })

    const totalsByHour = computed(() =>
        Array.isArray(props.hourlyBasalTotals) && props.hourlyBasalTotals.length === 24
            ? props.hourlyBasalTotals
            : new Array(24).fill(0)
    )


    // Build rows for display: ["12:00 AM – 1:00 AM", value]
    const rows = computed(() => {
        const out = []

        // anchor to selectedDate in Australia/Sydney
        const baseStart = DateTime
            .fromJSDate(props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate))
            .setZone('Australia/Sydney')
            .startOf('day')

        for (let h = 0; h < 24; h++) {
            const start = baseStart.plus({ hours: h })
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