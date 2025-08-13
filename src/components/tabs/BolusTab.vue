<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import BolusRow from '../rows/BolusRow.vue'   // 👈 add this

    const props = defineProps({
        bolusDoses:  { type: Array, default: () => [] },
        selectedDate:{ type: Date,  required: true }
    })

    const bolusesForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.bolusDoses
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
        <div v-if="bolusesForDay.length === 0">No bolus doses for this day.</div>

        <template v-else>
            <BolusRow
                    v-for="b in bolusesForDay"
                    :key="(b.timestamp?.getTime?.() ?? b.timestamp) + '-' + (b.amount ?? '')"
                    :dose="b"
            />
        </template>
    </div>
</template>