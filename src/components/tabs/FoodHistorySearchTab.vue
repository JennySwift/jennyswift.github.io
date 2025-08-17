<script setup>
    import { ref, computed } from 'vue'
    import { parseAsSydneyDate, formatHM } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'
    import FoodLogRow from '../rows/FoodLogRow.vue'
    import { DateTime } from 'luxon'

    const props = defineProps({
        allFoodLogs: { type: Array, default: () => [] },
        foods: { type: Array, default: () => [] },
    })

    const search = ref('')
    const selectedFood = ref('')
    const showSuggestions = ref(false)
    const selectedFoodTags = ref([])

    const inputEl = ref(null)
    function clearSearch() {
        search.value = ''
        selectedFood.value = ''
        showSuggestions.value = false
        // return focus to the field
        inputEl.value?.focus()
    }

    const allFoodTags = computed(() => {
        const set = new Set()
        for (const f of (props.foods ?? [])) {
            const tags = Array.isArray(f.tags) ? f.tags : []
            for (const t of tags) {
                const name = String(t).trim()
                if (name) set.add(name)
            }
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'accent' }))
    })

    function toggleFoodTag(tag) {
        const lc = tag.toLowerCase()
        const i = selectedFoodTags.value.indexOf(lc)
        if (i >= 0) selectedFoodTags.value.splice(i, 1)
        else selectedFoodTags.value.push(lc)
    }

    function isFoodTagSelected(tag) {
        return selectedFoodTags.value.includes(tag.toLowerCase())
    }

    const totalQuantity = computed(() =>
        matchingLogs.value.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)
    )

    const DAY_MS = 86_400_000
    const durationDays = computed(() => {
        const logs = matchingLogs.value
        if (logs.length === 0) return 0
        const times = logs.map(l =>
            (l.timestamp instanceof Date ? l.timestamp : parseAsSydneyDate(l.timestamp)).getTime()
        )
        const spanMs = Math.max(...times) - Math.min(...times) // elapsed time only
        return Math.max(1, Math.ceil(spanMs / DAY_MS))         // 0 → 1 day minimum
    })

    const groupedLogs = computed(() => {
        const logs = matchingLogs.value
        if (!logs.length) return []

        const map = new Map()
        for (const l of logs) {
            const js = l.timestamp instanceof Date ? l.timestamp : parseAsSydneyDate(l.timestamp)
            const dt = DateTime.fromJSDate(js, { zone: 'Australia/Sydney' })
            const key = dt.toISODate() // e.g., "2025-08-16"
            const label = dt.toFormat('EEE d LLL yyyy') // e.g., "Sat 16 Aug 2025"

            if (!map.has(key)) map.set(key, { key, label, logs: [] })
            map.get(key).logs.push(l)
        }

        // newest day first; logs within each group remain sorted by your existing sort
        return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
    })

    // Prefer string name on exported logs, but fall back to nested object if present.
    function getFoodName(log) {
        return (log.foodName ?? log.food?.name ?? '').trim()
    }

    const allFoodNames = computed(() => {
        const set = new Set(
            props.allFoodLogs.map(getFoodName).filter(Boolean)
        )
        return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    })

    const suggestions = computed(() => {
        const q = search.value.trim().toLowerCase()
        if (!q) return allFoodNames.value.slice(0, 20)
        return allFoodNames.value.filter(n => n.toLowerCase().includes(q)).slice(0, 20)
    })

    function chooseFood(name) {
        selectedFood.value = name
        search.value = name
        showSuggestions.value = false
    }

    const matchingLogs = computed(() => {
        const nameLower = (selectedFood.value || '').toLowerCase()
        const requiredTags = selectedFoodTags.value // already lowercased

        return props.allFoodLogs
            .filter(l => {
                if (nameLower) {
                    const fn = getFoodName(l).toLowerCase()
                    if (fn !== nameLower) return false
                }

                // 2) tag AND filter: each selected tag must exist in this log's foodTags
                if (requiredTags.length > 0) {
                    const tags = Array.isArray(l.foodTags) ? l.foodTags.map(t => String(t).toLowerCase()) : []
                    // every selected tag must be present
                    if (!requiredTags.every(t => tags.includes(t))) return false
                }

                return true
            })
            .sort((a, b) => {
                const ta = (a.timestamp instanceof Date ? a.timestamp : parseAsSydneyDate(a.timestamp)).getTime()
                const tb = (b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)).getTime()
                return tb - ta
            })
    })

    function onLogClick(ts) {
        jumpToTime(ts, 'food')
    }

    function clearAllFoodFilters() {
        clearSearch()
        selectedFoodTags.value = []
    }


</script>

