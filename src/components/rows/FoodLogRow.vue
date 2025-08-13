<!-- src/components/rows/FoodLogRow.vue -->
<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, formatTime12hCompact } from '../../helpers/dateHelpers'

    const props = defineProps({
        log: { type: Object, required: true },   // { timestamp, foodName, quantity, netCarbs, totalCarbs, fat, protein, fibre, calories }
        // Optional: let callers style it like a button/list item if they want
        asButton: { type: Boolean, default: true }
    })

    const ts = computed(() =>
        props.log.timestamp instanceof Date
            ? props.log.timestamp
            : parseAsSydneyDate(props.log.timestamp)
    )
</script>

<template>
    <div
            class="log-block"
            :role="asButton ? 'button' : undefined"
            :tabindex="asButton ? 0 : undefined"
    >
        <div class="log-title">
            <strong>{{ formatTime12hCompact(ts) }}</strong>:
            {{ log.foodName || 'Food' }}
        </div>

        <div class="log-details">
            <span v-if="log.quantity != null">⚖️ Grams/mL: {{ log.quantity }}</span>
            <span v-if="log.netCarbs != null">🍌 Net Carbs: {{ log.netCarbs }}g</span>
            <span v-if="log.totalCarbs != null">🍌 Total Carbs: {{ log.totalCarbs }}g</span>
            <span v-if="log.fat != null">🥑 Fat: {{ log.fat }}g</span>
            <span v-if="log.protein != null">🫘 Protein: {{ log.protein }}g</span>
            <span v-if="log.fibre != null">🌿 Fibre: {{ log.fibre }}g</span>
            <span v-if="log.calories != null">🔥 Calories: {{ log.calories }}</span>
        </div>
    </div>
</template>

<style scoped>
    /* Uses the same classes your tabs already use so styling stays consistent */
</style>