//AllNotesTab.vue
<script setup>
    import { ref, computed, watch, onMounted } from 'vue'
    import { formatDateTime } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'
    import HelpTooltip from '../../components/HelpTooltip.vue'
    import { filterAllNotesWithPagination, fetchAllNoteTags } from '../../supabase/supabaseNotes'

    const emit = defineEmits(['note-click'])

    // local state (no props from App.vue)
    const filteredNotes = ref([])
    const nextAnchor = ref(null)
    const loading = ref(false)

    // UI state
    const query = ref('')
    const allTags = ref([])
    const selectedTags = ref([])

    function isTagSelected(tag) {
        return selectedTags.value.includes(tag)
    }

    function toggleTag(tag) {
        const i = selectedTags.value.indexOf(tag)
        if (i >= 0) selectedTags.value.splice(i, 1)
        else selectedTags.value.push(tag)

        // instantly show loading + clear current results
        loading.value = true
        filteredNotes.value = []
        nextAnchor.value = null
    }

    function clearFilters() {
        query.value = ''
        selectedTags.value = []
    }

    async function loadFirstPage() {
        loading.value = true
        try {
            const { items, nextAnchor: anchor } = await filterAllNotesWithPagination({
                limit: 10,
                query: query.value,
                tags: selectedTags.value,
            })
            filteredNotes.value = items
            nextAnchor.value = anchor
        } catch (e) {
            console.error('[AllNotesTab] first page failed:', e)
            filteredNotes.value = []
            nextAnchor.value = null
        } finally {
            loading.value = false
        }
    }

    async function loadMore() {
        if (!nextAnchor.value || loading.value) return
        loading.value = true
        try {
            const { items, nextAnchor: anchor } = await filterAllNotesWithPagination({
                limit: 10,
                query: query.value,
                tags: selectedTags.value,
                anchor: nextAnchor.value,
            })
            filteredNotes.value.push(...items)
            nextAnchor.value = anchor
        } catch (e) {
            console.error('[AllNotesTab] next page failed:', e)
        } finally {
            loading.value = false
        }
    }

    function onNoteClick(note) {
        jumpToTime(note.timestamp, 'all-notes')
        emit('note-click', note.timestamp)
    }

    // debounce search/tag changes → reload first page
    let t = null
    watch([query, () => selectedTags.value.join('|')], async () => {
        loading.value = true
        filteredNotes.value = []   // hide current results while fetching
        nextAnchor.value = null
        await loadFirstPage()
    })


    async function loadAllTags() {
        try {
            allTags.value = await fetchAllNoteTags()
        } catch (e) {
            console.error('[AllNotesTab] loadAllTags failed:', e)
            allTags.value = []
        }
    }

    onMounted(async () => {
        await loadAllTags()
        await loadFirstPage()
    })
</script>

<template>
    <section class="all-notes">
        <div class="search">
            <input
                    v-model="query"
                    type="text"
                    placeholder="Search notes…  (#tag or text)"
            />

            <button
                    v-if="query || selectedTags.length"
                    class="clear-btn"
                    type="button"
                    @click="clearFilters"
            >
                Clear Search
            </button>

            <HelpTooltip>
            <div>
            <div>To filter by tag, prefix tag name with <code>#</code>or click on the tags listed below.</div>
            <div>To filter by note number, prefix note number with <code>#</code>.</div>
            <div>Or you can just search the content by entering a word.</div>
            <!--<div>To filter by title: <code>*keyword</code>.</div>-->
            </div>
            </HelpTooltip>
        </div>

        <div class="tag-cloud">
            <button
                    v-for="tag in allTags"
                    :key="tag"
                    class="tag-chip"
                    :class="{ selected: isTagSelected(tag) }"
                    type="button"
                    @click="toggleTag(tag)"
            >
                {{ tag }}
            </button>
        </div>

        <div v-if="loading" class="empty">Loading…</div>

        <TransitionGroup v-else name="list" tag="div" class="notes-list">
            <div
                    v-for="note in filteredNotes"
                    :key="note.id ?? (note.timestamp + '-' + (note.text || '').slice(0,10))"
                    class="note-log-block clickable-row"
                    @click="onNoteClick(note)"
                    role="button"
                    tabindex="0"
            >
                <div class="note-log-body">
                    <div>
                        <strong>{{ formatDateTime(note.timestamp) }}</strong> —
                        <span v-html="(note.text || '').replace(/\n/g, '<br>')"></span>
                    </div>
                </div>

                <div v-if="note.tags?.length" class="note-tags">
                    <span v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</span>
                </div>
            </div>
        </TransitionGroup>

        <div class="load-more">
            <button
                    v-if="nextAnchor && !loading"
                    type="button"
                    @click="loadMore"
            >
                Load more
            </button>
            <div v-else-if="loading">Loading…</div>
            <div v-else-if="filteredNotes.length > 0">No more results.</div>
        </div>
    </section>
