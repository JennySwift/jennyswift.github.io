<script setup>
    import {ref, computed} from 'vue'
    import { getSydneyStartOfToday, formatDateInSydney, formatDateForInput, parseAsSydneyDate } from '../helpers/dateHelpers'

    const props = defineProps({
        selectedDate: { type: Date, default: () => getSydneyStartOfToday() }
    })

    const emit = defineEmits(['update:selectedDate'])

    const selectedDate = computed({
        get: () => props.selectedDate,
        set: (d) => emit('update:selectedDate', d)
    })

    const dateHeading = computed(() => formatDateInSydney(selectedDate.value))

    const dateInputValue = computed(() => formatDateForInput(selectedDate.value))

    function prevDate() {
        const base = parseAsSydneyDate(formatDateForInput(selectedDate.value))
        base.setDate(base.getDate() - 1)
        const iso = base.toISOString().split('T')[0]
        selectedDate.value = parseAsSydneyDate(iso)
    }

    function nextDate() {
        const base = parseAsSydneyDate(formatDateForInput(selectedDate.value))
        base.setDate(base.getDate() + 1)
        const iso = base.toISOString().split('T')[0]
        selectedDate.value = parseAsSydneyDate(iso)
    }

    function onDateInput(e) {
        const v = e.target.value
        if (!v) return
        selectedDate.value = parseAsSydneyDate(v)
    }

</script>

<template>
    <header class="date-header">
        <h1 class="date-heading">{{ dateHeading }}</h1>

        <div class="date-nav">
            <button class="nav-btn" @click="prevDate">⬅️ Previous</button>
            <input class="date-input" type="date" :value="dateInputValue" @input="onDateInput"/>
            <button class="nav-btn" @click="nextDate">➡️ Next</button>
        </div>
    </header>
</template>

<style scoped lang="scss">
    .date-header {
        display: grid;
        gap: 0.75rem;
        justify-items: center;
        margin-top: 1.25rem;
    }

    .date-heading {
        font-size: 1.8rem;
        margin: 0;
        text-align: center;
    }

    .date-nav {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .nav-btn {
            padding: 0.4rem 0.7rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #f9fafb;
            cursor: pointer;

            &:hover {
                background: #f3f4f6;
            }
        }

        .date-input {
            padding: 0.35rem 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }
    }
</style>