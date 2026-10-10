<template>
  <div class="card">
    <div class="cardHead">
      <div>
        <h3>Visual Analytics &amp; Performance Insights</h3>
        <div class="sub">Activity distribution by engineering sector, status breakdown, and team delivery rates.</div>
      </div>
    </div>

    <!-- Status Breakdown Cards -->
    <div class="grid g4" style="margin-top: 12px;">
      <div class="card" style="margin-top: 0; border-top: 4px solid var(--done);">
        <div class="small muted">Accomplished</div>
        <div style="font-size: 26px; font-weight: 800; color: var(--done);">{{ statusCounts.done }}</div>
        <div class="small muted">{{ percent(statusCounts.done, totalActive) }}% of active workload</div>
      </div>
      <div class="card" style="margin-top: 0; border-top: 4px solid var(--open);">
        <div class="small muted">Ongoing</div>
        <div style="font-size: 26px; font-weight: 800; color: var(--open);">{{ statusCounts.open }}</div>
        <div class="small muted">{{ percent(statusCounts.open, totalActive) }}% currently in field</div>
      </div>
      <div class="card" style="margin-top: 0; border-top: 4px solid var(--pend);">
        <div class="small muted">Pending</div>
        <div style="font-size: 26px; font-weight: 800; color: var(--pend);">{{ statusCounts.pend }}</div>
        <div class="small muted">{{ percent(statusCounts.pend, totalActive) }}% queued</div>
      </div>
      <div class="card" style="margin-top: 0; border-top: 4px solid var(--late);">
        <div class="small muted">Overdue / Delayed</div>
        <div style="font-size: 26px; font-weight: 800; color: var(--late);">{{ statusCounts.overdue }}</div>
        <div class="small muted">Need immediate attention</div>
      </div>
    </div>

    <!-- Sector / Category Distribution -->
    <div class="card" style="margin-top: 16px;">
      <div class="cardHead">
        <h4>Distribution by Program / Sector</h4>
        <span class="chip">{{ categoryStats.length }} Sectors</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
        <div v-for="cat in categoryStats" :key="cat.name">
          <div style="display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 4px;">
            <span><b>{{ cat.name }}</b></span>
            <span><b>{{ cat.count }}</b> activities ({{ cat.pct }}%)</span>
          </div>
          <div style="background: var(--line-2); height: 10px; border-radius: 999px; overflow: hidden;">
            <div
              style="background: linear-gradient(90deg, var(--brand), var(--brand-2)); height: 100%; border-radius: 999px; transition: width 0.3s;"
              :style="{ width: cat.pct + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <InsightCharts />
    <!-- Staff Contribution Metrics -->
    <div class="card" style="margin-top: 16px;">
      <div class="cardHead">
        <h4>Engineering Staff &amp; Team Metrics</h4>
      </div>
      <div style="overflow-x: auto;">
        <table class="tbl" style="margin: 0; font-size: 13.5px;">
          <thead>
            <tr>
              <th>Personnel</th>
              <th style="text-align: right;">Total Logged</th>
              <th style="text-align: right;">Accomplished</th>
              <th style="text-align: right;">Ongoing</th>
              <th style="text-align: right;">Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in staffStats" :key="staff.name">
              <td><b>{{ staff.name }}</b></td>
              <td style="text-align: right;">{{ staff.total }}</td>
              <td style="text-align: right; color: var(--done); font-weight: 600;">{{ staff.done }}</td>
              <td style="text-align: right; color: var(--open);">{{ staff.open }}</td>
              <td style="text-align: right; font-weight: 700; color: var(--brand-2);">
                {{ staff.rate }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../../store/state';
import { todayISO, isDate } from '../../utils/dateUtils';
import InsightCharts from './InsightCharts.vue';

const statusCounts = computed(() => {
  const T = todayISO();
  let done = 0, open = 0, pend = 0, cancel = 0, overdue = 0;
  state.entries.forEach((e) => {
    if (e.status === 'done') done++;
    else if (e.status === 'open') open++;
    else if (e.status === 'pend') pend++;
    else if (e.status === 'cancel') cancel++;

    if ((e.status === 'open' || e.status === 'pend') && isDate(e.dueDate) && e.dueDate < T) {
      overdue++;
    }
  });
  return { done, open, pend, cancel, overdue };
});

const totalActive = computed(() => {
  return statusCounts.value.done + statusCounts.value.open + statusCounts.value.pend;
});

function percent(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

const categoryStats = computed(() => {
  const counts = {};
  state.entries.forEach((e) => {
    const c = e.category || 'Others';
    counts[c] = (counts[c] || 0) + 1;
  });
  const total = state.entries.length || 1;
  return Object.keys(counts).map((k) => ({
    name: k,
    count: counts[k],
    pct: Math.round((counts[k] / total) * 100)
  })).sort((a, b) => b.count - a.count);
});

const staffStats = computed(() => {
  const map = {};
  state.entries.forEach((e) => {
    const p = e.personnel || e.createdByName || 'Unassigned';
    if (!map[p]) map[p] = { name: p, total: 0, done: 0, open: 0, cancel: 0 };
    map[p].total++;
    if (e.status === 'done') map[p].done++;
    else if (e.status === 'open' || e.status === 'pend') map[p].open++;
    else if (e.status === 'cancel') map[p].cancel++;
  });
  return Object.values(map).map((s) => ({
    ...s,
    rate: s.total - s.cancel ? Math.round((s.done / (s.total - s.cancel)) * 100) : 0
  })).sort((a, b) => b.total - a.total);
});
</script>
