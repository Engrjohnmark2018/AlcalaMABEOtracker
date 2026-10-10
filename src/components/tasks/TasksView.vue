<template>
  <div class="card">
    <div class="cardHead">
      <div>
        <h3>Work, Tasks &amp; Accomplishments Register</h3>
        <div class="sub">Complete log of engineering services, machinery operations, and field activities.</div>
      </div>
      <div class="topActions">
        <button class="btn primary" @click="openNewTask">+ Log Work</button>
        <button class="btn soft" @click="showTemplatesModal = true"><AppIcon name="bolt" /> Templates</button>
        <button class="btn sm" @click="showCsvModal = true"><AppIcon name="upload" /> Import CSV</button>
        <button class="btn sm" @click="exportCsv"><AppIcon name="download" /> Export CSV</button>
        <button class="btn sm" @click="showTrashModal = true" title="Trash Bin">
          <AppIcon name="trash" /> ({{ state.trash.length }})
        </button>
      </div>
    </div>

    <!-- Quick Filter Chips -->
    <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
      <button
        v-for="qf in quickFilters"
        :key="qf.id"
        :class="['btn sm', { primary: state.filters.quick === qf.id }]"
        @click="setQuickFilter(qf.id)"
      >
        <AppIcon v-if="qf.icon" :name="qf.icon" /> {{ qf.label }}
      </button>
    </div>

    <!-- Detailed Filters Toolbar -->
    <div class="card" style="margin-top: 0; background: var(--panel-2); padding: 12px;">
      <div class="filterbar">
        <input
          v-model="state.filters.q"
          class="input"
          placeholder="Search by title, location, personnel, or remarks…"
        />
        <select v-model="state.filters.status" class="input">
          <option value="">All Statuses</option>
          <option value="done">Accomplished</option>
          <option value="open">Ongoing</option>
          <option value="pend">Pending</option>
          <option value="cancel">Cancelled</option>
        </select>
        <select v-model="state.filters.category" class="input">
          <option value="">All Categories</option>
          <option v-for="cat in state.settings.categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
        <select v-model="state.filters.sort" class="input">
          <option value="due-asc">Due Date (Earliest)</option>
          <option value="due-desc">Due Date (Latest)</option>
          <option value="title-asc">Title (A–Z)</option>
          <option value="created-desc">Recently Logged</option>
        </select>
      </div>
      <div class="filterbar" style="margin-top:10px">
        <div class="field"><label>Location</label><select v-model="state.filters.location" class="input"><option value="">All locations</option><option v-for="p in state.settings.locations" :key="p" :value="p">{{ p }}</option></select></div>
        <div class="field"><label>Recorded by</label><select v-model="state.filters.user" class="input"><option value="">All staff</option><option v-for="u in state.users" :key="u.id" :value="u.id">{{ u.displayName || u.username }}</option><option value="master">Administrator</option></select></div>
        <div class="field"><label>From</label><input v-model="state.filters.from" type="date" class="input"></div>
        <div class="field"><label>To</label><input v-model="state.filters.to" type="date" class="input"></div>
        <button class="btn" @click="resetFilters">Reset filters</button>
      </div>
    </div>

    <!-- Bulk Selection Bar -->
    <div
      v-if="selectedIds.length"
      class="banner"
      style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; background: var(--brand-3); color: var(--brand-2);"
    >
      <div>
        <b>{{ selectedIds.length }} item{{ selectedIds.length > 1 ? 's' : '' }} selected</b>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn sm" @click="bulkMarkDone"><AppIcon name="check" /> Mark Accomplished</button>
        <button class="btn danger sm" @click="bulkDelete"><AppIcon name="trash" /> Delete Selected</button>
        <button class="btn sm" @click="selectedIds = []">Cancel</button>
      </div>
    </div>

    <!-- Entries Table -->
    <div style="margin-top: 12px; overflow-x: auto; border: 1px solid var(--line); border-radius: 10px;">
      <table class="tbl" style="margin: 0; font-size: 13.5px;">
        <thead>
          <tr>
            <th style="width: 36px; text-align: center;">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isIndeterminate"
                @change="toggleSelectAll($event.target.checked)"
              />
            </th>
            <th style="width: 130px;">Status</th>
            <th>Title &amp; Category</th>
            <th>Target / Due Date</th>
            <th>Location &amp; Personnel</th>
            <th style="text-align: right;">Beneficiaries</th>
            <th>Evidence</th>
            <th style="text-align: right; width: 90px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredEntries.length">
            <td colspan="8" class="small muted" style="text-align: center; padding: 32px;">
              No activities found matching your criteria. Click <b>"+ Log Work"</b> to add an entry.
            </td>
          </tr>
          <tr
            v-for="e in filteredEntries"
            :key="e.id"
            :class="{ mine: isMine(e), overdueRow: isTaskOverdue(e) }"
          >
            <td style="text-align: center;">
              <input
                type="checkbox"
                :value="e.id"
                v-model="selectedIds"
              />
            </td>
            <td>
              <button
                :class="['chip', e.status]"
                style="cursor: pointer; border: 0;"
                title="Click to cycle status"
                @click="cycleStatus(e)"
              >
                {{ formatStatus(e.status) }}
              </button>
            </td>
            <td>
              <div><b>{{ e.title }}</b></div>
              <div class="small muted">
                {{ e.category }}
                <span v-if="e.remarks"> · {{ e.remarks }}</span>
              </div>
            </td>
            <td style="white-space: nowrap;">
              <div v-if="e.status === 'done'" style="color: var(--done); font-weight: 600;">
                ✓ {{ e.completedDate || e.dueDate || 'Done' }}
              </div>
              <div v-else-if="e.dueDate" :style="{ color: isTaskOverdue(e) ? 'var(--late)' : 'inherit', fontWeight: isTaskOverdue(e) ? '700' : 'normal' }">
                {{ e.dueDate }}
                <div v-if="isTaskOverdue(e)" style="font-size: 10.5px; color: var(--late);">OVERDUE</div>
              </div>
              <div v-else class="small muted">—</div>
            </td>
            <td class="small">
              <div>{{ e.location || '—' }}</div>
              <div class="muted">{{ e.personnel || '—' }}</div>
            </td>
            <td style="text-align: right; font-weight: 600;">
              {{ e.beneficiaries || 0 }}
            </td>
            <td>
              <a
                v-if="e.driveUrl"
                :href="e.driveUrl"
                target="_blank"
                class="btn sm icon"
                title="Open Google Drive folder with evidence"
              >
                <AppIcon name="link" />
              </a>
              <span v-else class="small muted">—</span>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn sm icon" title="Edit" @click="editTask(e)"><AppIcon name="edit" /></button>
              <button class="btn sm icon danger" title="Delete" @click="deleteTask(e)"><AppIcon name="trash" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <TaskModal
      v-model="showTaskModal"
      :editing-item="editingTask"
      @saved="selectedIds = []"
    />
    <ActivityTemplatesModal
      v-model="showTemplatesModal"
      @apply="applyTemplate"
    />
    <CsvImportModal
      v-model="showCsvModal"
      @imported="selectedIds = []"
    />
    <TrashBinModal
      v-model="showTrashModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, updateEntry, deleteEntry, saveState, saveUi, notify } from '../../store/state';
