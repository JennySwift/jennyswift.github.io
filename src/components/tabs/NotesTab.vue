//NotesTab.vue
<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, getStartAndEndOfDay } from '../../helpers/dateHelpers'
    import NoteRow from '../rows/NoteRow.vue'
    import { jumpToTime } from '../../helpers/jumpToTime'

    const props = defineProps({
        notes:        { type: Array, default: () => [] },
        selectedDate: { type: Date,  required: true },
        loading:      { type: Boolean, default: false },
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
</script>

<template>
    <div class="daily-section">
        <div v-if="loading" class="loading-row">
            <span class="spinner" aria-hidden="true"></span>
            <span>Loading notes…</span>
        </div>

        <div v-else-if="notesForDay.length === 0">No notes for this day.</div>

        <div v-else>
            <NoteRow
                    v-for="n in notesForDay"
                    :key="(n.timestamp?.getTime?.() ?? n.timestamp) + '-' + (n.noteNumber ?? '')"
                    :note="n"
                    @click="jumpToTime(n.timestamp, 'notes')"
                    class="clickable-row"
            />
        </div>
    </div>
</template>