<template>
    <div class="daily-section">
        <div class="search-box">
            <input
                    ref="inputEl"
                    v-model="search"
                    type="text"
                    class="search-input"
                    placeholder="Search foods (e.g., apple, orange)…"
                    @focus="showSuggestions = true"
                    @blur="showSuggestions = false"
                    @keydown.esc="showSuggestions = false"
                    @keydown.enter.prevent="chooseFood(suggestions[0] || search)"
            />
            <button
                    v-if="search || selectedFood"
                    class="clear-btn"
                    type="button"
                    @mousedown.prevent
                    @click="clearSearch"
                    aria-label="Clear search"
            >
                ×
            </button>

            <ul v-if="showSuggestions && suggestions.length && search.trim().length" class="suggestions">
                <li
                        v-for="name in suggestions"
                        :key="name"
                        class="suggestion"
                        @mousedown.prevent="chooseFood(name)"
                >
                    {{ name }}
                </li>
            </ul>
        </div>

        <div class="tag-cloud">
            <button
                    v-for="tag in allFoodTags"
                    :key="tag"
                    class="tag-chip"
                    :class="{ selected: isFoodTagSelected(tag) }"
                    type="button"
                    @click="toggleFoodTag(tag)"
            >
                {{ tag }}
            </button>

            <button
                    v-if="selectedFoodTags.length || selectedFood"
                    class="clear-btn"
                    type="button"
                    @click="clearAllFoodFilters"
                    aria-label="Clear tag & name filters"
                    style="margin-left: 0.5rem"
            >
                Clear Filters
            </button>
        </div>

        <div v-if="!selectedFood" class="hint">Search for a food, select it, then click the results to navigate and see the effect on BG.</div>

        <div v-if="selectedFood || selectedFoodTags.length > 0">
            <!--<h3 class="results-title">History for “{{ selectedFood }}”</h3>-->

            <div class="summary" v-if="matchingLogs.length">
                <strong>Total consumed: {{ totalQuantity }}</strong> grams in <strong>{{ durationDays }}</strong> day<span v-if="durationDays !== 1">s</span>.
            </div>

            <div v-if="matchingLogs.length === 0">No logs found.</div>

            <div v-else class="logs">
                <template v-for="group in groupedLogs" :key="group.key">
                    <h4 class="date-heading">{{ group.label }}</h4>
                    <FoodLogRow
                            v-for="log in group.logs"
                            :key="log.id"
                            :log="log"
                            @click="onLogClick(log.timestamp)"
                    />
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .search-box { position: relative; max-width: 520px; }
    .search-input {
        width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #ccc; border-radius: 8px;
        font-size: 0.95rem; outline: none;
    }
    .search-input:focus { border-color: #007acc; }

    .suggestions {
        position: absolute; z-index: 10; background: white; border: 1px solid #ddd; border-radius: 8px;
        width: 100%; margin-top: 0.25rem; max-height: 300px; overflow-y: auto; box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        list-style: none; padding: 0.25rem; margin-bottom: 0;
    }
    .suggestion {
        padding: 0.5rem 0.6rem; border-radius: 6px; cursor: pointer;
    }
    .suggestion:hover { background: #f2f7ff; }

    .hint { margin-top: 0.75rem; color: #666; }

    .results-title { margin: 1rem 0 0.5rem; font-size: 1.05rem; }

    .logs { list-style: none; padding: 0; margin: 0.5rem 0 0; }
    .log-item {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.5rem 0.6rem; border-bottom: 1px solid #eee; border-radius: 8px;
    }
    .log-item:hover { background: #f7fbff; }
    .log-time { width: 56px; font-variant-numeric: tabular-nums; color: #333; }
    .log-main { display: flex; flex-direction: column; gap: 0.15rem; }
    .log-name { font-weight: 600; }
    .log-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; color: #555; font-size: 0.9rem; }
    .summary {
        margin: 0.5rem 0 0.75rem;
        color: #0f172a;
    }
    .search-box { position: relative; max-width: 520px; }

    /* make room for the clear button */
    .search-input { padding-right: 2rem; }

    .clear-btn {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        color: #666;
        padding: 0.25rem;    /* larger clickable area */
    }

    .clear-btn:hover { color: #000; }

    .date-heading {
        margin: 1rem 0 0.4rem;
        font-weight: 700;
        color: #0f172a;
    }
    .tag-cloud {
        margin: 0.5rem 0 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }
    .tag-chip {
        border: 1px solid #d1d5db;
        background: #fff;
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.85rem;
        cursor: pointer;
        user-select: none;
    }
    .tag-chip.selected {
        background: #11182710;
        border-color: #11182766;
        font-weight: 600;
    }
</style>