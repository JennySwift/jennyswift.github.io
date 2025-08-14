<script setup>
    import { computed } from 'vue'
    import WorkoutRow from '../rows/WorkoutRow.vue'
    import { parseAsSydneyDate, getStartAndEndOfDay, formatTimeFromString } from '../../helpers/dateHelpers'
    import { formatMinutesPerKm, formatKmPerHour, formatDistance } from '../../helpers/workoutHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'

    const props = defineProps({
        workouts:     { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true }
    })

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

</script>

<template>
    <div class="daily-section">
        <div v-if="workoutsForDay.length === 0">No workouts for this day.</div>
        <div v-else>
            <WorkoutRow
                    v-for="w in workoutsForDay"
                    :key="(w.start?.getTime?.() ?? w.start) + '-' + (w.name || '')"
                    :workout="w"
                    @click="jumpToTime(w.start, 'workout')"
                    class="clickable-row"
            />

        </div>
    </div>
</template>