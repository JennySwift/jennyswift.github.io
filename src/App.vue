<script setup>
    import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
    import DateHeader from './components/DateHeader.vue'
    import BgChart from './components/charts/BgChart.vue'
    import BasalChart from './components/charts/BasalChart.vue'
    import HourlyBasalChart from './components/charts/HourlyBasalChart.vue'
    import Tabs from './components/tabs/Tabs.vue'
    import Tooltip from './components/CustomTooltip.vue'
    import { getSydneyStartOfToday } from './helpers/dateHelpers'
    import { fetchDashboardData } from './helpers/dataService'
    import { DateTime } from 'luxon';

    const notes = ref([])
    const foods = ref([])
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

    // Hourly basal totals for the selected day (array[24] of units)
    const hourlyBasalTotals = computed(() => {
        const totals = new Array(24).fill(0)
        if (!selectedDate.value || !Array.isArray(basalEntries.value)) return totals

        // Selected day window in Australia/Sydney
        const base = selectedDate.value instanceof Date
            ? selectedDate.value
            : toSydneyJSDate(selectedDate.value)
        let dayStart = DateTime.fromJSDate(base, { zone: 'Australia/Sydney' }).startOf('day')
        const dayEnd = dayStart.plus({ days: 1 })

        for (const e of basalEntries.value) {
            const jsStart = e.startTime instanceof Date ? e.startTime : toSydneyJSDate(e.startTime)
            const jsEnd   = e.endTime   ? (e.endTime instanceof Date ? e.endTime : toSydneyJSDate(e.endTime)) : null
            if (!jsStart || !jsEnd || jsEnd <= jsStart) continue

            const ratePerHour = Number(e.rate) // U/h
            if (!Number.isFinite(ratePerHour) || ratePerHour <= 0) continue

            // Convert to Sydney and CLAMP to [dayStart, dayEnd)
            let cur = DateTime.fromJSDate(jsStart, { zone: 'Australia/Sydney' })
            let end = DateTime.fromJSDate(jsEnd,   { zone: 'Australia/Sydney' })

            if (end <= dayStart || cur >= dayEnd) continue // no overlap with selected day
            if (cur < dayStart) cur = dayStart
            if (end > dayEnd)   end = dayEnd

            // Walk hour buckets within the clamped range
            while (cur < end) {
                const bucketEnd = cur.startOf('hour').plus({ hours: 1 })
                const sliceEnd = end < bucketEnd ? end : bucketEnd

                const seconds = Math.max(0, sliceEnd.toSeconds() - cur.toSeconds())
                if (seconds > 0) {
                    const hourIdx = cur.hour // 0..23
                    totals[hourIdx] += ratePerHour * (seconds / 3600)
                }
                cur = sliceEnd
            }
        }

        return totals.map(v => Math.round(v * 1000) / 1000)
    })

    function clamp(n, min, max) { return Math.max(min, Math.min(n, max)) }

    function goToTimestamp(at, source = 'any') {
        // [goToTimestamp] normalize input → Luxon DateTime at Sydney wall-clock
        let dt
        if (at instanceof Date) dt = DateTime.fromJSDate(at)
        else if (typeof at === 'number') dt = DateTime.fromMillis(at)
        else if (typeof at === 'string')
            dt = /Z|[+\-]\d{2}:?\d{2}$/.test(at)
                ? DateTime.fromISO(at)
                : DateTime.fromISO(at, { zone: 'Australia/Sydney' })
        else return

        const sydney = dt.setZone('Australia/Sydney')

        // Move the daily view
        selectedDate.value = sydney.startOf('day').toJSDate()

        // Move the hover/vertical line
        const x = sydney.toMillis()
        window.dispatchEvent(new CustomEvent('chart-hover', {
            detail: { x, px: null, source } // ← pass source through
        }))

        console.log('[goToTimestamp] jumped to', sydney.toISO(), 'source:', source)
    }

    // keep a single reference so removeEventListener works
    const onJumptoTime = (e) => {
        const at = e?.detail?.at
        const source = e?.detail?.source ?? 'any'
            goToTimestamp(at, source)
    }

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
        window.removeEventListener('jump-to-time', onJumptoTime)
        window.removeEventListener('chart-hover', handleChartHover)
    })

    onMounted(async () => {
        window.addEventListener('jump-to-time', onJumptoTime)
        window.addEventListener('chart-hover', handleChartHover)

        try {
            const data = await fetchDashboardData()

            foods.value = Array.isArray(data?.foods)
                ? data.foods.map(f => ({
                    id: f.id,
                    name: f.name,
                    tags: Array.isArray(f.tags) ? f.tags : []
                }))
                : []

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
                    foodTags: Array.isArray(f.foodTags) ? f.foodTags : []
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


    <!-- stage wrapper so tooltip can't cover the header -->
    <section class="dashboard-grid">
      <aside class="left-rail">
        <DateHeader v-model:selectedDate="selectedDate" />
        <div ref="stageRef" class="chart-stage">
          <Tooltip
                  :visible="tooltip.visible"
                  :time="tooltip.time"
                  :bg="tooltip.bg"
                  :basal="tooltip.basal"
                  :left="tooltip.left"
                  :top="8"
          />

          <div class="chart-box bg-box">
            <BgChart :glucose-readings="glucoseReadings" :selected-date="selectedDate" />
          </div>
          <div class="chart-box basal-box">
            <BasalChart :basal-entries="basalEntries" :selected-date="selectedDate" />
          </div>

          <div class="chart-box hourly-basal-box">
            <HourlyBasalChart
                    :hourly-totals="hourlyBasalTotals"
                    :selected-date="selectedDate"
            />
          </div>



        </div>
      </aside>

      <main class="right-rail">
        <Tabs
                :notes="notes"
                :foods="foods"
                :food-logs="foodLogs"
                :bolus-doses="bolusDoses"
                :fasts="fasts"
                :workouts="workouts"
                :basal-entries="basalEntries"
                :hourly-basal-totals="hourlyBasalTotals"
                :glucose-readings="glucoseReadings"
                :selected-date="selectedDate"
        />
      </main>
    </section>
  </main>
</template>

<style scoped lang="scss">
  /* Desktop: two columns, sticky chart */
  .dashboard-grid {
    display: grid;
    grid-template-columns: 550px 1fr; /* adjust left width if needed */
    gap: 1rem;
    align-items: start;
  }

  .left-rail {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow: visible; /* let the tooltip overflow */
  }

  .chart-stage {
    position: relative;             /* keeps Tooltip positioning working */
    margin-top: .5rem;
  }

  .right-rail {
    min-width: 0;                   /* prevents overflow in CSS grid */
  }

  /* Small screens: fall back to single column, no sticky */
  @media (max-width: 980px) {
    .dashboard-grid { grid-template-columns: 1fr; }
    .left-rail {
      position: static;
      max-height: none;
      overflow: visible;
      margin-bottom: 1rem;
    }
  }

  .bg-box   { --box-h: var(--bg-chart-h); }
  .basal-box{ --box-h: var(--basal-chart-h); }

  .chart-box > * {
    width: 100%;
    height: 100%;
  }



  /* Layout the two boxes with a tiny gap */
  .chart-stage {
    display: grid;
    row-gap: 8px;
  }

  /* Fixed heights: you asked for 180px and 140px */
  .chart-box { position: relative; overflow: hidden; }
  .bg-box    { height: 180px; }
  .basal-box { height: 140px; }
  .hourly-basal-box { height: 140px; }

  /* Make the chart components and their canvases fill the box height */
  .chart-box > * { width: 100%; height: 100%; display: block; }
  .chart-box canvas { height: 100% !important; width: 100% !important; }
</style>