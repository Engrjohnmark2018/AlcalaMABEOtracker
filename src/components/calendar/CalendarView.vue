<template>
  <section id="calendar-view">
    <div class="card" id="calendar-sheet">
      <div class="cardHead">
        <div class="calNav">
          <button class="btn icon no-print" aria-label="Previous period" @click="shift(-1)">‹</button>
          <div>
            <h2>{{ state.calView === 'year' ? state.calYear : MONTHS[state.calMonth] + ' ' + state.calYear }}</h2>
            <div class="moy">
              {{ state.calView === 'year' ? 'Year overview' : state.calView === 'kanban' ? 'Monthly Kanban board' : 'Month view' }} · {{ state.settings.officeName || 'ABE Office — Alcala' }}
            </div>
          </div>
          <button class="btn icon no-print" aria-label="Next period" @click="shift(1)">›</button>
          <button class="btn sm no-print" @click="goToday">Today</button>
          <button class="btn sm no-print" @click="printArea('calendar-sheet')">Print sheet</button>
        </div>
        <div class="flexrow no-print">
          <select v-model="state.calMode" class="input" aria-label="Calendar date mode" style="width:auto;max-width:360px" @change="saveUi">
            <option value="auto">Auto — completion / target date</option>
            <option value="due">Target / due date for everything</option>
            <option value="done">Completion date for everything</option>
          </select>
          <button :class="['btn sm', { primary: state.calView === 'month' }]" @click="setView('month')">Month</button>
          <button :class="['btn sm', { primary: state.calView === 'year' }]" @click="setView('year')">Year</button>
          <button :class="['btn sm', { primary: state.calView === 'kanban' }]" @click="setView('kanban')">Kanban</button>
        </div>
      </div>

      <!-- Year Overview View -->
      <div v-if="state.calView === 'year'" class="calYearWrap">
        <div v-for="(month, m) in MONTHS" :key="month" class="mini">
          <h4>
            <button class="month-link" @click="openMonth(m)">{{ month }}</button>
            <span class="chip">{{ monthSummary(m).done + monthSummary(m).left }}</span>
          </h4>
          <div class="mg">
            <span v-for="d in weekLabels" :key="d" class="hd">{{ d[0] }}</span>
            <template v-for="(iso, i) in monthCells(state.calYear, m, state.settings.weekStart)" :key="i">
              <i v-if="!iso" class="bl"></i>
              <button
                v-else
                :class="miniClass(iso)"
                :title="fmtLong(iso) + ' · ' + dayInfo(iso).done.length + ' accomplished · ' + travelsOn(state.travels, iso).length + ' travels'"
                @click="pickDay(iso, true)"
              >
                {{ fromISO(iso).getDate() }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Monthly Status Kanban View -->
      <div v-else-if="state.calView === 'kanban'" class="calKanbanWrap">
        <div class="kanban-board">
          <!-- Pending Column -->
          <div
            :class="['kanban-col pend', { 'drag-over': calDragOver === 'pend' }]"
            @dragover.prevent="calDragOver = 'pend'"
            @dragleave="calDragOver = null"
            @drop="handleCalDrop($event, 'pend')"
          >
            <div class="kanban-col-head">
              <div class="kanban-col-title">
                <i class="kanban-dot pend"></i>
                <span>Pending</span>
              </div>
              <span class="chip pend sm">{{ monthPending.length }}</span>
            </div>
            <div class="kanban-col-body">
              <div v-if="!monthPending.length" class="kanban-empty">
                <span>No pending tasks for {{ MONTHS[state.calMonth] }}</span>
              </div>
              <div
                v-for="e in monthPending"
                :key="e.id"
                :class="['kanban-card pend', { late: isOverdue(e), dragging: calDraggingId === e.id }]"
                :draggable="canEdit"
                @dragstart="handleCalDragStart($event, e)"
                @dragend="handleCalDragEnd"
              >
                <div class="kanban-card-title">{{ e.title }}</div>
                <div class="kanban-card-meta">
                  <span class="chip cat sm">{{ e.category }}</span>
                  <span v-if="isOverdue(e)" class="chip late sm">Overdue</span>
                  <button class="month-link" style="font-size:11px;font-weight:600" @click="pickDay(plotDate(e, state.calMode))">
                    📅 {{ fmtMed(plotDate(e, state.calMode)) }}
                  </button>
                </div>
                <div v-if="e.location || e.personnel" class="kanban-card-info">
                  <span v-if="e.location">📍 {{ e.location }}</span>
                  <span v-if="e.personnel">👤 {{ e.personnel }}</span>
                </div>
                <div v-if="e.remarks" class="kanban-card-remarks">{{ e.remarks }}</div>
                <div v-if="canEdit" class="kanban-card-acts no-print">
                  <button class="btn sm" @click="updateTaskStatus(e, 'open')">→ Ongoing</button>
                  <button class="btn sm" @click="updateTaskStatus(e, 'done')">✓ Done</button>
                  <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Ongoing Column -->
          <div
            :class="['kanban-col open', { 'drag-over': calDragOver === 'open' }]"
            @dragover.prevent="calDragOver = 'open'"
            @dragleave="calDragOver = null"
            @drop="handleCalDrop($event, 'open')"
          >
            <div class="kanban-col-head">
              <div class="kanban-col-title">
                <i class="kanban-dot open"></i>
                <span>Ongoing</span>
              </div>
              <span class="chip open sm">{{ monthOngoing.length }}</span>
            </div>
            <div class="kanban-col-body">
              <div v-if="!monthOngoing.length" class="kanban-empty">
                <span>No ongoing activities for {{ MONTHS[state.calMonth] }}</span>
              </div>
              <div
                v-for="e in monthOngoing"
                :key="e.id"
                :class="['kanban-card open', { late: isOverdue(e), dragging: calDraggingId === e.id }]"
                :draggable="canEdit"
                @dragstart="handleCalDragStart($event, e)"
                @dragend="handleCalDragEnd"
              >
                <div class="kanban-card-title">{{ e.title }}</div>
                <div class="kanban-card-meta">
                  <span class="chip cat sm">{{ e.category }}</span>
                  <span v-if="isOverdue(e)" class="chip late sm">Overdue</span>
                  <button class="month-link" style="font-size:11px;font-weight:600" @click="pickDay(plotDate(e, state.calMode))">
                    📅 {{ fmtMed(plotDate(e, state.calMode)) }}
                  </button>
                </div>
                <div v-if="e.location || e.personnel" class="kanban-card-info">
                  <span v-if="e.location">📍 {{ e.location }}</span>
                  <span v-if="e.personnel">👤 {{ e.personnel }}</span>
                </div>
                <div v-if="e.remarks" class="kanban-card-remarks">{{ e.remarks }}</div>
                <div v-if="canEdit" class="kanban-card-acts no-print">
                  <button class="btn sm" @click="updateTaskStatus(e, 'done')">✓ Done</button>
                  <button class="btn sm" @click="updateTaskStatus(e, 'pend')">← Pending</button>
                  <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Accomplished Column -->
          <div
            :class="['kanban-col done', { 'drag-over': calDragOver === 'done' }]"
            @dragover.prevent="calDragOver = 'done'"
            @dragleave="calDragOver = null"
            @drop="handleCalDrop($event, 'done')"
          >
            <div class="kanban-col-head">
              <div class="kanban-col-title">
                <i class="kanban-dot done"></i>
                <span>Accomplished</span>
              </div>
              <span class="chip done sm">{{ monthAccomplished.length }}</span>
            </div>
            <div class="kanban-col-body">
              <div v-if="!monthAccomplished.length" class="kanban-empty">
                <span>No accomplishments recorded for {{ MONTHS[state.calMonth] }}</span>
              </div>
              <div
                v-for="e in monthAccomplished"
                :key="e.id"
                :class="['kanban-card done', { dragging: calDraggingId === e.id }]"
                :draggable="canEdit"
                @dragstart="handleCalDragStart($event, e)"
                @dragend="handleCalDragEnd"
              >
                <div class="kanban-card-title">✓ {{ e.title }}</div>
                <div class="kanban-card-meta">
                  <span class="chip cat sm">{{ e.category }}</span>
                  <button class="month-link" style="font-size:11px;font-weight:600" @click="pickDay(plotDate(e, state.calMode))">
                    📅 {{ fmtMed(plotDate(e, state.calMode)) }}
                  </button>
                </div>
                <div v-if="e.location || e.personnel" class="kanban-card-info">
                  <span v-if="e.location">📍 {{ e.location }}</span>
                  <span v-if="e.personnel">👤 {{ e.personnel }}</span>
                </div>
                <div v-if="e.remarks" class="kanban-card-remarks">{{ e.remarks }}</div>
                <div v-if="canEdit" class="kanban-card-acts no-print">
                  <button class="btn sm" @click="updateTaskStatus(e, 'open')">↺ Reopen</button>
                  <button class="btn sm" @click="emit('edit-task', e)">Edit</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Travel Column -->
          <div class="kanban-col trav">
            <div class="kanban-col-head">
              <div class="kanban-col-title">
                <i class="kanban-dot trav"></i>
                <span>Travel Orders</span>
              </div>
              <span class="chip t sm">{{ monthTravels.length }}</span>
            </div>
            <div class="kanban-col-body">
              <div v-if="!monthTravels.length" class="kanban-empty">
                <span>No travels in {{ MONTHS[state.calMonth] }}</span>
              </div>
              <div
                v-for="t in monthTravels"
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Month Grid View -->
      <div v-else class="calendar-scroll">
        <table class="calGrid">
          <thead>
            <tr><th v-for="d in weekLabels" :key="d">{{ d }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(week, w) in weeks" :key="w">
              <td v-for="(iso, i) in week" :key="i" :class="iso ? dayClass(iso) : 'out'">
                <button v-if="iso" class="calendar-day" :aria-label="fmtLong(iso)" @click="pickDay(iso)">
                  <span class="dnum">
                    <span class="n">{{ fromISO(iso).getDate() }}</span>
                    <span class="cnts">
                      <span v-if="dayInfo(iso).done.length" class="c d">{{ dayInfo(iso).done.length }}✓</span>
                      <span v-if="dayInfo(iso).unfinished.length" :class="['c', dayInfo(iso).unfinished.some(isOverdue) ? 'l' : 'u']">
                        {{ dayInfo(iso).unfinished.length }}!
                      </span>
                      <span v-if="travelsOn(state.travels, iso).length" class="c t">
                        T{{ travelsOn(state.travels, iso).length > 1 ? travelsOn(state.travels, iso).length : '' }}
                      </span>
                    </span>
                  </span>
                  <span
                    v-for="(e, idx) in events(iso)"
                    :key="e.id"
                    :class="['calEv', e.kind, { 'calEv-overflow': idx >= 3 }]"
                    :title="e.text"
                  >
                    {{ e.text }}
                  </span>
                  <span v-if="events(iso).length > 3" class="moreEv no-print">+{{ events(iso).length - 3 }} more</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="legend calendar-legend">
        <span><i style="background:var(--done)"></i>Accomplished</span>
        <span><i style="background:var(--open)"></i>Ongoing</span>
        <span><i style="background:var(--pend)"></i>Pending</span>
        <span><i style="background:var(--late)"></i>Overdue</span>
        <span><i class="lt"></i><b>T</b> = traveller on travel that day</span>
      </div>

      <div v-if="state.calView === 'month' || state.calView === 'kanban'" class="grid g4" style="margin-top:12px">
        <div v-for="k in monthKpis" :key="k.label" :class="['kpi', k.cls]">
          <div class="lab">{{ k.label }}</div>
          <div class="val">{{ k.value }}</div>
        </div>
      </div>
    </div>

    <!-- Day details & Status Kanban Panel -->
    <DayPanel @edit-task="emit('edit-task', $event)" @add-task="emit('open-new-task-date', $event)" />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { state, saveUi, updateEntry } from '../../store/state';
import { canDo } from '../../utils/auth';
import { MONTHS, DOW_S, STATUS } from '../../utils/constants';
import { todayISO, toISO, fromISO, fmtLong, fmtMed, fmtRange } from '../../utils/dateUtils';
import { monthCells, entriesForDate, travelsOn, isOverdue, plotDate, overlapsRange, travelDays } from '../../utils/trackerMetrics';
import { printArea } from '../../utils/print';
import DayPanel from './DayPanel.vue';

const emit = defineEmits(['edit-task', 'open-new-task-date']);
const canEdit = computed(() => canDo(state.auth.role, 'edit'));

const weekLabels = computed(() => Array.from({ length: 7 }, (_, i) => DOW_S[(i + Number(state.settings.weekStart || 0)) % 7]));
const cells = computed(() => monthCells(state.calYear, state.calMonth, state.settings.weekStart));
const weeks = computed(() => Array.from({ length: cells.value.length / 7 }, (_, i) => cells.value.slice(i * 7, i * 7 + 7)));

const dayInfo = iso => entriesForDate(state.entries, iso, state.calMode);

function events(iso) {
  const info = dayInfo(iso);
  return [
    ...info.unfinished.map(e => ({ id: e.id, kind: isOverdue(e) ? 'l' : STATUS[e.status].ev, text: e.title })),
    ...info.done.map(e => ({ id: e.id, kind: 'd', text: '✓ ' + e.title })),
    ...travelsOn(state.travels, iso).map(t => ({ id: t.id, kind: 't', text: t.purpose || (t.travellerName ? t.travellerName + ' → ' + t.destination : t.destination) }))
  ];
}

function dayClass(iso) {
  const info = dayInfo(iso);
  return {
    today: iso === todayISO(),
    sel: iso === state.selDate,
    haspast: info.done.length,
    hasplan: info.unfinished.length && iso > todayISO(),
    haslate: info.unfinished.some(isOverdue),
    hastravel: travelsOn(state.travels, iso).length
  };
}

function miniClass(iso) {
  const info = dayInfo(iso), n = info.done.length + info.unfinished.length;
  return {
    late: info.unfinished.some(isOverdue),
    on1: n === 1,
    on2: n === 2,
    on3: n >= 3,
    trav: travelsOn(state.travels, iso).length,
    today: iso === todayISO()
  };
}

function monthSummary(m) {
  const info = monthCells(state.calYear, m).filter(Boolean).map(dayInfo);
  return {
    done: info.reduce((s, d) => s + d.done.length, 0),
    left: info.reduce((s, d) => s + d.unfinished.length, 0),
    late: info.reduce((s, d) => s + d.unfinished.filter(isOverdue).length, 0),
    active: info.filter(d => d.done.length + d.unfinished.length).length
  };
}

const monthKpis = computed(() => {
  const s = monthSummary(state.calMonth);
  return [
    { label: 'Accomplished in ' + MONTHS[state.calMonth], value: s.done, cls: 'done' },
    { label: 'Unfinished due this month', value: s.left, cls: 'open' },
    { label: 'Overdue on date', value: s.late, cls: 'late' },
    { label: 'Active days', value: s.active, cls: '' }
  ];
});

function setView(v) {
  state.calView = v;
  saveUi();
}

function shift(n) {
  if (state.calView === 'year') {
    state.calYear += n;
  } else {
    const d = new Date(state.calYear, state.calMonth + n, 1);
    state.calYear = d.getFullYear();
    state.calMonth = d.getMonth();
  }
  saveUi();
}

function goToday() {
  const d = fromISO(todayISO());
  state.calYear = d.getFullYear();
  state.calMonth = d.getMonth();
  state.selDate = toISO(d);
  saveUi();
}

function openMonth(m) {
  state.calMonth = m;
  setView('month');
}

function pickDay(iso, switchMonth = false) {
  if (!iso) return;
  state.selDate = iso;
  if (switchMonth) {
    state.calMonth = fromISO(iso).getMonth();
    state.calView = 'month';
  }
  saveUi();
}

// ----------------- Monthly Kanban Computations -----------------
const monthPrefix = computed(() => {
  const y = state.calYear;
  const m = String(state.calMonth + 1).padStart(2, '0');
  return `${y}-${m}`;
});

const monthTasks = computed(() => {
  const p = monthPrefix.value;
  return state.entries.filter(e => {
    const d = plotDate(e, state.calMode);
    return d && d.startsWith(p);
  });
});

const monthPending = computed(() => monthTasks.value.filter(e => e.status === 'pend'));
const monthOngoing = computed(() => monthTasks.value.filter(e => e.status === 'open'));
const monthAccomplished = computed(() => monthTasks.value.filter(e => e.status === 'done'));

const monthTravels = computed(() => {
  const y = state.calYear;
  const m = state.calMonth;
  const start = toISO(new Date(y, m, 1));
  const end = toISO(new Date(y, m + 1, 0));
  return state.travels.filter(t => overlapsRange(t, start, end));
});

const calDragOver = ref(null);
const calDraggingId = ref(null);

function updateTaskStatus(e, newStatus) {
  const updates = { status: newStatus };
  if (newStatus === 'done' && !e.completedDate) {
    updates.completedDate = todayISO();
  } else if (e.status === 'done' && newStatus !== 'done') {
    updates.completedDate = '';
  }
  updateEntry(e.id, updates);
}

function handleCalDragStart(event, entry) {
  if (!canEdit.value) return;
  calDraggingId.value = entry.id;
  event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: entry.id }));
  event.dataTransfer.effectAllowed = 'move';
}

function handleCalDragEnd() {
  calDraggingId.value = null;
  calDragOver.value = null;
}

function handleCalDrop(event, targetStatus) {
  event.preventDefault();
  calDragOver.value = null;
  calDraggingId.value = null;
  if (!canEdit.value) return;
  try {
    const raw = event.dataTransfer.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && data.type === 'task' && data.id) {
      const entry = state.entries.find(e => e.id === data.id);
      if (entry && entry.status !== targetStatus) {
        updateTaskStatus(entry, targetStatus);
      }
    }
  } catch (err) {
    console.error('Drop error:', err);
  }
}
</script>
