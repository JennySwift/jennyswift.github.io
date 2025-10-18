//TestResultsTab.vue
<script setup>
    import { computed } from 'vue'
    import { formatShortDateInSydney, timeAgoInWords } from '../../helpers/dateHelpers'
    import TestResultsChart from '../../components/charts/TestResultsChart.vue'


    const props = defineProps({
        testResults: { type: Array, default: () => [] }
    })

    console.log('[TestResultsTab] testResults:', props.testResults)

    const DIABETIC_METRICS = [
        {
            key: 'hba1c',
            label: 'HbA1c (%)',
            targetRange: { min: 4.5,  max: 6.5 }
        },
        {
            key: 'cPeptide',
            label: 'C-Peptide',
            targetRange: { min: .4,  max: 1.5 }
        }
    ]

    const IRON_METRICS = [
        { key: 'iron',        label: 'Iron (µmol/L)',       colorVar: '--color-test-iron',        targetRange: { min: 5,  max: 30 } },
        { key: 'transferrin', label: 'Transferrin (g/L)',   colorVar: '--color-test-transferrin', targetRange: { min: 2.0, max: 3.6 } },
        { key: 'tibc',        label: 'TIBC (µmol/L)',       colorVar: '--color-test-tibc',        targetRange: { min: 46,  max: 77 } },
        { key: 'saturation',  label: 'Transferrin Sat (%)', colorVar: '--color-test-saturation',  targetRange: { min: 10,  max: 45 } },
        { key: 'ferritin',    label: 'Ferritin (µg/L)',     colorVar: '--color-test-ferritin',    targetRange: { min: 15,  max: 200 } },
        {
            key: 'zinc',
            label: 'Zinc',
            targetRange: { min: 10,  max: 18 }
        },
        {
            key: 'copper',
            label: 'Copper',
            targetRange: { min: 12,  max: 22 }
        },
    ]

    const THYROID_METRICS = [
        {
            key: 'tsh',
            label: 'TSH',
            targetRange: { min: .4,  max: 3.5 }
        },
        {
            key: 't4',
            label: 'T4',
            targetRange: { min: 9,  max: 19 }
        },
        {
            key: 't3',
            label: 'T3',
            targetRange: { min: 2.6,  max: 6.0 }
        },
    ]

    const LIPID_METRICS = [
        {
            key: 'cholesterol',
            label: 'Cholesterol',
            targetRange: { min: 3.9,  max: 5.5 }
        },
        {
            key: 'triglycerides',
            label: 'Triglycerides',
            targetRange: { min: .5,  max: 1.7 }
        },
        {
            key: 'hdlCholesterol',
            label: 'HDL Cholesterol',
            targetRange: { min: .9,  max: 2.1 }
        },
        {
            key: 'ldlCholesterol',
            label: 'LDL Cholesterol',
            targetRange: { min: 1.7,  max: 3.5 }
        },
    ]

    const OTHER_METRICS = [
        {
            key: 'b12',
            label: 'B12',
            targetRange: { min: 135,  max: 650 }
        },
        {
            key: 'iodine',
            label: 'Iodine'
        },
        {
            key: 'creatinine',
            label: 'Creatinine',
            targetRange: { min: 45,  max: 85 }
        },
        {
            key: 'vitaminD',
            label: 'Vitamin D',
            targetRange: { min: 50,  max: 140 }
        },
    ]

    // Helper to build rows for a given metric key: [{ date: Date, value: number }]
    function metricRows(key) {
        return (props.testResults ?? [])
            .map(r => ({ date: r.testDate, value: r?.[key] }))
            .filter(p => p.date && Number.isFinite(p.value))
            .sort((a, b) => a.date - b.date)
    }

    // HbA1c chart rows
    // const hba1cRows = computed(() => metricRows('hba1c'))

    const sortedResults = computed(() =>
        [...(props.testResults ?? [])].sort((a, b) => b.testDate - a.testDate)
    )

    // const sortedResults = computed(() =>
    //     [...props.testResults].sort((a, b) =>
    //         new Date(b.test_date) - new Date(a.test_date)
    //     )
    // )
</script>

<template>
    <div class="test-results-tab">
        <h1>Diabetic-related</h1>
        <!-- HbA1c chart -->
        <div v-for="m in DIABETIC_METRICS" :key="m.key" class="mini">
            <TestResultsChart
                    :testResults="testResults"
                    :metricKey="m.key"
                    :label="m.label"
                    :colorVar="m.colorVar"
                    :targetRange="m.targetRange"
            />
        </div>

        <!-- Iron Studies -->
        <h1>Iron-related</h1>
        <div class="iron-grid">
            <div v-for="m in IRON_METRICS" :key="m.key" class="mini">
                <TestResultsChart
                        :testResults="testResults"
                        :metricKey="m.key"
                        :label="m.label"
                        :colorVar="m.colorVar"
                        :targetRange="m.targetRange"
                />
            </div>
        </div>

        <h1>Thyroid-related</h1>
        <div v-for="m in THYROID_METRICS" :key="m.key" class="mini">
            <TestResultsChart
                    :testResults="testResults"
                    :metricKey="m.key"
                    :label="m.label"
                    :colorVar="m.colorVar"
                    :targetRange="m.targetRange"
            />
        </div>

        <h1>Lipids</h1>
        <div v-for="m in LIPID_METRICS" :key="m.key" class="mini">
            <TestResultsChart
                    :testResults="testResults"
                    :metricKey="m.key"
                    :label="m.label"
                    :colorVar="m.colorVar"
                    :targetRange="m.targetRange"
            />
        </div>

        <h1>Other</h1>
        <div v-for="m in OTHER_METRICS" :key="m.key" class="mini">
            <TestResultsChart
                    :testResults="testResults"
                    :metricKey="m.key"
                    :label="m.label"
                    :colorVar="m.colorVar"
                    :targetRange="m.targetRange"
            />
        </div>

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