<template>
  <div v-if="modelValue" class="modalBg" @click.self="close">
    <div class="modalCard" style="max-width: 540px;">
      <div class="modalHead">
        <h3>{{ isEditing ? 'Edit User Account' : 'Add New User Account' }}</h3>
        <button class="btn icon sm" type="button" @click="close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modalBody">
          <div class="field">
            <label for="usr-name">Username *</label>
            <input
              id="usr-name"
              v-model="form.username"
              class="input"
              required
              :disabled="isEditing"
              placeholder="e.g. juan.dela"
            />
            <span class="hint">Used at sign-in (letters, numbers, dot or underscore).</span>
          </div>

          <div class="field" style="margin-top: 10px;">
            <label for="usr-display">Display Name *</label>
            <input
              id="usr-display"
              v-model="form.displayName"
              class="input"
              required
              placeholder="e.g. Juan Dela Cruz — ABE Staff"
            />
          </div>

          <div class="field" style="margin-top: 10px;">
            <label for="usr-role">Role *</label>
            <select id="usr-role" v-model="form.role" class="input">
              <option value="admin">Administrator (Full Access)</option>
              <option value="editor">Encoder / Staff (Add/Edit Entries &amp; TEV)</option>
              <option value="viewer">Viewer (Read-Only)</option>
            </select>
          </div>

          <div class="field" style="margin-top: 10px;">
            <label class="check">
              <input type="checkbox" v-model="form.active" />
              Account is active (can sign in)
            </label>
          </div>

          <!-- Password fields for new user or password change -->
          <div v-if="!isEditing || changePassword" style="margin-top: 10px;">
            <div class="field">
              <label for="usr-pass">Password *</label>
              <input
                id="usr-pass"
                v-model="password"
                type="password"
                class="input"
                :required="!isEditing"
                placeholder="At least 6 characters"
              />
            </div>
            <div class="field" style="margin-top: 8px;">
              <label for="usr-pass2">Repeat Password *</label>
              <input
                id="usr-pass2"
                v-model="passwordConfirm"
                type="password"
                class="input"
                :required="!isEditing"
                placeholder="Repeat password"
              />
            </div>
          </div>
          <div v-else style="margin-top: 10px;">
            <button type="button" class="btn sm soft" @click="changePassword = true">
              <AppIcon name="key" /> Change Password
            </button>
          </div>
        </div>

        <div class="modalFoot" style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn" @click="close">Cancel</button>
          <button type="submit" class="btn primary">
            {{ isEditing ? 'Save Changes' : 'Create Account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, cleanUser, saveState, notify } from '../../store/state';
import { makeSalt, pwHashes } from '../../utils/auth';

const props = defineProps({
  modelValue: Boolean,
  editingItem: Object
});

const emit = defineEmits(['update:modelValue', 'saved']);

const isEditing = computed(() => !!props.editingItem && !!props.editingItem.id);
const changePassword = ref(false);
const password = ref('');
const passwordConfirm = ref('');

const form = ref({
  username: '',
  displayName: '',
  role: 'editor',
  active: true
});

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.editingItem) {
      form.value = { ...props.editingItem };
      changePassword.value = false;
    } else {
      form.value = { username: '', displayName: '', role: 'editor', active: true };
      changePassword.value = true;
    }
    password.value = '';
    passwordConfirm.value = '';
  }
});

async function handleSubmit() {
  if (!form.value.username.trim() || !form.value.displayName.trim()) {
    notify('Username and display name are required.', true);
    return;
  }

  if (!isEditing.value || changePassword.value) {
    if (password.value.length < 6) {
      notify('Password must be at least 6 characters long.', true);
      return;
    }
    if (password.value !== passwordConfirm.value) {
      notify('Passwords do not match.', true);
      return;
    }
  }

  try {
    if (isEditing.value) {
      const idx = state.users.findIndex((x) => x.id === props.editingItem.id);
      if (idx >= 0) {
        state.users[idx].displayName = form.value.displayName;
        state.users[idx].role = form.value.role;
        state.users[idx].active = form.value.active;
        state.users[idx].updatedAt = new Date().toISOString();

        if (changePassword.value && password.value) {
          const salt = makeSalt();
          const hashes = await pwHashes(password.value, salt);
          state.users[idx].salt = salt;
          state.users[idx].sha = hashes.sha256;
          state.users[idx].fb = hashes.fb;
        }
      }
      notify(`Updated account: ${form.value.displayName}`);
    } else {
      const salt = makeSalt();
      const hashes = await pwHashes(password.value, salt);
      const newUser = cleanUser({
        username: form.value.username,
        displayName: form.value.displayName,
        role: form.value.role,
        active: form.value.active,
        salt,
        sha: hashes.sha256,
        fb: hashes.fb
      });
      state.users.push(newUser);
      notify(`Created account for ${newUser.displayName}!`);
    }

    saveState();
    emit('saved');
    close();
  } catch (err) {
    notify(err.message, true);
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>
