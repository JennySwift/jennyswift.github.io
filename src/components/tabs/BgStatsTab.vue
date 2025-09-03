<script setup>
    import { computed } from 'vue'
    import { getStartAndEndOfDay, parseAsSydneyDate, formatMinutesAsHM } from '../../helpers/dateHelpers'

    const props = defineProps({
        selectedDate:    { type: Date, required: true },
        glucoseReadings: { type: Array, default: () => [] },
    })

    const toMgdl = (mmol) => mmol != null && isFinite(mmol) ? Math.round(mmol * 18) : null

    const segmentWidth = (minutes) => {
        const covered = glucoseSummary.value.totalCoveredMinutes || 1
        return `${(minutes / covered) * 100}%`
    }

    const segments = computed(() => {
        const s = glucoseSummary.value
        const covered = s.totalCoveredMinutes

        return [
            { class: 'low',       minutes: s.timeBelow4 },
            { class: 'in-range',  minutes: s.timeBetween4and6 },
            { class: 'six-to-eight',  minutes: s.timeBetween6and8 },
            { class: 'high',      minutes: s.timeBetween8and10 },
            { class: 'very-high', minutes: s.timeAbove10 },
        ].filter(seg => seg.minutes > 0 && covered > 0)
    })

    const glucoseSummary = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const readings = props.glucoseReadings
            .map(r => ({ timestamp: r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp), value: Number(r.value) }))
            .filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay)
            .sort((a, b) => a.timestamp - b.timestamp)

        let tBelow4 = 0, t4to6 = 0, t6to8 = 0, t8to10 = 0, tAbove8 = 0, tAbove10 = 0, t4to10 = 0, covered = 0
        let minVal = Infinity
        let maxVal = -Infinity
        //Average BG
        let weightedSum = 0

        for (let i = 0; i < readings.length; i++) {
            const cur = readings[i], next = readings[i+1]
            const start = cur.timestamp
            const end   = next ? next.timestamp : new Date(Math.min(endOfDay, cur.timestamp.getTime() + 5*60*1000))
            const mins = Math.max(0, (end - start) / 60000)
            covered += mins
            const v = cur.value
            if (v < 4) tBelow4 += mins
            if (v >= 4 && v <= 6) t4to6 += mins
            if (v > 6 && v <= 8) t6to8 += mins
            if (v >= 4 && v <= 10) t4to10 += mins
            if (v > 8) tAbove8 += mins
            if (v > 10) tAbove10 += mins
            if (v > 8 && v <= 10) t8to10 += mins

            //Min BG
            if (Number.isFinite(v) && v < minVal) minVal = v
            //Max BG
            if (Number.isFinite(v) && v > maxVal) maxVal = v
            //Average BG
            if (Number.isFinite(v)) weightedSum += v * mins
        }

        const denom = Math.max(covered, 1) // avoid divide-by-zero

        //Min and Max BG
        const minMmol = Number.isFinite(minVal) ? minVal : null
        const maxMmol = Number.isFinite(maxVal) ? maxVal : null
        //Average BG
        const avgMmol = covered > 0 && Number.isFinite(weightedSum) ? (weightedSum / covered) : null

        return {
            timeBelow4: tBelow4,
            timeBetween4and6: t4to6,
            timeBetween6and8: t6to8,
            timeBetween8and10: t8to10,
            timeAbove8: tAbove8,
            timeAbove10: tAbove10,
            timeBetween4and10: t4to10,
            totalCoveredMinutes: covered,
            uncoveredMinutes: Math.max(0, 1440 - covered),
            uncoveredSeconds: Math.max(0, (1440 - covered) * 60),

            // Percentages based on covered time (matches Dexcom-style reporting)
            pct4to6: (t4to6 / denom) * 100,
            pct4to10: (t4to10 / denom) * 100,

            //Lowest and highest BG
            lowestBG: minMmol,
            highestBG: maxMmol,
            averageBG: avgMmol,
        }
    })
</script>

<template>
    <div class="range-bar-wrapper">
        <div class="range-bar-vertical">
            <!-- Reverse both the bar and label segments so 'Above 10' is at the top -->
            <div

                    v-for="segment in segments.slice().reverse()"
                    :key="segment.class"
                    class="segment"
                    :class="segment.class"
                    :style="{ height: `${(segment.minutes / glucoseSummary.totalCoveredMinutes) * 100}%` }"
            />
        </div>

        <div class="range-bar-labels">
            <!-- Reverse both the bar and label segments so 'Above 10' is at the top -->
            <div
                    v-for="segment in segments.slice().reverse()"
                    :key="segment.class + '-label'"
                    class="label-row"
            >

                <span class="range-name">
  {{
    segment.class === 'low' ? `Below 4 (${toMgdl(4)})` :
    segment.class === 'in-range' ? `4–6 (${toMgdl(4)}–${toMgdl(6)})` :
    segment.class === 'six-to-eight' ? `6–8 (${toMgdl(6)}–${toMgdl(8)})` :
    segment.class === 'high' ? `8–10 (${toMgdl(8)}–${toMgdl(10)})` :
    segment.class === 'very-high' ? `Above 10 (${toMgdl(10)})` : ''
  }}