</template>

<!--//AllNotesTab.vue-->
<!--<script setup>-->
    <!--import { ref, computed } from 'vue'-->
    <!--import { parseAsSydneyDate, formatDateTime } from '../../helpers/dateHelpers'-->
    <!--import { jumpToTime } from '../../helpers/jumpToTime'-->
    <!--import HelpTooltip from '../../components/HelpTooltip.vue'-->


    <!--// Props: pass your notes array in later from App.vue (next step)-->
    <!--const props = defineProps({-->
        <!--notes: {-->
            <!--type: Array,-->
            <!--default: () => []-->
        <!--}-->
    <!--})-->

    <!--// Emit a click so parent can scroll charts / navigate dates later-->
    <!--const emit = defineEmits(['note-click'])-->

    <!--const query = ref('')-->

    <!--// Selected tags (store lowercased values for matching)-->
    <!--const selectedTags = ref([])-->

    <!--// Unique tag list (display original casing)-->
    <!--const allTags = computed(() => {-->
        <!--const set = new Set()-->
        <!--if (!Array.isArray(props.notes)) return []-->
        <!--for (const n of props.notes) {-->
            <!--const tags = Array.isArray(n.tags) ? n.tags : []-->
            <!--for (const t of tags) {-->
                <!--const name = String(t).trim()-->
                <!--if (name) set.add(name)-->
            <!--}-->
        <!--}-->
        <!--// Sort case-insensitively for nicer UI-->
        <!--return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'accent' }))-->
    <!--})-->

    <!--function clearFilters() {-->
        <!--query.value = ''-->
        <!--selectedTags.value = []-->
    <!--}-->

    <!--function toggleTag(tag) {-->
        <!--const lc = String(tag).toLowerCase()-->
        <!--const idx = selectedTags.value.indexOf(lc)-->
        <!--if (idx >= 0) selectedTags.value.splice(idx, 1)-->
        <!--else selectedTags.value.push(lc)-->
    <!--}-->
    <!--function isTagSelected(tag) {-->
        <!--return selectedTags.value.includes(String(tag).toLowerCase())-->
    <!--}-->

    <!--const filteredNotes = computed(() => {-->
        <!--const q = (query.value || '').trim().toLowerCase()-->
        <!--if (!Array.isArray(props.notes) || props.notes.length === 0) return []-->

        <!--const arr = props.notes.filter(note => {-->
            <!--const text = (note.text ?? '').toLowerCase()-->
            <!--const tags = Array.isArray(note.tags) ? note.tags.map(t => String(t).toLowerCase()) : []-->
            <!--const title = (note.title ?? '').toLowerCase()-->

            <!--// Tag multi-select (AND): if any tags selected, note must include all of them-->
            <!--if (selectedTags.value.length > 0) {-->
                <!--const hasAll = selectedTags.value.every(t => tags.includes(t))-->
                <!--if (!hasAll) return false-->
            <!--}-->

            <!--if (q.startsWith('#')) {-->
                <!--const tagOrNumber = q.slice(1)-->
                <!--if (tagOrNumber !== '' && !Number.isNaN(Number(tagOrNumber))) {-->
                    <!--return Number(note.noteNumber) === Number(tagOrNumber)-->
                <!--}-->
                <!--return tags.includes(tagOrNumber)-->
            <!--}-->

            <!--if (q.startsWith('*')) {-->
                <!--const titleQuery = q.slice(1)-->
                <!--return title.includes(titleQuery)-->
            <!--}-->

            <!--// default search: text, tags, title-->
            <!--return (-->
                <!--text.includes(q) ||-->
                <!--tags.some(tag => tag.includes(q)) ||-->
                <!--title.includes(q)-->
            <!--)-->
        <!--})-->

        <!--// Sort newest first; tolerate number or string timestamp-->
        <!--return arr.sort((a, b) => {-->
            <!--const ta = typeof a.timestamp === 'number' ? a.timestamp : parseAsSydneyDate(a.timestamp).getTime()-->
            <!--const tb = typeof b.timestamp === 'number' ? b.timestamp : parseAsSydneyDate(b.timestamp).getTime()-->
            <!--return tb - ta-->
        <!--})-->
    <!--})-->

    <!--function onNoteClick(note) {-->
        <!--jumpToTime(note.timestamp, 'all-notes')-->
    <!--}-->
