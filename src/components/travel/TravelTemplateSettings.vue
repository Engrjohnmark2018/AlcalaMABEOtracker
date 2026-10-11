<template>
  <div class="card" style="margin-top:14px" id="travel-template-settings">
    <div class="cardHead"><div><h3>Travel Order template</h3><div class="sub">Your Word (.docx) file with the four placeholders</div></div><span :class="['chip', meta ? 'done' : 'pend']">{{ meta ? 'Template loaded' : 'No template yet' }}</span></div>
    <div class="banner">Type these placeholders in your Word document wherever the details should appear:<div class="flexrow" style="margin-top:6px"><span v-for="k in TO_FIELDS" :key="k" class="chip ph" v-text="'{{' + k + '}}'"></span></div><div class="small" style="margin-top:6px">Letter case and extra spaces are forgiven. Placeholders can appear in tables, headers or footers; your letterhead, fonts and layout are preserved.</div></div>
    <div v-if="meta" class="kv" style="margin-top:12px"><dt>File</dt><dd>{{ meta.name }}</dd><dt>Size</dt><dd>{{ (meta.size / 1024).toFixed(1) }} KB</dd><dt>Placeholders found</dt><dd>{{ meta.found?.join(', ') || 'none' }}</dd><dt>Not found</dt><dd>{{ meta.missing?.join(', ') || 'all four present' }}</dd><dt>Document parts scanned</dt><dd>{{ meta.paths }}</dd></div>
    <div class="field" style="margin-top:12px"><label for="to-template">Upload / replace template (.docx, up to 20 MB)</label><input id="to-template" type="file" class="input" accept=".docx" :disabled="!canEdit" @change="upload"><span class="hint">Kept in this browser on this computer. Export the template to keep a copy or move it to another computer.</span></div>
    <div class="flexrow" style="margin-top:12px"><button class="btn" @click="state.activeTab = 'tev'">Open Travel &amp; Expenses</button><button v-if="meta" class="btn" @click="exportTemplate">Export template</button><button v-if="meta && canEdit" class="btn danger" @click="remove">Remove template</button><a class="btn" :href="`${baseUrl}templates/Sample-Travel-Order-Template.docx`" download>Download sample template</a></div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { state, notify } from '../../store/state';
import { canDo } from '../../utils/auth';
import { TO_FIELDS, toInspect } from '../../utils/docxEngine';
import { toTemplateBoot, toTemplateBytes, toTemplateSave, toTemplateClear, downloadBinary, TO_DOCX_MIME } from '../../utils/storage';
const baseUrl = import.meta.env.BASE_URL, meta = ref(null);
const canEdit = computed(() => canDo(state.auth.role, 'settings'));
onMounted(async () => { meta.value = await toTemplateBoot(); });
async function upload(e) {
  const file = e.target.files?.[0];
  if (!file || !canEdit.value) return;
  try {
    if (!/\.docx$/i.test(file.name)) throw new Error('Choose a Word .docx file.');
    const bytes = await file.arrayBuffer(), info = await toInspect(bytes);
    await toTemplateSave({name: file.name, size:file.size, at:new Date().toISOString(), bytes, ...info});
    meta.value = await toTemplateBoot(); notify('Travel Order template saved.');
  } catch (err) { notify(err.message, true); }
  finally { e.target.value = ''; }
}
async function exportTemplate() { const bytes = await toTemplateBytes(); if (bytes) downloadBinary(meta.value.name, bytes, TO_DOCX_MIME); }
async function remove() { if (confirm(`Remove template "${meta.value.name}"?`)) { await toTemplateClear(); meta.value = null; } }
</script>
