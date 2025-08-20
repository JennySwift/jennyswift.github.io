<script setup>
    import { computed } from 'vue'
    import FoodLogRow from '../rows/FoodLogRow.vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'

    const props = defineProps({
        foodLogs:     { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true },
        loading:      { type: Boolean, default: false },
    })

</script>

<template>
    <div class="daily-section">
        <div v-if="loading" class="loading-row">
            <span class="spinner" aria-hidden="true"></span>
            <span>Loading food logs…</span>
        </div>

        <div v-else-if="foodLogs.length === 0">No food logs.</div>

        <div v-else>
            <FoodLogRow
                    v-for="f in foodLogs"
                    :key="f.id"
                    :log="f"
                    @click="jumpToTime(f.timestamp, 'foodLogs')"
                    class="clickable-row"
            />
        </div>


    </div>
</template>