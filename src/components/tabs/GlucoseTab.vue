<!-- src/components/tabs/GlucoseTab.vue -->
<script setup>
    import { computed } from 'vue'
    import {
        parseAsSydneyDate,
        getStartAndEndOfDay,
        formatTimeInSydney
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

    // return a CSS class for the range color
    function rangeClass(v) {
        const val = Number(v)
        if (val < 4) return 'is-low'          // red
        if (val <= 6) return 'is-inrange'     // green
        if (val <= 10) return 'is-elevated'   // yellow
        return 'is-high'                      // red
    }
</script>

<template>
    <div class="daily-section">
        <div v-if="readingsForDay.length === 0">No glucose readings for this day.</div>

        <div v-else class="glucose-list">
            <div
                    v-for="r in readingsForDay"
                    :key="r.ts.getTime() + '-' + r.value"
                    class="glucose-row"
                    :class="rangeClass(r.value)"
                    :aria-label="`BG ${Number(r.value).toFixed(2)} at ${formatTimeInSydney(r.ts)}`"
            >
                <span class="time">{{ formatTimeInSydney(r.ts) }}</span>
                <span class="value">{{ Number(r.value).toFixed(2) }}</span>
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
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #f9fafb;

        /* strong left border as a color cue */
        border-left: 6px solid transparent;

        .time   { font-variant-numeric: tabular-nums; color: #374151; }
        .value  { font-weight: 700; }
        .unit   { color: #6b7280; }
    }

    /* Colors:
       - Use light background tints + strong left border for visibility.
       - Keep text dark for contrast.
    */
    .is-inrange {
        background: #edf7ed;         /* soft green tint */
        border-left-color: #2e7d32;  /* green */
    }

    .is-elevated {
        background: #fff8e1;         /* soft yellow tint */
        border-left-color: #ef6c00;  /* orange/yellow */
    }

    .is-low,
    .is-high {
        background: #fdecea;         /* soft red tint */
        border-left-color: #d32f2f;  /* red */
    }
</style>