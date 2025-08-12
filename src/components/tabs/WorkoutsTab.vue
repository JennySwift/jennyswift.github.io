<script setup>
    import { computed } from 'vue'
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
            <div
                    v-for="w in workoutsForDay"
                    :key="(w.start?.getTime?.() ?? w.start) + '-' + (w.name || '')"
                    class="log-block"
                    role="button"
                    tabindex="0"
                    @click="onWorkoutClick(w)"
            >
                <div class="log-title">{{ w.name }}</div>

                <div><strong>Duration:</strong> {{ Math.round((w.duration ?? 0) / 60) }} min</div>
                <div><strong>Average H/R:</strong> {{ Math.round(w.averageHeartRate ?? 0) }}bpm</div>
                <div><strong>Max H/R:</strong> {{ Math.round(w.maxHeartRate ?? 0) }}bpm</div>
                <div><strong>Calories:</strong> {{ Math.round(w.activeCalories ?? 0) }}</div>

                <div><strong>Start:</strong> {{ formatTimeFromString(w.start) }}</div>
                <div><strong>End:</strong> {{ w.endTime ? formatTimeFromString(w.endTime) : '—' }}</div>

                <div><strong>Elapsed Time:</strong> {{ Math.round((w.elapsedTime ?? 0) / 60) }} min</div>

                <div v-if="w.distance"><strong>Distance:</strong> {{ formatDistance(w.distance) }}</div>
                <div v-if="w.kmPerHour"><strong>Speed:</strong> {{ formatKmPerHour(w.kmPerHour) }}</div>
                <div v-if="w.minutesPerKm"><strong>Pace:</strong> {{ formatMinutesPerKm(w.minutesPerKm) }}</div>

                <div v-if="w.notes"><strong>Notes:</strong> {{ w.notes }}</div>
            </div>
        </div>
    </div>
</template>