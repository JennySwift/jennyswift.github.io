
<!-- CustomTooltip.vue -->
<script setup>
    const props = defineProps({
        visible: { type: Boolean, default: false },
        time:    { type: String,  default: '' },
        bg:      { type: [Number, null], default: null },
        basal:   { type: [Number, null], default: null },
        left:    { type: Number, default: 8 },
        top:     { type: Number, default: 8 },
        hourlyBasalUnits: { type: [Number, null], default: null },
        hourlyBasalLabel: { type: String, default: '' },
        bolus: { type: [Object, null], default: null },
        note: { type: [Object, null], default: null },
        foodLogs: { type: [Object, null], default: null },
        // noteIconUrl: { type: String, default: '/note-icon.png' },
    })
</script>

<template>
    <div
            v-show="visible"
            class="tooltip"
            :style="{ left: left + 'px', top: top + 'px' }"
            role="status"
            aria-live="polite"
    >
        <div class="row"><strong>{{ time }}</strong></div>

        <div class="row">
            BG: <span>{{ bg != null ? bg.toFixed(2) + ' mmol/L' : '—' }}
            ({{ (bg * 18).toFixed(2) }} mg/dL)
        </span>
        </div>

        <div class="row">Basal Rate: <span>{{ basal != null ? basal.toFixed(3) + ' U/hr' : '—' }}</span></div>

        <div v-if="hourlyBasalUnits != null" class="row">
            Total basal from {{ hourlyBasalLabel }}: <strong>{{ Number(hourlyBasalUnits).toFixed(2) }}</strong> units
        </div>

        <div v-if="bolus" class="row">
            Bolus:
            <strong>{{ Number(bolus.amount).toFixed(2) }}</strong> units
            <span v-if="bolus.type"> ({{ bolus.type }})</span>
        </div>

        <div v-if="note" class="row note-row">
            <span class="note-symbol">📝</span>
            <div class="note-text">{{ note.text }}</div>
        </div>

        <div v-if="foodLogs" class="row food-log-row" style="flex-direction: column;">
            <div><strong>Foods ({{ foodLogs.netCarbs.toFixed(1) }}g net carbs) :</strong></div>
            <ul style="margin: 4px 0 0; padding-left: 1rem;">
                <li v-for="(desc, i) in foodLogs.descriptions" :key="i">{{ desc }}</li>
            </ul>
        </div>

        <!--<div v-if="note" class="row note-row">-->
            <!--<img class="note-icon" :src="noteIconUrl" alt="" aria-hidden="true" />-->
            <!--<div class="note-text">{{ note.text }}</div>-->
        <!--</div>-->



    </div>
</template>

<style scoped>
    .tooltip {
        position: absolute;            /* <-- now confined to .chart-stage */
        background: rgba(17,17,17,0.92);
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.25;
        box-shadow: 0 4px 14px rgba(0,0,0,.25);
        pointer-events: none;
        z-index: 5;
        max-width: 360px;
        /* lift it up from wherever JS sets top */
        transform: translateY(-80px);
        min-width: 220px;      /* make it wider */
        /*white-space: nowrap;   !* prevent wrapping *!*/
    }
    .row { display: flex; gap: 8px; align-items: flex-start; }
    .row + .row { margin-top: 4px; }

    .note-row {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.12); /* divider before notes */
    }

    .note-icon {
        width: 14px;
        height: 14px;
        flex: 0 0 auto;
        margin-top: 2px; /* aligns icon with first text line */
        opacity: 0.95;
    }

    .note-text {
        white-space: pre-wrap;     /* keep your line breaks */
        overflow-wrap: anywhere;   /* prevent long words from overflowing */
    }

    .note-symbol {
        font-size: 14px;
        line-height: 1;
        margin-top: 2px;
    }
</style>