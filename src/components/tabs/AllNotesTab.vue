<script setup>
    import { ref, computed } from 'vue'
    import { parseAsSydneyDate, formatDateTime } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'
    import HelpTooltip from '../../components/HelpTooltip.vue'


    // Props: pass your notes array in later from App.vue (next step)
    const props = defineProps({
        notes: {
            type: Array,
            default: () => []
        }
    })

    // Emit a click so parent can scroll charts / navigate dates later
    const emit = defineEmits(['note-click'])

    const query = ref('')

    const filteredNotes = computed(() => {
        const q = (query.value || '').trim().toLowerCase()
        if (!Array.isArray(props.notes) || props.notes.length === 0) return []

        const arr = props.notes.filter(note => {
            const text = (note.text ?? '').toLowerCase()
            const tags = Array.isArray(note.tags) ? note.tags.map(t => String(t).toLowerCase()) : []
            const title = (note.title ?? '').toLowerCase()

            if (q.startsWith('#')) {
                const tagOrNumber = q.slice(1)
                if (tagOrNumber !== '' && !Number.isNaN(Number(tagOrNumber))) {
                    return Number(note.noteNumber) === Number(tagOrNumber)
                }
                return tags.includes(tagOrNumber)
            }

            if (q.startsWith('*')) {
                const titleQuery = q.slice(1)
                return title.includes(titleQuery)
            }

            // default search: text, tags, title
            return (
                text.includes(q) ||
                tags.some(tag => tag.includes(q)) ||
                title.includes(q)
            )
        })

        // Sort newest first; tolerate number or string timestamp
        return arr.sort((a, b) => {
            const ta = typeof a.timestamp === 'number' ? a.timestamp : parseAsSydneyDate(a.timestamp).getTime()
            const tb = typeof b.timestamp === 'number' ? b.timestamp : parseAsSydneyDate(b.timestamp).getTime()
            return tb - ta
        })
    })

    function onNoteClick(note) {
        jumpToTime(note.timestamp, 'all-notes')
    }
</script>

<template>
    <section class="all-notes">
        <div class="search">
            <input
                    v-model="query"
                    type="text"
                    placeholder="Search notes…  (#tag, #1, *title, or text)"
            />
            <HelpTooltip>
                <div>
                    <div>To filter by tag, prefix tag name with <code>#</code>.</div>
                    <div>To filter by note number, prefix note number with <code>#</code>.</div>
                    <div>Or you can just search the content by entering a word.</div>
                    <!--<div>To filter by title: <code>*keyword</code>.</div>-->
                </div>
            </HelpTooltip>
        </div>

        <!--<div v-if="filteredNotes.length === 0" class="empty">No matching notes found.</div>-->
        <TransitionGroup name="list" tag="div" class="notes-list">
        <div
                v-for="note in filteredNotes"
                :key="note.id ?? note.noteNumber ?? (note.timestamp + '-' + (note.text || '').slice(0,10))"
                class="note-log-block clickable-row"
                @click="onNoteClick(note)"
                role="button"
                tabindex="0"
        >
            <div class="note-log-body">
                <div v-if="note.title" class="note-title"><strong>{{ note.title }}</strong></div>
                <div>
                    <strong>#{{ note.noteNumber }}</strong>
                    — {{ formatDateTime(note.timestamp) }}:
                    <span v-html="(note.text || '').replace(/\n/g, '<br>')"></span>
                </div>
            </div>

            <div v-if="note.tags?.length" class="note-tags">
                <span v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</span>
            </div>
        </div>
        </TransitionGroup>
    </section>
</template>

<style scoped lang="scss">
    /* transition classes must be top-level so Vue can add them to items */
    .list-enter-from,
    .list-leave-to {
        opacity: 0;
    }

    .list-enter-active,
    .list-leave-active {
        transition: opacity .5s ease;
    }

    .list-move {
        transition: transform .5s ease;
    }

    /* keep the list area from collapsing during filter edits */
    .notes-list {
        min-height: 800px;
    }
    .all-notes {
        .search {
            margin: 1rem 0;
            text-align: center;

            input {
                width: 90%;
                max-width: 400px;
                padding: 0.5rem;
                font-size: 1rem;
                border: 1px solid #d1d5db;
                border-radius: 8px;
            }

            .help-tip {
                margin-left: 0.5rem;
                cursor: help;
                user-select: none;
            }
        }

        .empty {
            text-align: center;
            color: #6b7280;
            padding: 1rem 0;
        }

        .note-log-block {
            padding: 0.6rem 0.8rem;
            border-bottom: 1px solid #e5e7eb;

            &:hover { background: #f9fafb; }
        }

        .note-title { margin-bottom: 0.25rem; }

        .note-tags {
            margin-top: 0.35rem;

            .note-tag {
                display: inline-block;
                padding: 0.15rem 0.5rem;
                margin-right: 0.35rem;
                margin-top: 0.25rem;
                font-size: 0.85rem;
                border: 1px solid #d1d5db;
                border-radius: 999px;
                background: #fff;
            }
        }

    }
</style>