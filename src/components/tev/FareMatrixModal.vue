<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 780px;">
      <div class="modalHead">
        <h3><AppIcon name="map" /> Fare Matrix Directory (Alcala &amp; Destinations)</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <div class="modalBody">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <input
            v-model="search"
            class="input"
            style="max-width: 280px;"
            placeholder="Search destination or route…"
          />
          <div style="display: flex; gap: 8px;">
            <button class="btn sm" @click="showAddForm = !showAddForm">
              {{ showAddForm ? 'Close Add Form' : '+ Add Destination' }}
            </button>
            <button class="btn soft sm" @click="handleReset" title="Reset to standard municipal fare matrix">
              Reset Defaults
            </button>
          </div>
        </div>

        <!-- Add / Edit Destination Subform -->
        <div v-if="showAddForm" class="card" style="margin-bottom: 14px; background: var(--panel-2);">
          <div class="cardHead">
            <h4>{{ editTarget ? 'Edit Destination' : 'Add New Destination' }}</h4>
            <button class="btn icon sm" @click="cancelEdit">✕</button>
          </div>
          <form @submit.prevent="saveDestination">
            <div class="tev-form-grid">
              <div class="field">
                <label>Destination Name *</label>
                <input v-model="form.destination" class="input" required placeholder="e.g. Afusing Daga" />
              </div>
              <div class="field">
                <label>Fare Amount (₱) *</label>
                <input v-model.number="form.fare" type="number" step="any" class="input" required placeholder="140" />
              </div>
            </div>
            <div class="field" style="margin-top: 8px;">
              <label>Transportation Mode</label>
              <input v-model="form.transportation" class="input" placeholder="e.g. Tricycle, Boat" />
            </div>
            <div class="field" style="margin-top: 8px;">
              <label>Route</label>
              <input v-model="form.route" class="input" placeholder="e.g. Municipal Hall to Afusing Daga to Municipal Hall" />
            </div>
            <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="btn sm" @click="cancelEdit">Cancel</button>
              <button type="submit" class="btn primary sm">Save Destination</button>
            </div>
          </form>
        </div>

        <!-- Matrix Table -->
        <div style="max-height: 420px; overflow-y: auto; border: 1px solid var(--line); border-radius: 8px;">
          <table class="tbl" style="margin: 0;">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Route</th>
                <th>Transportation</th>
                <th style="text-align: right;">Fare (₱)</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredMatrix.length">
                <td colspan="5" class="small muted" style="text-align: center; padding: 20px;">
                  No destinations found matching "{{ search }}".
                </td>
              </tr>
              <tr v-for="item in filteredMatrix" :key="item.destination">
                <td><b>{{ item.destination }}</b></td>
                <td class="small muted">{{ item.route }}</td>
                <td class="small">{{ item.transportation }}</td>
                <td style="text-align: right; font-weight: 700; color: var(--brand-2);">
                  ₱{{ Number(item.fare).toFixed(2) }}
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn sm icon" title="Edit" @click="startEdit(item)"><AppIcon name="edit" /></button>
                  <button class="btn sm icon danger" title="Delete" @click="handleDelete(item.destination)"><AppIcon name="trash" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modalFoot" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="small muted">Total Destinations: {{ state.fareMatrix.length }}</span>
        <button type="button" class="btn" @click="close">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { state, addFareDestination, updateFareDestination, deleteFareDestination, resetFareMatrix, notify } from '../../store/state';

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const search = ref('');
const showAddForm = ref(false);
const editTarget = ref(null);

const form = ref({
  destination: '',
  route: '',
  transportation: 'Tricycle',
  fare: 0
});

const filteredMatrix = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return state.fareMatrix;
  return state.fareMatrix.filter((item) =>
    item.destination.toLowerCase().includes(q) ||
    item.route.toLowerCase().includes(q) ||
    item.transportation.toLowerCase().includes(q)
  );
});

function startEdit(item) {
  editTarget.value = item.destination;
  form.value = { ...item };
  showAddForm.value = true;
}

function cancelEdit() {
  editTarget.value = null;
  form.value = { destination: '', route: '', transportation: 'Tricycle', fare: 0 };
  showAddForm.value = false;
}

function saveDestination() {
  try {
    if (editTarget.value) {
      updateFareDestination(editTarget.value, form.value);
    } else {
      addFareDestination(form.value);
    }
    cancelEdit();
  } catch (e) {
    notify(e.message, true);
  }
}

function handleDelete(dest) {
  if (confirm(`Remove "${dest}" from the fare matrix?`)) {
    deleteFareDestination(dest);
  }
}

function handleReset() {
  if (confirm('Reset fare matrix back to the standard 28 Alcala municipal destinations?')) {
    resetFareMatrix();
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>
