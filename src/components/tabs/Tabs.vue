<script setup>
    import { ref, computed } from 'vue'
    import CombinedTab from './CombinedTab.vue'
    import AllNotesTab from './AllNotesTab.vue'
    import NotesTab from './NotesTab.vue'
    import FastsTab from './FastsTab.vue'
    import GlucoseTab from './GlucoseTab.vue'
    import FoodLogsTab from './FoodLogsTab.vue'
    import WorkoutsTab from './WorkoutsTab.vue'
    import BolusTab from './BolusTab.vue'
    import BasalTab from './BasalTab.vue'
    import BasalByHourTab from './BasalByHourTab.vue'
    import InsulinStatsTab from './InsulinStatsTab.vue'
    import NutritionStatsTab from './NutritionStatsTab.vue'
    import BgStatsTab from './BgStatsTab.vue'
    import FoodHistorySearchTab from './FoodHistorySearchTab.vue'
    import { formatDateTime, parseAsSydneyDate, getStartAndEndOfDay, isSameDay, formatTimeFromString, minutesOverlapWithinDay, formatHM, minutesBetweenOrEndOfDay} from '../../helpers/dateHelpers'
    import { formatMinutesPerKm, formatKmPerHour, formatDistance } from '../../helpers/workoutHelpers'

    const props = defineProps({
        notes:           { type: Array, default: () => [] },
        foods:           { type: Array, default: () => [] },
        foodLogs:        { type: Array, default: () => [] },
        bolusDoses:      { type: Array, default: () => [] },
        fasts:           { type: Array, default: () => [] },
        workouts:        { type: Array, default: () => [] },
        basalEntries:    { type: Array, default: () => [] },
        glucoseReadings: { type: Array, default: () => [] },
        selectedDate:     { type: Date, required: true },
    })

    const emit = defineEmits(['note-click'])

    const activeTab = ref('combined')

    function setTab(name) {
        activeTab.value = name
    }

</script>

<template>
    <section class="tab-section">
        <div class="tab-bar">
            <button class="tab-button" :class="{ active: activeTab === 'combined' }" @click="setTab('combined')">🧾 Combined</button>
            <button class="tab-button" :class="{ active: activeTab === 'notes' }" @click="setTab('notes')">📝 Notes</button>
            <button class="tab-button" :class="{ active: activeTab === 'foodLogs' }" @click="setTab('foodLogs')">🥗 Food</button>
            <button class="tab-button" :class="{ active: activeTab === 'bolus' }" @click="setTab('bolus')">💉 Bolus</button>
            <button class="tab-button" :class="{ active: activeTab === 'fasts' }" @click="setTab('fasts')">⏳ Fasts</button>
            <button class="tab-button" :class="{ active: activeTab === 'workouts' }" @click="setTab('workouts')">🏃‍♀️ Workouts</button>
            <button class="tab-button" :class="{ active: activeTab === 'basal' }" @click="setTab('basal')">💉 Basal</button>
            <button class="tab-button" :class="{ active: activeTab === 'basal-by-hour' }" @click="setTab('basal-by-hour')">💉 Hourly Basal</button>
            <button class="tab-button" :class="{ active: activeTab === 'glucose' }" @click="setTab('glucose')">🩸 BG</button>
            <button class="tab-button" :class="{ active: activeTab === 'all-notes' }" @click="setTab('all-notes')">📝 All Notes</button>
            <button class="tab-button" :class="{ active: activeTab === 'insulin-stats' }" @click="setTab('insulin-stats')">📊 Insulin Stats</button>
            <button class="tab-button" :class="{ active: activeTab === 'nutrition-stats' }" @click="setTab('nutrition-stats')">🥗 Nutrition Stats</button>
            <button class="tab-button" :class="{ active: activeTab === 'bg-stats' }" @click="setTab('bg-stats')">📈 BG Stats</button>
            <button class="tab-button" :class="{ active: activeTab === 'food-history' }" @click="setTab('food-history')">🔎 Food History</button>
        </div>

        <!-- Containers -->
        <div class="tab-content" :class="{ 'active-tab': activeTab === 'combined' }">
            <CombinedTab
                    :selected-date="selectedDate"
                    :food-logs="foodLogs"
                    :bolus-doses="bolusDoses"
                    :notes="notes"
                    :workouts="workouts"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'notes' }">
            <NotesTab
                    :notes="notes"
                    :selected-date="selectedDate"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'foodLogs' }">
            <FoodLogsTab
                    :food-logs="foodLogs"
                    :selected-date="selectedDate"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'bolus' }">
            <BolusTab
                    :bolus-doses="bolusDoses"
                    :selected-date="selectedDate"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'fasts' }">
            <FastsTab
                    :fasts="fasts"
                    :selected-date="selectedDate"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'workouts' }">
            <WorkoutsTab
                    :workouts="workouts"
                    :selected-date="selectedDate"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'basal' }">
            <BasalTab
                    :basal-entries="basalEntries"
                    :selected-date="selectedDate"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'basal-by-hour' }">
            <BasalByHourTab
                    :basal-entries="basalEntries"
                    :selected-date="selectedDate"
            />
        </div>



        <div class="tab-content" :class="{ 'active-tab': activeTab === 'glucose' }">
            <GlucoseTab
                    :glucose-readings="glucoseReadings"
                    :selected-date="selectedDate"
            />
        </div>

        <!-- All Notes with real data + search -->
        <div class="tab-content" :class="{ 'active-tab': activeTab === 'all-notes' }">
            <div class="daily-section">
                <AllNotesTab
                        :notes="notes"
                        @note-click="ts => emit('note-click', ts)"
                />
            </div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'insulin-stats' }">
            <InsulinStatsTab
                    :selected-date="selectedDate"
                    :bolus-doses="bolusDoses"
                    :basal-entries="basalEntries"
                    :food-logs="foodLogs"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'nutrition-stats' }">
            <NutritionStatsTab
                    :selected-date="selectedDate"
                    :food-logs="foodLogs"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'bg-stats' }">
            <BgStatsTab
                    :selected-date="selectedDate"
                    :glucose-readings="glucoseReadings"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'food-history' }">
            <FoodHistorySearchTab
                    :all-food-logs="foodLogs"
                    :foods="foods"
            />
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