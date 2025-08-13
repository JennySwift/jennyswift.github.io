
<!-- CustomTooltip.vue -->
<script setup>
    const props = defineProps({
        visible: { type: Boolean, default: false },
        time:    { type: String,  default: '' },
        bg:      { type: [Number, null], default: null },
        basal:   { type: [Number, null], default: null },
        left:    { type: Number, default: 8 },   // NEW
        top:     { type: Number, default: 8 },   // NEW
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
        <div class="row">BG: <span>{{ bg != null ? bg.toFixed(2) + ' mmol/L' : '—' }}</span></div>
        <div class="row">Basal: <span>{{ basal != null ? basal.toFixed(3) + ' U/hr' : '—' }}</span></div>
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
    }
    .row { display:flex; gap:8px; }
    .row + .row { margin-top: 4px; }
</style>


<!-- src/components/CustomTooltip.vue -->
<!--<script setup>-->
    <!--const props = defineProps({-->
        <!--visible: { type: Boolean, default: false },-->
        <!--time:    { type: String,  default: ''    },-->
        <!--bg:      { type: [Number, null], default: null },-->
        <!--basal:   { type: [Number, null], default: null },-->
        <!--// Optional: x,y if you later want to position near cursor-->
        <!--x:       { type: [Number, null], default: null },-->
        <!--y:       { type: [Number, null], default: null },-->
    <!--});-->
<!--</script>-->

<!--<template>-->
    <!--<div-->
            <!--v-show="visible"-->
            <!--class="tooltip"-->
            <!--role="status"-->
            <!--aria-live="polite"-->
    <!--&gt;-->
        <!--<div class="row"><strong>{{ time }}</strong></div>-->
        <!--<div class="row">BG: <span>{{ bg != null ? bg.toFixed(2) + ' mmol/L' : '—' }}</span></div>-->
        <!--<div class="row">Basal: <span>{{ basal != null ? basal.toFixed(3) + ' U/hr' : '—' }}</span></div>-->
    <!--</div>-->
<!--</template>-->

<!--<style scoped>-->
    <!--.tooltip {-->
        <!--position: fixed;      /* simple: keep it pinned near top-center */-->
        <!--top: 12px;-->
        <!--left: 50%;-->
        <!--transform: translateX(-50%);-->
        <!--background: rgba(17,17,17,0.92);-->
        <!--color: #fff;-->
        <!--padding: 8px 12px;-->
        <!--border-radius: 8px;-->
        <!--font-size: 14px;-->
        <!--line-height: 1.25;-->
        <!--box-shadow: 0 4px 14px rgba(0,0,0,.25);-->
        <!--pointer-events: none;-->
        <!--z-index: 9999;-->
    <!--}-->
    <!--.row { display: flex; gap: 8px; }-->
    <!--.row + .row { margin-top: 4px; }-->
<!--</style>-->



<!--<script setup>-->
    <!--const props = defineProps({-->
        <!--// Single object to drive the tooltip-->
        <!--data: {-->
            <!--type: Object,-->
            <!--default: () => ({-->
                <!--visible: false,   // boolean-->
                <!--time: '',         // e.g. "2:35 pm"-->
                <!--bg: null,         // number | null-->
                <!--basal: null,      // number | null-->
            <!--})-->
        <!--}-->
    <!--})-->
<!--</script>-->

<!--<template>-->
    <!--&lt;!&ndash; Simple, unobtrusive pill at the top-right; change placement later if you like &ndash;&gt;-->
    <!--<div v-show="true" class="tooltip">-->
        <!--<div class="row">-->
            <!--<span class="time">{{ data.time }}</span>-->
        <!--</div>-->
        <!--<div class="row">-->
            <!--<span class="label">BG</span>-->
            <!--<span class="value" v-if="data.bg != null">{{ Number(data.bg).toFixed(2) }} mmol/L</span>-->
            <!--<span class="value" v-else>—</span>-->
        <!--</div>-->
        <!--<div class="row">-->
            <!--<span class="label">Basal</span>-->
            <!--<span class="value" v-if="data.basal != null">{{ Number(data.basal).toFixed(3) }} U/hr</span>-->
            <!--<span class="value" v-else>—</span>-->
        <!--</div>-->
    <!--</div>-->
<!--</template>-->

<!--<style scoped>-->
    <!--.tooltip {-->
        <!--position: fixed;        /* keep it visible; tweak as you like */-->
        <!--top: 12px;-->
        <!--right: 12px;-->
        <!--z-index: 50;-->
        <!--background: rgba(17, 24, 39, 0.92); /* near-black */-->
        <!--color: #fff;-->
        <!--backdrop-filter: blur(6px);-->
        <!--border: 1px solid rgba(255,255,255,0.15);-->
        <!--border-radius: 10px;-->
        <!--padding: 10px 12px;-->
        <!--box-shadow: 0 6px 18px rgba(0,0,0,0.25);-->
        <!--min-width: 180px;-->
    <!--}-->

    <!--.row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }-->
    <!--.time { font-weight: 700; letter-spacing: 0.2px; }-->
    <!--.label { color: #cbd5e1; }-->
    <!--.value { font-variant-numeric: tabular-nums; }-->
<!--</style>-->