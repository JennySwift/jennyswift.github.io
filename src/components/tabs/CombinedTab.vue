<script setup>
    import { computed } from 'vue'
    import {
        getStartAndEndOfDay,
        parseAsSydneyDate,
        formatTime12hCompact
    } from '../../helpers/dateHelpers'

    const props = defineProps({
        selectedDate: { type: Date, required: true },
        foodLogs:     { type: Array, default: () => [] },
        bolusDoses:   { type: Array, default: () => [] },
        notes:        { type: Array, default: () => [] },
        workouts:     { type: Array, default: () => [] },
    })

    /** Build a single array of day entries with a common shape */
    const feedItems = computed(() => {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(props.selectedDate)

        const foods = props.foodLogs.map(f => {
            const ts = f.timestamp instanceof Date ? f.timestamp : parseAsSydneyDate(f.timestamp)
            return ts >= startOfDay && ts < endOfDay ? {
                type: 'food',
                ts,
                title: f.foodName ?? 'Food',
                netCarbs: Number(f.netCarbs ?? 0),
                calories: Number(f.calories ?? 0),
            } : null
        }).filter(Boolean)

        const boluses = props.bolusDoses.map(b => {
            const ts = b.timestamp instanceof Date ? b.timestamp : parseAsSydneyDate(b.timestamp)
            return ts >= startOfDay && ts < endOfDay ? {
                type: 'bolus',
                ts,
                amount: Number(b.amount ?? 0),
                notes: b.notes ?? '',
                source: b.source ?? '',
            } : null
        }).filter(Boolean)

        const noteItems = props.notes.map(n => {
            const ts = n.timestamp
                ? (n.timestamp instanceof Date ? n.timestamp : parseAsSydneyDate(n.timestamp))
                : (n.startTime instanceof Date ? n.startTime : parseAsSydneyDate(n.startTime))
            return ts >= startOfDay && ts < endOfDay ? {
                type: 'note',
                ts,
                text: n.text ?? '',
                tags: n.tags ?? [],
            } : null
        }).filter(Boolean)

        const workouts = props.workouts.map(w => {
            const ts = w.start instanceof Date ? w.start : parseAsSydneyDate(w.start)
            return ts >= startOfDay && ts < endOfDay ? {
                type: 'workout',
                ts,
                name: w.name ?? w.type ?? 'Workout',
                duration: Number(w.duration ?? 0), // seconds
                avgHR: Number(w.averageHeartRate ?? 0),
                distance: Number(w.distance ?? 0),
            } : null
        }).filter(Boolean)

        return [...foods, ...boluses, ...noteItems, ...workouts]
            .sort((a, b) => a.ts - b.ts)
    })
</script>

<template>
    <div class="combined-list">
        <div v-if="feedItems.length === 0" class="empty">No activity for this day.</div>

        <div v-else>
            <div v-for="(item, idx) in feedItems" :key="item.type + '-' + item.ts.getTime() + '-' + idx" class="row">
                <span class="time">{{ formatTime12hCompact(item.ts) }}</span>

                <template v-if="item.type === 'food'">
                    <span class="icon">🥗</span>
                    <div class="content">
                        <div class="title">{{ item.title }}</div>
                        <div class="meta">Net: {{ item.netCarbs.toFixed(1) }}g • {{ Math.round(item.calories) }} kcal</div>
                    </div>
                </template>

                <template v-else-if="item.type === 'bolus'">
                    <span class="icon">💉</span>
                    <div class="content">
                        <div class="title">Bolus</div>
                        <div class="meta">{{ item.amount.toFixed(2) }}U<span v-if="item.source"> • {{ item.source }}</span><span v-if="item.notes"> • {{ item.notes }}</span></div>
                    </div>
                </template>

                <template v-else-if="item.type === 'note'">
                    <span class="icon">📝</span>
                    <div class="content">
                        <div class="title">{{ item.text }}</div>
                        <div v-if="item.tags?.length" class="tags">
                            <span v-for="t in item.tags" :key="t" class="tag">#{{ t }}</span>
                        </div>
                    </div>
                </template>

                <template v-else-if="item.type === 'workout'">
                    <span class="icon">🏃‍♀️</span>
                    <div class="content">
                        <div class="title">{{ item.name }}</div>
                        <div class="meta">
                            {{ item.distance ? (item.distance.toFixed(2) + ' km • ') : '' }}
                            {{ item.duration ? Math.round(item.duration / 60) + ' min' : '' }}
                            <span v-if="item.avgHR"> • Avg HR {{ Math.round(item.avgHR) }}</span>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .combined-list { display: grid; gap: 8px; }
    .empty { color:#6b7280; }
    .row {
        display:grid;
        grid-template-columns: 72px 28px 1fr;
        gap:10px;
        align-items:flex-start;
        background:#f9fafb;
        border:1px solid #e5e7eb;
        border-radius:8px;
        padding:8px 10px;
    }
    .time { color:#374151; font-variant-numeric: tabular-nums; margin-top:2px; }
    .icon { display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
    .content .title { font-weight:600; color:#111827; }
    .content .meta { color:#4b5563; margin-top:2px; font-size:.92rem; }
    .tags { margin-top:4px; display:flex; flex-wrap:wrap; gap:6px; }
    .tag { background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; border-radius:999px; padding:2px 8px; font-size:.78rem; }
</style>