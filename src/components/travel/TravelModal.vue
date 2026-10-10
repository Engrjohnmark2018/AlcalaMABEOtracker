<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 580px;">
      <div class="modalHead">
        <h3>{{ isEditing ? 'Edit travel record' : 'Record a travel' }}</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modalBody">
          <div class="field">
            <label for="to-traveller">Personnel on Travel *</label>
            <input
              id="to-traveller"
              v-model="form.travellerName"
              class="input"
              list="dl-to-personnel"
              required
              placeholder="e.g. Municipal Agriculturist"
            />
            <datalist id="dl-to-personnel">
              <option v-for="p in state.settings.personnel" :key="p" :value="p" />
            </datalist>
          </div>

          <label class="check" style="margin-top:10px"><input type="checkbox" v-model="form.docGenerated"> Travel Order .docx generated</label>
          <div class="field" style="margin-top: 10px;">
            <label for="to-dest">Official Destination *</label>
            <input
              id="to-dest"
              v-model="form.destination"
              class="input"
              required
              placeholder="e.g. DA Regional Field Office 02, Tuguegarao City"
            />
          </div>

          <div class="field" style="margin-top: 10px;">
            <label>Travel Dates *</label>
            <div class="row2">
              <div>
                <input type="date" v-model="form.from" class="input" required @change="syncToDate" />
                <span class="small muted">From</span>
              </div>
              <div>
                <input type="date" v-model="form.to" class="input" required />
                <span class="small muted">To</span>
              </div>
            </div>
          </div>

          <div class="field" style="margin-top: 10px;">
            <label for="to-purpose">Purpose of Travel *</label>
            <textarea
              id="to-purpose"
              v-model="form.purpose"
              class="input"
              rows="3"
              required
              placeholder="Official purpose or mission details…"
            ></textarea>
          </div>

          <div class="field" style="margin-top: 10px;">
            <label for="to-odate">Order Date</label>
            <input id="to-odate" v-model="form.orderDate" type="date" class="input" />
          </div>
        </div>

        <div class="modalFoot" style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn" @click="close">Cancel</button>
          <button type="submit" class="btn primary">
            {{ isEditing ? 'Save Changes' : 'Record Travel' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, addTravel, updateTravel, notify } from '../../store/state';
import { todayISO } from '../../utils/dateUtils';

const props = defineProps({
  modelValue: Boolean,
  editingItem: Object
});

const emit = defineEmits(['update:modelValue', 'saved']);

const isEditing = computed(() => !!props.editingItem && !!props.editingItem.id);

const form = ref({
  travellerName: '',
  destination: '',
  from: todayISO(),
  to: todayISO(),
  purpose: '',
  orderDate: todayISO()
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
    travellerName: state.settings.personnel[1] || 'ABE Staff',
    destination: '',
    from: todayISO(),
    to: todayISO(),
    purpose: '',
    orderDate: todayISO()
  };
}

function syncToDate() {
  if (form.value.from && (!form.value.to || form.value.to < form.value.from)) {
    form.value.to = form.value.from;
  }
}

function handleSubmit() {
  if (form.value.to < form.value.from) {
    notify('The travel end date cannot be earlier than the start date.', true);
    return;
  }
  if (!form.value.destination || !form.value.purpose) {
    notify('Destination and Purpose are required.', true);
    return;
  }

  if (isEditing.value) {
    updateTravel(props.editingItem.id, form.value);
  } else {
    addTravel(form.value);
  }

  emit('saved');
  close();
}

function close() {
  emit('update:modelValue', false);
}
</script>
