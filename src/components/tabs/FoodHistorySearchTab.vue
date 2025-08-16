<script setup>
    import { ref, computed } from 'vue'
    import { parseAsSydneyDate, formatHM } from '../../helpers/dateHelpers'
    import { jumpToTime } from '../../helpers/jumpToTime'
    import FoodLogRow from '../rows/FoodLogRow.vue'

    const props = defineProps({
        allFoodLogs: { type: Array, default: () => [] },
    })

    const search = ref('')
    const selectedFood = ref('')

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
    }

    const matchingLogs = computed(() => {
        if (!selectedFood.value) return []
        const nameLower = selectedFood.value.toLowerCase()
        return props.allFoodLogs
            .filter(l => getFoodName(l).toLowerCase() === nameLower)
            .sort((a, b) => {
                const ta = (a.timestamp instanceof Date ? a.timestamp : parseAsSydneyDate(a.timestamp)).getTime()
                const tb = (b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)).getTime()
                return tb - ta
            })
    })

    function onLogClick(ts) {
        jumpToTime(ts, 'food')
    }


</script>

<template>
    <div class="daily-section">
        <div class="search-box">
            <input
                    v-model="search"
                    type="text"
                    class="search-input"
                    placeholder="Search foods (e.g., apple, orange)…"
                    @keydown.enter.prevent="chooseFood(suggestions[0] || search)"
            />
            <ul v-if="suggestions.length && search.trim().length" class="suggestions">
                <li
                        v-for="name in suggestions"
                        :key="name"
                        class="suggestion"
                        @click="chooseFood(name)"
                >
                    {{ name }}
                </li>
            </ul>
        </div>

        <div v-if="!selectedFood" class="hint">Type to search, then pick a food to see its history.</div>

        <div v-else>
            <h3 class="results-title">History for “{{ selectedFood }}”</h3>

            <div v-if="matchingLogs.length === 0">No logs found.</div>

            <div v-else class="logs">
                <FoodLogRow
                        v-for="log in matchingLogs"
                        :key="log.id"
                        :log="log"
                        @click="onLogClick(log.timestamp)"
                />
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
</style>