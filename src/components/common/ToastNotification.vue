<template>
  <div
    v-if="state.toast.show"
    :class="['toast on', { bad: state.toast.isError }]"
  >
    {{ state.toast.message }}
  </div>
</template>

<script setup>
import { state } from '../../store/state';
</script>
