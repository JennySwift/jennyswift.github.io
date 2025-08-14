<script setup>
    import { computed } from 'vue'
    import FoodLogRow from '../rows/FoodLogRow.vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'

    const props = defineProps({
        foodLogs:     { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true }
    })

    const foodLogsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.foodLogs
            .filter(f => {
                const t = f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp)
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
        <div v-if="foodLogsForDay.length === 0">No food logs.</div>
        <div v-else>
            <FoodLogRow
                    v-for="f in foodLogsForDay"
                    :key="(f.timestamp?.getTime?.() ?? f.timestamp) + '-' + (f.foodName || '')"
                    :log="f"
                    @click="jumpToTime(f.timestamp, 'foodLogs')"
            />
        </div>


    </div>
</template>