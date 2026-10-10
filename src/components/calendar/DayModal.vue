<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 620px;">
      <div class="modalHead">
        <div>
          <h3>{{ fmtLong(dateStr) }}</h3>
          <div class="small muted">Schedule, accomplishments, and travel orders for this day</div>
        </div>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <div class="modalBody">
        <!-- Travel Orders on this Day -->
        <div v-if="travelsOnDay.length" class="card" style="margin-bottom: 12px; background: var(--brand-3); border-color: var(--brand-2);">
          <div style="font-weight: 700; color: var(--brand-2); margin-bottom: 6px;">
            <AppIcon name="plane" /> Official Travel Orders ({{ travelsOnDay.length }})
          </div>
          <div v-for="tr in travelsOnDay" :key="tr.id" class="small" style="margin-bottom: 4px;">
            <b>{{ tr.travellerName || 'Personnel' }}</b> → {{ tr.destination }}
            <span class="muted">({{ tr.purpose }})</span>
          </div>
        </div>

        <!-- Accomplished Work on this Day -->
        <div style="margin-bottom: 14px;">
          <h4 style="color: var(--done); margin-bottom: 6px;">✓ Accomplished on this day ({{ doneEntries.length }})</h4>
          <div v-if="!doneEntries.length" class="small muted">No work marked completed on this date.</div>
          <div v-else class="list">
            <div v-for="e in doneEntries" :key="e.id" class="item" style="cursor: pointer;" @click="emit('edit-task', e)">
              <b>{{ e.title }}</b>
              <div class="small muted">{{ e.category }} · {{ e.location || 'ABE Office' }}</div>
            </div>
          </div>
        </div>

        <!-- Ongoing / Due on this Day -->
        <div>
          <h4 style="color: var(--open); margin-bottom: 6px;"><AppIcon name="clock" /> Ongoing or Due on this day ({{ unfinishedEntries.length }})</h4>
          <div v-if="!unfinishedEntries.length" class="small muted">No pending deadlines on this date.</div>
          <div v-else class="list">
            <div v-for="e in unfinishedEntries" :key="e.id" class="item" style="cursor: pointer;" @click="emit('edit-task', e)">
              <div style="display: flex; justify-content: space-between;">
                <b>{{ e.title }}</b>
                <span :class="['chip', e.status]">{{ e.status }}</span>
              </div>
              <div class="small muted">{{ e.category }} · {{ e.location || 'ABE Office' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="modalFoot" style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn primary sm" @click="emit('add-task-on-date', dateStr); close();">
          + Add Work on this day
        </button>
        <button class="btn" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../../store/state';
import { fmtLong, isDate } from '../../utils/dateUtils';

const props = defineProps({
  modelValue: Boolean,
  dateStr: String
});

const emit = defineEmits(['update:modelValue', 'edit-task', 'add-task-on-date']);

const doneEntries = computed(() => {
  return state.entries.filter((e) => e.status === 'done' && (e.completedDate === props.dateStr || (!e.completedDate && e.dueDate === props.dateStr)));
});

const unfinishedEntries = computed(() => {
  return state.entries.filter((e) => {
    if (e.status === 'done' || e.status === 'cancel') return false;
    if (e.dueDate === props.dateStr) return true;
    if (isDate(e.startDate) && isDate(e.dueDate) && e.startDate <= props.dateStr && props.dateStr <= e.dueDate) return true;
    return false;
  });
});

const travelsOnDay = computed(() => {
  return state.travels.filter((t) => isDate(t.from) && isDate(t.to) && t.from <= props.dateStr && props.dateStr <= t.to);
});

function close() {
  emit('update:modelValue', false);
}
</script>
