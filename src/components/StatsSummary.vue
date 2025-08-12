<!-- src/components/StatsSummary.vue -->
<script setup>
    import { computed } from 'vue'
    import {
        getStartAndEndOfDay,
        parseAsSydneyDate,
        formatMinutesAsHM,
    } from '../helpers/dateHelpers'

    const props = defineProps({
        selectedDate:     { type: Date, required: true },
        glucoseReadings:  { type: Array, default: () => [] },
        foodLogs:         { type: Array, default: () => [] },
        bolusDoses:       { type: Array, default: () => [] },
        basalEntries:     { type: Array, default: () => [] },
    })

    /** Food logs within the selected day */
    const foodLogsForDay = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.foodLogs
            .map(f => ({
                ...f,
                timestamp: f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp)
            }))
            .filter(f => f.timestamp >= startOfDay && f.timestamp < endOfDay)
    })

    /** Totals for nutrition */
    const totals = computed(() => {
        const sum = (arr, key) =>
            arr.reduce((acc, it) => acc + Number(it?.[key] ?? 0), 0)

        const logs = foodLogsForDay.value
        return {
            netCarbs:   sum(logs, 'netCarbs'),
            totalCarbs: sum(logs, 'totalCarbs'),
            fat:        sum(logs, 'fat'),
            protein:    sum(logs, 'protein'),
            fibre:      sum(logs, 'fibre'),
            calories:   sum(logs, 'calories'),
        }
    })

    /** Total bolus within the selected day */
    const totalBolus = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.bolusDoses
            .map(b => ({
                ...b,
                timestamp: b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)
            }))
            .filter(b => b.timestamp >= startOfDay && b.timestamp < endOfDay)
            .reduce((acc, b) => acc + Number(b.amount ?? 0), 0)
    })

    /** Total basal delivered overlapping the selected day (rate * hours overlapped) */
    const totalBasal = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        // include any entry that overlaps the day
        const entries = props.basalEntries
            .map(e => ({
                ...e,
                startTime: e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime),
                endTime:   e.endTime   ? (e.endTime   instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null,
                rate: Number(e.rate ?? 0)
            }))
            .filter(e => e.startTime < endOfDay && (!e.endTime || e.endTime > startOfDay))
            .sort((a, b) => a.startTime - b.startTime)

        let units = 0
        for (const e of entries) {
            const clippedStart = new Date(Math.max(e.startTime.getTime(), startOfDay.getTime()))
            const clippedEnd   = new Date(Math.min((e.endTime ?? endOfDay).getTime(), endOfDay.getTime()))
            const minutes = (clippedEnd - clippedStart) / 60000
            if (minutes > 0) units += e.rate * (minutes / 60)
        }
        return units
    })

    const totalInsulin = computed(() => totalBolus.value + totalBasal.value)

    /** Ratios */
    const netCarbsToBolusRatio = computed(() => {
        const net = totals.value.netCarbs
        const bol = totalBolus.value
        if (net > 0 && bol > 0) return (net / bol).toFixed(2) + 'g/U'
        return 'N/A'
    })
    const netCarbsToTotalInsulinRatio = computed(() => {
        const net = totals.value.netCarbs
        const tot = totalInsulin.value
        if (tot > 0) return (net / tot).toFixed(2) + 'g/U'
        return 'N/A'
    })

    /** BG time-in-ranges for the selected day, using 5 min forward-fill at the end */
    const glucoseSummary = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        const readings = props.glucoseReadings
            .map(r => ({
                timestamp: r.timestamp instanceof Date ? r.timestamp : parseAsSydneyDate(r.timestamp),
                value: Number(r.value)
            }))
            .filter(r => r.timestamp >= startOfDay && r.timestamp < endOfDay)
            .sort((a, b) => a.timestamp - b.timestamp)

        let timeBelow4 = 0
        let timeBetween4and6 = 0
        let timeAbove8 = 0
        let timeAbove10 = 0
        let totalCoveredMinutes = 0

        for (let i = 0; i < readings.length; i++) {
            const current = readings[i]
            const next = readings[i + 1]

            const startTime = current.timestamp
            let endTime
            if (next) {
                endTime = next.timestamp
            } else {
                const assumedEnd = new Date(current.timestamp.getTime() + 5 * 60 * 1000)
                endTime = assumedEnd > endOfDay ? endOfDay : assumedEnd
            }

            const minutes = (endTime - startTime) / 60000
            if (minutes <= 0) continue
            totalCoveredMinutes += minutes

            const v = current.value
            if (v < 4) timeBelow4 += minutes
            if (v >= 4 && v <= 6) timeBetween4and6 += minutes
            if (v > 8) timeAbove8 += minutes
            if (v > 10) timeAbove10 += minutes
        }

        const uncoveredMinutes = Math.max(0, 1440 - totalCoveredMinutes)

        return {
            timeBelow4,
            timeBetween4and6,
            timeAbove8,
            timeAbove10,
            totalCoveredMinutes,
            uncoveredMinutes,
        }
    })
