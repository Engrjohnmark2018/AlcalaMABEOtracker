<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" :style="{ maxWidth: maxWidth || '580px' }">
      <div class="modalHead">
        <h3>{{ title }}</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>
      <div class="modalBody">
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="modalFoot">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
  maxWidth: String
});

const emit = defineEmits(['update:modelValue', 'close']);

function close() {
  emit('update:modelValue', false);
  emit('close');
}
</script>
