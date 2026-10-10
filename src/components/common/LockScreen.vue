<template>
  <div v-if="state.isLocked" class="lock">
    <div :class="['lockCard', { shake: isShaking }]">
      <div class="lockBrand">
        <div class="mark lockMark">
          <svg viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#14532d"/>
            <path d="M20 44c0-13 9-24 24-24 0 15-10 24-24 24z" fill="#76d39a"/>
            <path d="M20 44c7-1 14-6 18-13" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <h1>{{ state.settings.officeName || 'ABE Office — Alcala' }}</h1>
          <div class="small muted">{{ state.settings.tagline || 'Agricultural and Biosystems Engineering Services' }}</div>
        </div>
      </div>

      <div class="lockLead">
        Sign in to encode work, generate travel orders &amp; TEV documents, and export reports.
      </div>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="lockUser">Username</label>
          <input
            id="lockUser"
            v-model="username"
            class="input"
            list="dl-users"
            placeholder="e.g. juan.dela or leave blank for master password"
            autocomplete="username"
          />
          <datalist id="dl-users">
            <option v-for="u in activeUsers" :key="u.id" :value="u.username">
              {{ u.displayName || u.username }}
            </option>
          </datalist>
        </div>

        <div class="field" style="margin-top: 10px;">
          <label for="lockPass">Password</label>
          <div class="lockInput">
            <input
              id="lockPass"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              placeholder="Enter password"
              autocomplete="current-password"
            />
            <button
              type="button"
              id="lockEye"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              class="btn icon"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </div>
        </div>

        <div class="lockRow">
          <label class="check">
            <input type="checkbox" v-model="rememberMe" />
            Remember this computer
          </label>
        </div>

        <div v-if="errorMsg" :class="['lockMsg', { ok: isSuccess }]">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          class="btn primary lockBtn"
          :disabled="isSubmitting || coolSeconds > 0"
        >
          <span v-if="coolSeconds > 0">Wait {{ coolSeconds }}s</span>
          <span v-else-if="isSubmitting">Checking…</span>
          <span v-else><AppIcon name="unlock" /> Sign in</span>
        </button>
      </form>

      <div class="lockHint">
        <span v-if="activeUsers.length">
          <b>{{ activeUsers.length }} account{{ activeUsers.length > 1 ? 's' : '' }}</b> on this computer — pick your username or sign in with the <b>master password</b>.
        </span>
        <span v-else>
          Sign in with the office <b>master password</b>, then manage accounts in <b>Settings → Users &amp; Accounts</b>.
        </span>
      </div>

      <div class="lockFoot">
        {{ state.settings.footer || 'ABE Office — Alcala · Work & Accomplishment Tracker' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { state, tryUnlock, notify } from '../../store/state';
import { devRec, coolRemaining, failsSave, failsInfo, MAX_TRIES } from '../../utils/auth';

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);
const errorMsg = ref('');
const isSuccess = ref(false);
const isSubmitting = ref(false);
const isShaking = ref(false);
const coolSeconds = ref(0);

let timer = null;

const activeUsers = computed(() => {
  return state.users.filter((u) => u.active);
});

onMounted(() => {
  const dev = devRec();
  if (dev && dev.u && dev.u !== 'master') {
    const user = state.users.find((x) => x.id === dev.u);
    if (user) username.value = user.username;
    if (dev.rem !== undefined) rememberMe.value = !!dev.rem;
  }
  checkCool();
});

function checkCool() {
  coolSeconds.value = coolRemaining();
  if (coolSeconds.value > 0) {
    if (!timer) {
      timer = setInterval(() => {
        coolSeconds.value = coolRemaining();
        if (coolSeconds.value <= 0) {
          clearInterval(timer);
          timer = null;
        }
      }, 1000);
    }
  }
}

async function handleLogin() {
  if (coolSeconds.value > 0) return;
  if (!password.value) {
    errorMsg.value = 'Please enter the password.';
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = '';

  try {
    const ident = await tryUnlock(username.value, password.value, rememberMe.value);
    isSuccess.value = true;
    errorMsg.value = 'Access granted — loading…';
    failsSave({ n: 0, t: 0 });
    notify(`Welcome back, ${ident.name}!`);
  } catch (err) {
    isSubmitting.value = false;
    isSuccess.value = false;
    isShaking.value = true;
    setTimeout(() => { isShaking.value = false; }, 400);

    const f = failsInfo();
    const n = (f.n || 0) + 1;
    failsSave({ n, t: Date.now() });

    checkCool();
    if (coolSeconds.value > 0) {
      errorMsg.value = `Too many incorrect attempts. Please wait ${coolSeconds.value}s.`;
    } else {
      const left = Math.max(0, MAX_TRIES - n);
      errorMsg.value = `${err.message} ${left} attempt${left === 1 ? '' : 's'} remaining.`;
    }
  }
}
</script>
