<template>
  <div>
    <!-- Top Brand Header -->
    <AppHeader @new-entry="openNewTask" />

    <!-- Navigation Tabs -->
    <AppTabs />

    <!-- Main Container -->
    <main class="app" style="margin-top: 16px;">
      <!-- Dashboard -->
      <DashboardView
        v-if="state.activeTab === 'dashboard'"
        @open-task-modal="openNewTask"
        @edit-task="editTask"
      />

      <!-- PPA Overview -->
      <PpaView
        v-else-if="state.activeTab === 'ppa'"
      />

      <!-- Work & Accomplishments -->
      <TasksView
        v-else-if="state.activeTab === 'tasks'"
        ref="tasksViewRef"
      />

      <!-- Calendar -->
      <CalendarView
        v-else-if="state.activeTab === 'calendar'"
        @edit-task="editTask"
        @open-new-task-date="openNewTaskOnDate"
      />

      <!-- Weekly Schedule -->
      <WeeklyScheduleView
        v-else-if="state.activeTab === 'weekly'"
      />

      <!-- Travel expense document processing -->
      <TevAutomationView
        v-else-if="state.activeTab === 'tev'"
      />

      <!-- Reports -->
      <ReportsView
        v-else-if="state.activeTab === 'reports'"
      />

      <!-- Insights -->
      <InsightsView
        v-else-if="state.activeTab === 'insights'"
      />

      <!-- Settings -->
      <SettingsView
        v-else-if="state.activeTab === 'settings'"
      />
    </main>

    <!-- Global App-level Task Modal -->
    <TaskModal
      v-model="showGlobalTaskModal"
      :editing-item="globalEditingTask"
    />

    <!-- Password Gate -->
    <LockScreen />

    <!-- Toast Alerts -->
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { state, loadState, autoCheckSession } from './store/state';

import AppHeader from './components/common/AppHeader.vue';
import AppTabs from './components/common/AppTabs.vue';
import LockScreen from './components/common/LockScreen.vue';
import ToastNotification from './components/common/ToastNotification.vue';

import DashboardView from './components/dashboard/DashboardView.vue';
import PpaView from './components/ppa/PpaView.vue';
import TasksView from './components/tasks/TasksView.vue';
import CalendarView from './components/calendar/CalendarView.vue';
import WeeklyScheduleView from './components/weekly/WeeklyScheduleView.vue';
import TevAutomationView from './components/tev/TevAutomationView.vue';
import ReportsView from './components/reports/ReportsView.vue';
import InsightsView from './components/insights/InsightsView.vue';
import SettingsView from './components/settings/SettingsView.vue';

import TaskModal from './components/tasks/TaskModal.vue';
import { todayISO } from './utils/dateUtils';

const showGlobalTaskModal = ref(false);
const globalEditingTask = ref(null);
watch(() => state.activeTab, async () => {
  await nextTick();
  window.scrollTo({top:0,left:0,behavior:'instant'});
});

onMounted(() => {
  loadState();
  autoCheckSession();
});

function openNewTask() {
  globalEditingTask.value = null;
  showGlobalTaskModal.value = true;
}

function openNewTaskOnDate(dateStr) {
  globalEditingTask.value = {
    title: '',
    category: state.settings.categories[0] || 'Others',
    status: 'pend',
    startDate: dateStr,
    dueDate: dateStr,
    completedDate: '',
    location: '',
    personnel: '',
    beneficiaries: 0,
    remarks: ''
  };
  showGlobalTaskModal.value = true;
}

function editTask(task) {
  globalEditingTask.value = { ...task };
  showGlobalTaskModal.value = true;
}
</script>
