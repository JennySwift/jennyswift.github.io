<script setup>
    import { computed } from 'vue'
    import { getStartAndEndOfDay, parseAsSydneyDate, formatMinutesAsHM } from '../../helpers/dateHelpers'

    const props = defineProps({
        selectedDate:    { type: Date, required: true },
        glucoseReadings: { type: Array, default: () => [] },
    })

    const glucoseSummary = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const readings = props.glucoseReadings
            .map(r => ({ timestamp: r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp), value: Number(r.value) }))
            .filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay)
            .sort((a, b) => a.timestamp - b.timestamp)

        let tBelow4 = 0, t4to6 = 0, t4to10 = 0, tAbove8 = 0, tAbove10 = 0, covered = 0
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
            if (v >= 4 && v <= 10) t4to10 += mins
            if (v > 8) tAbove8 += mins
            if (v > 10) tAbove10 += mins

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
            timeBetween4and10: t4to10,
            timeAbove8: tAbove8,
            timeAbove10: tAbove10,
            totalCoveredMinutes: covered,
            uncoveredMinutes: Math.max(0, 1440 - covered),

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
    <div class="bg-grid">
        <div class="row green">
            <span>In range (4–10)</span>
            <div class="right">
                <span class="chip chip-green">{{ glucoseSummary.pct4to10.toFixed(1) }}%</span>
                <strong>{{ formatMinutesAsHM(glucoseSummary.timeBetween4and10) }}</strong>
            </div>
        </div>

        <div class="row green">
            <span>In range, stricter (4–6)</span>
            <div class="right">
                <span class="chip chip-green">{{ glucoseSummary.pct4to6.toFixed(1) }}%</span>
                <strong>{{ formatMinutesAsHM(glucoseSummary.timeBetween4and6) }}</strong>
            </div>
        </div>

        <div class="row red">
            <span>High (above 10)</span>
            <strong>{{ formatMinutesAsHM(glucoseSummary.timeAbove10) }}</strong>
        </div>

        <div class="row amber">
            <span>Above 8</span>
            <strong>{{ formatMinutesAsHM(glucoseSummary.timeAbove8) }}</strong>
        </div>

        <div class="row red">
            <span>Low (below 4)</span>
            <strong>{{ formatMinutesAsHM(glucoseSummary.timeBelow4) }}</strong>
        </div>

        <div class="row">
            <span>Lowest BG</span>
            <strong>
                {{ glucoseSummary.lowestBG != null ? glucoseSummary.lowestBG.toFixed(2) + ' ' : '—' }}
                <span v-if="glucoseSummary.lowestBG != null" class="secondary">
      ({{ (glucoseSummary.lowestBG * 18).toFixed(0) }} mg/dL)
    </span>
            </strong>
        </div>

        <div class="row">
            <span>Highest BG</span>
            <strong>
                {{ glucoseSummary.highestBG != null ? glucoseSummary.highestBG.toFixed(2) + ' ' : '—' }}
                <span v-if="glucoseSummary.highestBG != null" class="secondary">
      ({{ (glucoseSummary.highestBG * 18).toFixed(0) }} mg/dL)
    </span>
            </strong>
        </div>

        <div class="row">
            <span>Average BG</span>
            <strong>
                {{ glucoseSummary.averageBG != null ? glucoseSummary.averageBG.toFixed(2) + ' ' : '—' }}
                <span v-if="glucoseSummary.averageBG != null" class="secondary">
      ({{ (glucoseSummary.averageBG * 18).toFixed(0) }} mg/dL)
    </span>
            </strong>
        </div>

        <div class="foot">
            Time not covered in the calculations:
            <strong>{{ formatMinutesAsHM(glucoseSummary.uncoveredMinutes) }}</strong>
        </div>
    </div>

</template>

<style scoped>
    .bg-grid { display:grid; gap:.5rem; }
    .row { display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:.6rem .8rem; }
    .row.red   { border-left:4px solid #ef4444; }
    .row.amber { border-left:4px solid #f59e0b; }
    .row.green { border-left:4px solid #10b981; }
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
</style>