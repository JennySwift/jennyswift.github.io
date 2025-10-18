<script setup>
    import { computed } from 'vue'
    import { formatShortDateInSydney, timeAgoInWords } from '../../helpers/dateHelpers'
    import TestResultsChart from '../../components/charts/TestResultsChart.vue'


    const props = defineProps({
        testResults: { type: Array, default: () => [] }
    })

    console.log('[TestResultsTab] testResults:', props.testResults)

    const sortedResults = computed(() =>
        [...props.testResults].sort((a, b) =>
            new Date(b.test_date) - new Date(a.test_date)
        )
    )
</script>

<template>
    <div class="test-results-tab">
        <h2>HbA1c Test Results</h2>
        <TestResultsChart :testResults="testResults" />

        <ul class="test-results-list">
            <li v-for="r in sortedResults" :key="r.id">
                <strong class="label">{{ formatShortDateInSydney(r.testDate) }}</strong>
                <span class="value">{{ r.hba1c }}%</span>
                <span class="ago">({{ timeAgoInWords(r.testDate) }})</span>
                <span v-if="r.notes" class="notes">{{ r.notes }}</span>
            </li>
        </ul>
    </div>
</template>

<style scoped>
    .test-results-tab {
        padding: 1rem 0;
    }

    .test-results-list {
        list-style: none;
        padding: 0;
        margin-top: 1rem;
    }

    .test-results-list li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
        font-size: 1rem;
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
    }

    .label {
        width: 110px;
        font-weight: 600;
    }

    .value {
        font-weight: bold;
        font-size: 1.1rem;
    }

    .ago {
        color: #666;
        font-size: 0.85rem;
    }
</style>