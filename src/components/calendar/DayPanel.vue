<template>
  <div class="card daypanel" id="calendar-day-report" style="margin-top:14px">
    <div class="dpHead">
      <div>
        <div class="dpDate">{{ fmtLong(state.selDate) }}</div>
        <div class="dpSub">
          {{ relDay(state.selDate) }} · {{ totalItemsCount }} work &amp; travel item{{ totalItemsCount === 1 ? '' : 's' }} on this date
        </div>
      </div>
      <div class="flexrow no-print">
        <!-- View mode switcher: Kanban vs List -->
        <div class="btn-group">
          <button
            :class="['btn sm', { primary: dayViewMode === 'kanban' }]"
            @click="dayViewMode = 'kanban'"
            title="Kanban Board View"
          >
            <AppIcon name="kanban" /> Kanban
          </button>
          <button
            :class="['btn sm', { primary: dayViewMode === 'list' }]"
            @click="dayViewMode = 'list'"
            title="Classic List View"
          >
            <AppIcon name="list" /> List
          </button>
        </div>

        <button class="btn sm" @click="move(-1)">‹ Day</button>
        <button class="btn sm" @click="move(1)">Day ›</button>
        <button v-if="canEdit" class="btn sm primary" @click="emit('add-task', state.selDate)">
          + Add entry
        </button>
      </div>
    </div>

    <!-- Stats summary pills -->
    <div class="dpStats">
      <span class="chip pend">{{ pendingTasks.length }} pending</span>
      <span class="chip open">{{ ongoingTasks.length }} ongoing</span>
      <span class="chip done">{{ accomplishedTasks.length }} accomplished</span>
      <span v-if="travels.length" class="chip t">{{ travels.length }} on travel</span>
      <span v-if="state.selDate === todayISO()" class="chip">Today</span>
    </div>

    <!-- ----------------- KANBAN BOARD VIEW ----------------- -->
    <div v-if="dayViewMode === 'kanban'" class="kanban-board">
      <!-- 1. PENDING COLUMN -->
      <div
        :class="['kanban-col pend', { 'drag-over': dragOverCol === 'pend' }]"
        @dragover.prevent="dragOverCol = 'pend'"
        @dragleave="dragOverCol = null"
        @drop="handleDrop($event, 'pend')"
      >
        <div class="kanban-col-head">
          <div class="kanban-col-title">
            <i class="kanban-dot pend"></i>
            <span>Pending</span>
          </div>
          <span class="chip pend sm">{{ pendingTasks.length }}</span>
        </div>
        <div class="kanban-col-body">
          <div v-if="!pendingTasks.length" class="kanban-empty">
            <span>No pending tasks</span>
            <button v-if="canEdit" class="btn sm" @click="emit('add-task', state.selDate)">+ Add task</button>
          </div>
          <div
            v-for="e in pendingTasks"
            :key="e.id"
            :class="['kanban-card pend', { late: isOverdue(e), dragging: draggingId === e.id }]"
            :draggable="canEdit"
            @dragstart="handleDragStart($event, e)"
            @dragend="handleDragEnd"
          >
            <div class="kanban-card-title">{{ e.title }}</div>
            <div class="kanban-card-meta">
              <span class="chip cat sm">{{ e.category }}</span>
              <span v-if="isOverdue(e)" class="chip late sm">Overdue</span>
              <span v-if="e.dueDate">Due {{ fmtMed(e.dueDate) }}</span>
            </div>
            <div v-if="e.location || e.personnel" class="kanban-card-info">
              <span v-if="e.location">📍 {{ e.location }}</span>
              <span v-if="e.personnel">👤 {{ e.personnel }}</span>
            </div>
            <div v-if="e.remarks" class="kanban-card-remarks">{{ e.remarks }}</div>
            <div class="kanban-card-acts no-print">
              <a v-if="e.driveUrl" :href="e.driveUrl" class="btn sm drv" target="_blank" rel="noopener">Drive</a>
              <template v-if="canEdit">
                <button class="btn sm" @click="moveToStatus(e, 'open')" title="Move to Ongoing">→ Ongoing</button>
                <button class="btn sm" @click="moveToStatus(e, 'done')" title="Mark Accomplished">✓ Done</button>
                <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
                <button class="btn sm danger" @click="remove(e)">Del</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. ONGOING COLUMN -->
      <div
        :class="['kanban-col open', { 'drag-over': dragOverCol === 'open' }]"
        @dragover.prevent="dragOverCol = 'open'"
        @dragleave="dragOverCol = null"
        @drop="handleDrop($event, 'open')"
      >
        <div class="kanban-col-head">
          <div class="kanban-col-title">
            <i class="kanban-dot open"></i>
            <span>Ongoing</span>
          </div>
          <span class="chip open sm">{{ ongoingTasks.length }}</span>
        </div>
        <div class="kanban-col-body">
          <div v-if="!ongoingTasks.length" class="kanban-empty">
            <span>No ongoing activities</span>
          </div>
          <div
            v-for="e in ongoingTasks"
            :key="e.id"
            :class="['kanban-card open', { late: isOverdue(e), dragging: draggingId === e.id }]"
            :draggable="canEdit"
            @dragstart="handleDragStart($event, e)"
            @dragend="handleDragEnd"
          >
            <div class="kanban-card-title">{{ e.title }}</div>
            <div class="kanban-card-meta">
              <span class="chip cat sm">{{ e.category }}</span>
              <span v-if="isOverdue(e)" class="chip late sm">Overdue</span>
              <span v-if="e.dueDate">Target {{ fmtMed(e.dueDate) }}</span>
            </div>
            <div v-if="e.location || e.personnel" class="kanban-card-info">
              <span v-if="e.location">📍 {{ e.location }}</span>
              <span v-if="e.personnel">👤 {{ e.personnel }}</span>
            </div>
            <div v-if="e.remarks" class="kanban-card-remarks">{{ e.remarks }}</div>
            <div class="kanban-card-acts no-print">
              <a v-if="e.driveUrl" :href="e.driveUrl" class="btn sm drv" target="_blank" rel="noopener">Drive</a>
              <template v-if="canEdit">
                <button class="btn sm" @click="moveToStatus(e, 'done')" title="Mark Accomplished">✓ Done</button>
                <button class="btn sm" @click="moveToStatus(e, 'pend')" title="Move to Pending">← Pending</button>
                <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
                <button class="btn sm danger" @click="remove(e)">Del</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ACCOMPLISHED COLUMN -->
      <div
        :class="['kanban-col done', { 'drag-over': dragOverCol === 'done' }]"
        @dragover.prevent="dragOverCol = 'done'"
        @dragleave="dragOverCol = null"
        @drop="handleDrop($event, 'done')"
      >
        <div class="kanban-col-head">
          <div class="kanban-col-title">
            <i class="kanban-dot done"></i>
            <span>Accomplished</span>
          </div>
          <span class="chip done sm">{{ accomplishedTasks.length }}</span>
        </div>
        <div class="kanban-col-body">
          <div v-if="!accomplishedTasks.length" class="kanban-empty">
            <span>No accomplishments</span>
          </div>
          <div
            v-for="e in accomplishedTasks"
            :key="e.id"
            :class="['kanban-card done', { dragging: draggingId === e.id }]"
            :draggable="canEdit"
            @dragstart="handleDragStart($event, e)"
            @dragend="handleDragEnd"
          >
            <div class="kanban-card-title">✓ {{ e.title }}</div>
            <div class="kanban-card-meta">
              <span class="chip cat sm">{{ e.category }}</span>
              <span v-if="e.completedDate">Done {{ fmtMed(e.completedDate) }}</span>
            </div>
            <div v-if="e.location || e.personnel" class="kanban-card-info">
              <span v-if="e.location">📍 {{ e.location }}</span>
              <span v-if="e.personnel">👤 {{ e.personnel }}</span>
            </div>
            <div v-if="e.remarks" class="kanban-card-remarks">{{ e.remarks }}</div>
            <div class="kanban-card-acts no-print">
              <a v-if="e.driveUrl" :href="e.driveUrl" class="btn sm drv" target="_blank" rel="noopener">Drive</a>
              <template v-if="canEdit">
                <button class="btn sm" @click="moveToStatus(e, 'open')" title="Reopen Task">↺ Reopen</button>
                <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
                <button class="btn sm danger" @click="remove(e)">Del</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. TRAVEL COLUMN -->
      <div class="kanban-col trav">
        <div class="kanban-col-head">
          <div class="kanban-col-title">
            <i class="kanban-dot trav"></i>
            <span>Travel Orders</span>
          </div>
          <span class="chip t sm">{{ travels.length }}</span>
        </div>
        <div class="kanban-col-body">
          <div v-if="!travels.length" class="kanban-empty">
            <span>No travel on this date</span>
            <button v-if="canEdit" class="btn sm" @click="editingTravel = null; showTravel = true">+ Record Travel</button>
          </div>
          <div
            v-for="t in travels"
            :key="t.id"
            class="kanban-card trav"
          >
            <div class="kanban-card-title">{{ t.purpose || t.destination }}</div>
            <div class="kanban-card-meta">
              <b>{{ t.destination }}</b>
              <span v-if="t.travellerName">· {{ t.travellerName }}</span>
            </div>
            <div class="kanban-card-info">
              <span>📅 {{ fmtRange(t.from, t.to) }} ({{ travelDays(t) }} day{{ travelDays(t) === 1 ? '' : 's' }})</span>
              <span v-if="t.docGenerated" class="chip t sm">TO Generated</span>
            </div>
            <div v-if="t.purpose && t.purpose !== t.destination" class="kanban-card-remarks">
              {{ t.purpose }}
            </div>
            <div v-if="canEdit" class="kanban-card-acts no-print">
              <button class="btn sm" @click="editingTravel = { ...t }; showTravel = true">Edit</button>
              <button class="btn sm danger" @click="removeTravel(t)">Del</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ----------------- CLASSIC LIST VIEW ----------------- -->
    <div v-else>
      <div v-for="section in sections" :key="section.title" class="dpSec">
        <h4>{{ section.title }} <span class="n">{{ section.entries.length }}</span></h4>
        <div v-if="!section.entries.length" class="empty">{{ section.empty }}</div>
        <div
          v-for="e in section.entries"
          :key="e.id"
          :class="['evItem', isOverdue(e) ? 'l' : STATUS[e.status].ev]"
        >
          <div class="t">{{ e.title }}</div>
          <div class="meta">
            <span class="chip cat">{{ e.category }}</span>
            <span>{{ e.location }}</span>
            <span>{{ e.personnel }}</span>
            <span>{{ e.status === 'done' ? 'Accomplished ' + fmtMed(e.completedDate) : 'Target ' + fmtMed(e.dueDate) }}</span>
            <span v-if="e.createdByName">Encoded by {{ e.createdByName }}</span>
            <span v-if="e.completedByName">Accomplished by {{ e.completedByName }}</span>
          </div>
          <div v-if="e.remarks" class="rm">{{ e.remarks }}</div>
          <div class="acts no-print">
            <a v-if="e.driveUrl" :href="e.driveUrl" class="btn sm drv" target="_blank" rel="noopener">Supporting file</a>
            <template v-if="canEdit">
              <button class="btn sm" @click="toggle(e)">{{ e.status === 'done' ? 'Reopen' : 'Mark accomplished' }}</button>
              <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
              <button class="btn sm danger" @click="remove(e)">Delete</button>
            </template>
          </div>
        </div>
      </div>

      <div v-if="travels.length" class="dpSec">
        <h4>On travel this day <span class="chip t">T</span></h4>
        <div v-for="t in travels" :key="t.id" class="evItem t">
          <div class="t">{{ t.purpose || t.travellerName }}</div>
          <div class="meta">
            <b>{{ t.destination }}</b>
            <span v-if="t.travellerName"> · {{ t.travellerName }}</span>
            <span> · {{ fmtRange(t.from, t.to) }} · {{ travelDays(t) }} days</span>
            <span v-if="t.docGenerated"> · TO generated</span>
          </div>
          <div v-if="t.purpose && t.purpose !== t.destination && t.purpose !== t.travellerName" class="rm">{{ t.purpose }}</div>
          <div v-if="canEdit" class="acts no-print">
            <button class="btn sm" @click="editingTravel = { ...t }; showTravel = true">Edit travel</button>
            <button class="btn sm danger" @click="removeTravel(t)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <hr class="sep">
    <div class="flexrow no-print">
      <button class="btn sm" @click="showList">Show all entries of this date in a list</button>
      <button class="btn sm" @click="printArea('calendar-day-report')">Printable day report</button>
    </div>
    <TravelModal v-model="showTravel" :editing-item="editingTravel" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { state, saveUi, updateEntry, deleteEntry, deleteTravel } from '../../store/state';
