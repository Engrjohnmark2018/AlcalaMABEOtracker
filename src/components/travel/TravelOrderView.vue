<template>
  <section id="view-travel">
    <div class="spread view-heading">
      <div><h2>Travel Order</h2><div class="small muted">Fill your Word template and download the finished document. <span :class="['chip', templateMeta ? (templateMeta.missing?.length ? 'pend' : 'done') : 'late']">{{ templateMeta ? (templateMeta.missing?.length ? 'Template loaded · placeholders missing' : 'Template ready') : 'No template uploaded' }}</span></div></div>
      <div class="flexrow no-print"><button class="btn" @click="state.activeTab = 'settings'">Template settings</button><button class="btn" @click="printArea('travel-details')">Print details</button><button v-if="canEdit" class="btn primary" :disabled="busy" @click="generate">{{ busy ? 'Generating…' : 'Generate Travel Order (.docx)' }}</button></div>
    </div>
    <div class="grid g2">
      <div class="card">
        <div class="cardHead"><div><h3>Travel Order details</h3><div class="sub">Only these four fields are inserted into the template</div></div></div>
        <div v-if="!templateMeta" class="banner" style="margin-bottom:12px">No template yet. Upload your <b>.docx</b> Travel Order template in <b>Settings → Travel Order template</b> (with the four placeholders), then come back here.</div>
        <div v-else-if="templateMeta.missing?.length" class="banner warn" style="margin-bottom:12px">Not found in the uploaded template: <span v-text="templateMeta.missing.map(k => '{{' + k + '}}').join(', ')"></span>. These details will not appear in the document.</div>
        <div class="formGrid">
          <div class="field"><label for="to-created">Creation date <span class="mono" v-text="'{{CreationDate}}'"></span></label><input id="to-created" v-model="draft.created" class="input" type="date"><span class="hint">{{ fmtLong(draft.created) }}</span></div>
          <div class="field"><label for="to-dest">Destination <span class="mono" v-text="'{{Destination}}'"></span></label><input id="to-dest" v-model="draft.dest" class="input" list="to-destinations" placeholder="e.g. Tuguegarao City, Cagayan"><datalist id="to-destinations"><option v-for="p in state.settings.locations" :key="p" :value="p" /></datalist></div>
          <div class="field span2" style="border-top:1px dashed var(--line);padding-top:12px"><label for="to-traveller">Traveller — who is on travel? <span class="chip t">T</span></label><div class="flexrow"><select id="to-traveller" v-model="draft.travellerId" class="input" style="max-width:320px"><option v-for="u in travellers" :key="u.id" :value="u.id">{{ u.displayName || u.username }}</option><option value="other">Other — type the name</option></select><input v-if="draft.travellerId === 'other'" v-model="draft.travellerOther" class="input" style="flex:1 1 200px" placeholder="e.g. Engr. Juan Dela Cruz — ABE Staff"></div><span class="hint">Used for the T mark on the calendar and the destination on the overview. Leave as “Other” with an empty name to skip recording.</span></div>
          <div class="field span2"><label for="to-purpose">Purpose <span class="mono" v-text="'{{Purpose}}'"></span></label><textarea id="to-purpose" v-model="draft.purpose" class="input" placeholder="e.g. To attend the Regional Consultation on Agricultural and Biosystems Engineering programs and to inspect the demo rice processing facility"></textarea></div>
          <div class="field"><label for="to-from">Travel date — from</label><input id="to-from" v-model="draft.from" class="input" type="date"></div>
          <div class="field"><label for="to-to">Travel date — to</label><input id="to-to" v-model="draft.to" class="input" type="date"></div>
          <div class="field span2"><label for="to-datetext">Travel date as it will appear <span class="mono" v-text="'{{TravelDate}}'"></span></label><div class="lockInput"><input id="to-datetext" v-model="draft.dateText" class="input" @input="draft.dateEdited = true"><button class="btn icon" title="Rebuild this wording from the two dates" @click="recompute">↻</button></div><span class="hint">Generated automatically from the dates above (with the day count) — edit it if you prefer a different wording.</span></div>
        </div>
        <div v-if="error" class="small err" role="alert" style="margin-top:8px">{{ error }}</div>
        <label class="check" style="margin-top:10px"><input v-model="draft.record" type="checkbox">Also record this travel <span class="chip t">T</span></label>
        <div class="flexrow no-print" style="margin-top:12px"><button v-if="canEdit" class="btn primary" :disabled="busy" @click="generate">Generate &amp; download .docx</button><span v-else class="chip">Viewer role — generating is disabled</span><button class="btn" @click="clear">Clear form</button></div>
        <div v-if="result" class="banner" style="margin-top:12px">Downloaded <b>{{ result.name }}</b>.<div class="small">Placeholders filled: {{ result.replaced.join(', ') }} · searched {{ result.files }} document part(s).<span v-if="result.missing.length"> Not found: {{ result.missing.join(', ') }}</span></div></div>
      </div>
      <div class="card" id="travel-details">
        <div class="cardHead"><div><h3>What will be inserted</h3><div class="sub">Preview — this is exactly what replaces the placeholders</div></div></div>
        <div class="tableWrap"><table class="tbl previewTable" style="min-width:0"><tbody><tr v-for="k in TO_FIELDS" :key="k"><td class="mono" v-text="'{{' + k + '}}'"></td><td><b v-if="values[k]">{{ values[k] }}</b><span v-else class="muted">— empty —</span><div v-if="k === 'TravelDate'" class="hint">{{ days }} day(s) incl. both dates</div></td></tr></tbody></table></div>
        <hr class="sep"><div class="small muted"><b>How it works.</b> The generator opens your uploaded .docx, replaces the four placeholders (inside the body, headers and footers — even when Word split them across formatting), and downloads a new file. Keep the downloaded file.</div>
        <div class="small muted" style="margin-top:8px"><b>Template tips.</b> <span v-text="TO_FIELDS.map(k => '{{' + k + '}}').join(', ')"></span> (spacing and letter case are forgiving). Templates up to 20 MB work — the file is kept in this browser and never uploaded.</div>
      </div>
    </div>
    <div class="card" style="margin-top:14px"><div class="cardHead"><div><h3>Travel log <span class="chip t">T</span></h3><div class="sub">{{ state.travels.length }} travel records · drives the calendar T marks and dashboard destinations</div></div><div class="flexrow no-print"><button v-if="canEdit" class="btn" @click="editingTravel = null; showModal = true">+ Record a travel</button><button class="btn" @click="exportCsv">CSV</button></div></div>
      <div v-if="!state.travels.length" class="empty"><b>No travel records yet</b>Generate a Travel Order (tick “also record this travel”) or use “Record a travel” for orders prepared on paper.</div>
      <div v-else class="tableWrap"><table class="tbl"><thead><tr><th>Traveller</th><th>Destination</th><th>Inclusive dates</th><th>Purpose</th><th>Order date</th><th>Recorded by</th><th class="no-print">Actions</th></tr></thead><tbody><tr v-for="t in sortedTravels" :key="t.id"><td><b>{{ t.travellerName }}</b> <span v-if="t.from <= todayISO() && t.to >= todayISO()" class="chip t on">T</span></td><td>{{ t.destination }}</td><td>{{ fmtRange(t.from, t.to) }}<div class="hint">{{ travelDays(t) }} days</div></td><td class="small">{{ t.purpose }}</td><td>{{ fmtMed(t.orderDate) }}<div v-if="t.docGenerated" class="hint">.docx generated</div></td><td class="small muted">{{ t.createdByName }}</td><td class="no-print"><div v-if="canEdit" class="flexrow"><button class="btn sm" @click="editingTravel = {...t}; showModal = true">Edit</button><button class="btn sm danger" @click="remove(t)">Delete</button></div></td></tr></tbody></table></div>
      <div class="small muted" style="margin-top:8px">Records are included in JSON backups. T marks follow the inclusive dates; past travels stay in the log and upcoming travels show on the dashboard.</div>
    </div>
    <TravelModal v-model="showModal" :editing-item="editingTravel" />
  </section>
