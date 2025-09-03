<script setup>
    import { computed } from 'vue'
    import { getStartAndEndOfDay, parseAsSydneyDate } from '../../helpers/dateHelpers'

    const props = defineProps({
        selectedDate:  { type: Date, required: true },
        bolusDoses:    { type: Array, default: () => [] },
        basalEntries:  { type: Array, default: () => [] },
        foodLogs:      { type: Array, default: () => [] }, // for ratios
    })

    // Total bolus within the day
    const totalBolus = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.bolusDoses
            .map(b => ({ ...b, timestamp: b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp) }))
            .filter(b => b.timestamp >= startOfDay && b.timestamp < endOfDay)
            .reduce((acc, b) => acc + Number(b.amount ?? 0), 0)
    })

    // Total basal overlapping the day (rate * hours overlapped)
    const totalBasal = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const entries = props.basalEntries
            .map(e => ({
                startTime: e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime),
                endTime:   e.endTime   ? (e.endTime   instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null,
                rate: Number(e.rate ?? 0)
            }))
            .filter(e => e.startTime < endOfDay && (!e.endTime || e.endTime > startOfDay))
            .sort((a, b) => a.startTime - b.startTime)

        let units = 0
        for (const e of entries) {
            const s = new Date(Math.max(e.startTime.getTime(), startOfDay.getTime()))
            const eend = new Date(Math.min((e.endTime ?? endOfDay).getTime(), endOfDay.getTime()))
            const minutes = (eend - s) / 60000
            if (minutes > 0) units += e.rate * (minutes / 60)
        }
        return units
    })

    const totalInsulin = computed(() => totalBolus.value + totalBasal.value)

    // Ratios that are handy here
    const netCarbs = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.foodLogs
            .map(f => ({ ...f, timestamp: f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp) }))
            .filter(f => f.timestamp >= startOfDay && f.timestamp < endOfDay)
            .reduce((acc, it) => acc + Number(it?.netCarbs ?? 0), 0)
    })

    const netCarbsToBolus = computed(() => {
        const net = netCarbs.value, bol = totalBolus.value
        return (net > 0 && bol > 0) ? `${(net / bol).toFixed(2)}` : 'N/A'
    })
    const netCarbsToTotal = computed(() => {
        const net = netCarbs.value, tot = totalInsulin.value
        return (tot > 0) ? `${(net / tot).toFixed(2)}` : 'N/A'
    })
</script>

<template>
    <div class="stat-list">
        <div class="stat-row">
            <span class="label">💉 Total Insulin Units</span>
            <span class="value">{{ totalInsulin.toFixed(2) }}</span>
        </div>
        <div class="stat-row">
            <span class="label">💉 Bolus Units</span>
            <span class="value">{{ totalBolus.toFixed(2) }}</span>
        </div>
        <div class="stat-row">
            <span class="label">💉 Basal Units</span>
            <span class="value">{{ totalBasal.toFixed(2) }}</span>
        </div>
        <div class="stat-row">
            <span class="label">➗ Net Carbs / Total Insulin</span>
            <span class="value">{{ netCarbsToTotal }}</span>
        </div>
        <div class="stat-row">
            <span class="label">➗ Net Carbs / Bolus Units</span>
            <span class="value">{{ netCarbsToBolus }}</span>
        </div>
    </div>
</template>

<style scoped>
    /*.card { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:.75rem .9rem; }*/
    .stat-list {
        display: grid;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 1px solid #e5e7eb;
        padding: 4px 0;
    }

    .stat-row:last-child {
        border-bottom: none;
    }

    .label {
        color: #334155;
        font-weight: 500;
    }

    .value {
        font-weight: bold;
        color: #0f172a;
    }
</style>