import { canDo } from '../../utils/auth';
import { todayISO, addDays, fmtLong, fmtMed, fmtRange, relDay } from '../../utils/dateUtils';
import { entriesForDate, travelsOn, travelDays, isOverdue } from '../../utils/trackerMetrics';
import { STATUS } from '../../utils/constants';
import { printArea } from '../../utils/print';
import AppIcon from '../common/AppIcon.vue';
import TravelModal from '../travel/TravelModal.vue';

const emit = defineEmits(['edit-task', 'add-task']);
const canEdit = computed(() => canDo(state.auth.role, 'edit'));

const dayViewMode = ref('kanban');
const dragOverCol = ref(null);
const draggingId = ref(null);

const info = computed(() => entriesForDate(state.entries, state.selDate, state.calMode));
const travels = computed(() => travelsOn(state.travels, state.selDate));

const showTravel = ref(false);
const editingTravel = ref(null);

// Kanban columns partitioned for the selected day
const pendingTasks = computed(() => {
  return info.value.unfinished.filter(e => e.status === 'pend');
});

const ongoingTasks = computed(() => {
  const list = info.value.unfinished.filter(e => e.status === 'open');
  const seen = new Set(list.map(e => e.id));
  for (const s of info.value.spanning) {
    if (!seen.has(s.id) && s.status === 'open') {
      list.push(s);
      seen.add(s.id);
    }
  }
  return list;
});

