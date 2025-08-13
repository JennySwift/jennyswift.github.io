<script setup>
    import { computed } from 'vue'
    import WorkoutRow from '../rows/WorkoutRow.vue'
    import { parseAsSydneyDate, getStartAndEndOfDay, formatTimeFromString } from '../../helpers/dateHelpers'
    import { formatMinutesPerKm, formatKmPerHour, formatDistance } from '../../helpers/workoutHelpers'

    const props = defineProps({
        workouts:     { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true }
    })

    const emit = defineEmits(['note-click'])

    const workoutsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.workouts
            .filter(w => {
                const start = w.start instanceof Date ? w.start : parseAsSydneyDate(w.start)
                return start >= startOfDay && start < endOfDay
            })
            .sort((a, b) => {
                const sa = (a.start instanceof Date ? a.start : parseAsSydneyDate(a.start)).getTime()
                const sb = (b.start instanceof Date ? b.start : parseAsSydneyDate(b.start)).getTime()
                return sa - sb
            })
    })

    function onWorkoutClick(w) {
        const ts = w.start instanceof Date ? w.start : parseAsSydneyDate(w.start)
        emit('note-click', ts)
    }
</script>

<template>
    <div class="daily-section">
        <div v-if="workoutsForDay.length === 0">No workouts for this day.</div>
        <div v-else>
            <WorkoutRow
                    v-for="w in workoutsForDay"
                    :key="(w.start?.getTime?.() ?? w.start) + '-' + (w.name || '')"
                    :workout="w"
                    @workout-click="$emit('note-click', w.start)" />

        </div>
    </div>
</template>