</script>

<template>
    <div class="summary-row">
        <!-- Insulin group -->
        <div class="summary-group insulin-group">
            <div class="summary-item">💉 Bolus: {{ totalBolus.toFixed(2) }}U</div>
            <div class="summary-item">💧 Basal: {{ totalBasal.toFixed(2) }}U</div>
            <div class="summary-item">💉 Total Insulin: {{ totalInsulin.toFixed(2) }}U</div>
            <div class="summary-item">➗ Net Carbs / Bolus Insulin: {{ netCarbsToBolusRatio }}</div>
            <div class="summary-item">➗ Net Carbs / Total Insulin: {{ netCarbsToTotalInsulinRatio }}</div>
        </div>

        <!-- Nutrition group -->
        <div class="summary-group nutrition-group">
            <div class="summary-item">🍌 Net Carbs: {{ totals.netCarbs.toFixed(1) }}g</div>
            <div class="summary-item">🍌 Total Carbs: {{ totals.totalCarbs.toFixed(1) }}g</div>
            <div class="summary-item">🥑 Fat: {{ totals.fat.toFixed(1) }}g</div>
            <!-- keep protein for the future when data is present -->
            <!-- <div class="summary-item">🫘 Protein: {{ totals.protein.toFixed(1) }}g</div> -->
            <div class="summary-item">🥦 Fibre: {{ totals.fibre.toFixed(1) }}g</div>
            <div class="summary-item">🔥 Calories: {{ totals.calories.toFixed(0) }}</div>
        </div>

        <!-- BG group -->
        <div class="summary-group bg-group">
            <div class="summary-glucose-block">
                <div class="bg-stat-row red-border">
                    <span class="bg-label">⏱ BG &gt; 10:</span>
                    <span class="bg-value">{{ formatMinutesAsHM(glucoseSummary.timeAbove10) }}</span>
                </div>
                <div class="bg-stat-row orange-border">
                    <span class="bg-label">⏱ BG &gt; 8:</span>
                    <span class="bg-value">{{ formatMinutesAsHM(glucoseSummary.timeAbove8) }}</span>
                </div>
                <div class="bg-stat-row green-border">
                    <span class="bg-label">⏱ BG 4–6:</span>
                    <span class="bg-value">{{ formatMinutesAsHM(glucoseSummary.timeBetween4and6) }}</span>
                </div>
                <div class="bg-stat-row red-border">
                    <span class="bg-label">⏱ BG &lt; 4:</span>
                    <span class="bg-value">{{ formatMinutesAsHM(glucoseSummary.timeBelow4) }}</span>
                </div>

                <div class="bg-details">
                    ⏱ Calculations covered:
                    <strong>{{ formatMinutesAsHM(glucoseSummary.totalCoveredMinutes) }}</strong>
                </div>
                <div class="bg-details">
                    ⏳ These calculations use the first BG reading of the day until 5 mins after the last (but not past midnight).
                    Uncovered: <strong>{{ formatMinutesAsHM(glucoseSummary.uncoveredMinutes) }} mins</strong>
                </div>
            </div>
        </div>
    </div>
</template>