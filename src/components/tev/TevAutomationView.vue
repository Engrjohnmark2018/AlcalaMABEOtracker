<template>
  <div class="card">
    <div class="cardHead">
      <div>
        <h3>Travel &amp; Expenses — Document Processing</h3>
        <div class="sub">
          Generate Travel Orders (DOCX), Itinerary of Travel (XLSX), Certificate of Expenses (XLSX), and Certificate of Travel Completed (XLSX).
        </div>
      </div>

      <div class="topActions">
        <button class="btn primary" @click="openAddModal">+ Add Travel Request</button>
        <button class="btn soft" @click="showFareMatrixModal = true"><AppIcon name="map" /> Fare Matrix ({{ state.fareMatrix.length }})</button>
        <button class="btn icon" title="Templates & Settings" @click="showTemplateModal = true"><AppIcon name="settings" /></button>
      </div>
    </div>

    <!-- Top KPI Cards -->
    <div class="kpis">
      <div class="kpi">
        <div class="lab">Total Requests</div>
        <div class="val">{{ state.tevRequests.length }}</div>
        <div class="small muted">Recorded entries</div>
      </div>
      <div class="kpi done">
        <div class="lab">Marked to Generate</div>
        <div class="val" style="color: var(--brand-2);">{{ markedRequests.length }}</div>
        <div class="small muted">Ready for batching</div>
      </div>
      <div class="kpi open">
        <div class="lab">Total Fares</div>
        <div class="val" style="font-size: 24px;">₱{{ formatMoney(totalFares) }}</div>
        <div class="small muted">Transportation costs</div>
      </div>
      <div class="kpi pend">
        <div class="lab">Total Diems</div>
        <div class="val" style="font-size: 24px;">₱{{ formatMoney(totalDiems) }}</div>
        <div class="small muted">Allowance claims</div>
      </div>
      <div class="kpi late">
        <div class="lab">Total Estimated TEV</div>
        <div class="val" style="font-size: 24px; color: var(--brand-2);">₱{{ formatMoney(totalOverall) }}</div>
        <div class="small muted">Fare + Diem combined</div>
      </div>
    </div>

    <!-- Generation Toolbar -->
    <div class="card" style="margin-top: 14px; background: var(--panel-2);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 13.5px;">Batch Generation ({{ markedRequests.length }} checked):</span>
          <button
            class="btn primary sm"
            :disabled="!markedRequests.length || isGenerating"
            @click="generateBatchNoTO"
          >
            <AppIcon name="chart" /> Generate Batch (IOT + COE + CTC)
          </button>
          <button
            class="btn soft sm"
            :disabled="!markedRequests.length || isGenerating"
            @click="generateTOOnly"
          >
            <AppIcon name="file" /> Generate TO Only (DOCX)
          </button>
          <button
            class="btn sm"
            :disabled="!markedRequests.length || isGenerating"
            style="background: var(--brand-2); color: #fff; border: 0;"
            @click="generateCompleteBatch"
          >
            <AppIcon name="package" /> Complete Package (All 4 in ZIP)
          </button>
          <button
            class="btn danger sm"
            :disabled="!markedRequests.length || isGenerating"
            @click="handleDeleteChecked"
          >
            <AppIcon name="trash" /> Delete Checked
          </button>
        </div>

        <!-- Export / Import -->
        <div style="display: flex; gap: 6px;">
          <button class="btn sm" @click="handleExportExcel" title="Export current requests table to Excel">
            <AppIcon name="download" /> Export Excel
          </button>
          <label class="btn sm soft" style="cursor: pointer; margin: 0;" title="Import requests from Excel">
            <AppIcon name="upload" /> Import Excel
            <input type="file" accept=".xlsx" style="display: none;" @change="handleImportExcel" />
          </label>
        </div>
      </div>

      <div v-if="genStatus" class="lockMsg ok" style="margin-top: 8px;">
        {{ genStatus }}
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; gap: 8px; align-items: center; flex: 1; max-width: 480px;">
        <input
          v-model="search"
          class="input"
          placeholder="Search by destination, route, purpose, or request ID…"
        />
        <select v-model="filterStatus" class="input" style="max-width: 170px;">
          <option value="all">All Requests</option>
          <option value="marked">Marked for Gen</option>
          <option value="batched">Already Batched</option>
          <option value="unbatched">Unbatched</option>
        </select>
      </div>

      <div class="small muted">
        Showing {{ filteredRequests.length }} of {{ state.tevRequests.length }} requests
      </div>
    </div>

    <!-- Tabulation Table -->
    <div style="overflow-x: auto; border: 1px solid var(--line); border-radius: 10px;">
      <table class="tbl" style="margin: 0; font-size: 13.5px;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isIndeterminate"
                @change="toggleSelectAll($event.target.checked)"
                title="Select / Deselect All"
              />
            </th>
            <th>Request ID</th>
            <th>Date of Travel</th>
            <th>Destination</th>
            <th>Route &amp; Mode</th>
            <th style="text-align: right;">Fare (₱)</th>
            <th style="text-align: right;">Diem (₱)</th>
            <th style="text-align: right;">Total (₱)</th>
            <th>Purpose</th>
            <th>Batch ID</th>
            <th style="text-align: right; width: 110px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredRequests.length">
            <td colspan="11" class="small muted" style="text-align: center; padding: 24px;">
              No travel requests found. Click <b>"+ Add Travel Request"</b> to encode a new trip!
            </td>
          </tr>
          <tr
            v-for="req in filteredRequests"
            :key="req.REQUEST_ID"
            :class="{ mine: req.GENERATE }"
          >
            <td style="text-align: center;">
              <input
                type="checkbox"
                :checked="req.GENERATE"
                @change="toggleSelect(req.REQUEST_ID, $event.target.checked)"
              />
            </td>
            <td>
              <span class="tev-batch-id" :title="'Created: ' + req.CREATION_DATE">{{ req.REQUEST_ID }}</span>
            </td>
            <td style="white-space: nowrap; font-weight: 600;">
              {{ req.DATE_OF_TRAVEL }}
            </td>
            <td>
              <b>{{ req.DESTINATION }}</b>
            </td>
            <td class="small muted" style="max-width: 220px;" :title="req.ROUTE">
              <div>{{ req.ROUTE }}</div>
              <div v-if="req.TRANSPORTATION" style="color: var(--ink-2); font-weight: 500;">
                Mode: {{ req.TRANSPORTATION }}
              </div>
            </td>
            <td style="text-align: right; font-weight: 600;">
              ₱{{ formatMoney(req.FARE) }}
            </td>
            <td style="text-align: right; font-weight: 600;">
              ₱{{ formatMoney(req.DIEM) }}
            </td>
            <td style="text-align: right; font-weight: 700; color: var(--brand-2);">
              ₱{{ formatMoney(Number(req.FARE) + Number(req.DIEM)) }}
            </td>
            <td style="max-width: 240px; font-size: 12.5px;" :title="req.PURPOSE">
              {{ req.PURPOSE }}
            </td>
            <td>
              <span v-if="req.BATCH_ID" class="chip" style="font-size: 11px;">{{ req.BATCH_ID }}</span>
              <span v-else class="small muted">—</span>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <button
                class="btn sm icon"
                title="Generate single Travel Order (.docx)"
                @click="generateSingleTO(req)"
              >
                <AppIcon name="file" />
              </button>
              <button
                class="btn sm icon"
                title="Edit Request"
                @click="startEdit(req)"
              >
                <AppIcon name="edit" />
              </button>
              <button
                class="btn sm icon danger"
                title="Delete Request"
                @click="handleDelete(req)"
              >
                <AppIcon name="trash" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <TevRequestModal
      v-model="showRequestModal"
      :editing-item="editingItem"
      @saved="onSaved"
    />

    <FareMatrixModal
      v-model="showFareMatrixModal"
    />

    <TevTemplateModal
      v-model="showTemplateModal"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  state, deleteTevRequest, deleteCheckedTevRequests, toggleSelectAllTev,
  toggleSelectTev, updateTevBatch, notify
} from '../../store/state';
import { makeBatchId } from '../../utils/dateUtils';
import { downloadBinary, TO_DOCX_MIME, XLSX_MIME, tevTemplateGet } from '../../utils/storage';
import { buildTravelDocx } from '../../utils/docxEngine';
import {
  generateIOT, generateCOE, generateCTC, generateBatchZip,
  exportRequestsToXlsx, importRequestsFromXlsx, loadDefaultTemplate
} from '../../utils/xlsxEngine';
import JSZip from 'jszip';

