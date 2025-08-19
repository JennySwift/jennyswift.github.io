<script setup>
    import { computed } from 'vue'
    import FoodLogRow from '../rows/FoodLogRow.vue'
    import BolusRow from '../rows/BolusRow.vue'
    import NoteRow from '../rows/NoteRow.vue'
    import WorkoutRow from '../rows/WorkoutRow.vue'
    import { getStartAndEndOfDay, parseAsSydneyDate } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'

    const props = defineProps({
        selectedDate: { type: Date, required: true },
        foodLogs:     { type: Array, default: () => [] },
        boluses:   { type: Array, default: () => [] },
        notes:        { type: Array, default: () => [] },
        workouts:     { type: Array, default: () => [] },
    })

    const TYPE_META = {
        food:    { icon: '🥗', cssVar: '--color-food' },
        bolus:   { icon: '💉', cssVar: '--color-bolus' },
        note:    { icon: '📝', cssVar: '--color-note' },
        workout: { icon: '🏃‍♀️', cssVar: '--color-workout' }
    }

    function typeIcon(t){ return TYPE_META[t]?.icon ?? '•' }
    function typeAccentVar(t){ return `var(${TYPE_META[t]?.cssVar || '--color-border'})` }

    /** One flat, time-sorted list with a simple shape { type, ts, payload } */
    const feedItems = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        const foods = props.foodLogs.map(f => {
            const ts = f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp)
            return (ts >= startOfDay && ts < endOfDay) ? { type: 'food', ts, payload: f } : null
        }).filter(Boolean)

        const boluses = props.boluses.map(b => {
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

    // function jumpTo(ts) {
    //     // Charts will set their vertical line, and App.vue will update the tooltip.
    //     window.dispatchEvent(new CustomEvent('chart-hover', {
    //         detail: { x: ts, source: 'combined' }
    //     }))
    // }
</script>

<template>
    <div class="combined-list">
        <div v-if="feedItems.length === 0" class="empty">No activity for this day.</div>

        <div v-else class="stack">
            <div
                    v-for="(item, idx) in feedItems"
                    :key="item.type + '-' + item.ts.getTime() + '-' + idx"
                    class="feed-item clickable-row"
                    :style="{ '--accent': typeAccentVar(item.type) }"
                    @click="jumpToTime(item.ts, 'combined')"
            >
                <div class="type-badge" aria-hidden="true">{{ typeIcon(item.type) }}</div>
                <div class="content">
                    <FoodLogRow  v-if="item.type === 'food'"      :log="item.payload" />
                    <BolusRow    v-else-if="item.type === 'bolus'" :dose="item.payload" />
                    <NoteRow     v-else-if="item.type === 'note'"  :note="item.payload" />
                    <WorkoutRow  v-else-if="item.type === 'workout'" :workout="item.payload" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .combined-list { display: grid; gap: 8px; }
    .empty { color: #6b7280; }
    .stack { display: grid; gap: 8px; }

    /* Clickable wrapper */
    .feed-item {
        --accent: #6b7280;                 /* fallback */
        display: grid;
        grid-template-columns: 36px 1fr;   /* icon column + content */
        align-items: start;
        gap: 10px;

        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 10px 12px;
        background: #ffffff;
        position: relative;

        /* subtle left accent strip */
        box-shadow: inset 4px 0 0 0 var(--accent);
        transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
    }

    .feed-item:hover {
        background: rgba(0,0,0,0.03);
        border-color: #d1d5db;
        box-shadow:
                inset 6px 0 0 0 var(--accent),          /* a bit thicker on hover */
                0 1px 2px rgba(0,0,0,0.04);
    }

    /* round icon chip */
    .type-badge {
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        background: color-mix(in srgb, var(--accent) 14%, white);
        border: 1px solid color-mix(in srgb, var(--accent) 40%, white);
        user-select: none;
        margin-top: 2px;
    }

    /* Let the child rows be visually “flat” so the wrapper styling shows */
    .feed-item :deep(.food-row),
    .feed-item :deep(.log-block),
    .feed-item :deep(.bolus-row),
    .feed-item :deep(.note-row),
    .feed-item :deep(.workout-row) {
        background: transparent !important;
        border: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    /* Optional: tighten inner spacing slightly since wrapper adds padding */
    .feed-item :deep(.log-title),
    .feed-item :deep(.line),
    .feed-item :deep(.note-line) {
        margin-bottom: 2px;
    }
</style>