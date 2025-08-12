<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay, formatTime12hCompact } from '../../helpers/dateHelpers'

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
        <div v-else>
            <div
                    v-for="b in bolusesForDay"
                    :key="(b.timestamp?.getTime?.() ?? b.timestamp) + '-' + (b.amount ?? '')"
                    class="bolus-block"
                    role="button"
                    tabindex="0"
            >
                <strong>{{ formatTime12hCompact(b.timestamp) }}</strong>:
                💉 {{ (Number(b.amount ?? 0)).toFixed(2) }}U
                <span v-if="b.carbRatioUsed"> · Ratio: 1:{{ b.carbRatioUsed }}</span>
                <span v-if="b.notes"> · {{ b.notes }}</span>
            </div>
        </div>
    </div>
</template>