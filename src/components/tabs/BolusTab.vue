<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import BolusRow from '../rows/BolusRow.vue'
    import { jumpToTime } from '../../helpers/jumpToTime'

    const props = defineProps({
        boluses:  { type: Array, default: () => [] },
        selectedDate:{ type: Date,  required: true },
        loading:     { type: Boolean, default: false },
    })

    const bolusesForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.boluses
            .filter(b => {
                const t = b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)
                return t >= startOfDay && t < endOfDay
            })
            .sort((a, b) => {
                const ta = (a.timestamp instanceof Date ? a.timestamp : parseAsSydneyDate(a.timestamp)).getTime()
                const tb = (b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)).getTime()
                return ta - tb
            })
    })
</script>

<template>
    <div class="daily-section">
        <div v-if="loading" class="loading-row">
            <span class="spinner" aria-hidden="true"></span>
            <span>Loading boluses…</span>
        </div>

        <div v-else-if="bolusesForDay.length === 0">No bolus doses for this day.</div>

        <template v-else>
            <BolusRow
                    v-for="b in bolusesForDay"
                    :key="(b.timestamp?.getTime?.() ?? b.timestamp) + '-' + (b.amount ?? '')"
                    :dose="b"
                    @click="jumpToTime(b.timestamp, 'bolus')"
                    class="clickable-row"
            />
        </template>
    </div>
</template>