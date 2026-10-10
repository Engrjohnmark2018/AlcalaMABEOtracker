<template>
  <div class="card">
    <div class="cardHead">
      <div>
        <h3>Weekly Schedule of Activities (Official Timetable)</h3>
        <div class="sub">Compiled work schedule from Monday to Friday with PNG, PDF, and print layouts.</div>
      </div>
      <div class="topActions">
        <button class="btn primary sm" @click="handleDownloadPdf"><AppIcon name="file" /> Export PDF</button>
        <button class="btn soft sm" @click="handleDownloadPng"><AppIcon name="image" /> Export PNG</button>
        <button class="btn sm" @click="handlePrint"><AppIcon name="print" /> Print</button>
      </div>
    </div>

    <!-- Week Controls Toolbar -->
    <div class="card" style="margin-top: 0; background: var(--panel-2); padding: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn sm" @click="shiftWeek(-7)">‹ Previous Week</button>
          <input type="date" v-model="selectedMonday" class="input" style="max-width: 170px;" @change="onDateChange" />
          <button class="btn sm" @click="shiftWeek(7)">Next Week ›</button>
          <button class="btn sm" @click="setThisWeek">This Week</button>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <label class="check">
            <input type="checkbox" v-model="includeAccomplished" />
            Include Accomplished
          </label>
          <select v-model="paperSize" class="input" style="max-width: 150px;">
            <option value="a4l">A4 Landscape</option>
            <option value="letterl">Letter Landscape</option>
            <option value="a4p">A4 Portrait</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Formatted Weekly Preview Table -->
    <div id="weeklyPrintArea" style="margin-top: 14px; background: #fff; color: #000; border: 1px solid var(--line); border-radius: 8px; padding: 24px; box-shadow: var(--shadow);">
      <!-- Official Header -->
      <div style="border-bottom: 2px solid #14532d; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="font-size: 16px; font-weight: 800; color: #14532d;">
          {{ state.settings.officeName || 'ABE Office — Alcala' }}
        </div>
        <div style="font-size: 11px; color: #666;">
          {{ state.settings.tagline || 'Agricultural and Biosystems Engineering Services' }}
        </div>
        <div style="font-size: 18px; font-weight: 800; margin-top: 6px; letter-spacing: -0.3px;">
          WEEKLY SCHEDULE OF ACTIVITIES
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #1f7a43;">
          {{ weekData.label }} · Monday – Friday
        </div>
      </div>

      <!-- 5-column weekday timetable -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; min-height: 400px;">
        <div
          v-for="col in weekData.days"
          :key="col.iso"
          style="border: 1px solid #e3e9f0; border-radius: 6px; display: flex; flex-direction: column;"
        >
          <!-- Day header -->
          <div style="background: #14532d; color: #fff; padding: 8px; border-radius: 5px 5px 0 0; text-align: center;">
            <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.5px;">{{ col.dow.toUpperCase() }}</div>
            <div style="font-size: 11px; opacity: 0.9;">{{ col.label }}</div>
          </div>

          <!-- Items list -->
          <div style="padding: 6px; flex: 1; display: flex; flex-direction: column; gap: 6px; background: #fdfdfd;">
            <div v-if="!col.items.length" style="color: #999; font-size: 11px; text-align: center; margin-top: 12px;">
              No activities scheduled
            </div>
            <div
              v-for="item in col.items"
              :key="item.title + item.kind"
              :style="{
                borderLeft: '3px solid ' + WK_KIND[item.kind].css,
                background: WK_KIND[item.kind].bg,
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }"
            >
              <div style="font-weight: 700; color: #111;">{{ item.title }}</div>
              <div style="font-size: 10px; color: #555; margin-top: 2px;">{{ item.meta }}</div>
              <div v-if="item.by" style="font-size: 9.5px; color: #777; margin-top: 2px;">by {{ item.by }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Signatures footer -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e3e9f0; display: flex; justify-content: space-between; font-size: 12px;">
        <div>
          <div>Prepared by: <b>{{ state.auth.name || 'ABE Staff / Engineer' }}</b></div>
          <div style="border-bottom: 1px solid #888; width: 180px; margin-top: 20px;"></div>
        </div>
        <div>
          <div>Noted by: <b>Municipal Agriculturist</b></div>
          <div style="border-bottom: 1px solid #888; width: 180px; margin-top: 20px;"></div>
        </div>
        <div style="text-align: right; color: #888; font-size: 10.5px;">
          Generated {{ todayISO() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { state, notify, saveUi } from '../../store/state';
import { todayISO, fromISO, toISO, addDays } from '../../utils/dateUtils';
import {
  wkMonday, weekScheduleData, generateWeeklyPdf, WK_KIND
} from '../../utils/pdfEngine';
import { downloadBinary } from '../../utils/storage';
import { generateWeeklyPng } from '../../utils/weeklyPng';
import { printArea } from '../../utils/print';

if (!state.wk.mon) state.wk.mon = wkMonday(todayISO());
const selectedMonday = computed({get:()=>state.wk.mon,set:v=>state.wk.mon=v});
const includeAccomplished = computed({get:()=>state.wk.accomplished,set:v=>state.wk.accomplished=v});
const paperSize = computed({get:()=>state.wk.paper,set:v=>state.wk.paper=v});
watch(()=>[state.wk.mon,state.wk.accomplished,state.wk.paper],saveUi);

function onDateChange() {
  selectedMonday.value = wkMonday(selectedMonday.value);
}

function shiftWeek(days) {
  const d = fromISO(selectedMonday.value);
  d.setDate(d.getDate() + days);
  selectedMonday.value = wkMonday(toISO(d));
}

function setThisWeek() {
  selectedMonday.value = wkMonday(todayISO());
}

const weekData = computed(() => {
  return weekScheduleData(selectedMonday.value, state.entries, {
    accomplished: includeAccomplished.value
  });
});

function handleDownloadPdf() {
  try {
    notify('Rendering weekly timetable PDF…');
    const pdfBytes = generateWeeklyPdf(
      weekData.value,
      state.settings,
      state.auth.name,
      { paper: paperSize.value, accomplished: includeAccomplished.value }
    );
    downloadBinary(`Weekly-Schedule-${selectedMonday.value}.pdf`, pdfBytes, 'application/pdf');
    notify('PDF downloaded successfully.');
  } catch (e) {
    notify(`PDF generation failed: ${e.message}`, true);
  }
}

async function handleDownloadPng() {
  try {
    const bytes = await generateWeeklyPng(weekData.value, state.settings, state.auth.name, {paper:paperSize.value});
    downloadBinary(`Weekly-Schedule-${selectedMonday.value}.png`, bytes, 'image/png');
    notify('Weekly schedule PNG downloaded.');
  } catch (e) {
    notify(e.message, true);
  }
}

function handlePrint() {
  printArea('weeklyPrintArea');
}
</script>
