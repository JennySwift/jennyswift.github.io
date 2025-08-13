<script setup>
    import { formatTimeFromString } from '../../helpers/dateHelpers'
    import { formatMinutesPerKm, formatKmPerHour, formatDistance } from '../../helpers/workoutHelpers'

    const props = defineProps({
        workout: { type: Object, required: true } // expects fields like start, endTime, name, duration, distance, etc.
    })

    const emit = defineEmits(['workout-click'])

    function onClick() {
        emit('workout-click', props.workout)
    }

    function minutes(v) { return Math.round((Number(v ?? 0)) / 60) }
    function round(v) { return Math.round(Number(v ?? 0)) }
</script>

<template>
    <div class="log-block" role="button" tabindex="0" @click="onClick">
        <div class="log-title">
            <strong>{{ workout.name ?? workout.type ?? 'Workout' }}</strong>
            <span class="time"> • {{ formatTimeFromString(workout.start) }}</span>
        </div>

        <div class="log-details">
            <span v-if="workout.duration != null"><strong>Duration:</strong> {{ minutes(workout.duration) }} min</span>
            <span v-if="workout.averageHeartRate != null"><strong>Avg HR:</strong> {{ round(workout.averageHeartRate) }} bpm</span>
            <span v-if="workout.maxHeartRate != null"><strong>Max HR:</strong> {{ round(workout.maxHeartRate) }} bpm</span>
            <span v-if="workout.activeCalories != null"><strong>Calories:</strong> {{ round(workout.activeCalories) }}</span>
            <span><strong>Start:</strong> {{ formatTimeFromString(workout.start) }}</span>
            <span><strong>End:</strong> {{ workout.endTime ? formatTimeFromString(workout.endTime) : '—' }}</span>
            <span v-if="workout.elapsedTime != null"><strong>Elapsed:</strong> {{ minutes(workout.elapsedTime) }} min</span>
            <span v-if="workout.distance != null"><strong>Distance:</strong> {{ formatDistance(workout.distance) }}</span>
            <span v-if="workout.kmPerHour != null"><strong>Speed:</strong> {{ formatKmPerHour(workout.kmPerHour) }}</span>
            <span v-if="workout.minutesPerKm != null"><strong>Pace:</strong> {{ formatMinutesPerKm(workout.minutesPerKm) }}</span>
            <span v-if="workout.notes"><strong>Notes:</strong> {{ workout.notes }}</span>
        </div>
    </div>
</template>

<style scoped>
    .log-title { font-weight:600; color:#111827; margin-bottom:4px; }
    .time { color:#6b7280; font-weight:500; }
    .log-details { display:flex; flex-wrap:wrap; gap:10px; color:#374151; }
    .log-details > span strong { margin-right:4px; }
    .log-block{
        background:#f9fafb;
        border:1px solid color-mix(in srgb, var(--color-workout) 20%, var(--color-border));
        border-left:4px solid var(--color-workout);
        border-radius:8px;
        padding:8px 10px;
    }
</style>