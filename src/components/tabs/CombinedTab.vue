<script setup>
    import { computed } from 'vue'
    import FoodLogRow from '../rows/FoodLogRow.vue'
    import BolusRow from '../rows/BolusRow.vue'
    import NoteRow from '../rows/NoteRow.vue'
    import WorkoutRow from '../rows/WorkoutRow.vue'
    import { getStartAndEndOfDay, parseAsSydneyDate } from '../../helpers/dateHelpers'

    const props = defineProps({
        selectedDate: { type: Date, required: true },
        foodLogs:     { type: Array, default: () => [] },
        bolusDoses:   { type: Array, default: () => [] },
        notes:        { type: Array, default: () => [] },
        workouts:     { type: Array, default: () => [] },
    })

    /** One flat, time-sorted list with a simple shape { type, ts, payload } */
    const feedItems = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        const foods = props.foodLogs.map(f => {
            const ts = f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp)
            return (ts >= startOfDay && ts < endOfDay) ? { type: 'food', ts, payload: f } : null
        }).filter(Boolean)

        const boluses = props.bolusDoses.map(b => {
            const ts = b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)
            return (ts >= startOfDay && ts < endOfDay) ? { type: 'bolus', ts, payload: b } : null
        }).filter(Boolean)

        const noteItems = props.notes.map(n => {
            const raw = n.timestamp ?? n.startTime
            const ts = raw instanceof Date ? raw : parseAsSydneyDate(raw)
            if (!(ts >= startOfDay && ts < endOfDay)) return null
            return { type: 'note', ts, payload: { ...n, timestamp: ts } }
        }).filter(Boolean)

        const workouts = props.workouts.map(w => {
            const ts = w.start instanceof Date ? w.start : parseAsSydneyDate(w.start)
            return (ts >= startOfDay && ts < endOfDay) ? { type: 'workout', ts, payload: w } : null
        }).filter(Boolean)

        return [...foods, ...boluses, ...noteItems, ...workouts].sort((a, b) => a.ts - b.ts)
    })

    function jumpTo(ts) {
        // Charts will set their vertical line, and App.vue will update the tooltip.
        window.dispatchEvent(new CustomEvent('chart-hover', {
            detail: { x: ts, source: 'combined' }
        }))
    }
</script>

<template>
    <div class="combined-list">
        <div v-if="feedItems.length === 0" class="empty">No activity for this day.</div>

        <div v-else class="stack">
            <div
                    v-for="(item, idx) in feedItems"
                    :key="item.type + '-' + item.ts.getTime() + '-' + idx"
                    class="feed-item"
                    @click="jumpTo(item.ts)"
            >
                <FoodLogRow  v-if="item.type === 'food'"    :log="item.payload" />
                <BolusRow v-else-if="item.type === 'bolus'" :dose="item.payload" />
                <NoteRow    v-else-if="item.type === 'note'"  :note="item.payload" />
                <WorkoutRow v-else-if="item.type === 'workout'" :workout="item.payload" />
            </div>
        </div>
    </div>
</template>

<style scoped>
    .combined-list { display: grid; gap: 8px; }
    .empty { color: #6b7280; }
    .stack { display: grid; gap: 8px; }

    /* The clickable frame that should receive hover styles */
    .feed-item {
        cursor: pointer;
        border: 1px solid #e5e7eb;      /* light border */
        border-radius: 8px;
        padding: 8px 10px;
        transition: background-color .15s ease, border-color .15s ease;
        background: transparent;
    }

    /* subtle hover */
    .feed-item:hover {
        background: rgba(0,0,0,0.25);
        border-color: #d1d5db;
    }

    /* Make sure child components don’t paint over the wrapper */
    .feed-item :deep(.bolus-block),
    .feed-item :deep(.note-log-block),
    .feed-item :deep(.log-block) {    /* log-block covers your workout rows, etc. */
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        width: 100%;
    }
</style>