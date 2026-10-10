<template>
  <div class="card">
    <div class="cardHead">
      <div>
        <h3>System Settings &amp; Office Configuration</h3>
        <div class="sub">Manage user accounts, customize office identity, backup/restore data, and configure storage.</div>
      </div>
    </div>

    <!-- 1. Users & Accounts -->
    <div class="card" style="margin-top: 12px;">
      <div class="cardHead">
        <div>
          <h4>Users &amp; Staff Accounts</h4>
          <div class="sub">Control access levels and attribution for office staff sharing this computer.</div>
        </div>
        <button v-if="canManageUsers" class="btn primary sm" @click="openAddUser">+ Add User</button>
      </div>

      <div style="overflow-x: auto; margin-top: 10px;">
        <table class="tbl" style="margin: 0; font-size: 13.5px;">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Sign-In</th>
              <th v-if="canManageUsers" style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!state.users.length">
              <td colspan="6" class="small muted" style="text-align: center; padding: 20px;">
                No user accounts created yet. Anyone with the master password can sign in as Administrator.
              </td>
            </tr>
            <tr v-for="u in state.users" :key="u.id">
              <td><code>{{ u.username }}</code></td>
              <td><b>{{ u.displayName }}</b></td>
              <td>
                <span :class="['chip role', u.role]">{{ getRoleLabel(u.role) }}</span>
              </td>
              <td>
                <span :class="['chip', u.active ? 'done' : 'cancel']">
                  {{ u.active ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="small muted">{{ u.lastLogin ? u.lastLogin.slice(0, 16).replace('T', ' ') : 'Never' }}</td>
              <td v-if="canManageUsers" style="text-align: right; white-space: nowrap;">
                <button class="btn sm icon" title="Edit User" @click="editUser(u)"><AppIcon name="edit" /></button>
                <button class="btn sm icon danger" title="Delete User" @click="deleteUser(u)"><AppIcon name="trash" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. Office Information Customization -->
    <div class="card" style="margin-top: 14px;">
      <div class="cardHead">
        <h4>Office Identity &amp; Document Headers</h4>
      </div>
      <form @submit.prevent="saveOfficeSettings">
        <div class="tev-form-grid">
          <div class="field">
            <label for="set-off">Office Name</label>
            <input id="set-off" v-model="state.settings.officeName" class="input" required />
          </div>
          <div class="field">
            <label for="set-tag">Tagline / Department</label>
            <input id="set-tag" v-model="state.settings.tagline" class="input" />
          </div>
        </div>
        <div class="field" style="margin-top: 10px;">
          <label for="set-foot">Document Footer Text</label>
          <input id="set-foot" v-model="state.settings.footer" class="input" />
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
          <button type="submit" class="btn primary sm">Save Office Identity</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="cardHead"><h3>Entry lists &amp; calendar preferences</h3><div class="sub">One item per line — used by the work and travel forms</div></div>
      <form @submit.prevent="saveLists"><div class="grid g3"><div class="field"><label>Categories</label><textarea v-model="listDraft.categories" class="input" rows="8" :disabled="!canEditSettings"></textarea></div><div class="field"><label>Locations / barangays</label><textarea v-model="listDraft.locations" class="input" rows="8" :disabled="!canEditSettings"></textarea></div><div class="field"><label>Personnel</label><textarea v-model="listDraft.personnel" class="input" rows="8" :disabled="!canEditSettings"></textarea></div></div><div class="flexrow" style="margin-top:12px"><div class="field"><label>Week starts on</label><select v-model="state.settings.weekStart" class="input" :disabled="!canEditSettings"><option :value="0">Sunday</option><option :value="1">Monday</option></select></div><button v-if="canEditSettings" class="btn primary" type="submit">Save lists &amp; preferences</button></div></form>
    </div>
    <!-- 3. Backup & Recovery -->
    <div class="card" style="margin-top: 14px;">
      <div class="cardHead">
        <h4>Data Backup &amp; Recovery</h4>
        <div class="sub">Download complete database backup or restore an existing backup file.</div>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn" @click="exportBackup">
          <AppIcon name="download" /> Export Full JSON Backup
        </button>
        <label class="btn soft" style="cursor: pointer; margin: 0;">
          <AppIcon name="upload" /> Restore JSON Backup
          <input type="file" accept=".json,application/json" style="display: none;" @change="importBackup" />
        </label>
        <button class="btn sm" @click="handleResetDemo">
          <AppIcon name="refresh" /> Reset Demo Data
        </button>
        <button class="btn danger sm" @click="handleClearAll">
          <AppIcon name="warning" /> Clear All Data
        </button>
      </div>
    </div>

    <TravelTemplateSettings />
    <!-- User Modal -->
    <UserModal
      v-model="showUserModal"
      :editing-item="editingUser"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { state, saveState, resetDemoData, clearAllData, notify, cleanEntry, cleanUser, cleanTravel, cleanTemplate, cleanTevRequest } from '../../store/state';
import { canDo } from '../../utils/auth';
import { ROLES } from '../../utils/constants';
import { downloadBinary } from '../../utils/storage';
import { todayISO } from '../../utils/dateUtils';
import UserModal from './UserModal.vue';
import TravelTemplateSettings from '../travel/TravelTemplateSettings.vue';

const showUserModal = ref(false);
const editingUser = ref(null);
const canEditSettings = computed(()=>canDo(state.auth.role,'settings'));
const listDraft = ref(Object.fromEntries(['categories','locations','personnel'].map(k=>[k,state.settings[k].join('\n')])));
function saveLists(){if(!canEditSettings.value)return;for(const k of ['categories','locations','personnel']){const values=[...new Set(listDraft.value[k].split('\n').map(s=>s.trim()).filter(Boolean))];if(!values.length){notify('Each entry list needs at least one item.',true);return;}}for(const k of ['categories','locations','personnel'])state.settings[k]=[...new Set(listDraft.value[k].split('\n').map(s=>s.trim()).filter(Boolean))];saveState();notify('Lists and calendar preferences saved.');}

const canManageUsers = computed(() => {
  return state.auth.role === 'admin' || state.auth.id === 'master';
});

function getRoleLabel(role) {
  return ROLES[role] ? ROLES[role].label : role;
}

function openAddUser() {
  editingUser.value = null;
  showUserModal.value = true;
}

function editUser(u) {
  editingUser.value = { ...u };
  showUserModal.value = true;
}

function deleteUser(u) {
  if (confirm(`Delete account for "${u.displayName}" (${u.username})?`)) {
    state.users = state.users.filter((x) => x.id !== u.id);
    saveState();
    notify(`Deleted user: ${u.displayName}`);
  }
}

function saveOfficeSettings() {
  if (!canEditSettings.value) return;
  saveState();
  notify('Office identity settings updated.');
}

function exportBackup() {
  const data = {
    version: '2.0.0-vue',
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    entries: state.entries,
    users: state.users,
    travels: state.travels,
    templates: state.templates,
    trash: state.trash,
    ppa: state.ppa,
    tevRequests: state.tevRequests,
    fareMatrix: state.fareMatrix
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const enc = new TextEncoder().encode(jsonStr);
  downloadBinary(`ABE-Tracker-FullBackup-${todayISO()}.json`, enc, 'application/json');
  notify('Full system backup downloaded.');
}

function importBackup(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data || !Array.isArray(data.entries)) {
        throw new Error('Invalid backup file format.');
      }
      if (confirm('Restore backup? This will merge/replace existing records.')) {
        if (data.settings) state.settings = Object.assign(state.settings, data.settings);
        if (Array.isArray(data.entries)) state.entries = data.entries.map(cleanEntry);
        if (Array.isArray(data.users)) state.users = data.users.map(cleanUser);
        if (Array.isArray(data.travels)) state.travels = data.travels.map(cleanTravel);
        if (Array.isArray(data.templates)) state.templates = data.templates.map(cleanTemplate);
        if (Array.isArray(data.trash)) state.trash = data.trash.filter(r=>r?.entry).map(r=>({...r,entry:cleanEntry(r.entry)}));
        if (Array.isArray(data.tevRequests)) state.tevRequests = data.tevRequests.map(cleanTevRequest);
        if (Array.isArray(data.fareMatrix)) state.fareMatrix = data.fareMatrix;
        if ('ppa' in data) state.ppa = data.ppa;
        listDraft.value = Object.fromEntries(['categories','locations','personnel'].map(k=>[k,state.settings[k].join('\n')]));
        saveState();
        notify('Backup restored successfully!');
      }
    } catch (err) {
      notify(`Restore failed: ${err.message}`, true);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function handleResetDemo() {
  if (confirm('Reset to initial sample activities and Alcala TEV requests?')) {
    resetDemoData();
  }
}

function handleClearAll() {
  if (confirm('DANGER: Clear all activities, travel orders, and TEV requests? This cannot be undone.')) {
    clearAllData();
  }
}
</script>
