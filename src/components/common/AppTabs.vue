<template>
  <nav class="tabs">
    <div class="tabsIn">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: state.activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge" class="dotbadge">{{ tab.badge }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { state, saveUi } from '../../store/state';

const openTasksCount = computed(() => {
  return state.entries.filter((e) => e.status === 'open' || e.status === 'pend').length;
});

const tevMarkedCount = computed(() => {
  return state.tevRequests.filter((r) => r.GENERATE).length;
});

const tabs = computed(() => [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ppa', label: 'PPA Overview' },
  { id: 'tasks', label: 'Work & Accomplishments', badge: openTasksCount.value > 0 ? openTasksCount.value : null },
  { id: 'calendar', label: 'Calendar', badge: openTasksCount.value || null },
  { id: 'weekly', label: 'Weekly Schedule' },
  { id: 'travel', label: 'Travel Order' },
  { id: 'tev', label: 'Travel & Expenses', badge: tevMarkedCount.value > 0 ? tevMarkedCount.value : null },
  { id: 'reports', label: 'Reports' },
  { id: 'insights', label: 'Insights' },
  { id: 'settings', label: 'Settings' }
]);

function switchTab(id) {
  state.activeTab = id;
  saveUi();
}
</script>