<!--</script>-->

<!--<template>-->
    <!--<section class="all-notes">-->
        <!--<div class="search">-->
            <!--<input-->
                    <!--v-model="query"-->
                    <!--type="text"-->
                    <!--placeholder="Search notes…  (#tag, #1, *title, or text)"-->
            <!--/>-->

            <!--<button-->
                    <!--v-if="query || selectedTags.length"-->
                    <!--class="clear-btn"-->
                    <!--type="button"-->
                    <!--@click="clearFilters"-->
            <!--&gt;-->
                <!--Clear Search-->
            <!--</button>-->

            <!--<HelpTooltip>-->
                <!--<div>-->
                    <!--<div>To filter by tag, prefix tag name with <code>#</code>.</div>-->
                    <!--<div>To filter by note number, prefix note number with <code>#</code>.</div>-->
                    <!--<div>Or you can just search the content by entering a word.</div>-->
                    <!--&lt;!&ndash;<div>To filter by title: <code>*keyword</code>.</div>&ndash;&gt;-->
                <!--</div>-->
            <!--</HelpTooltip>-->
        <!--</div>-->

        <!--<div class="tag-cloud">-->
            <!--<button-->
                    <!--v-for="tag in allTags"-->
                    <!--:key="tag"-->
                    <!--class="tag-chip"-->
                    <!--:class="{ selected: isTagSelected(tag) }"-->
                    <!--type="button"-->
                    <!--@click="toggleTag(tag)"-->
            <!--&gt;-->
                <!--{{ tag }}-->
            <!--</button>-->
        <!--</div>-->

        <!--&lt;!&ndash;<div v-if="filteredNotes.length === 0" class="empty">No matching notes found.</div>&ndash;&gt;-->
        <!--<TransitionGroup name="list" tag="div" class="notes-list">-->
        <!--<div-->
                <!--v-for="note in filteredNotes"-->
                <!--:key="note.id ?? note.noteNumber ?? (note.timestamp + '-' + (note.text || '').slice(0,10))"-->
                <!--class="note-log-block clickable-row"-->
                <!--@click="onNoteClick(note)"-->
                <!--role="button"-->
                <!--tabindex="0"-->
        <!--&gt;-->
            <!--<div class="note-log-body">-->
                <!--<div v-if="note.title" class="note-title"><strong>{{ note.title }}</strong></div>-->
                <!--<div>-->
                    <!--<strong>#{{ note.noteNumber }}</strong>-->
                    <!--— {{ formatDateTime(note.timestamp) }}:-->
                    <!--<span v-html="(note.text || '').replace(/\n/g, '<br>')"></span>-->
                <!--</div>-->
            <!--</div>-->

            <!--<div v-if="note.tags?.length" class="note-tags">-->
                <!--<span v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</span>-->
            <!--</div>-->
        <!--</div>-->
        <!--</TransitionGroup>-->
    <!--</section>-->
<!--</template>-->

<style scoped lang="scss">
    /* transition classes must be top-level so Vue can add them to items */
    /*.list-enter-from,*/
    /*.list-leave-to {*/
        /*opacity: 0;*/
    /*}*/

    /*.list-enter-active,*/
    /*.list-leave-active {*/
        /*transition: opacity .5s ease;*/
    /*}*/

    /*.list-move {*/
        /*transition: transform .5s ease;*/
    /*}*/

    /* keep the list area from collapsing during filter edits */
    .notes-list {
        min-height: 800px;
    }
    .all-notes {
        .clear-btn {
            margin-left: 0.5rem;
            padding: 0.3rem 0.6rem;
            font-size: 0.85rem;
            border: none;
            border-radius: 6px;
            background: var(--color-button);
            color: #fff; /* white text for contrast */
            cursor: pointer;

            &:hover {
                background: color-mix(in srgb, var(--color-bolus) 80%, black); /* darker on hover */
            }
        }

        .tag-cloud {
            margin: 0.5rem 0 1rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;

            .tag-chip {
                border: 1px solid #d1d5db;
                background: #fff;
                border-radius: 999px;
                padding: 0.2rem 0.6rem;
                font-size: 0.85rem;
                cursor: pointer;
                user-select: none;

                &.selected {
                    background: #11182710; /* subtle */
                    border-color: #11182766;
                    font-weight: 600;
                }
            }
        }

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