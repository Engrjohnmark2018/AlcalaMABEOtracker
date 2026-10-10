<template>
  <header class="topbar">
    <div class="brand">
      <div class="mark" :title="state.settings.officeName">
        <svg viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="14" fill="#14532d"/>
          <path d="M20 44c0-13 9-24 24-24 0 15-10 24-24 24z" fill="#76d39a"/>
          <path d="M20 44c7-1 14-6 18-13" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h1>{{ state.settings.officeName || 'ABE Office — Alcala' }}</h1>
        <div class="tag">{{ state.settings.tagline || 'Agricultural and Biosystems Engineering Services' }}</div>
      </div>
    </div>

    <div class="topActions">
      <!-- User Chip -->
      <div v-if="!state.isLocked && state.auth.name" class="userChip" :title="'Signed in as ' + state.auth.name">
        <div class="avatar">{{ userInitials }}</div>
        <div class="who">
          <b>{{ state.auth.name }}</b>
          <span :class="['chip role', state.auth.role]">{{ roleLabel }}</span>
        </div>
      </div>

      <!-- Theme Switcher -->
      <button v-if="!state.isLocked" class="btn icon" title="Switch account" @click="lockNow('Sign in with the account you want to use.')"><AppIcon name="switch" /></button>
      <button class="btn icon" :title="state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        <AppIcon :name="state.theme === 'dark' ? 'sun' : 'moon'" />
      </button>

      <!-- Lock button -->
      <button v-if="!state.isLocked" class="btn soft" title="Lock tracker" @click="handleLock">
        <AppIcon name="lock" /> Lock
      </button>
      <button v-if="canEdit && !state.isLocked" class="btn primary" @click="emit('new-entry')">+ New Entry</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { state, toggleTheme, lockNow } from '../../store/state';
import { ROLES } from '../../utils/constants';
import { canDo } from '../../utils/auth';
const emit = defineEmits(['new-entry']);
const canEdit = computed(()=>canDo(state.auth.role,'edit'));

const userInitials = computed(() => {
  const n = state.auth.name || state.auth.username || '?';
  return n.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
});

const roleLabel = computed(() => {
  return ROLES[state.auth.role] ? ROLES[state.auth.role].short : 'Viewer';
});

function handleLock() {
  lockNow('Tracker locked. Enter your password to continue.');
}
</script>
