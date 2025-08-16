<script setup>
    import { computed } from 'vue'
    import { getStartAndEndOfDay, parseAsSydneyDate } from '../../helpers/dateHelpers'

    const props = defineProps({
        selectedDate: { type: Date, required: true },
        foodLogs:     { type: Array, default: () => [] },
    })

    const foodLogsForDay = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.foodLogs
            .map(f => ({ ...f, timestamp: f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp) }))
            .filter(f => f.timestamp >= startOfDay && f.timestamp < endOfDay)
    })

    const percentageOfCaloriesFromFat = computed(() => {
        const fatKcal = (Number(totals.value.fat) || 0) * 9;        // 9 kcal / g
        const totalKcal = Number(totals.value.calories) || 0;
        if (totalKcal <= 0) return 0;
        return (fatKcal / totalKcal) * 100;
    });

    const totals = computed(() => {
        const sum = (k) => foodLogsForDay.value.reduce((acc, it) => acc + Number(it?.[k] ?? 0), 0)
        return {
            netCarbs:   sum('netCarbs'),
            totalCarbs: sum('totalCarbs'),
            fat:        sum('fat'),
            protein:    sum('protein'),
            fibre:      sum('fibre'),
            calories:   sum('calories'),
        }
    })
</script>

<template>
    <div class="stat-grid">
        <div class="card">🍌 Net Carbs <strong>{{ totals.netCarbs.toFixed(1) }}g</strong></div>
        <div class="card">🍌 Total Carbs <strong>{{ totals.totalCarbs.toFixed(1) }}g</strong></div>
        <div class="card">🥑 Fat <strong>{{ totals.fat.toFixed(1) }}g</strong></div>
        <div class="card">🥑 % Calories from Fat <strong>{{ percentageOfCaloriesFromFat.toFixed(2) }}%</strong></div>
        <div class="card">🫘 Protein <strong>Not tracked yet...</strong></div>
        <!--<div class="card">🫘 Protein <strong>{{ totals.protein.toFixed(1) }}g</strong></div>-->
        <div class="card">🥦 Fibre <strong>{{ totals.fibre.toFixed(1) }}g</strong></div>
        <div class="card">🔥 Calories <strong>{{ totals.calories.toFixed(0) }}</strong></div>
    </div>
</template>

<style scoped>
    .stat-grid { display:grid; gap:.5rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .card { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:.75rem .9rem; }
</style>