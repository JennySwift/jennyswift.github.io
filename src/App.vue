<script setup>
    import { ref, onMounted } from 'vue'
    import DateHeader from './components/DateHeader.vue'
    import BgChart from './components/BgChart.vue'
    import Tabs from './components/tabs/Tabs.vue'
    import StatsSummary from './components/StatsSummary.vue'
    import { parseAsSydneyDate, getSydneyStartOfToday } from './helpers/dateHelpers'
    import { fetchDashboardData } from './helpers/dataService'

    const notes = ref([])
    const glucoseReadings = ref([])
    const foodLogs = ref([])
    const fasts = ref([])
    const workouts = ref([])
    const basalEntries = ref([])
    const bolusDoses = ref([])
    const selectedDate = ref(getSydneyStartOfToday())

    onMounted(async () => {
        try {
            const data = await fetchDashboardData()

            glucoseReadings.value = Array.isArray(data?.glucoseReadings)
                ? data.glucoseReadings.map(r => ({
                    timestamp: parseAsSydneyDate(r.timestamp),
                    value: r.value,
                }))
                : []

            foodLogs.value = Array.isArray(data?.foodLogs)
                ? data.foodLogs.map(f => ({
                    timestamp: parseAsSydneyDate(f.timestamp),
                    foodName: f.foodName,
                    quantity: f.quantity,
                    netCarbs: f.netCarbs,
                    calories: f.calories,
                    fat: f.fat,
                    protein: f.protein,
                    fibre: f.fibre,
                    totalCarbs: f.totalCarbs,
                }))
                : []

            notes.value = Array.isArray(data?.notes)
                ? data.notes.map(n => ({
                    timestamp: parseAsSydneyDate(n.startTime),
                    noteNumber: n.noteNumber,
                    text: n.text,
                    tags: n.tags ?? [],
                    title: n.title ?? '',
                }))
                : []

            fasts.value = Array.isArray(data?.fasts)
                ? data.fasts.map(f => {
                    const startTime = parseAsSydneyDate(f.startTime)
                    const endTime = f.endTime ? parseAsSydneyDate(f.endTime) : null
                    const duration = endTime ? (endTime - startTime) / 1000 : null // seconds
                    return { startTime, endTime, duration, notes: f.notes }
                })
                : []

            workouts.value = Array.isArray(data?.workouts)
                ? data.workouts.map(w => ({
                    start: parseAsSydneyDate(w.startTime),
                    name: w.name,
                    type: w.type,
                    duration: w.duration,
                    distance: w.distance,
                    activeCalories: w.activeCalories,
                    maxHeartRate: w.maxHeartRate,
                    endTime: parseAsSydneyDate(w.endTime),
                    source: w.source,
                    elapsedTime: w.elapsedTime,
                    averageHeartRate: w.averageHeartRate,
                    notes: w.notes,
                    kmPerHour: w.kmPerHour,
                    minutesPerKm: w.minutesPerKm,
                    tags: w.tags ?? [],
                }))
                : []

            basalEntries.value = Array.isArray(data?.basalEntries)
                ? data.basalEntries.map(b => ({
                    startTime: parseAsSydneyDate(b.startTime),
                    endTime: b.endTime ? parseAsSydneyDate(b.endTime) : null,
                    rate: b.rate,
                    mode: b.mode,
                    notes: b.notes,
                }))
                : []

            bolusDoses.value = Array.isArray(data?.bolusDoses)
                ? data.bolusDoses.map(b => ({
                    timestamp: parseAsSydneyDate(b.timestamp),
                    amount: b.amount,
                    duration: b.duration,
                    type: b.type,
                    notes: b.notes,
                    carbRatioUsed: b.carbRatioUsed,
                    source: b.source,
                    tags: b.tags ?? [],
                }))
                : []

            console.log('[App:onMounted] loaded', {
                glucose: glucoseReadings.value.length,
                foodLogs: foodLogs.value.length,
                notes: notes.value.length,
                fasts: fasts.value.length,
                workouts: workouts.value.length,
                basalEntries: basalEntries.value.length,
                bolusDoses: bolusDoses.value.length,
            })
        } catch (e) {
            console.error('[App:onMounted] failed to load data:', e)
        }
    })

</script>

<template>
  <main style="padding: 1rem;">
    <h1>Control Dashboard</h1>
    <DateHeader v-model:selectedDate="selectedDate" />

    <StatsSummary
            :selectedDate="selectedDate"
            :glucoseReadings="glucoseReadings"
            :foodLogs="foodLogs"
            :bolusDoses="bolusDoses"
            :basalEntries="basalEntries"
    />

    <BgChart />
    <Tabs
            :notes="notes"
            :food-logs="foodLogs"
            :bolus-doses="bolusDoses"
            :fasts="fasts"
            :workouts="workouts"
            :basal-entries="basalEntries"
            :glucose-readings="glucoseReadings"
            :selected-date="selectedDate"
    />
  </main>
</template>