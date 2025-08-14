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
            <strong class="time">{{ formatTimeInSydney(ts) }}</strong>:
            <span class="title">Bolus</span>
            <span class="pill">{{ amountText }}U</span>
        </div>

        <div class="meta">
            <span v-if="dose?.amount">{{ dose.amount }} units</span>
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
</style>