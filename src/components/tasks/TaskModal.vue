<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 660px;">
      <div class="modalHead">
        <h3>{{ isEditing ? 'Edit Work / Accomplishment' : 'Log New Work / Accomplishment' }}</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modalBody">
          <!-- Title -->
          <div class="field">
            <label for="task-title">Title / Activity Name *</label>
            <input
              id="task-title"
              v-model="form.title"
              class="input"
              required
              placeholder="e.g. Land preparation services for rice farmers (wet season)"
            />
          </div>

          <!-- Category & Status -->
          <div class="tev-form-grid" style="margin-top: 10px;">
            <div class="field">
              <label for="task-cat">Category / Program *</label>
              <select id="task-cat" v-model="form.category" class="input">
                <option v-for="cat in state.settings.categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="task-status">Status *</label>
              <select id="task-status" v-model="form.status" class="input" @change="onStatusChange">
                <option value="done">Accomplished (Completed)</option>
                <option value="open">Ongoing / In Progress</option>
                <option value="pend">Pending / Scheduled</option>
                <option value="cancel">Cancelled / Deferred</option>
              </select>
            </div>
          </div>

          <!-- Dates: Start, Due, Completed -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px;">
            <div class="field">
              <label>Start Date</label>
              <input v-model="form.startDate" type="date" class="input" />
            </div>
            <div class="field">
              <label>Target / Due Date</label>
              <input v-model="form.dueDate" type="date" class="input" />
            </div>
            <div class="field">
              <label>Accomplished Date</label>
              <input v-model="form.completedDate" type="date" class="input" :disabled="form.status !== 'done'" />
            </div>
          </div>

          <!-- Location & Personnel -->
          <div class="tev-form-grid" style="margin-top: 10px;">
            <div class="field">
              <label for="task-loc">Location</label>
              <input
                id="task-loc"
                v-model="form.location"
                class="input"
                list="dl-locations"
                placeholder="e.g. Municipal Hall / ABE Office"
              />
              <datalist id="dl-locations">
                <option v-for="loc in state.settings.locations" :key="loc" :value="loc" />
              </datalist>
            </div>
            <div class="field">
              <label for="task-pers">Personnel / Assigned To</label>
              <input
                id="task-pers"
                v-model="form.personnel"
                class="input"
                list="dl-personnel"
                placeholder="e.g. ABE Staff / Engineer"
              />
              <datalist id="dl-personnel">
                <option v-for="p in state.settings.personnel" :key="p" :value="p" />
              </datalist>
            </div>
          </div>

          <!-- Beneficiaries & Drive URL -->
          <div class="tev-form-grid" style="margin-top: 10px;">
            <div class="field">
              <label for="task-ben">Beneficiaries (Headcount / Farmers)</label>
              <input id="task-ben" v-model.number="form.beneficiaries" type="number" min="0" class="input" placeholder="0" />
            </div>
            <div class="field">
              <label for="task-drive">Google Drive Link (Evidence / Photos)</label>
              <input id="task-drive" v-model="form.driveUrl" type="url" class="input" placeholder="https://drive.google.com/..." />
            </div>
          </div>

          <!-- Remarks -->
          <div class="field" style="margin-top: 10px;">
            <label for="task-remarks">Remarks / Output Notes</label>
            <textarea
              id="task-remarks"
              v-model="form.remarks"
              class="input"
              rows="2"
              placeholder="Output details, equipment utilized, recommendations..."
            ></textarea>
          </div>
        </div>

        <div class="modalFoot" style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn" @click="close">Cancel</button>
          <button type="submit" class="btn primary">
            {{ isEditing ? 'Save Changes' : 'Record Work' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, addEntry, updateEntry, notify } from '../../store/state';
import { todayISO } from '../../utils/dateUtils';

const props = defineProps({
  modelValue: Boolean,
  editingItem: Object
});

const emit = defineEmits(['update:modelValue', 'saved']);

const isEditing = computed(() => !!props.editingItem && !!props.editingItem.id);

const form = ref({
  title: '',
  category: 'Machinery & Equipment',
  status: 'pend',
  startDate: '',
  dueDate: '',
  completedDate: '',
  location: '',
  personnel: '',
  beneficiaries: 0,
  remarks: '',
  driveUrl: ''
});

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.editingItem) {
      form.value = { ...props.editingItem };
    } else {
      resetForm();
    }
  }
});

function resetForm() {
  form.value = {
    title: '',
    category: state.settings.categories[0] || 'Others',
    status: 'pend',
    startDate: todayISO(),
    dueDate: todayISO(),
    completedDate: '',
    location: state.settings.locations[0] || '',
    personnel: state.settings.personnel[1] || '',
    beneficiaries: 0,
    remarks: '',
    driveUrl: ''
  };
}

function onStatusChange() {
  if (form.value.status === 'done' && !form.value.completedDate) {
    form.value.completedDate = form.value.dueDate || todayISO();
  }
}

function handleSubmit() {
  if (!form.value.title.trim()) {
    notify('Title is required.', true);
    return;
  }

  if (isEditing.value) {
    updateEntry(props.editingItem.id, form.value);
  } else {
    addEntry(form.value);
  }

  emit('saved');
  close();
}

function close() {
  emit('update:modelValue', false);
}
</script>
