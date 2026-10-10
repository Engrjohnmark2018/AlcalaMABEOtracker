<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 680px;">
      <div class="modalHead">
        <h3><AppIcon name="settings" /> TEV Templates &amp; Settings</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <div class="modalBody">
        <div class="small muted" style="margin-bottom: 14px;">
          The system uses official Alcala templates for Word (.docx) and Excel (.xlsx) generation. You can inspect or update the templates below.
        </div>

        <div class="list">
          <!-- TO Template -->
          <div class="item" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <b>1. Travel Order (TO)</b>
              <div class="small muted" v-text="'Format: Word Document (.docx) · Placeholders: {{Destination}}, {{Purpose}}, etc.'"></div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a :href="`${baseUrl}templates/Travel Order Template.docx`" download="Travel Order Template.docx" class="btn sm">
                Download
              </a>
              <label class="btn soft sm" style="cursor: pointer; margin: 0;">
                Upload
                <input type="file" accept=".docx" style="display: none;" @change="handleUpload('to', $event)" />
              </label>
            </div>
          </div>

          <!-- IOT Template -->
          <div class="item" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <b>2. Itinerary of Travel (IOT)</b>
              <div class="small muted">Format: Excel Workbook (.xlsx) · Table Row 22 · Header F16/F17</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a :href="`${baseUrl}templates/Itenerary of Travel.xlsx`" download="Itenerary of Travel.xlsx" class="btn sm">
                Download
              </a>
              <label class="btn soft sm" style="cursor: pointer; margin: 0;">
                Upload
                <input type="file" accept=".xlsx" style="display: none;" @change="handleUpload('iot', $event)" />
              </label>
            </div>
          </div>

          <!-- COE Template -->
          <div class="item" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <b>3. Certificate of Expenses (COE)</b>
              <div class="small muted">Format: Excel Workbook (.xlsx) · Table Row 11</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a :href="`${baseUrl}templates/Certificate of Expenses.xlsx`" download="Certificate of Expenses.xlsx" class="btn sm">
                Download
              </a>
              <label class="btn soft sm" style="cursor: pointer; margin: 0;">
                Upload
                <input type="file" accept=".xlsx" style="display: none;" @change="handleUpload('coe', $event)" />
              </label>
            </div>
          </div>

          <!-- CTC Template -->
          <div class="item" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <b>4. Certificate of Travel Completed (CTC)</b>
              <div class="small muted">Format: Excel Workbook (.xlsx) · Cell C21</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a :href="`${baseUrl}templates/Certificate of Travel Completed.xlsx`" download="Certificate of Travel Completed.xlsx" class="btn sm">
                Download
              </a>
              <label class="btn soft sm" style="cursor: pointer; margin: 0;">
                Upload
                <input type="file" accept=".xlsx" style="display: none;" @change="handleUpload('ctc', $event)" />
              </label>
            </div>
          </div>

          <!-- Fare Matrix Template -->
          <div class="item" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <b>5. Fare Matrix Reference</b>
              <div class="small muted">Format: Excel Workbook (.xlsx) · 28 municipal destinations</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a :href="`${baseUrl}templates/Fare matrix.xlsx`" download="Fare matrix.xlsx" class="btn sm">
                Download
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="modalFoot" style="display: flex; justify-content: flex-end;">
        <button type="button" class="btn" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { notify } from '../../store/state';
import { tevTemplateSave } from '../../utils/storage';

const baseUrl = import.meta.env.BASE_URL;

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

async function handleUpload(type, event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const ab = await file.arrayBuffer();
    // save in IndexedDB
    await tevTemplateSave(`custom_${type}`, {
      name: file.name,
      size: file.size,
      at: new Date().toISOString(),
      bytes: ab
    });
    notify(`Custom template "${file.name}" saved!`);
  } catch (e) {
    notify(`Template upload failed: ${e.message}`, true);
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>
