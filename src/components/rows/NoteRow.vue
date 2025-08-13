<script setup>
    import { computed } from 'vue'
    import { parseAsSydneyDate, formatTime12hCompact } from '../../helpers/dateHelpers'

    const props = defineProps({
        note: { type: Object, required: true }
    })

    const emit = defineEmits(['note-click'])

    const ts = computed(() =>
        props.note.timestamp instanceof Date
            ? props.note.timestamp
            : parseAsSydneyDate(props.note.timestamp)
    )

    function onClick(e) {
        emit('note-click', ts.value)
    }
</script>

<template>
    <div class="note-row" role="button" tabindex="0" @click="onClick">
        <div class="note-body">
            <div v-if="note.title" class="note-title">
                <strong>{{ note.title }}</strong>
            </div>

            <div class="note-line">
                <strong v-if="note.noteNumber">#{{ note.noteNumber }}</strong>
                <span v-if="note.noteNumber"> — </span>
                <strong>{{ formatTime12hCompact(ts) }}</strong>:
                <span
                        class="note-text"
                        v-html="(note.text || '').replace(/\n/g, '<br>')"
                />
            </div>
        </div>

        <div v-if="note.tags?.length" class="note-tags">
            <span v-for="tag in note.tags" :key="tag" class="note-tag">#{{ tag }}</span>
        </div>
    </div>
</template>

<style scoped>
    .note-row {
        background:#f9fafb;
        border:1px solid #e5e7eb;
        border-radius:8px;
        padding:8px 10px;
    }
    .note-title { margin-bottom:4px; }
    .note-line { color:#111827; }
    .note-text { white-space:normal; }
    .note-tags { margin-top:6px; display:flex; gap:6px; flex-wrap:wrap; }
    .note-tag { background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; border-radius:999px; padding:2px 8px; font-size:.78rem; }
</style>