<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 680px;">
      <div class="modalHead">
        <h3><AppIcon name="trash" /> Trash Bin (Deleted Accomplishments)</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <div class="modalBody">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span class="small muted">{{ state.trash.length }} deleted items</span>
          <button v-if="state.trash.length" class="btn danger sm" @click="handlePurge">
            Empty Trash Bin
          </button>
        </div>

        <div v-if="!state.trash.length" class="empty">
          <b>Trash bin is empty</b>
          Deleted work items will appear here and can be restored anytime.
        </div>

        <div v-else class="list" style="max-height: 400px; overflow-y: auto;">
          <div
            v-for="item in state.trash"
            :key="item.id"
            class="item"
            style="display: flex; justify-content: space-between; align-items: center;"
          >
            <div>
              <b>{{ item.entry.title }}</b>
              <div class="small muted">
                {{ item.entry.category }} · Deleted {{ item.deletedAt ? item.deletedAt.slice(0, 10) : '' }}
                {{ item.deletedByName ? 'by ' + item.deletedByName : '' }}
              </div>
            </div>
            <button class="btn primary sm" @click="restoreTrash(item.id)">
              Restore
            </button>
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
import { state, restoreTrash, purgeTrash } from '../../store/state';

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

function handlePurge() {
  if (confirm('Permanently delete all items in the trash bin? This cannot be undone.')) {
    purgeTrash();
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>
