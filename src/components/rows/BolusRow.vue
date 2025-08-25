<!-- src/components/rows/BolusRow.vue -->
<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, formatTimeInSydney } from '../../helpers/dateHelpers'

    const props = defineProps({
        dose: { type: Object, required: true } // { timestamp, amount, carbRatioUsed?, notes?, source?, duration? }
    })

    // Normalize timestamp → Date (Sydney)
    const ts = computed(() => {
        const t = props.dose?.timestamp
        return t instanceof Date ? t : parseAsSydneyDate(t)
    })

    const amountText = computed(() => {
        const amt = Number(props.dose?.amount ?? 0)
        return isFinite(amt) ? amt.toFixed(2) : '0.00'
    })
</script>

<template>
    <div class="bolus-row" role="button" tabindex="0">
        <div class="line">
            <strong class="time">{{ formatTimeInSydney(ts) }}</strong>

            <span class="amount-pill">
    {{ amountText }}U <span class="icon" aria-hidden="true">💉</span>
  </span>
        </div>


        <div class="meta">
            <span
                    v-if="dose?.type"
                    class="badge"
                    :class="{
    'badge-meal': dose.type === 'meal',
    'badge-correction': dose.type === 'correction',
    'badge-controliq': dose.type === 'Control-IQ',
    'badge-other': dose.type !== 'meal' && dose.type !== 'correction'
  }"
            >{{ dose.type }}</span>
            <span v-if="dose?.carbRatioUsed">Ratio: 1:{{ dose.carbRatioUsed }}</span>
            <span v-if="dose?.duration">Duration: {{ dose.duration }}s</span>
            <span v-if="dose?.notes">• {{ dose.notes }}</span>
        </div>
    </div>
</template>

<style scoped>
    .bolus-row{
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        /* Use the per-item accent if provided by a parent, else bolus blue */
        border-left: 4px solid var(--accent, var(--color-bolus));
        border-radius: 8px;
        padding: 8px 10px;
    }

    .bolus-row .pill{
        margin-left: auto;
        /* Soft pill using the same accent color */
        border: 1px solid color-mix(in srgb, var(--accent, var(--color-bolus)) 35%, white);
        background: color-mix(in srgb, var(--accent, var(--color-bolus)) 12%, white);
        color: var(--accent, var(--color-bolus));
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.85rem;
        font-weight: 600;
    }

    .line{
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .time{ color:#374151; font-variant-numeric: tabular-nums; }
    .title{ font-weight:600; color:#111827; }

    .meta{
        margin-top:4px;
        color:#4b5563;
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        font-size:.92rem;
    }

    .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-left: 4px;
        border: 1px solid transparent;
        white-space: nowrap;
    }

    .badge-meal {
        background: var(--color-bolus-meal);
        color: #ffffff;
        border-color: color-mix(in srgb, var(--color-bolus-meal) 80%, black);
    }

    .badge-correction {
        background: var(--color-bolus-correction);
        color: #ffffff;
        border-color: color-mix(in srgb, var(--color-bolus-correction) 80%, black);
    }

    .badge-controliq {
        background: var(--color-bolus-controliq);
        color: #ffffff;
        border-color: color-mix(in srgb, var(--color-bolus-controliq) 80%, black);
    }

    /* Meal = green tag */
    /*.badge-meal {*/
        /*background: #16a34a;   !* strong green *!*/
        /*color: #ffffff;        !* white text *!*/
        /*border-color: #15803d; !* darker green border *!*/
    /*}*/

    /*!* Correction = orange tag *!*/
    /*.badge-correction {*/
        /*background: #f97316;   !* vivid orange *!*/
        /*color: #ffffff;        !* white text *!*/
        /*border-color: #ea580c; !* darker orange border *!*/
    /*}*/

    /* Fallback for any other type = gray tag */
    /*.badge-other {*/
        /*background: #6b7280;   !* medium gray *!*/
        /*color: #ffffff;        !* white text *!*/
        /*border-color: #4b5563; !* dark gray border *!*/
    /*}*/

    .amount-pill {
        font-size: 1.1rem;          /* larger than meta text */
        font-weight: 700;
        color: var(--accent, var(--color-bolus));
        display: inline-flex;
        align-items: center;
        gap: 4px;

        background: color-mix(in srgb, var(--accent, var(--color-bolus)) 15%, white);
        border: 1px solid var(--accent, var(--color-bolus));
        border-radius: 999px;
        padding: 3px 10px;
    }

    .amount-pill .icon {
        font-size: 1rem;
        opacity: 0.9;
    }

    .amount-pill {
        margin-left: auto;   /* pushes it to the right end of .line */
    }
</style>