import { plotDate } from '../../utils/trackerMetrics';
import { todayISO, isDate } from '../../utils/dateUtils';
import { STATUS } from '../../utils/constants';
import { entriesToCsv } from '../../utils/csvEngine';
import { downloadBinary } from '../../utils/storage';

import TaskModal from './TaskModal.vue';
import ActivityTemplatesModal from './ActivityTemplatesModal.vue';
import CsvImportModal from './CsvImportModal.vue';
import TrashBinModal from './TrashBinModal.vue';

const showTaskModal = ref(false);
const showTemplatesModal = ref(false);
const showCsvModal = ref(false);
const showTrashModal = ref(false);
const editingTask = ref(null);
const selectedIds = ref([]);
watch(()=>state.filters,saveUi,{deep:true});
function resetFilters(){Object.assign(state.filters,{q:'',status:'',category:'',location:'',user:'',from:'',to:'',quick:'all'});}

const quickFilters = [
  { id: 'all', label: 'All Activities' },
  { id: 'mine', icon: 'user', label: 'My Logged Work' },
  { id: 'overdue', icon: 'warning', label: 'Overdue' },
  { id: 'today', icon: 'calendar', label: 'Today' },
  { id: 'open', icon: 'refresh', label: 'Open / Pending' }
];

function setQuickFilter(id) {
  state.filters.quick = id;
}

