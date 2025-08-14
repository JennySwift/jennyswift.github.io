<script setup>
    import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
    import DateHeader from './components/DateHeader.vue'
    import BgChart from './components/BgChart.vue'
    import BasalChart from './components/BasalChart.vue'
    import Tabs from './components/tabs/Tabs.vue'
    import Tooltip from './components/CustomTooltip.vue'
    import { getSydneyStartOfToday } from './helpers/dateHelpers'
    import { fetchDashboardData } from './helpers/dataService'
    import { DateTime } from 'luxon';

    const notes = ref([])
    const glucoseReadings = ref([])
    const foodLogs = ref([])
    const fasts = ref([])
    const workouts = ref([])
    const basalEntries = ref([])
    const bolusDoses = ref([])
    const selectedDate = ref(getSydneyStartOfToday())

    // Treat ISO strings with an explicit offset/Z as that instant.
    // Treat unzoned strings as Australia/Sydney local wall time.
    // Numbers = epoch ms. Dates pass through.
    const toSydneyJSDate = (v) => {
        if (v instanceof Date) return v
        if (typeof v === 'number') return new Date(v)
        if (typeof v === 'string') {
            const dt = /Z|[+\-]\d{2}:?\d{2}$/.test(v)
                ? DateTime.fromISO(v)                             // has TZ → respect it
                : DateTime.fromISO(v, { zone: 'Australia/Sydney' }) // no TZ → Sydney local
            return dt.toJSDate()
        }
        return null
    }

    const stageRef = ref(null)
    const tooltip = reactive({ visible:false, time:'', bg:null, basal:null, left: 12, locked:false })

    function clamp(n, min, max) { return Math.max(min, Math.min(n, max)) }

    function handleChartHover(e) {
        const { x, px, source, hide } = e?.detail ?? {}

            console.log('[handleChartHover] x value:', x, 'type:', typeof x);

        if (hide) {
            tooltip.visible = false
            tooltip.locked = false
            return
        }

        const ts = x != null ? new Date(x) : null

        if (!ts) {
            if (!tooltip.locked) {
                tooltip.visible = false
            }
            return
        }

        // position horizontally inside the stage wrapper
        const stageRect = stageRef.value?.getBoundingClientRect()
        if (stageRect && typeof px === 'number') {
            const approxWidth = 180   // rough width of tooltip for clamping
            const padding = 8
            const centeredLeft = px - approxWidth / 2
            tooltip.left = clamp(centeredLeft, padding, stageRect.width - approxWidth - padding)
        }

        tooltip.locked = (source === 'combined')
        tooltip.visible = true
        tooltip.time = DateTime.fromMillis(Number(x)).setZone('Australia/Sydney').toFormat('h:mma')
        // tooltip.time = formatTimeInSydney(ts)
        tooltip.bg = findBGAt(ts)
        tooltip.basal = findBasalRateAt(ts)
    }


    // BG at time T = the most recent reading at or before T (not "nearest")
    function findBGAt(when) {
        if (!glucoseReadings.value.length || !when) return null
        const target = when instanceof Date ? when : new Date(when)

        let bestTs = null
        let bestVal = null

        for (const r of glucoseReadings.value) {
            const ts = toSydneyJSDate(r.timestamp)
            if (ts <= target && (bestTs === null || ts > bestTs)) {
                bestTs = ts
                bestVal = Number(r.value)
            }
        }
        return bestVal
    }

    // Basal rate at time T = the segment whose [start, end) contains T
    function findBasalRateAt(when) {
        if (!basalEntries.value.length || !when) return null
        const t = when instanceof Date ? when : new Date(when)

        for (const e of basalEntries.value) {
            const start = e.startTime instanceof Date ? e.startTime : toSydneyJSDate(e.startTime)
            const end   = e.endTime ? (e.endTime instanceof Date ? e.endTime : toSydneyJSDate(e.endTime)) : null
            if (start <= t && (end === null || t < end)) {
                return Number(e.rate ?? 0)
            }
        }
        return null
    }

    function closeLastBasalEntryAtPumpUploadTime(data) {
        if (!data?.pumpUploadTime || basalEntries.value.length === 0) return

        const lastEntry = basalEntries.value[basalEntries.value.length - 1]
        if (!lastEntry.endTime) {
            lastEntry.endTime = toSydneyJSDate(data.pumpUploadTime)
        }
    }

    onBeforeUnmount(() => {
        window.removeEventListener('chart-hover', handleChartHover)
    })

    onMounted(async () => {
        window.addEventListener('chart-hover', handleChartHover)

        try {
            const data = await fetchDashboardData()

            glucoseReadings.value = Array.isArray(data?.glucoseReadings)
                ? data.glucoseReadings.map(r => ({
                    timestamp: r.timestamp,
                    value: r.value,
                }))
                : []

            foodLogs.value = Array.isArray(data?.foodLogs)
                ? data.foodLogs.map(f => ({
                    timestamp: toSydneyJSDate(f.timestamp),
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
                    timestamp: toSydneyJSDate(n.startTime),
                    noteNumber: n.noteNumber,
                    text: n.text,
                    tags: n.tags ?? [],
                    title: n.title ?? '',
                }))
                : []

            fasts.value = Array.isArray(data?.fasts)
                ? data.fasts.map(f => {
                    const startTime = toSydneyJSDate(f.startTime)
                    const endTime = f.endTime ? toSydneyJSDate(f.endTime) : null
                    const duration = endTime ? (endTime - startTime) / 1000 : null // seconds
                    return { startTime, endTime, duration, notes: f.notes }
                })
                : []

            workouts.value = Array.isArray(data?.workouts)
                ? data.workouts.map(w => ({
                    start: toSydneyJSDate(w.startTime),
                    name: w.name,
                    type: w.type,
                    duration: w.duration,
                    distance: w.distance,
                    activeCalories: w.activeCalories,
                    maxHeartRate: w.maxHeartRate,
                    endTime: toSydneyJSDate(w.endTime),
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
                    startTime: toSydneyJSDate(b.startTime),
                    endTime: b.endTime ? toSydneyJSDate(b.endTime) : null,
                    rate: b.rate,
                    mode: b.mode,
                    notes: b.notes,
                }))
                : []

            closeLastBasalEntryAtPumpUploadTime(data)

            bolusDoses.value = Array.isArray(data?.bolusDoses)
                ? data.bolusDoses.map(b => ({
                    timestamp: toSydneyJSDate(b.timestamp),
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
    <DateHeader v-model:selectedDate="selectedDate" />

    <!-- stage wrapper so tooltip can't cover the header -->
    <div ref="stageRef" class="chart-stage" style="position:relative; margin-top:.5rem;">
      <Tooltip
              :visible="tooltip.visible"
              :time="tooltip.time"
              :bg="tooltip.bg"
              :basal="tooltip.basal"
              :left="tooltip.left"
              :top="8"
      />
      <BgChart :glucose-readings="glucoseReadings" :selected-date="selectedDate" />
      <BasalChart :basal-entries="basalEntries" :selected-date="selectedDate" />
    </div>

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