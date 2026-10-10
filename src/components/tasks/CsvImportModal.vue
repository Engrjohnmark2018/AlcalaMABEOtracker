<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 580px;">
      <div class="modalHead">
        <h3><AppIcon name="upload" /> Import Accomplishments from CSV</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <div class="modalBody">
        <div class="small muted" style="margin-bottom: 12px;">
          Upload a CSV file containing columns for <b>Title, Category, Status, Due Date, Location, Personnel</b>, etc.
        </div>

        <div class="field">
          <input type="file" accept=".csv,text/csv" class="input" @change="onFileSelected" />
        </div>

        <div v-if="previewCount" class="banner done" style="margin-top: 12px;">
          Found <b>{{ previewCount }} valid entries</b> ready to import.
        </div>
      </div>

      <div class="modalFoot" style="display: flex; justify-content: flex-end; gap: 8px;">
        <button type="button" class="btn" @click="close">Cancel</button>
        <button type="button" class="btn primary" :disabled="!previewEntries.length" @click="importNow">
          Import {{ previewEntries.length }} Entries
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, cleanEntry, saveState, notify } from '../../store/state';
import { csvToEntries } from '../../utils/csvEngine';

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'imported']);

const previewEntries = ref([]);
const previewCount = ref(0);

function onFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = csvToEntries(event.target.result);
      previewEntries.value = parsed;
      previewCount.value = parsed.length;
    } catch (err) {
      notify('Could not parse CSV: ' + err.message, true);
    }
  };
  reader.readAsText(file);
}

function importNow() {
  if (!previewEntries.value.length) return;
  const cleaned = previewEntries.value.map((e) => {
    const c = cleanEntry(e);
    c.createdBy = state.auth.id;
    c.createdByName = state.auth.name;
    return c;
  });
  state.entries = [...cleaned, ...state.entries];
  saveState();
  notify(`Imported ${cleaned.length} entries!`);
  emit('imported');
  close();
}

function close() {
  previewEntries.value = [];
  previewCount.value = 0;
  emit('update:modelValue', false);
}
</script>
