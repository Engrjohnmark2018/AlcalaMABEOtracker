<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 600px;">
      <div class="modalHead">
        <h3><AppIcon name="bolt" /> Activity Templates (Faster Encoding)</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <div class="modalBody">
        <div class="small muted" style="margin-bottom: 12px;">
          Insert recurring tasks with one click, or save new templates for frequent office activities.
        </div>

        <div v-if="!state.templates.length" class="empty">
          <b>No activity templates saved yet</b>
          When logging work, you can save common activities as reusable templates.
        </div>

        <div v-else class="list">
          <div
            v-for="tpl in state.templates"
            :key="tpl.id"
            class="item"
            style="display: flex; justify-content: space-between; align-items: center;"
          >
            <div>
              <b>{{ tpl.title }}</b>
              <div class="small muted">{{ tpl.category }} · {{ tpl.location || 'ABE Office' }}</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn primary sm" @click="useTemplate(tpl)">Insert</button>
              <button class="btn danger sm icon" @click="removeTemplate(tpl.id)">✕</button>
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
import { state, saveState, notify } from '../../store/state';

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'apply']);

function useTemplate(tpl) {
  emit('apply', tpl);
  close();
}

function removeTemplate(id) {
  state.templates = state.templates.filter((x) => x.id !== id);
  saveState();
  notify('Template removed.');
}

function close() {
  emit('update:modelValue', false);
}
</script>
