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

    const percentageOfCaloriesFromFat = computed(() => {
        const fatKcal = (Number(totals.value.fat) || 0) * 9;        // 9 kcal / g
        const totalKcal = Number(totals.value.calories) || 0;
        if (totalKcal <= 0) return 0;
        return (fatKcal / totalKcal) * 100;
    });

    const scaleMax = computed(() => {
        const v = Number(percentageOfCaloriesFromFat.value) || 0
        return Math.max(15, v) // baseline 15%; above 15 → scale to actual value
    })

    const fatMarkerLeft = computed(() => {
        const v = Math.max(0, Number(percentageOfCaloriesFromFat.value) || 0)
        return `${(v / scaleMax.value) * 100}%`
    })

    const fatFillWidth = computed(() => {
        // fill grows to the actual value marker
        return fatMarkerLeft.value
    })

    const targetBand = computed(() => {
        // 10–15% band positioned inside current scale
        const left = (10 / scaleMax.value) * 100
        const width = (5 / scaleMax.value) * 100
        return { left: `${left}%`, width: `${width}%` }
    })

    const tick10Left = computed(() => `${(10 / scaleMax.value) * 100}%`)
    const tick15Left = computed(() => `${(15 / scaleMax.value) * 100}%`)

    const fatStatus = computed(() => {
        const v = Number(percentageOfCaloriesFromFat.value) || 0
        if (v < 10) return 'below'
        if (v > 15) return 'above'
        return 'in'
    })






</script>

<template>
    <div class="stat-grid">
        <div class="card">🍌 Net Carbs <strong>{{ totals.netCarbs.toFixed(1) }}g</strong></div>
        <div class="card">🍌 Total Carbs <strong>{{ totals.totalCarbs.toFixed(1) }}g</strong></div>
        <div class="card">🥑 Fat <strong>{{ totals.fat.toFixed(1) }}g</strong></div>

        <div class="card fat-pct" :data-status="fatStatus">
            🥑 % Calories from Fat <strong>{{ percentageOfCaloriesFromFat.toFixed(1) }}%</strong>

            <div class="target-bar">
                <div class="bar"></div>

                <!-- goal stripe -->
                <div class="target-band" :style="{ left: targetBand.left, width: targetBand.width }"></div>

                <!-- fill to value -->
                <div class="fill" :style="{ width: fatFillWidth }"></div>

                <!-- ticks at 10% and 15% -->
                <div class="tick" :style="{ left: tick10Left }" aria-hidden="true"></div>
                <div class="tick" :style="{ left: tick15Left }" aria-hidden="true"></div>

                <!-- exact value marker -->
                <div class="marker" :style="{ left: fatMarkerLeft }" :title="percentageOfCaloriesFromFat.toFixed(1) + '%'"></div>
            </div>

            <!-- labels BELOW the bar so they aren’t clipped -->
            <div class="ticks-row">
                <div class="tick-label" :style="{ left: tick10Left }">10</div>
                <div class="tick-label" :style="{ left: tick15Left }">15</div>
                <div class="tick-label value-label" :style="{ left: fatMarkerLeft }">
                    {{ percentageOfCaloriesFromFat.toFixed(1) }}</div>
            </div>

        </div>

        <!--<div class="card">🥑 % Calories from Fat <strong>{{ percentageOfCaloriesFromFat.toFixed(2) }}%</strong></div>-->
        <div class="card">🫘 Protein <strong>Not tracked yet...</strong></div>
        <!--<div class="card">🫘 Protein <strong>{{ totals.protein.toFixed(1) }}g</strong></div>-->
        <div class="card">🥦 Fibre <strong>{{ totals.fibre.toFixed(1) }}g</strong></div>
        <div class="card">🔥 Calories <strong>{{ totals.calories.toFixed(0) }}</strong></div>
    </div>
</template>

<style scoped lang="scss">
    .fat-pct {
        .target-bar {
            position: relative;
            margin-top: .4rem;
            height: 16px;
            border-radius: 999px;
            background: rgba(148, 163, 184, .7); // full-width track
            overflow: hidden;
        }

        .ticks-row {
            position: relative;
            height: 14px;      // space for labels
            margin-top: 2px;   // slight gap below the bar
        }

        .tick-label {
            position: absolute;
            top: 0;
            transform: translateX(-50%);
            font-size: 1rem;
            color: rgba(100,116,139,1);
            white-space: nowrap;
            user-select: none;
            z-index: 5;
            &.value-label {
                font-weight: 600;             // make it stand out
                color: rgba(17,24,39,1);      // darker
            }
        }

        // goal stripe (always visible, repositions with scale)
        .target-band {
            position: absolute;
            top: 0; bottom: 0;
            background: rgba(34, 197, 94, 0.35); // translucent green
            z-index: 1;
            pointer-events: none;
        }

        // actual value fill (0..100% within current scale)
        .fill {
            position: absolute;
            left: 0; top: 0; bottom: 0;
            /*background: rgba(30, 144, 255, 0.72); // blue*/
            border-radius: 999px;
            z-index: 2;
            pointer-events: none;
        }

        // tick lines at 10% and 15%
        .tick {
            position: absolute;
            top: 50%;
            width: 2px;
            height: 16px;
            transform: translate(-1px, -50%);
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.8); // subtle outline
            z-index: 3;
            pointer-events: none;
        }
        .tick10 { left: var(--tick10-left); }
        .tick15 { left: var(--tick15-left); }

        // exact value marker on top of ticks
        .marker {
            position: absolute;
            top: 50%;
            width: 4px;
            height: 20px;
            transform: translate(-1px, -50%);
            background: rgba(17, 24, 39, 1);
            border-radius: 1px;
            z-index: 4;
        }

        &[data-status="in"]    { .marker { background: rgba(22, 163, 74, 1); } }  // green
        &[data-status="below"] { .marker { background: rgba(245, 158, 11, 1); } } // amber
        &[data-status="above"] { .marker { background: rgba(220, 38, 38, 1); } }  // red

        .caption {
            margin-top: 6px;
            font-size: .75rem;
            color: rgba(100, 116, 139, 1);
            user-select: none;
        }

        /*.stat-grid {*/
            /*display: grid;*/
            /*gap: .5rem;*/

            /*!* keep cards at a consistent width and wrap as needed *!*/
            /*grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));*/
            /*justify-content: start;   !* align columns to the left *!*/
            /*justify-items: start;     !* prevent items from stretching full column *!*/
        /*}*/

        /*.card {*/
            /*background: rgba(248, 250, 252, 1);*/
            /*border: 1px solid rgba(229, 231, 235, 1);*/
            /*border-radius: 8px;*/
            /*padding: .75rem .9rem;*/

            /*!* ✅ cap the visual width so the card doesn’t grow to fill the row *!*/
            /*max-width: 220px;   !* adjust to your previous preferred width *!*/
            /*width: 100%;        !* fill within the capped width *!*/
        /*}*/
    }
</style>