<script setup>
    import { ref, computed } from 'vue'
    import AllNotesTab from './AllNotesTab.vue'
    import NotesTab from './NotesTab.vue'
    import WorkoutsTab from './WorkoutsTab.vue'
    import { formatDateTime, formatTime12hCompact, parseAsSydneyDate, getStartAndEndOfDay, isSameDay, formatTimeFromString, minutesOverlapWithinDay, formatHM, minutesBetweenOrEndOfDay} from '../../helpers/dateHelpers'
    import { formatMinutesPerKm, formatKmPerHour, formatDistance } from '../../helpers/workoutHelpers'

    const props = defineProps({
        notes:           { type: Array, default: () => [] },
        foodLogs:        { type: Array, default: () => [] },
        bolusDoses:      { type: Array, default: () => [] },
        fasts:           { type: Array, default: () => [] },
        workouts:        { type: Array, default: () => [] },
        basalEntries:    { type: Array, default: () => [] },
        glucoseReadings: { type: Array, default: () => [] },
        selectedDate:     { type: Date, required: true },
    })

    const emit = defineEmits(['note-click'])

    const activeTab = ref('all-notes')

    function setTab(name) {
        activeTab.value = name
    }

    const fastsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.fasts
            .filter(f => {
                const start = f.startTime instanceof Date ? f.startTime : parseAsSydneyDate(f.startTime)
                const end = f.endTime ? (f.endTime instanceof Date ? f.endTime : parseAsSydneyDate(f.endTime)) : null
                return (
                    (start >= startOfDay && start < endOfDay) ||            // started today
                    (end && end >= startOfDay && end < endOfDay) ||         // ended today
                    (start < startOfDay && (!end || end > endOfDay))        // spans whole day
                )
            })
            .sort((a, b) => {
                const sa = (a.startTime instanceof Date ? a.startTime : parseAsSydneyDate(a.startTime)).getTime()
                const sb = (b.startTime instanceof Date ? b.startTime : parseAsSydneyDate(b.startTime)).getTime()
                return sa - sb
            })
    })

    const bolusesForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.bolusDoses
            .filter(b => {
                const t = b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)
                return t >= startOfDay && t < endOfDay
            })
            .sort((a, b) => {
                const ta = (a.timestamp instanceof Date ? a.timestamp : parseAsSydneyDate(a.timestamp)).getTime()
                const tb = (b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)).getTime()
                return ta - tb
            })
    })

    function onBolusClick(b, evt) {
        const ts = b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)
        if (typeof highlightRow === 'function') highlightRow(evt?.currentTarget)
        emit('note-click', ts)
    }

    function onDailyNoteClick(n, evt) {
        const ts = n.timestamp instanceof Date ? n.timestamp : parseAsSydneyDate(n.timestamp)
        if (typeof highlightRow === 'function') highlightRow(evt?.currentTarget) // uses the helper you added earlier
        emit('note-click', ts)
    }

    const foodLogsForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)
        return props.foodLogs
            .filter(f => {
                const t = f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp)
                return t >= startOfDay && t < endOfDay
            })
            .sort((a, b) => {
                const ta = (a.timestamp instanceof Date ? a.timestamp : parseAsSydneyDate(a.timestamp)).getTime()
                const tb = (b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)).getTime()
                return ta - tb
            })
    })

    const basalEntriesForDay = computed(() => {
        if (!props.selectedDate) return []
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        return props.basalEntries
            .filter(e => {
                const s = e.startTime instanceof Date ? e.startTime : parseAsSydneyDate(e.startTime)
                const end = e.endTime ? (e.endTime instanceof Date ? e.endTime : parseAsSydneyDate(e.endTime)) : null
                // include any entry that overlaps the selected day (rate 0 included)
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
    <section class="tab-section">
        <div class="tab-bar">
            <button class="tab-button" :class="{ active: activeTab === 'notes' }" @click="setTab('notes')">📝 Notes</button>
            <button class="tab-button" :class="{ active: activeTab === 'foodLogs' }" @click="setTab('foodLogs')">🥗 Food</button>
            <button class="tab-button" :class="{ active: activeTab === 'bolus' }" @click="setTab('bolus')">💉 Bolus</button>
            <button class="tab-button" :class="{ active: activeTab === 'fasts' }" @click="setTab('fasts')">⏳ Fasts</button>
            <button class="tab-button" :class="{ active: activeTab === 'workouts' }" @click="setTab('workouts')">🏃‍♀️ Workouts</button>
            <button class="tab-button" :class="{ active: activeTab === 'basal' }" @click="setTab('basal')">💧 Basal</button>
            <button class="tab-button" :class="{ active: activeTab === 'all-notes' }" @click="setTab('all-notes')">📝 All Notes</button>
        </div>

        <!-- Containers -->
        <div class="tab-content" :class="{ 'active-tab': activeTab === 'notes' }">
            <NotesTab
                    :notes="notes"
                    :selected-date="selectedDate"
                    @note-click="ts => emit('note-click', ts)"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'foodLogs' }">
            <div class="daily-section">
                <div v-if="foodLogsForDay.length === 0">No food logs.</div>
                <div v-else>
                    <div
                            v-for="f in foodLogsForDay"
                            :key="(f.timestamp?.getTime?.() ?? f.timestamp) + '-' + (f.foodName || '')"
                            class="log-block"
                            role="button"
                            tabindex="0"
                            @click="onFoodClick(f, $event)"
                    >
                        <div class="log-title">
                            <strong>{{ formatTime12hCompact(f.timestamp) }}</strong>:
                            {{ f.foodName || 'Food' }}
                        </div>

                        <div class="log-details">
                            <span v-if="f.quantity != null">⚖️ Grams/mL: {{ f.quantity }}</span>
                            <span v-if="f.netCarbs != null">🍌 Net Carbs: {{ f.netCarbs }}g</span>
                            <span v-if="f.totalCarbs != null">🍌 Total Carbs: {{ f.totalCarbs }}g</span>
                            <span v-if="f.fat != null">🥑 Fat: {{ f.fat }}g</span>
                            <span v-if="f.protein != null">🫘 Protein: {{ f.protein }}g</span>
                            <span v-if="f.fibre != null">🌿 Fibre: {{ f.fibre }}g</span>
                            <span v-if="f.calories != null">🔥 Calories: {{ f.calories }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'bolus' }">
            <div class="daily-section">
                <div v-if="bolusesForDay.length === 0">No bolus doses for this day.</div>
                <div v-else>
                    <div
                            v-for="b in bolusesForDay"
                            :key="(b.timestamp?.getTime?.() ?? b.timestamp) + '-' + (b.amount ?? '')"
                            class="bolus-block"
                            role="button"
                            tabindex="0"
                            @click="onBolusClick(b, $event)"
                    >
                        <strong>{{ formatTime12hCompact(b.timestamp) }}</strong>:
                        💉 {{ (Number(b.amount ?? 0)).toFixed(2) }}U
                        <span v-if="b.carbRatioUsed"> · Ratio: 1:{{ b.carbRatioUsed }}</span>
                        <span v-if="b.notes"> · {{ b.notes }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'fasts' }">
            <div class="daily-section">
                <div v-if="fastsForDay.length === 0">No fasts for this day.</div>
                <div v-else>
                    <div
                            v-for="f in fastsForDay"
                            :key="(f.startTime?.getTime?.() ?? f.startTime) + '-' + (f.endTime?.getTime?.() ?? 'ongoing')"
                            class="fast-block"
                    >
                        <!-- Label -->
                        <div class="fast-label">
                            {{
                            isSameDay(f.startTime, selectedDate) && f.endTime && isSameDay(f.endTime, selectedDate) ? 'Started and Ended' :
                            isSameDay(f.startTime, selectedDate) ? 'Started fast:' :
                            (f.endTime && isSameDay(f.endTime, selectedDate)) ? 'Ended fast:' :
                            'Continued'
                            }}
                        </div>

                        <!-- Duration -->
                        <div v-if="f.duration">
                            <strong>Duration:</strong>
                            {{
                            Math.floor(f.duration / 3600) + 'h ' +
                            Math.floor((f.duration % 3600) / 60) + 'm'
                            }}
                        </div>

                        <!-- Start / End -->
                        <div><strong>Start:</strong> {{ formatDateTime(f.startTime) }}</div>
                        <div><strong>End:</strong> {{ f.endTime ? formatDateTime(f.endTime) : 'Ongoing' }}</div>

                        <!-- Notes -->
                        <div v-if="f.notes" class="fast-notes">📝 {{ f.notes }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'workouts' }">
            <WorkoutsTab
                    :workouts="workouts"
                    :selected-date="selectedDate"
                    @note-click="ts => emit('note-click', ts)"
            />
        </div>

        <div class="tab-content" :class="{ 'active-tab': activeTab === 'basal' }">
            <div class="daily-section">
                <div v-if="basalEntriesForDay.length === 0">No basal entries for this day.</div>
                <div v-else>
                    <div
                            v-for="b in basalEntriesForDay"
                            :key="(b.startTime?.getTime?.() ?? b.startTime) + '-' + (b.endTime?.getTime?.() ?? 'ongoing') + '-' + (b.rate ?? '')"
                            class="log-block"
                            role="button"
                            tabindex="0"
                            @click="emit('note-click', (b.startTime instanceof Date ? b.startTime : parseAsSydneyDate(b.startTime)))"
                    >
                        <div>
                            <strong>{{ formatTimeFromString(b.startTime) }}</strong>
                            —
                            <strong>{{ b.endTime ? formatTimeFromString(b.endTime) : 'Ongoing' }}</strong>
                        </div>

                        <!-- Duration of this entry (not clipped to day) -->
                        <div><strong>Duration:</strong> {{ formatHM(minutesBetweenOrEndOfDay(b.startTime, b.endTime, selectedDate)) }}</div>

                        <div class="log-details">
                            <span>💧 Rate: {{ b.rate }} U/hr</span>
                            <span v-if="b.mode">• Mode: {{ b.mode }}</span>
                            <span v-if="b.notes">• {{ b.notes }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- All Notes with real data + search -->
        <div class="tab-content" :class="{ 'active-tab': activeTab === 'all-notes' }">
            <div class="daily-section">
                <AllNotesTab :notes="notes" @note-click="ts => emit('note-click', ts)" />
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