import TevRequestModal from './TevRequestModal.vue';
import FareMatrixModal from './FareMatrixModal.vue';
import TevTemplateModal from './TevTemplateModal.vue';

const baseUrl = import.meta.env.BASE_URL;
const search = ref('');
const filterStatus = ref('all');
const showRequestModal = ref(false);
const showFareMatrixModal = ref(false);
const showTemplateModal = ref(false);
const editingItem = ref(null);
const isGenerating = ref(false);
const genStatus = ref('');

const markedRequests = computed(() => {
  return state.tevRequests.filter((r) => r.GENERATE);
});

const totalFares = computed(() => {
  return state.tevRequests.reduce((acc, r) => acc + (Number(r.FARE) || 0), 0);
});

const totalDiems = computed(() => {
  return state.tevRequests.reduce((acc, r) => acc + (Number(r.DIEM) || 0), 0);
});

const totalOverall = computed(() => {
  return totalFares.value + totalDiems.value;
});

const isAllSelected = computed(() => {
  return state.tevRequests.length > 0 && state.tevRequests.every((r) => r.GENERATE);
});

const isIndeterminate = computed(() => {
  const count = markedRequests.value.length;
  return count > 0 && count < state.tevRequests.length;
});

const filteredRequests = computed(() => {
  const q = search.value.toLowerCase().trim();
  return state.tevRequests.filter((r) => {
    // Filter status
    if (filterStatus.value === 'marked' && !r.GENERATE) return false;
    if (filterStatus.value === 'batched' && !r.BATCH_ID) return false;
    if (filterStatus.value === 'unbatched' && r.BATCH_ID) return false;

    // Search query
    if (q) {
      const match =
        (r.DESTINATION && r.DESTINATION.toLowerCase().includes(q)) ||
        (r.PURPOSE && r.PURPOSE.toLowerCase().includes(q)) ||
        (r.ROUTE && r.ROUTE.toLowerCase().includes(q)) ||
        (r.REQUEST_ID && r.REQUEST_ID.toLowerCase().includes(q)) ||
        (r.BATCH_ID && r.BATCH_ID.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
});

function formatMoney(num) {
  return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function openAddModal() {
  editingItem.value = null;
  showRequestModal.value = true;
}

function startEdit(req) {
  editingItem.value = { ...req };
  showRequestModal.value = true;
}

function onSaved() {
  editingItem.value = null;
}

function toggleSelectAll(checked) {
  toggleSelectAllTev(checked);
}

function toggleSelect(id, checked) {
  toggleSelectTev(id, checked);
}

function handleDelete(req) {
  if (confirm(`Delete request "${req.DESTINATION}" (${req.REQUEST_ID})?`)) {
    deleteTevRequest(req.REQUEST_ID);
  }
}

function handleDeleteChecked() {
  const count = markedRequests.value.length;
  if (!count) return;
  if (confirm(`Delete all ${count} checked request(s)?`)) {
    deleteCheckedTevRequests();
  }
}

// ---------------- Document Generation Helpers ----------------
async function getTemplateBuffer(type, defaultUrl) {
  // Check if custom uploaded in IndexedDB
  try {
    const custom = await tevTemplateGet(`custom_${type}`);
    if (custom && custom.bytes) return custom.bytes;
  } catch (e) {}

  // Fallback to bundled template in /templates
  return await loadDefaultTemplate(defaultUrl);
}

// 1. Generate single Travel Order DOCX
async function generateSingleTO(req) {
  try {
    notify(`Generating Travel Order for ${req.DESTINATION}…`);
    const tplBuffer = await getTemplateBuffer('to', `${baseUrl}templates/Travel Order Template.docx`);
    const values = {
      REQUEST_ID: req.REQUEST_ID || '',
      BATCH_ID: req.BATCH_ID || '',
      CREATION_DATE: req.CREATION_DATE || '',
      Date_Prepared: req.CREATION_DATE || '',
      CreationDate: req.CREATION_DATE || '',
      DESTINATION: req.DESTINATION || '',
      Destination: req.DESTINATION || '',
      ROUTE: req.ROUTE || '',
      TRANSPORTATION: req.TRANSPORTATION || '',
      FARE: String(req.FARE || '0'),
      DATE_OF_TRAVEL: req.DATE_OF_TRAVEL || '',
      Date_of_Travel: req.DATE_OF_TRAVEL || '',
      TravelDate: req.DATE_OF_TRAVEL || '',
      PURPOSE: req.PURPOSE || '',
      Purpose: req.PURPOSE || '',
      DIEM: String(req.DIEM || '0')
    };

    const res = await buildTravelDocx(tplBuffer, values);
    const safeDest = (req.DESTINATION || 'Destination').replace(/[\\/:*?"<>|]/g, '-').slice(0, 30);
    const filename = `TO - ${safeDest} - ${req.DATE_OF_TRAVEL} - ${req.REQUEST_ID}.docx`;
    downloadBinary(filename, res.bytes, TO_DOCX_MIME);
    notify(`Downloaded: ${filename}`);
  } catch (e) {
    notify(`Generation failed: ${e.message}`, true);
  }
}

// 2. Generate Batch (IOT + COE + CTC XLSX)
async function generateBatchNoTO() {
  const selected = markedRequests.value;
  if (!selected.length) {
    notify('Please select at least one request.', true);
    return;
  }

  isGenerating.value = true;
  genStatus.value = 'Preparing batch Excel files (IOT, COE, CTC)…';

  try {
    const batchId = makeBatchId();
    const iotTpl = await getTemplateBuffer('iot', `${baseUrl}templates/Itenerary of Travel.xlsx`);
    const coeTpl = await getTemplateBuffer('coe', `${baseUrl}templates/Certificate of Expenses.xlsx`);
    const ctcTpl = await getTemplateBuffer('ctc', `${baseUrl}templates/Certificate of Travel Completed.xlsx`);

    const zipBuffer = await generateBatchZip({
      iotTemplateBuffer: iotTpl,
      coeTemplateBuffer: coeTpl,
      ctcTemplateBuffer: ctcTpl,
      payloads: selected,
      batchId,
      includeTO: false
    });

    const zipFilename = `Batch-Documents-${batchId}.zip`;
    downloadBinary(zipFilename, zipBuffer, 'application/zip');

    // Update batch ID in state
    updateTevBatch(selected.map((s) => s.REQUEST_ID), batchId);

    genStatus.value = `Generated Batch: ${batchId} (${selected.length} entries).`;
    notify(`Batch package downloaded: ${zipFilename}`);
  } catch (e) {
    genStatus.value = `Error: ${e.message}`;
    notify(`Batch generation failed: ${e.message}`, true);
  } finally {
    isGenerating.value = false;
  }
}

// 3. Generate TO Only for all checked requests
async function generateTOOnly() {
  const selected = markedRequests.value;
  if (!selected.length) {
    notify('Please select at least one request.', true);
    return;
  }

  isGenerating.value = true;
  genStatus.value = `Generating ${selected.length} Travel Order DOCX files…`;

  try {
    const batchId = 'TO-' + makeBatchId();
    const toTpl = await getTemplateBuffer('to', `${baseUrl}templates/Travel Order Template.docx`);

    if (selected.length === 1) {
      await generateSingleTO(selected[0]);
    } else {
      // Multiple: bundle in a zip
      const zip = new JSZip();
      for (const p of selected) {
        const values = {
          REQUEST_ID: p.REQUEST_ID || '',
          BATCH_ID: batchId,
          CREATION_DATE: p.CREATION_DATE || '',
          Date_Prepared: p.CREATION_DATE || '',
          CreationDate: p.CREATION_DATE || '',
          DESTINATION: p.DESTINATION || '',
          Destination: p.DESTINATION || '',
          ROUTE: p.ROUTE || '',
          TRANSPORTATION: p.TRANSPORTATION || '',
          FARE: String(p.FARE || '0'),
          DATE_OF_TRAVEL: p.DATE_OF_TRAVEL || '',
          Date_of_Travel: p.DATE_OF_TRAVEL || '',
          TravelDate: p.DATE_OF_TRAVEL || '',
          PURPOSE: p.PURPOSE || '',
          Purpose: p.PURPOSE || '',
          DIEM: String(p.DIEM || '0')
        };
        const docxResult = await buildTravelDocx(toTpl, values);
        const safeDest = (p.DESTINATION || 'Destination').replace(/[\\/:*?"<>|]/g, '-').slice(0, 30);
        const filename = `TO - ${safeDest} - ${p.DATE_OF_TRAVEL} - ${p.REQUEST_ID}.docx`;
        zip.file(filename, docxResult.bytes);
      }
      const zipBytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
      downloadBinary(`${batchId}.zip`, zipBytes, 'application/zip');
      updateTevBatch(selected.map((s) => s.REQUEST_ID), batchId);
      notify(`Downloaded ${selected.length} Travel Orders in ZIP.`);
    }
    genStatus.value = `Generated ${selected.length} Travel Orders.`;
  } catch (e) {
    genStatus.value = `Error: ${e.message}`;
    notify(`Failed: ${e.message}`, true);
  } finally {
    isGenerating.value = false;
  }
}

// 4. Generate Complete Package (TO + IOT + COE + CTC in ZIP)
async function generateCompleteBatch() {
  const selected = markedRequests.value;
  if (!selected.length) {
    notify('Please select at least one request.', true);
    return;
  }

  isGenerating.value = true;
  genStatus.value = 'Generating complete package (TO, IOT, COE, CTC)…';

  try {
    const batchId = makeBatchId();
    const toTpl = await getTemplateBuffer('to', `${baseUrl}templates/Travel Order Template.docx`);
    const iotTpl = await getTemplateBuffer('iot', `${baseUrl}templates/Itenerary of Travel.xlsx`);
    const coeTpl = await getTemplateBuffer('coe', `${baseUrl}templates/Certificate of Expenses.xlsx`);
    const ctcTpl = await getTemplateBuffer('ctc', `${baseUrl}templates/Certificate of Travel Completed.xlsx`);

    const zipBuffer = await generateBatchZip({
      toTemplateBuffer: toTpl,
      iotTemplateBuffer: iotTpl,
      coeTemplateBuffer: coeTpl,
      ctcTemplateBuffer: ctcTpl,
      payloads: selected,
      batchId,
      includeTO: true
    });

    const zipFilename = `Complete-Package-${batchId}.zip`;
    downloadBinary(zipFilename, zipBuffer, 'application/zip');
    updateTevBatch(selected.map((s) => s.REQUEST_ID), batchId);

    genStatus.value = `Complete package generated: ${batchId}.`;
    notify(`Complete package downloaded: ${zipFilename}`);
  } catch (e) {
    genStatus.value = `Error: ${e.message}`;
    notify(`Failed: ${e.message}`, true);
  } finally {
    isGenerating.value = false;
  }
}

// 5. Export to Excel
async function handleExportExcel() {
  try {
    notify('Preparing Excel export…');
    const buffer = await exportRequestsToXlsx(state.tevRequests);
    downloadBinary('TEV-Requests-Export.xlsx', buffer, XLSX_MIME);
    notify('Excel file downloaded.');
  } catch (e) {
    notify(`Export failed: ${e.message}`, true);
  }
}

// 6. Import from Excel
async function handleImportExcel(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    notify(`Reading ${file.name}…`);
    const ab = await file.arrayBuffer();
    const imported = await importRequestsFromXlsx(ab);
    if (!imported.length) {
      notify('No valid request records found in file.', true);
      return;
    }

    if (confirm(`Import ${imported.length} travel requests into tracker?`)) {
      state.tevRequests = [...imported, ...state.tevRequests];
      notify(`Successfully imported ${imported.length} requests!`);
    }
  } catch (e) {
    notify(`Import failed: ${e.message}`, true);
  } finally {
    event.target.value = '';
  }
}
</script>
