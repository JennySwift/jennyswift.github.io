//FastStatsTab.vue
<script setup>
    import { ref, computed, watch } from 'vue'
    import { DateTime } from 'luxon'
    import { fetchTotalFastOverlapSeconds } from '../../supabase/supabaseFasts'
    import { formatMinutesAsHM, sydneyRangeUtcISOExclusive } from '../../helpers/dateHelpers'

    // Anchor date = "current week" in Sydney
    const anchor = ref(DateTime.local().setZone('Australia/Sydney').toJSDate())

    // Custom date range (Sydney midnight→midnight)
    const todaySydney = DateTime.local().setZone('Australia/Sydney').startOf('day')
    const startDate = ref(todaySydney.minus({ days: 6 }).toJSDate()) // default: last 7 days
    const endDate   = ref(todaySydney.toJSDate())                     // inclusive end day

    const label = computed(() => {
        const fmt = (dt) => dt.setZone('Australia/Sydney').toFormat('d LLL yyyy')
        return `${fmt(DateTime.fromJSDate(startDate.value))} → ${fmt(DateTime.fromJSDate(endDate.value))}`
    })

    const startInput = computed(() =>
        DateTime.fromJSDate(startDate.value).setZone('Australia/Sydney').toFormat('yyyy-LL-dd')
    )
    const endInput = computed(() =>
        DateTime.fromJSDate(endDate.value).setZone('Australia/Sydney').toFormat('yyyy-LL-dd')
    )

    function setStartFromInput(e) {
        const dt = DateTime.fromISO(e.target.value, { zone: 'Australia/Sydney' }).startOf('day')
        startDate.value = dt.toJSDate()
    }
    function setEndFromInput(e) {
        const dt = DateTime.fromISO(e.target.value, { zone: 'Australia/Sydney' }).startOf('day')
        endDate.value = dt.toJSDate()
    }

    const loading = ref(false)
    const errorMsg = ref('')
    const avgHM = ref('—')

    // Convert seconds → "16h30m"
    function secondsToHM(sec) {
        if (sec == null) return '—'
        const minutes = Math.round(sec / 60)
        return formatMinutesAsHM(minutes)
    }

    async function load() {
        loading.value = true
        errorMsg.value = ''
        try {
            const { startUtcISO, endUtcISO } = sydneyRangeUtcISOExclusive(startDate.value, endDate.value)

            // total fasting seconds within [start, end)
            const totalSec = await fetchTotalFastOverlapSeconds(startUtcISO, endUtcISO)

            // average per 24h day in the range
            const startDt = DateTime.fromISO(startUtcISO)
            const endDt   = DateTime.fromISO(endUtcISO)
            const dayCount = Math.max(1, endDt.diff(startDt, 'days').days) // e.g. 2.0 days for 17→19
            const avgPerDaySec = totalSec / dayCount

            avgHM.value = secondsToHM(avgPerDaySec)
        } catch (e) {
            console.error('[FastStatsTab] load failed:', e)
            errorMsg.value = 'Failed to load.'
            avgHM.value = '—'
        } finally {
            loading.value = false
        }
    }

    // Auto-reload when dates change
    watch([startDate, endDate], () => { load() })

    // Replace your rangeDays() with this (exclusive end):
    function rangeDays() {
        const s = DateTime.fromJSDate(startDate.value).setZone('Australia/Sydney').startOf('day')
        const e = DateTime.fromJSDate(endDate.value).setZone('Australia/Sydney').startOf('day')
        const diff = Math.floor(e.diff(s, 'days').days) // exclusive end → no +1
        return Math.max(1, diff) // ensure at least 1 day
    }

    function shiftRange(byDays) {
        const s = DateTime.fromJSDate(startDate.value).setZone('Australia/Sydney').startOf('day')
        const e = DateTime.fromJSDate(endDate.value).setZone('Australia/Sydney').startOf('day')
        startDate.value = s.plus({ days: byDays }).toJSDate()
        endDate.value   = e.plus({ days: byDays }).toJSDate()
    }

    function prevRange() { shiftRange(-rangeDays()) }
    function nextRange() { shiftRange(rangeDays()) }

    // initial
    load()
</script>

<template>
    <div class="stats-card">
        <div class="row">
            <button type="button" @click="prevRange">◀︎ Prev</button>
            <div class="range">{{ label }}</div>
            <div class="pickers">
                <input type="date" :value="startInput" @change="setStartFromInput" />
                <span>→</span>
                <input type="date" :value="endInput" @change="setEndFromInput" />
            </div>
            <button type="button" @click="nextRange">Next ▶︎</button>
        </div>

        <div class="metric">
            <div class="title">Average Fasting Duration Per 24 Hours</div>
            <div class="value" :class="{ dim: loading }">{{ avgHM }}</div>
            <div v-if="errorMsg" class="err">{{ errorMsg }}</div>
        </div>
    </div>
</template>

<style scoped>
    .stats-card {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        background: #fff;
    }
    .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
    }
    .range { font-weight: 600; }
    .metric .title { color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .metric .value { font-size: 1.75rem; font-weight: 800; }
    .metric .value.dim { opacity: .6; }
    .err { color: #b91c1c; margin-top: 6px; }
    button {
        border: 1px solid #d1d5db; border-radius: 8px; padding: 4px 8px; background: #fff; cursor: pointer;
    }
    button:hover { background: #f9fafb; }
    .pickers { display: flex; align-items: center; gap: 6px; }
    input[type="date"] { padding: 3px 6px; border: 1px solid #d1d5db; border-radius: 6px; }
</style>