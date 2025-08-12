<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay, formatTime12hCompact } from '../../helpers/dateHelpers'

    const props = defineProps({
        notes:        { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true }
    })

    const emit = defineEmits(['note-click'])

    const notesForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.notes
            .filter(n => {
                const t = n.timestamp instanceof Date ? n.timestamp : parseAsSydneyDate(n.timestamp)
                return t >= startOfDay && t < endOfDay
            })
            .sort((a, b) => {
                const ta = (a.timestamp instanceof Date ? a.timestamp : parseAsSydneyDate(a.timestamp)).getTime()
                const tb = (b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)).getTime()
                return ta - tb
            })
    })

    function onDailyNoteClick(n, evt) {
        const ts = n.timestamp instanceof Date ? n.timestamp : parseAsSydneyDate(n.timestamp)
        // optional: highlightRow(evt?.currentTarget)
        emit('note-click', ts)
    }
</script>

<template>
    <div class="daily-section">
        <div v-if="notesForDay.length === 0">No notes for this day.</div>
        <div v-else>
            <div
                    v-for="n in notesForDay"
                    :key="(n.timestamp?.getTime?.() ?? n.timestamp) + '-' + (n.noteNumber ?? '')"
                    class="note-log-block"
                    role="button"
                    tabindex="0"
                    @click="onDailyNoteClick(n, $event)"
            >
                <div class="note-log-body">
                    <div v-if="n.title" class="note-title"><strong>{{ n.title }}</strong></div>
                    <div>
                        <strong>#{{ n.noteNumber }}</strong> — {{ formatTime12hCompact(n.timestamp) }}:
                        <span v-html="(n.text || '').replace(/\n/g, '<br>')"></span>
                    </div>
                </div>

                <div v-if="n.tags?.length" class="note-tags">
                    <span v-for="tag in n.tags" :key="tag" class="note-tag">{{ tag }}</span>
                </div>
            </div>
        </div>
    </div>
</template>