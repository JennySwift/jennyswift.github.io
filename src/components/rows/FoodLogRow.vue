<!-- src/components/rows/FoodLogRow.vue -->
<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, formatTimeInSydney } from '../../helpers/dateHelpers'

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
            class="food-row clickable-row"
            :role="asButton ? 'button' : undefined"
            :tabindex="asButton ? 0 : undefined"
    >
        <div class="log-title">
            <strong>{{ formatTimeInSydney(ts) }}</strong>:
            {{ log.foodName || 'Food' }}
            <span v-if="log.isUnfinished">⚠️Unfinished</span>
        </div>

        <div class="log-details">
            <span v-if="log.quantity != null">⚖️ Grams (or mLs): {{ log.quantity }}</span>
            <span v-if="log.netCarbs != null">🍌 Net Carbs: {{ log.netCarbs }}g</span>
            <span v-if="log.totalCarbs != null">🍌 Total Carbs: {{ log.totalCarbs }}g</span>
            <span v-if="log.fat != null">🥑 Fat: {{ log.fat }}g</span>
            <!--<span v-if="log.protein != null">🫘 Protein: {{ log.protein }}g</span>-->
            <span v-if="log.fibre != null">🌿 Fibre: {{ log.fibre }}g</span>
            <span v-if="log.calories != null">🔥 Calories: {{ log.calories }}</span>
        </div>
    </div>
</template>

<style scoped>
    .food-row{
        /*background: var(--color-bg);*/
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 8px 10px;
        border-left: 4px solid var(--accent, var(--color-food));
    }

    .log-title{
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
    }

    .log-details{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        color: #374151;
        font-size: 0.92rem;
    }
</style>