</span>

                <span class="range-percent">
        {{ ((segment.minutes / glucoseSummary.totalCoveredMinutes) * 100).toFixed(1) }}%
      </span>
                <span class="range-duration">
        {{ formatMinutesAsHM(segment.minutes) }}
      </span>
            </div>
        </div>
    </div>

    <div class="bg-grid">
        <div class="row in-range">
            <span>In range (4–10)</span>
            <div class="right">
                <span class="chip chip-green">{{ glucoseSummary.pct4to10.toFixed(1) }}%</span>
                <strong>{{ formatMinutesAsHM(glucoseSummary.timeBetween4and10) }}</strong>
            </div>
        </div>

        <!--<div class="row in-range">-->
            <!--<span>In range, stricter (4–6)</span>-->
            <!--<div class="right">-->
                <!--<span class="chip chip-green">{{ glucoseSummary.pct4to6.toFixed(1) }}%</span>-->
                <!--<strong>{{ formatMinutesAsHM(glucoseSummary.timeBetween4and6) }}</strong>-->
            <!--</div>-->
        <!--</div>-->

        <!--<div class="row above-10">-->
            <!--<span>High (above 10)</span>-->
            <!--<strong>{{ formatMinutesAsHM(glucoseSummary.timeAbove10) }}</strong>-->
        <!--</div>-->

        <!--<div class="row above-8">-->
            <!--<span>Above 8</span>-->
            <!--<strong>{{ formatMinutesAsHM(glucoseSummary.timeAbove8) }}</strong>-->
        <!--</div>-->

        <!--<div class="row low">-->
            <!--<span>Low (below 4)</span>-->
            <!--<strong>{{ formatMinutesAsHM(glucoseSummary.timeBelow4) }}</strong>-->
        <!--</div>-->

        <div class="row grey">
            <span>Average BG</span>
            <strong>
                {{ glucoseSummary.averageBG != null ? glucoseSummary.averageBG.toFixed(2) + ' ' : '—' }}
                <span v-if="glucoseSummary.averageBG != null" class="secondary">({{ (glucoseSummary.averageBG * 18).toFixed(0) }} mg/dL)</span>
            </strong>
        </div>

        <div class="row low">
            <span>Lowest BG</span>
            <strong>{{ glucoseSummary.lowestBG != null ? glucoseSummary.lowestBG.toFixed(2) + ' ' : '—' }}
                <span v-if="glucoseSummary.lowestBG != null" class="secondary">({{ (glucoseSummary.lowestBG * 18).toFixed(0) }} mg/dL)</span>
            </strong>
        </div>

        <div class="row above-10">
            <span>Highest BG</span>
            <strong>
                {{ glucoseSummary.highestBG != null ? glucoseSummary.highestBG.toFixed(2) + ' ' : '—' }}
                <span v-if="glucoseSummary.highestBG != null" class="secondary">({{ (glucoseSummary.highestBG * 18).toFixed(0) }} mg/dL)</span>
            </strong>
        </div>



        <div class="foot">
            Time not covered in the calculations:
            <strong>{{ formatMinutesAsHM(glucoseSummary.uncoveredMinutes) }}</strong>
            <!--<small>{{ glucoseSummary.uncoveredSeconds.toFixed(2) }} seconds</small>-->
        </div>
    </div>

    <!--<div class="range-bar">-->
        <!--<div-->
                <!--v-for="segment in segments"-->
                <!--:key="segment.class"-->
                <!--class="segment"-->
                <!--:class="segment.class"-->
                <!--:style="{ width: `${(segment.minutes / glucoseSummary.totalCoveredMinutes) * 100}%` }"-->
        <!--/>-->
    <!--</div>-->



</template>

<style scoped>
    .bg-grid { display:grid; gap:.5rem; }

    .row {
        display:flex;
        justify-content:space-between;
        align-items:center;
        background:#f8fafc;
        border: 1px solid #e5e7eb;
        border-radius:8px;
        padding:.6rem .8rem;
        &.above-8  { border-left: 4px solid var(--color-high); }
        &.above-10  { border-left: 4px solid var(--color-very-high); }
        &.low   { border-left: 4px solid var(--color-low); }
        &.grey  { border-left: 4px solid #777; }
        &.in-range { border-left: 4px solid var(--color-in-range); }
    }
    .foot { color:#374151; font-size:.9rem; }
    .right { display: flex; align-items: center; gap: 8px; }

    .chip {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: .85rem;
        font-weight: 600;
        border: 1px solid #d1fae5;       /* light green border */
        background: #ecfdf5;              /* very light green bg */
        color: #065f46;                   /* deep green text */
    }

    .chip-green {
        border-color: #bbf7d0;            /* alt green */
        background: #f0fdf4;
        color: #166534;
    }
    .secondary { opacity: .75; margin-left: 6px; font-weight: 600; }

    .range-bar {
        display: flex;
        height: 20px;
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
        border: 1px solid var(--color-border);
    }

    .segment {
        height: 100%;
    }

    .segment.low  { background-color: var(--color-low); }
    .segment.in-range  { background-color: var(--color-in-range); }
    .segment.six-to-eight  { background-color: var(--color-6-8); }
    .segment.high      { background-color: var(--color-high); }
    .segment.very-high { background-color: var(--color-very-high); }
    /*.segment:first-child {*/
        /*border-top-left-radius: 8px;*/
        /*border-bottom-left-radius: 8px;*/
    /*}*/

    /*.segment:last-child {*/
        /*border-top-right-radius: 8px;*/
        /*border-bottom-right-radius: 8px;*/
    /*}*/

    .range-bar-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-top: 2rem;
        margin-bottom: 30px;
    }

    .range-bar-vertical {
        display: flex;
        flex-direction: column;
        width: 20px;
        height: 240px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--color-border);
    }

    .range-bar-vertical .segment {
        width: 100%;
    }

    .range-bar-labels {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 240px;
        font-size: 0.9rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }

    .label-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .label-row .range-name,
    .label-row .range-percent,
    .label-row .range-duration {
        font-size: 0.9rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: #1f2937;
        min-width: 110px;
        text-align: left;
    }

    .label-row .range-percent,
    .label-row .range-duration {
        text-align: right;
    }
    .range-bar-vertical .segment:first-child {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }

    .range-bar-vertical .segment:last-child {
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }
</style>