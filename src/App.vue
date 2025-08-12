<script setup>
    import { ref, onMounted } from 'vue'
    import DateHeader from './components/DateHeader.vue'
    import BgChart from './components/BgChart.vue'
    import Tabs from './components/Tabs.vue'
    import { parseAsSydneyDate } from './helpers/dateHelpers'
    import { fetchDashboardData } from './helpers/dataService'

    const notes = ref([])

    onMounted(async () => {
        try {
            const data = await fetchDashboardData()
            notes.value = Array.isArray(data?.notes)
                ? data.notes.map(n => ({
                    timestamp: parseAsSydneyDate(n.startTime),
                    noteNumber: n.noteNumber,
                    text: n.text,
                    tags: n.tags ?? [],
                    title: n.title ?? ''
                }))
                : []
            console.log('[App:onMounted] notes loaded:', notes.value.length)
        } catch (e) {
            console.error('[App:onMounted] failed to load data:', e)
        }
    })

    function handleNoteClick(ts) {
        console.log('[handleNoteClick] timestamp:', ts)
        // Next step: scroll chart / change date based on note ts.
    }
</script>

<template>
  <main style="padding: 1rem;">
    <h1>Control Dashboard</h1>
    <DateHeader />
    <BgChart />
    <Tabs :notes="notes" @note-click="handleNoteClick" />
  </main>
</template>