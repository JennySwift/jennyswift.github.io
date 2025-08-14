<script setup>
    import {ref, computed} from 'vue'
    import { getSydneyStartOfToday, formatDateInSydney, formatDateForInput, parseAsSydneyDate } from '../helpers/dateHelpers'
    import { DateTime } from 'luxon'

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
        const s = DateTime.fromJSDate(selectedDate.value).setZone('Australia/Sydney');
        selectedDate.value = s.minus({ days: 1 }).startOf('day').toJSDate();
    }

    function nextDate() {
        const s = DateTime.fromJSDate(selectedDate.value).setZone('Australia/Sydney');
        selectedDate.value = s.plus({ days: 1 }).startOf('day').toJSDate();
    }

    function onDateInput(e) {
        const v = e.target.value;
        if (!v) return;
        selectedDate.value = DateTime
            .fromISO(v, { zone: 'Australia/Sydney' })
            .startOf('day')
            .toJSDate();
    }

</script>

<template>
    <header class="date-header">
        <h1 class="date-heading">{{ dateHeading }}</h1>

        <div class="date-nav">
            <button
                    class="icon-btn"
                    type="button"
                    @click="prevDate"
                    aria-label="Previous day"
                    title="Previous day"
            >
                <!-- Left chevron -->
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <input class="date-input" type="date" :value="dateInputValue" @input="onDateInput"/>

            <button
                    class="icon-btn"
                    type="button"
                    @click="nextDate"
                    aria-label="Next day"
                    title="Next day"
            >
                <!-- Right chevron -->
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
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

        .date-nav {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .icon-btn {
                width: 44px;           // large, finger-friendly target
                height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;   // modern rounded
                border: 1px solid #e5e7eb;
                background: #fff;
                color: #111827;
                box-shadow: 0 1px 2px rgba(0,0,0,0.04);
                cursor: pointer;
                transition:
                        background-color .15s ease,
                        border-color .15s ease,
                        box-shadow .15s ease,
                        transform .06s ease;
            }

            .icon-btn:hover {
                background: #f9fafb;
                border-color: #d1d5db;
                box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            }

            .icon-btn:active {
                transform: translateY(1px);
            }

            .icon-btn:focus-visible {
                outline: none;
                box-shadow:
                        0 0 0 3px rgba(59,130,246,.15),   // soft focus ring
                        0 2px 6px rgba(0,0,0,0.06);
                border-color: #93c5fd;
            }

            .date-input {
                padding: 0.55rem 0.65rem;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                font-size: 1rem;
                background: #fff;
                transition: border-color .15s ease, box-shadow .15s ease;
            }

            .date-input:focus {
                outline: none;
                border-color: #93c5fd;
                box-shadow: 0 0 0 3px rgba(59,130,246,.15);
            }
        }

        .date-input {
            padding: 0.35rem 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }
        .icon-btn svg {
            display: block;       // remove inline spacing
            width: 20px;
            height: 20px;
        }
    }
</style>