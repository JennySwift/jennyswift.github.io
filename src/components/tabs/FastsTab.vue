<script setup>
    import { computed } from 'vue'
    import {
        parseAsSydneyDate,
        getStartAndEndOfDay,
        isSameDay,
        formatDateTime
    } from '../../helpers/dateHelpers'

    const props = defineProps({
        fasts:        { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true }
    })

    const emit = defineEmits(['note-click'])

    const fastsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        return props.fasts
            .filter(f => {
                const start = f.startTime instanceof Date ? f.startTime : parseAsSydneyDate(f.startTime)
                const end   = f.endTime ? (f.endTime instanceof Date ? f.endTime : parseAsSydneyDate(f.endTime)) : null
                // include if overlaps the selected day
                return (start < endOfDay) && (!end || end > startOfDay)
            })
            .sort((a, b) => {
                const sa = (a.startTime instanceof Date ? a.startTime : parseAsSydneyDate(a.startTime)).getTime()
                const sb = (b.startTime instanceof Date ? b.startTime : parseAsSydneyDate(b.startTime)).getTime()
                return sa - sb
            })
    })

    function labelForFast(f) {
        const d = props.selectedDate
        const start = f.startTime
        const end   = f.endTime
        if (isSameDay(start, d) && end && isSameDay(end, d)) return 'Started and Ended'
        if (isSameDay(start, d)) return 'Started fast:'
        if (end && isSameDay(end, d)) return 'Ended fast:'
        return 'Continued'
    }

</script>

<template>
    <div class="daily-section">
        <div v-if="fastsForDay.length === 0">No fasts for this day.</div>
        <div v-else>
            <div
                    v-for="f in fastsForDay"
                    :key="(f.startTime?.getTime?.() ?? f.startTime) + '-' + (f.endTime?.getTime?.() ?? 'ongoing')"
                    class="fast-block"
                    role="button"
                    tabindex="0"
            >
                <!-- Label -->
                <div class="fast-label">{{ labelForFast(f) }}</div>

                <!-- Duration (from export if present, in seconds) -->
                <div v-if="f.duration">
                    <strong>Duration:</strong>
                    {{ Math.floor(f.duration / 3600) }}h {{ Math.floor((f.duration % 3600) / 60) }}m
                </div>

                <!-- Start / End -->
                <div><strong>Start:</strong> {{ formatDateTime(f.startTime) }}</div>
                <div><strong>End:</strong> {{ f.endTime ? formatDateTime(f.endTime) : 'Ongoing' }}</div>

                <!-- Notes -->
                <div v-if="f.notes" class="fast-notes">📝 {{ f.notes }}</div>
            </div>
        </div>
    </div>
</template>