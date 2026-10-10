<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 640px;">
      <div class="modalHead">
        <h3>{{ isEditing ? 'Edit Travel Request' : 'New Travel Request' }}</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modalBody">
          <!-- Generation & Request ID -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: var(--panel-2); padding: 8px 12px; border-radius: 8px;">
            <label class="check" style="margin: 0;">
              <input type="checkbox" v-model="form.GENERATE" />
              <b>Mark for batch generation (TO / IOT / COE / CTC)</b>
            </label>
            <span v-if="form.REQUEST_ID" class="tev-batch-id">{{ form.REQUEST_ID }}</span>
          </div>

          <!-- Destination with Fare Matrix Lookup -->
          <div class="field">
            <label for="tev-dest">Destination *</label>
            <div style="display: flex; gap: 8px;">
              <select id="tev-dest" v-model="form.DESTINATION" class="input" required @change="onDestinationChange">
                <option value="">-- Select Destination from Fare Matrix --</option>
                <option v-for="item in state.fareMatrix" :key="item.destination" :value="item.destination">
                  {{ item.destination }} (₱{{ item.fare }})
                </option>
              </select>
              <button type="button" class="btn soft sm" @click="customDest = !customDest" title="Custom destination not in matrix">
                {{ customDest ? 'List' : 'Custom' }}
              </button>
            </div>
            <input
              v-if="customDest"
              v-model="form.DESTINATION"
              class="input"
              style="margin-top: 6px;"
              placeholder="Or type custom destination..."
            />
          </div>

          <!-- Auto-filled Fare Details -->
          <div class="tev-form-grid" style="margin-top: 10px;">
            <div class="field">
              <label for="tev-route">Route (auto-filled)</label>
              <input id="tev-route" v-model="form.ROUTE" class="input roField" placeholder="Route description" />
            </div>
            <div class="field">
              <label for="tev-trans">Transportation (auto-filled)</label>
              <input id="tev-trans" v-model="form.TRANSPORTATION" class="input roField" placeholder="e.g. Tricycle, Boat" />
            </div>
          </div>

          <div class="tev-form-grid" style="margin-top: 10px;">
            <div class="field">
              <label for="tev-fare">Fare (₱) *</label>
              <input id="tev-fare" v-model.number="form.FARE" type="number" step="any" class="input" required />
            </div>
            <div class="field">
              <label for="tev-diem">Per Diem (₱)</label>
              <input id="tev-diem" v-model.number="form.DIEM" type="number" step="any" class="input" placeholder="0" />
            </div>
          </div>

          <!-- Date of Travel (Start and End) -->
          <div class="field" style="margin-top: 10px;">
            <label>Date of Travel *</label>
            <div class="row2">
              <div>
                <input type="date" v-model="travelStart" class="input" required @change="syncEndDate" />
                <span class="small muted">Start Date</span>
              </div>
              <div>
                <input type="date" v-model="travelEnd" class="input" />
                <span class="small muted">End Date (optional)</span>
              </div>
            </div>
            <div v-if="previewFormattedDate" class="small" style="margin-top: 4px; color: var(--brand-2); font-weight: 600;">
              Document wording: {{ previewFormattedDate }}
            </div>
          </div>

          <!-- Purpose -->
          <div class="field" style="margin-top: 10px;">
            <label for="tev-purpose">Purpose of Travel *</label>
            <textarea
              id="tev-purpose"
              v-model="form.PURPOSE"
              class="input"
              rows="3"
              required
              placeholder="Specify the official purpose or mission..."
            ></textarea>
          </div>

          <!-- Creation Date & Batch Info -->
          <div class="tev-form-grid" style="margin-top: 10px;">
            <div class="field">
              <label for="tev-cdate">Date Prepared / Creation Date</label>
              <input id="tev-cdate" v-model="form.CREATION_DATE" type="date" class="input" />
            </div>
            <div class="field">
              <label>Batch Assignment</label>
              <input :value="form.BATCH_ID || '(None — will be assigned on batch gen)'" class="input roField" readonly />
            </div>
          </div>
        </div>

        <div class="modalFoot" style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn" @click="close">Cancel</button>
          <button type="submit" class="btn primary">
            {{ isEditing ? 'Save Changes' : 'Add Request' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, lookupFareByDestination, addTevRequest, updateTevRequest, notify } from '../../store/state';
import { todayISO, makeRequestId, formatDateRange, formatTravelDate } from '../../utils/dateUtils';

const props = defineProps({
  modelValue: Boolean,
  editingItem: Object
});

const emit = defineEmits(['update:modelValue', 'saved']);

const isEditing = computed(() => !!props.editingItem && !!props.editingItem.REQUEST_ID);

const customDest = ref(false);
const travelStart = ref('');
const travelEnd = ref('');

const form = ref({
  GENERATE: true,
  REQUEST_ID: '',
  CREATION_DATE: todayISO(),
  DESTINATION: '',
  ROUTE: '',
  TRANSPORTATION: '',
  FARE: 0,
  DATE_OF_TRAVEL: '',
  PURPOSE: '',
  DIEM: 0,
  BATCH_ID: ''
});

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.editingItem) {
      form.value = { ...props.editingItem };
      parseTravelDate(props.editingItem.DATE_OF_TRAVEL);
    } else {
      resetForm();
    }
  }
});