</template>
<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { state, addTravel, deleteTravel, notify } from '../../store/state';
import { canDo } from '../../utils/auth';
import { todayISO, fmtLong, fmtRange, fmtMed, isDate } from '../../utils/dateUtils';
import { travelDays } from '../../utils/trackerMetrics';
import { toTemplateBoot, toTemplateBytes, downloadBinary, TO_DOCX_MIME } from '../../utils/storage';
import { TO_FIELDS, buildTravelDocx } from '../../utils/docxEngine';
import { printArea } from '../../utils/print';
import TravelModal from './TravelModal.vue';
const fresh = () => ({ created: todayISO(), dest: '', purpose: '', from: todayISO(), to: todayISO(), dateText: '', dateEdited: false, record: true, travellerId: state.auth.id && state.auth.id !== 'master' ? state.auth.id : 'other', travellerOther: '' });
if (!state.travelDraft) state.travelDraft = fresh();
const draft = computed(() => state.travelDraft);
const templateMeta = ref(null), busy = ref(false), error = ref(''), result = ref(null), showModal = ref(false), editingTravel = ref(null);
const canEdit = computed(() => canDo(state.auth.role, 'edit'));
const travellers = computed(() => state.users.filter(u => u.active));
const days = computed(() => travelDays(draft.value));
const values = computed(() => ({ CreationDate: isDate(draft.value.created) ? fmtLong(draft.value.created) : '', Purpose: draft.value.purpose.trim(), TravelDate: draft.value.dateText.trim(), Destination: draft.value.dest.trim() }));
const sortedTravels = computed(() => [...state.travels].sort((a,b) => b.from.localeCompare(a.from)));
function recompute() { draft.value.dateEdited = false; draft.value.dateText = fmtRange(draft.value.from, draft.value.to) + (days.value ? ` (${days.value} day${days.value === 1 ? '' : 's'})` : ''); }
watch(() => [draft.value.from, draft.value.to], () => { if (!draft.value.dateEdited) recompute(); });
onMounted(async () => { templateMeta.value = await toTemplateBoot(); if (!draft.value.dateText) recompute(); });
function clear() { state.travelDraft = fresh(); recompute(); error.value = ''; result.value = null; }
function remove(t) { if (confirm(`Delete travel record for "${t.travellerName}" to ${t.destination}?`)) deleteTravel(t.id); }
function exportCsv() {
  const rows = [['Traveller','Destination','Purpose','From','To','Days','Order date','Document generated','Recorded by'], ...sortedTravels.value.map(t => [t.travellerName,t.destination,t.purpose,t.from,t.to,travelDays(t),t.orderDate,t.docGenerated ? 'YES' : 'NO',t.createdByName])];
  downloadBinary(`travel-log-${todayISO()}.csv`, new TextEncoder().encode(rows.map(r => r.map(c => '"' + String(c ?? '').replaceAll('"','""') + '"').join(',')).join('\r\n')), 'text/csv');
}
async function generate() {
  if (!canEdit.value || busy.value) return;
  error.value = '';
  if (!templateMeta.value) { notify('Upload your Word template first: Settings → Travel Order template.', true); state.activeTab = 'settings'; return; }
  if (TO_FIELDS.some(k => !values.value[k]) || !isDate(draft.value.from) || !isDate(draft.value.to)) error.value = 'Creation date, destination, purpose, and travel dates are required.';
  else if (draft.value.to < draft.value.from) error.value = 'The travel end date cannot be earlier than the start date.';
  if (error.value) return;
  busy.value = true;
  try {
    const bytes = await toTemplateBytes();
    if (!bytes) throw new Error('The stored template could not be read. Please upload it again.');
    const res = await buildTravelDocx(bytes, values.value);
    const name = `Travel-Order_${draft.value.created}_${draft.value.dest.replace(/[^\w]+/g, '-').slice(0,40)}.docx`;
    if (!downloadBinary(name, res.bytes, TO_DOCX_MIME)) throw new Error('The browser blocked the download.');
    result.value = { ...res, name };
    const u = travellers.value.find(u => u.id === draft.value.travellerId);
    const travellerName = u ? u.displayName || u.username : draft.value.travellerOther.trim();
    if (draft.value.record && travellerName) {
      const data = { travellerId: u?.id || '', travellerName, destination: values.value.Destination, purpose: values.value.Purpose, from: draft.value.from, to: draft.value.to, orderDate: draft.value.created, docGenerated: true };
      if (!state.travels.some(t => t.travellerName === travellerName && t.destination === data.destination && t.from === data.from && t.to === data.to && t.purpose === data.purpose && t.orderDate === data.orderDate && t.docGenerated)) addTravel(data);
    }
    notify(`Travel Order downloaded: ${name}`);
  } catch (e) { error.value = e.message; notify(e.message, true); }
  finally { busy.value = false; }
}
</script>
