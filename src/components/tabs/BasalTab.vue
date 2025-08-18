<script setup>
    import { computed } from 'vue'
    import {
        parseAsSydneyDate,
        getStartAndEndOfDay,
        formatTimeFromString,
        minutesBetweenOrEndOfDay,
        formatHM
    } from '../../helpers/dateHelpers'

    import { onMounted } from 'vue'
    import { jumpToTime } from '../../helpers/jumpToTime'

    function logBasalDebug() {
        console.log('[Basal Debug] Total entries:', props.basalEntries.length)

        const nullEndEntries = props.basalEntries.filter(e => !e.endTime)
        console.log('[Basal Debug] Entries with null endTime:', nullEndEntries.length)

        props.basalEntries.forEach((e, i) => {
            console.log(
                `#${i} start: ${e.startTime}, end: ${e.endTime ?? 'null'}, rate: ${e.rate}`
            )
        })
    }

    onMounted(() => {
        logBasalDebug()
    })

    const props = defineProps({
        basalEntries: { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true }
    })

    const basalEntriesForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        return props.basalEntries
            .filter(e => {
                const s = e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime)
                const end = e.endTime ? (e.endTime instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null
                // include any entry that overlaps the selected day (rate can be 0)
                return s < endOfDay && (!end || end > startOfDay)
            })
            .sort((a, b) => {
                const ta = (a.startTime instanceof Date ? a.startTime : parseAsSydneyDate(a.startTime)).getTime()
                const tb = (b.startTime instanceof Date ? b.startTime : parseAsSydneyDate(b.startTime)).getTime()
                return ta - tb
            })
    })


</script>

<template>
    <div class="daily-section">
        <div v-if="basalEntriesForDay.length === 0">No basal entries for this day.</div>
        <div v-else>
            <div
                    v-for="b in basalEntriesForDay"
                    :key="(b.startTime?.getTime?.() ?? b.startTime) + '-' + (b.endTime?.getTime?.() ?? 'ongoing') + '-' + (b.rate ?? '')"
                    class="log-block clickable-row"
                    role="button"
                    tabindex="0"
                    @click="jumpToTime(b.startTime, 'basal')"

            >
                <div>
                    <strong>{{ formatTimeFromString(b.startTime) }}</strong>
                    —
                    <strong>{{ b.endTime ? formatTimeFromString(b.endTime) : 'Ongoing' }}</strong>
                </div>

                <!-- Duration shown as full entry duration (or until end-of-day if ongoing on this day) -->
                <div>
                    <strong>Duration:</strong>
                    {{ formatHM(minutesBetweenOrEndOfDay(b.startTime, b.endTime, selectedDate)) }}
                </div>

                <div class="log-details">
                    <span>💧 Rate: {{ b.rate }} U/hr</span>

                    <span
                            v-if="b.mode"
                            class="mode-chip"
                            :class="{
    'chip-control-iq': b.mode === 'ControlIQ',
    'chip-manual': b.mode === 'Manual',
    'chip-suspended': b.mode === 'Suspended'
  }"
                    >
  {{ b.mode }}
</span>


                    <span v-if="b.notes">• {{ b.notes }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .log-block {
        border-left: 4px solid transparent;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.5rem;
        background: #f9fafb;
        transition: background 0.2s, transform 0.1s;
    }
    .log-block:hover {
        background: #f3f4f6;
        transform: translateX(2px);
    }


    .mode-chip {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: 6px;
    }

    /* ControlIQ = adaptive → calming indigo */
    .chip-control-iq {
        background: #eef2ff;    /* light indigo bg */
        color: #4338ca;         /* indigo text */
        border: 1px solid #c7d2fe;
    }

    /* Manual = steady → green */
    .chip-manual {
        background: #ecfdf5;    /* light green bg */
        color: #065f46;         /* green text */
        border: 1px solid #bbf7d0;
    }

    /* Suspended = urgent → red */
    .chip-suspended {
        background: #fef2f2;    /* light red bg */
        color: #b91c1c;         /* red text */
        border: 1px solid #fecaca;
    }

</style>