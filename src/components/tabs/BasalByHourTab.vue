<script setup>
    import { computed, ref } from 'vue'
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

    // Hour picker state (defaults to 12 AM → 9 AM)
    const selectedStartHour = ref(0)  // 0–23
    const selectedEndHour   = ref(9)  // 1–24 (end exclusive)

    // Dropdown options: 0–23 rendered as "12 AM", "1 AM", … "11 PM"
    const hourOptions = Array.from({ length: 24 }, (_, h) => ({
        value: h,
        label: `${(h % 12) || 12} ${h < 12 ? 'AM' : 'PM'}`
    }))

    // const hourOptions = Array.from({ length: 24 }, (_, h) => ({
    //     value: h,
    //     label: DateTime.fromObject({ hour: h }, { zone: 'Australia/Sydney' }).toFormat('h a')
    // }))


    const averageBasalInTimeRange = computed(() => {
        const start = Number(selectedStartHour.value)
        const end = Number(selectedEndHour.value)

        const hours = totalsByHour.value.slice(start, end)
        const sum = hours.reduce((a, b) => a + b, 0)
        return sum / hours.length
    })


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

        <!--Average basal in time range-->
        <div class="range-controls">
            <strong>Average basal in time range:</strong>
            <label>
                <select v-model.number="selectedStartHour">
                    <option v-for="opt in hourOptions" :key="'s'+opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </label>

            <label>
                <select v-model.number="selectedEndHour">
                    <option v-for="opt in hourOptions" :key="'e'+opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </label>

            <div class="average-display">{{ averageBasalInTimeRange.toFixed(3) }} U/hr</div>
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

    .range-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
        flex-wrap: wrap;

    label {
        display: flex;
        flex-direction: column;
        font-weight: 500;
        color: #0f172a;

    select {
        margin-top: 0.25rem;
        padding: 0.25rem 0.4rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #fff;
    }
    }

    .average-display {
        margin-left: 10px;
        white-space: nowrap;
        font-weight: 600;
    }
    }
</style>