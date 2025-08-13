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
</script>

<template>
    <div class="combined-list">
        <div v-if="feedItems.length === 0" class="empty">No activity for this day.</div>

        <div v-else class="stack">
            <div
                    v-for="(item, idx) in feedItems"
                    :key="item.type + '-' + item.ts.getTime() + '-' + idx"
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
</style>