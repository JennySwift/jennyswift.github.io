<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay, formatTime12hCompact } from '../../helpers/dateHelpers'

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
            <div
                    v-for="f in foodLogsForDay"
                    :key="(f.timestamp?.getTime?.() ?? f.timestamp) + '-' + (f.foodName || '')"
                    class="log-block"
                    role="button"
                    tabindex="0"
            >
                <div class="log-title">
                    <strong>{{ formatTime12hCompact(f.timestamp) }}</strong>:
                    {{ f.foodName || 'Food' }}
                </div>

                <div class="log-details">
                    <span v-if="f.quantity != null">⚖️ Grams/mL: {{ f.quantity }}</span>
                    <span v-if="f.netCarbs != null">🍌 Net Carbs: {{ f.netCarbs }}g</span>
                    <span v-if="f.totalCarbs != null">🍌 Total Carbs: {{ f.totalCarbs }}g</span>
                    <span v-if="f.fat != null">🥑 Fat: {{ f.fat }}g</span>
                    <span v-if="f.protein != null">🫘 Protein: {{ f.protein }}g</span>
                    <span v-if="f.fibre != null">🌿 Fibre: {{ f.fibre }}g</span>
                    <span v-if="f.calories != null">🔥 Calories: {{ f.calories }}</span>
                </div>
            </div>
        </div>
    </div>
</template>