const filteredEntries = computed(() => {
  let list = state.entries;
  const T = todayISO();
  const qf = state.filters.quick;

  // Quick filters
  if (qf === 'mine') {
    list = list.filter((e) => e.createdBy === state.auth.id);
  } else if (qf === 'overdue') {
    list = list.filter((e) => (e.status === 'open' || e.status === 'pend') && isDate(e.dueDate) && e.dueDate < T);
  } else if (qf === 'today') {
    list = list.filter((e) => e.dueDate === T || e.completedDate === T || e.startDate === T);
  } else if (qf === 'open') {
    list = list.filter((e) => e.status === 'open' || e.status === 'pend');
  }

  // Status
  if (state.filters.status) {
    list = list.filter((e) => e.status === state.filters.status);
  }

  // Category
  if (state.filters.category) {
    list = list.filter((e) => e.category === state.filters.category);
  }

  // Text search
  if (state.filters.location) list = list.filter(e=>e.location===state.filters.location);
  if (state.filters.user) list = list.filter(e=>e.createdBy===state.filters.user);
  if (state.filters.from || state.filters.to) list = list.filter(e=>{const d=plotDate(e);return isDate(d)&&(!state.filters.from||d>=state.filters.from)&&(!state.filters.to||d<=state.filters.to);});
  const q = (state.filters.q || '').toLowerCase().trim();
  if (q) {
    list = list.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.personnel.toLowerCase().includes(q) ||
      e.remarks.toLowerCase().includes(q)
    );
  }

  // Sort
  const sort = state.filters.sort;
  return [...list].sort((a, b) => {
    if (sort === 'due-asc') return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    if (sort === 'due-desc') return (b.dueDate || '').localeCompare(a.dueDate || '');
    if (sort === 'title-asc') return a.title.localeCompare(b.title);
    if (sort === 'created-desc') return (b.createdAt || '').localeCompare(a.createdAt || '');
    return 0;
  });
});

const isAllSelected = computed(() => {
  return filteredEntries.value.length > 0 && selectedIds.value.length === filteredEntries.value.length;
});

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < filteredEntries.value.length;
});

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = filteredEntries.value.map((e) => e.id);
  } else {
    selectedIds.value = [];
  }
}

function isMine(e) {
  return e.createdBy === state.auth.id;
}

function isTaskOverdue(e) {
  return (e.status === 'open' || e.status === 'pend') && isDate(e.dueDate) && e.dueDate < todayISO();
}

function formatStatus(s) {
  return STATUS[s] ? STATUS[s].label : s;
}

function cycleStatus(e) {
  const next = e.status === 'pend' ? 'open' : e.status === 'open' ? 'done' : 'pend';
  updateEntry(e.id, { status: next });
}

function openNewTask() {
  editingTask.value = null;
  showTaskModal.value = true;
}

function editTask(e) {
  editingTask.value = { ...e };
  showTaskModal.value = true;
}

function deleteTask(e) {
  if (confirm(`Move "${e.title}" to the trash bin?`)) {
    deleteEntry(e.id);
  }
}

function applyTemplate(tpl) {
  editingTask.value = {
    title: tpl.title,
    category: tpl.category,
    location: tpl.location,
    personnel: tpl.personnel,
    remarks: tpl.remarks,
    status: 'pend',
    startDate: todayISO(),
    dueDate: todayISO()
  };
  showTaskModal.value = true;
}

function bulkMarkDone() {
  selectedIds.value.forEach((id) => {
    updateEntry(id, { status: 'done', completedDate: todayISO() });
  });
  notify(`Marked ${selectedIds.value.length} activities as accomplished!`);
  selectedIds.value = [];
}

function bulkDelete() {
  if (confirm(`Move ${selectedIds.value.length} selected activities to the trash bin?`)) {
    selectedIds.value.forEach((id) => {
      deleteEntry(id);
    });
    selectedIds.value = [];
  }
}

function exportCsv() {
  const csv = entriesToCsv(filteredEntries.value);
  const enc = new TextEncoder().encode(csv);
  downloadBinary(`ABE-Accomplishments-${todayISO()}.csv`, enc, 'text/csv');
  notify('Accomplishments exported to CSV.');
}
</script>
