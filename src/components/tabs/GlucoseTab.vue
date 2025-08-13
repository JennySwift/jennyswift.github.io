<!-- src/components/tabs/GlucoseTab.vue -->
<script setup>
    import { computed } from 'vue'
    import {
        parseAsSydneyDate,
        getStartAndEndOfDay,
        formatTime12hCompact
    } from '../../helpers/dateHelpers'

    const props = defineProps({
        glucoseReadings: { type: Array, default: () => [] }, // [{ timestamp, value }]
        selectedDate:    { type: Date,  required: true }
    })

    const readingsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        return props.glucoseReadings
            .filter(r => {
                const t = r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp)
                return t >= startOfDay && t < endOfDay
            })
            .map(r => ({
                ...r,
                ts: r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp)
            }))
            .sort((a, b) => a.ts - b.ts)
    })
</script>

<template>
    <div class="daily-section">
        <div v-if="readingsForDay.length === 0">No glucose readings for this day.</div>

        <div v-else class="glucose-list">
            <div
                    v-for="r in readingsForDay"
                    :key="r.ts.getTime() + '-' + r.value"
                    class="glucose-row"
            >
                <span class="time">{{ formatTime12hCompact(r.ts) }}</span>
                <span class="value">{{ r.value.toFixed(2) }}</span>
                <span class="unit">mmol/L</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .glucose-list {
        display: grid;
        gap: 6px;
    }

    .glucose-row {
        display: grid;
        grid-template-columns: 90px 1fr 60px;
        gap: 8px;
        align-items: center;
        padding: 6px 10px;
        border-radius: 6px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;

        .time   { font-variant-numeric: tabular-nums; color: #374151; }
        .value  { font-weight: 700; }
        .unit   { color: #6b7280; }
    }
</style>