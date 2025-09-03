//App.vue
<script setup>
    import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
    import DateHeader from './components/DateHeader.vue'
    import BgChart from './components/charts/BgChart.vue'
    import NotesChart from './components/charts/NotesChart.vue'
    import BasalChart from './components/charts/BasalChart.vue'
    import BolusChart from './components/charts/BolusChart.vue'
    import HourlyBasalChart from './components/charts/HourlyBasalChart.vue'
    import FoodLogsChart from './components/charts/FoodLogsChart.vue'
    import WorkoutsChart from './components/charts/WorkoutsChart.vue'
    import Tabs from './components/tabs/Tabs.vue'
    import Tooltip from './components/CustomTooltip.vue'
    import { getSydneyStartOfToday } from './helpers/dateHelpers'
    // import { fetchDashboardData } from './helpers/dataService'
    import { DateTime } from 'luxon'
    import { loadAllForSelectedDay } from './dayLoadersUI'
    import { fetchAllFoods } from './supabase/supabaseFoods'
    import { fetchFoodLogsBetween } from './supabase/supabaseFoodLogs'
    import { fetchWeightsBetween } from './supabase/supabaseWeights'
    import { fetchDailyActivityBetween } from './supabase/supabaseDailyActivity'


    const data = reactive({
        notes: [],
        filteredNotes: [],
        filteredNotesCursor: null,
        foods: [],
        glucoseReadings: [],
        foodLogs: [],
        fasts: [],
        workouts: [],
        basalEntries: [],
        boluses: [],
        //For the weekly calories tab
        weeklyFoodLogs: [],
        weeklyWeights: [],
        dailyActivity: []
    })

    const loading = reactive({
        boluses: false,
        bg: false,
        basal: false,
        filteredNotes: false,
        foodLogs: false,
        foods: false,
        fasts: false,
        workouts: false
    })

    const selectedDate = ref(getSydneyStartOfToday())
    const stageRef = ref(null)

    const tooltip = reactive({
        visible: false,
        time: '',
        bg: null,
        basal: null,
        left: 12,
        locked: false,
        hourlyBasalUnits: null,
        hourlyBasalLabel: '',
        bolus: null,
        note: null,
        workout: null,
    })

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

    // Hourly basal totals for the selected day (array[24] of units)
    const hourlyBasalTotals = computed(() => {
        const totals = new Array(24).fill(0)
        if (!selectedDate.value || !Array.isArray(data.basalEntries)) return totals

        // Selected day window in Australia/Sydney
        const base = selectedDate.value instanceof Date
            ? selectedDate.value
            : toSydneyJSDate(selectedDate.value)
        let dayStart = DateTime.fromJSDate(base, { zone: 'Australia/Sydney' }).startOf('day')
        const dayEnd = dayStart.plus({ days: 1 })

        for (const e of data.basalEntries) {
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

    async function loadFoodsFromSupabase() {
        loading.foods = true
        try {
            data.foods = await fetchAllFoods()
        } catch (e) {
            console.error('[App] fetchAllFoods failed:', e)
            data.foods = []
        } finally {
            loading.foods = false
        }
    }

    async function loadDailyActivity(weeksBack = 26, tz = 'Australia/Sydney') {
        const now = DateTime.now().setZone(tz)
        const start = now.minus({ weeks: weeksBack }).startOf('week').toJSDate()
        const end   = now.plus({ days: 1 }).startOf('day').toJSDate() // end-exclusive next midnight

        try {
            data.dailyActivity = await fetchDailyActivityBetween(start, end, tz)
            console.log('[daily activity range]',
                'start=', start.toISOString(),
                'endExclusive=', end.toISOString(),
                'rows=', data.dailyActivity.length
            )
        } catch (e) {
            console.error('[loadDailyActivity] failed:', e)
            data.dailyActivity = []
        }
    }

    async function loadWeeklyWeights(weeksBack = 26, tz = 'Australia/Sydney') {
        const now = DateTime.now().setZone(tz)
        const start = now.minus({ weeks: weeksBack }).startOf('week').toJSDate()
        const end = now.plus({ days: 1 }).startOf('day').toJSDate()
        loading.weights = true
        try {
            data.weeklyWeights = await fetchWeightsBetween(start, end)
            const first = data.weeklyWeights[0]?.timestamp ?? '-'
            const last = data.weeklyWeights.at(-1)?.timestamp ?? '-'
                console.log('[weekly weights] rows=', data.weeklyWeights.length, 'first=', first, 'last=', last)
        } catch (e) {
            console.error('[loadWeeklyWeights] failed:', e)
            data.weeklyWeights = []
        } finally {
            loading.weights = false
        }
    }


    async function loadWeeklyFoodLogs(weeksBack = 26, tz = 'Australia/Sydney') {
        const now = DateTime.now().setZone(tz)

        // Start: Monday 00:00 of (now - weeksBack)
        const start = now.minus({ weeks: weeksBack }).startOf('week').toJSDate()

        // End (exclusive): next midnight after “today” in Sydney
        // Using next midnight avoids any edge-case at 23:59:59.999
        const end = now.plus({ days: 1 }).startOf('day').toJSDate()

        try {
            data.weeklyFoodLogs = await fetchFoodLogsBetween(start, end, tz)
            console.log('[weekly range]',
                'start=', start.toISOString(),
                'endExclusive=', end.toISOString(),
                'rows=', data.weeklyFoodLogs.length
            )
        } catch (e) {
            console.error('[loadFoodLogsWeekly] failed:', e)
            data.weeklyFoodLogs = []
        }
    }

    // async function loadWeeklyFoodLogs(weeksBack = 26, tz = 'Australia/Sydney') {
    //     const end = DateTime.now().setZone(tz).endOf('day').toJSDate()
    //     const start = DateTime.now().setZone(tz).minus({ weeks: weeksBack }).startOf('week').toJSDate()
    //     try {
    //         data.weeklyFoodLogs = await fetchFoodLogsBetween(start, end, tz)
    //     } catch (e) {
    //         console.error('[loadFoodLogsWeekly] failed:', e)
    //         data.weeklyFoodLogs = []
    //     }
    // }


    function handleChartHover(e) {
        const { x, px, source, hide, bolus, note, foodLogs, workout } = e?.detail ?? {}

            console.log('[handleChartHover] x value:', x, 'type:', typeof x);

        if (hide) {
            tooltip.visible = false
            tooltip.locked = false
            tooltip.hourlyBasalUnits = null
            tooltip.hourlyBasalLabel = ''
            tooltip.bolus = null
            tooltip.note = null
            tooltip.foodLogs = null
            tooltip.workout = null
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

        //Hourly Basal
        const dtSydney = DateTime.fromMillis(Number(x)).setZone('Australia/Sydney')
        const hourIdx = dtSydney.hour // 0..23
        const start = dtSydney.startOf('hour')
        const end = start.plus({ hours: 1 })
        const fmt = (dt) => dt.toFormat('h a').toLowerCase().replace(' ', '')
        tooltip.hourlyBasalLabel = `${fmt(start)}–${fmt(end)}`
        tooltip.hourlyBasalUnits = Number(hourlyBasalTotals.value?.[hourIdx] ?? 0)

        tooltip.locked = (source === 'combined')
        tooltip.visible = true
        tooltip.time = DateTime.fromMillis(Number(x)).setZone('Australia/Sydney').toFormat('h:mma')
        // tooltip.time = formatTimeInSydney(ts)
        tooltip.bg = findBGAt(ts)
        tooltip.basal = findBasalRateAt(ts)

        // Show bolus amount only when the bolus chart is the hover source
        if (source === 'bolus' && bolus?.amount != null) {
            tooltip.bolus = {
                amount: Number(bolus.amount),
                type: bolus.type ?? null,
            }
        } else {
            tooltip.bolus = null
        }

        // Show note only when notes chart hovers
        if (source === 'note' && note?.text) {
            tooltip.note = note
        } else {
            tooltip.note = null
        }

        if (source === 'foodLogs' && foodLogs?.logs?.length) {
            tooltip.foodLogs = {
                logs: foodLogs.logs,
                netCarbs: Number(foodLogs.netCarbs ?? 0)
            }
        } else {
            tooltip.foodLogs = null
        }

        if (source === 'workouts' && workout) {
            tooltip.workout = workout
        } else {
            tooltip.workout = null
        }

    }


    // BG at time T = the most recent reading at or before T (not "nearest")
    function findBGAt(when) {
        if (!data.glucoseReadings.length || !when) return null
        const target = when instanceof Date ? when : new Date(when)

        let bestTs = null
        let bestVal = null

        for (const r of data.glucoseReadings) {
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
        if (!data.basalEntries.length || !when) return null
        const t = when instanceof Date ? when : new Date(when)

        for (const e of data.basalEntries) {
            const start = e.startTime instanceof Date ? e.startTime : toSydneyJSDate(e.startTime)
            const end   = e.endTime ? (e.endTime instanceof Date ? e.endTime : toSydneyJSDate(e.endTime)) : null
            if (start <= t && (end === null || t < end)) {
                return Number(e.rate ?? 0)
            }
        }
        return null
    }



    watch(selectedDate, (d) => {
        loadAllForSelectedDay(data, loading, d)
    }, { immediate: true })

    onBeforeUnmount(() => {
        window.removeEventListener('jump-to-time', onJumptoTime)
        window.removeEventListener('chart-hover', handleChartHover)
    })

    onMounted(async () => {
        window.addEventListener('jump-to-time', onJumptoTime)
        window.addEventListener('chart-hover', handleChartHover)

        await loadFoodsFromSupabase()
        await loadWeeklyFoodLogs(26) // last ~6 months
        await loadWeeklyWeights(26)
        await loadDailyActivity(26)

        try {
            // const payload = await fetchDashboardData()

            console.log('[App:onMounted] loaded', {
                glucose: data.glucoseReadings.length,
                foodLogs: data.foodLogs.length,
                notes: data.notes.length,
                fasts: data.fasts.length,
                workouts: data.workouts.length,
                basalEntries: data.basalEntries.length,
                boluses: data.boluses.length,
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
                  :hourly-basal-units="tooltip.hourlyBasalUnits"
                  :hourly-basal-label="tooltip.hourlyBasalLabel"
                  :bolus="tooltip.bolus"
                  :note="tooltip.note"
                  :foodLogs="tooltip.foodLogs"
                  :workout="tooltip.workout"
          />

          <div class="chart-box food-logs-box">
            <FoodLogsChart :food-logs="data.foodLogs" :selected-date="selectedDate" />
          </div>

          <div class="chart-box bg-box">
            <BgChart :glucose-readings="data.glucoseReadings" :selected-date="selectedDate" />
          </div>

          <div class="chart-box notes-box">
            <NotesChart
                    :notes="data.notes"
                    :selected-date="selectedDate"
                    note-icon-url="/note-icon.png"
            />
          </div>

          <div class="chart-box bolus-box">
            <BolusChart :boluses="data.boluses" :selected-date="selectedDate" />
          </div>

          <div class="chart-box basal-box">
            <BasalChart :basal-entries="data.basalEntries" :selected-date="selectedDate" />
          </div>

          <div class="chart-box hourly-basal-box">
            <HourlyBasalChart
                    :hourly-totals="hourlyBasalTotals"
                    :selected-date="selectedDate"
            />
          </div>

          <div class="chart-box workout-box">
            <WorkoutsChart :workouts="data.workouts" :selected-date="selectedDate" />
          </div>



        </div>
      </aside>

      <main class="right-rail">
        <Tabs
                :data="data"
                :hourly-basal-totals="hourlyBasalTotals"
                :selected-date="selectedDate"
                :loading="loading"
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

  .chart-box > * {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Layout the two boxes with a tiny gap */
  .chart-stage {
    display: grid;
    z-index: 1;
    /*row-gap: 8px;*/
  }

  .bg-box {
    height: 120px;
  }

  .notes-box {
    height: 50px;
    margin-bottom: -25px;
    margin-top: -10px;
    //Fix the notes not lining up with the other charts at the right times
    padding-right: 5px
  }
  .basal-box {
    height: 100px;
  }

  .hourly-basal-box {
    height: 100px;
  }

  .food-logs-box {
    height: 100px;
  }
  .bolus-box {
    height: 100px;
  }

  .workout-box {
    height: 100px;
  }

  /* Make the chart components and their canvases fill the box height */
  .chart-box > * { width: 100%; height: 100%; display: block; }
  .chart-box canvas { height: 100% !important; width: 100% !important; }
</style>