const accomplishedTasks = computed(() => info.value.done);

const totalItemsCount = computed(() => {
  return pendingTasks.value.length + ongoingTasks.value.length + accomplishedTasks.value.length + travels.value.length;
});

// Classic list sections
const sections = computed(() => [
  { title: 'Accomplished on this date', entries: info.value.done, empty: 'No accomplishments recorded on this date.' },
  { title: 'Unfinished / not yet accomplished', entries: info.value.unfinished, empty: 'No unfinished work targeted for this date.' },
  ...(info.value.spanning.length ? [{ title: 'Ongoing work covering this date', entries: info.value.spanning, empty: '' }] : [])
]);

function move(n) {
  state.selDate = addDays(state.selDate, n);
  saveUi();
}

function moveToStatus(e, newStatus) {
  const updates = { status: newStatus };
  if (newStatus === 'done') {
    updates.completedDate = state.selDate || todayISO();
  } else if (e.status === 'done' && newStatus !== 'done') {
    updates.completedDate = '';
  }
  updateEntry(e.id, updates);
}

function toggle(e) {
  updateEntry(e.id, {
    status: e.status === 'done' ? 'open' : 'done',
    completedDate: e.status === 'done' ? '' : state.selDate
  });
}

function remove(e) {
  if (confirm(`Move "${e.title}" to the trash bin?`)) deleteEntry(e.id);
}

function removeTravel(t) {
  if (confirm(`Delete travel to ${t.destination}?`)) deleteTravel(t.id);
}

function showList() {
  Object.assign(state.filters, {
    quick: 'all',
    from: state.selDate,
    to: state.selDate,
    q: '',
    status: '',
    category: '',
    location: '',
    user: ''
  });
  state.activeTab = 'tasks';
  saveUi();
}

// Drag & drop handlers
function handleDragStart(event, entry) {
  if (!canEdit.value) return;
  draggingId.value = entry.id;
  event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: entry.id }));
  event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  draggingId.value = null;
  dragOverCol.value = null;
}

function handleDrop(event, targetStatus) {
  event.preventDefault();
  dragOverCol.value = null;
  draggingId.value = null;
  if (!canEdit.value) return;
  try {
    const raw = event.dataTransfer.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && data.type === 'task' && data.id) {
      const entry = state.entries.find(e => e.id === data.id);
      if (entry && entry.status !== targetStatus) {
        moveToStatus(entry, targetStatus);
      }
    }
  } catch (err) {
    console.error('Drop error:', err);
  }
}
</script>
