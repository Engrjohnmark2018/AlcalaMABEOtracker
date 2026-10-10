<template>
  <div class="card">
    <div class="cardHead">
      <div>
        <h3>Programs, Projects &amp; Activities (PPA) Overview</h3>
        <div class="sub">
          <span v-if="state.ppa">
            {{ state.ppa.name }} · {{ state.ppa.rows.length }} rows × {{ state.ppa.headers.length }} columns
            <span v-if="state.ppa.at">· uploaded {{ state.ppa.at.slice(0, 10) }} {{ state.ppa.byName ? 'by ' + state.ppa.byName : '' }}</span>
          </span>
          <span v-else>The office PPA list, exactly as uploaded</span>
        </div>
      </div>

      <div class="topActions">
        <label v-if="canEdit" class="btn soft sm" style="cursor: pointer; margin: 0;">
          <AppIcon name="upload" /> {{ state.ppa ? 'Replace CSV' : 'Upload PPA CSV' }}
          <input type="file" accept=".csv,text/csv" style="display: none;" @change="handleUploadCsv" />
        </label>
        <button v-if="state.ppa" class="btn sm" @click="handleExportCsv"><AppIcon name="download" /> Export CSV</button>
        <button v-if="state.ppa && canEdit" class="btn danger sm" @click="handleClearPpa"><AppIcon name="trash" /> Clear</button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!state.ppa" class="card" style="text-align: center; padding: 40px 20px; background: var(--panel-2);">
      <div style="font-size: 32px; margin-bottom: 8px;"><AppIcon name="clipboard" :size="32" /></div>
      <h4 style="margin-bottom: 6px;">No PPA list uploaded yet</h4>
      <p class="small muted" style="max-width: 480px; margin: 0 auto 16px;">
        Upload your office PPA list as a CSV file. The columns and rows will appear here exactly as formatted in your file.
      </p>
      <label v-if="canEdit" class="btn primary" style="cursor: pointer;">
        <AppIcon name="upload" /> Upload PPA CSV
        <input type="file" accept=".csv,text/csv" style="display: none;" @change="handleUploadCsv" />
      </label>
    </div>

    <!-- PPA Table View -->
    <div v-else>
      <div class="toolbar" style="margin: 6px 0 10px; display: flex; align-items: center; gap: 8px;">
        <input
          v-model="searchQuery"
          class="input"
          style="max-width: 320px;"
          placeholder="Search the PPA list…"
        />
        <button v-if="searchQuery" class="btn sm" @click="searchQuery = ''">Clear</button>
        <span class="small muted" style="margin-left: auto;">
          Showing {{ filteredRows.length }} of {{ state.ppa.rows.length }} rows
        </span>
      </div>

      <div style="overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; max-height: 600px;">
        <table class="tbl" style="margin: 0; font-size: 13.5px;">
          <thead>
            <tr>
              <th
                v-for="(header, colIdx) in state.ppa.headers"
                :key="colIdx"
                style="cursor: pointer; user-select: none;"
                @click="toggleSort(colIdx)"
              >
                {{ header }}
                <span v-if="sortCol === colIdx">{{ sortDir > 0 ? ' ▲' : ' ▼' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredRows.length">
              <td :colspan="state.ppa.headers.length" class="small muted" style="text-align: center; padding: 24px;">
                Nothing matches that search.
              </td>
            </tr>
            <tr v-for="(row, rIdx) in filteredRows" :key="rIdx">
              <td v-for="(val, cIdx) in row" :key="cIdx">
                {{ val }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { state, saveState, saveUi, notify } from '../../store/state';
import { canDo } from '../../utils/auth';
import { encCsvRows } from '../../utils/csvEngine';
import { downloadBinary } from '../../utils/storage';

const searchQuery = computed({get:()=>state.ppaQ,set:v=>state.ppaQ=v});
const sortCol = computed({get:()=>state.ppaSort.col,set:v=>state.ppaSort.col=v});
const sortDir = computed({get:()=>state.ppaSort.dir,set:v=>state.ppaSort.dir=v});
watch(()=>[state.ppaQ,state.ppaSort.col,state.ppaSort.dir],saveUi);

const canEdit = computed(() => canDo(state.auth.role, 'settings'));

function toggleSort(colIdx) {
  if (sortCol.value === colIdx) {
    sortDir.value = -sortDir.value;
  } else {
    sortCol.value = colIdx;
    sortDir.value = 1;
  }
}

const filteredRows = computed(() => {
  if (!state.ppa || !Array.isArray(state.ppa.rows)) return [];
  let rows = state.ppa.rows;

  const q = searchQuery.value.toLowerCase().trim();
  if (q) {
    rows = rows.filter((r) => r.some((c) => String(c || '').toLowerCase().includes(q)));
  }

  if (sortCol.value >= 0) {
    const c = sortCol.value;
    const d = sortDir.value;
    rows = [...rows].sort((a, b) => {
      const vA = String(a[c] || '');
      const vB = String(b[c] || '');
      return vA.localeCompare(vB, undefined, { numeric: true }) * d;
    });
  }

  return rows;
});

function handleUploadCsv(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const text = event.target.result;
      const parsed = encCsvRows(text);
      if (parsed.length < 2) throw new Error('CSV must have a header row and at least one data row.');

      const headers = parsed[0].map((h) => String(h || '').trim());
      const rows = parsed.slice(1).map((r) => r.map((c) => String(c || '').trim()));

      state.ppa = {
        name: file.name,
        at: new Date().toISOString(),
        by: state.auth.id,
        byName: state.auth.name,
        headers,
        rows,
        total: rows.length
      };

      saveState();
      notify(`Loaded PPA list: ${rows.length} rows, ${headers.length} columns.`);
    } catch (err) {
      notify(`Failed to parse CSV: ${err.message}`, true);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function handleExportCsv() {
  if (!state.ppa) return;
  const escapeCell=c=>/[",\r\n]/.test(String(c))?'"'+String(c).replaceAll('"','""')+'"':String(c);
  const lines = [state.ppa.headers.map(escapeCell).join(',')];
  state.ppa.rows.forEach((r) => {
    lines.push(r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(','));
  });
  const csvContent = lines.join('\r\n');
  const enc = new TextEncoder().encode(csvContent);
  downloadBinary(state.ppa.name || 'PPA-List.csv', enc, 'text/csv');
}

function handleClearPpa() {
  if (confirm('Remove the uploaded PPA list from the tracker?')) {
    state.ppa = null;
    saveState();
    notify('PPA list removed.');
  }
}
</script>
