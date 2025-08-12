<script setup>
    import { ref } from 'vue'
    import AllNotes from './AllNotes.vue'

    const props = defineProps({
        notes: { type: Array, default: () => [] }
    })
    const emit = defineEmits(['note-click'])

    const activeTab = ref('all-notes')

    function setTab(name) {
        activeTab.value = name
    }
</script>

<template>
    <section class="tab-section">
        <div class="tab-bar">
            <button class="tab-button" :class="{ active: activeTab === 'notes' }" @click="setTab('notes')">📝 Notes</button>
            <button class="tab-button" :class="{ active: activeTab === 'foodLogs' }" @click="setTab('foodLogs')">🥗 Food</button>
            <button class="tab-button" :class="{ active: activeTab === 'bolus' }" @click="setTab('bolus')">💉 Bolus</button>
            <button class="tab-button" :class="{ active: activeTab === 'fasts' }" @click="setTab('fasts')">⏳ Fasts</button>
            <button class="tab-button" :class="{ active: activeTab === 'workouts' }" @click="setTab('workouts')">🏃‍♀️ Workouts</button>
            <button class="tab-button" :class="{ active: activeTab === 'all-notes' }" @click="setTab('all-notes')">📝 All Notes</button>
        </div>

        <!-- Containers -->
        <div class="tab-content" :class="{ 'active-tab': activeTab === 'notes' }">
            <!-- (placeholder; we’ll fill this with your real notes-for-day later) -->
            <div class="daily-section">Notes for the selected day will go here.</div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'foodLogs' }">
            <div class="daily-section">Food logs go here.</div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'bolus' }">
            <div class="daily-section">Bolus entries go here.</div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'fasts' }">
            <div class="daily-section">Fasts go here.</div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'workouts' }">
            <div class="daily-section">Workouts go here.</div>
        </div>

        <!-- All Notes with real data + search -->
        <div class="tab-content" :class="{ 'active-tab': activeTab === 'all-notes' }">
            <div class="daily-section">
                <AllNotes :notes="notes" @note-click="ts => emit('note-click', ts)" />
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">
    .tab-section { margin-top: 2rem; }

    .tab-bar {
        display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; justify-content: center;
    }

    .tab-button {
        background: #e0e0e0; border: none; padding: 0.6rem 1rem; border-radius: 6px; font-weight: bold; cursor: pointer;
        transition: background 0.2s ease;
        &.active { background: #007acc; color: white; }
    }

    .tab-content { display: none; }
    .tab-content.active-tab { display: block; }

    .daily-section {
        background: #f9f9f9; padding: 1rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
</style>