function parseTravelDate(str) {
  if (!str) {
    travelStart.value = todayISO();
    travelEnd.value = todayISO();
    return;
  }
  if (str.includes(' to ')) {
    const p = str.split(' to ');
    travelStart.value = p[0].trim();
    travelEnd.value = p[1].trim();
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    travelStart.value = str;
    travelEnd.value = str;
  } else {
    // try to leave as is or default
    travelStart.value = todayISO();
    travelEnd.value = '';
  }
}

function resetForm() {
  form.value = {
    GENERATE: true,
    REQUEST_ID: makeRequestId(),
    CREATION_DATE: todayISO(),
    DESTINATION: '',
    ROUTE: '',
    TRANSPORTATION: '',
    FARE: 0,
    DATE_OF_TRAVEL: '',
    PURPOSE: '',
    DIEM: 0,
    BATCH_ID: ''
  };
  travelStart.value = todayISO();
  travelEnd.value = '';
  customDest.value = false;
}

function onDestinationChange() {
  const match = lookupFareByDestination(form.value.DESTINATION);
  if (match) {
    form.value.ROUTE = match.route || '';
    form.value.TRANSPORTATION = match.transportation || '';
    form.value.FARE = match.fare || 0;
  }
}

function syncEndDate() {
  if (travelStart.value && !travelEnd.value) {
    travelEnd.value = travelStart.value;
  }
}

const previewFormattedDate = computed(() => {
  if (!travelStart.value) return '';
  if (!travelEnd.value || travelStart.value === travelEnd.value) {
    return formatTravelDate(travelStart.value);
  }
  const s = new Date(travelStart.value);
  const e = new Date(travelEnd.value);
  if (!isNaN(s) && !isNaN(e)) {
    return formatDateRange(s, e);
  }
  return `${travelStart.value} to ${travelEnd.value}`;
});

function handleSubmit() {
  if (!form.value.DESTINATION || !travelStart.value || !form.value.PURPOSE) {
    notify('Please fill in Destination, Date of Travel, and Purpose.', true);
    return;
  }

  // Format date of travel
  let dateStr = travelStart.value;
  if (travelEnd.value && travelEnd.value !== travelStart.value) {
    dateStr = `${travelStart.value} to ${travelEnd.value}`;
  }
  form.value.DATE_OF_TRAVEL = formatTravelDate(dateStr);

  if (isEditing.value) {
    updateTevRequest(form.value.REQUEST_ID, form.value);
  } else {
    addTevRequest(form.value);
  }

  emit('saved');
  close();
}

function close() {
  emit('update:modelValue', false);
}
</script>
