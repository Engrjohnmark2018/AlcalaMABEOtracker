<template>
  <section id="calendar-view">
    <div class="card" id="calendar-sheet">
      <div class="cardHead">
        <div class="calNav"><button class="btn icon no-print" aria-label="Previous period" @click="shift(-1)">‹</button><div><h2>{{ state.calView === 'year' ? state.calYear : MONTHS[state.calMonth] + ' ' + state.calYear }}</h2><div class="moy">{{ state.calView === 'year' ? 'Year overview' : 'Month view' }} · click any date to see its accomplished and unfinished work</div></div><button class="btn icon no-print" aria-label="Next period" @click="shift(1)">›</button><button class="btn sm no-print" @click="goToday">Today</button><button class="btn sm no-print" @click="printArea('calendar-sheet')">Print sheet</button></div>
        <div class="flexrow no-print"><select v-model="state.calMode" class="input" aria-label="Calendar date mode" style="width:auto;max-width:360px" @change="saveUi"><option value="auto">Auto — completion / target date</option><option value="due">Target / due date for everything</option><option value="done">Completion date for everything</option></select><button :class="['btn sm', {primary:state.calView === 'month'}]" @click="setView('month')">Month</button><button :class="['btn sm', {primary:state.calView === 'year'}]" @click="setView('year')">Year</button></div>
      </div>
      <div v-if="state.calView === 'year'" class="calYearWrap">
        <div v-for="(month, m) in MONTHS" :key="month" class="mini"><h4><button class="month-link" @click="openMonth(m)">{{ month }}</button><span class="chip">{{ monthSummary(m).done + monthSummary(m).left }}</span></h4><div class="mg"><span v-for="d in weekLabels" :key="d" class="hd">{{ d[0] }}</span><template v-for="(iso,i) in monthCells(state.calYear,m,state.settings.weekStart)" :key="i"><i v-if="!iso" class="bl"></i><button v-else :class="miniClass(iso)" :title="fmtLong(iso) + ' · ' + dayInfo(iso).done.length + ' accomplished · ' + travelsOn(state.travels,iso).length + ' travels'" @click="pickDay(iso,true)">{{ fromISO(iso).getDate() }}</button></template></div></div>
      </div>
      <div v-else class="calendar-scroll"><table class="calGrid"><thead><tr><th v-for="d in weekLabels" :key="d">{{ d }}</th></tr></thead><tbody><tr v-for="(week,w) in weeks" :key="w"><td v-for="(iso,i) in week" :key="i" :class="iso ? dayClass(iso) : 'out'">
        <button v-if="iso" class="calendar-day" :aria-label="fmtLong(iso)" @click="pickDay(iso)">
          <span class="dnum"><span class="n">{{ fromISO(iso).getDate() }}</span><span class="cnts"><span v-if="dayInfo(iso).done.length" class="c d">{{ dayInfo(iso).done.length }}✓</span><span v-if="dayInfo(iso).unfinished.length" :class="['c', dayInfo(iso).unfinished.some(isOverdue) ? 'l' : 'u']">{{ dayInfo(iso).unfinished.length }}!</span><span v-if="travelsOn(state.travels,iso).length" class="c t">T{{ travelsOn(state.travels,iso).length > 1 ? travelsOn(state.travels,iso).length : '' }}</span></span></span>
          <span v-for="e in events(iso).slice(0,3)" :key="e.id" :class="['calEv', e.kind]" :title="e.text">{{ e.text }}</span><span v-if="events(iso).length > 3" class="moreEv">+{{ events(iso).length - 3 }} more</span>
        </button>
      </td></tr></tbody></table></div>
      <div class="legend calendar-legend"><span><i style="background:var(--done)"></i>Accomplished</span><span><i style="background:var(--open)"></i>Ongoing</span><span><i style="background:var(--pend)"></i>Pending</span><span><i style="background:var(--late)"></i>Overdue</span><span><i class="lt"></i><b>T</b> = traveller on travel that day</span></div>
      <div v-if="state.calView === 'month'" class="grid g4" style="margin-top:12px"><div v-for="k in monthKpis" :key="k.label" :class="['kpi', k.cls]"><div class="lab">{{ k.label }}</div><div class="val">{{ k.value }}</div></div></div>
    </div>
    <DayPanel @edit-task="emit('edit-task',$event)" @add-task="emit('open-new-task-date',$event)" />
  </section>
</template>
<script setup>
import { computed } from 'vue';
import { state, saveUi } from '../../store/state';
import { MONTHS, DOW_S, STATUS } from '../../utils/constants';
import { todayISO, toISO, fromISO, fmtLong } from '../../utils/dateUtils';
import { monthCells, entriesForDate, travelsOn, isOverdue } from '../../utils/trackerMetrics';
import { printArea } from '../../utils/print';
import DayPanel from './DayPanel.vue';
const emit = defineEmits(['edit-task','open-new-task-date']);
const weekLabels = computed(() => Array.from({length:7},(_,i) => DOW_S[(i + Number(state.settings.weekStart || 0)) % 7]));
const cells = computed(() => monthCells(state.calYear,state.calMonth,state.settings.weekStart));
const weeks = computed(() => Array.from({length:cells.value.length/7},(_,i) => cells.value.slice(i*7,i*7+7)));
const dayInfo = iso => entriesForDate(state.entries,iso,state.calMode);
function events(iso) { const info = dayInfo(iso); return [...info.unfinished.map(e => ({id:e.id,kind:isOverdue(e) ? 'l' : STATUS[e.status].ev,text:e.title})), ...info.done.map(e => ({id:e.id,kind:'d',text:'✓ ' + e.title})), ...travelsOn(state.travels,iso).map(t => ({id:t.id,kind:'t',text:t.purpose || (t.travellerName ? t.travellerName + ' → ' + t.destination : t.destination)}))]; }
function dayClass(iso) { const info = dayInfo(iso); return {today:iso === todayISO(),sel:iso === state.selDate,haspast:info.done.length,hasplan:info.unfinished.length && iso > todayISO(),haslate:info.unfinished.some(isOverdue),hastravel:travelsOn(state.travels,iso).length}; }
function miniClass(iso) { const info=dayInfo(iso), n=info.done.length+info.unfinished.length; return {late:info.unfinished.some(isOverdue),on1:n===1,on2:n===2,on3:n>=3,trav:travelsOn(state.travels,iso).length,today:iso===todayISO()}; }
function monthSummary(m) { const info = monthCells(state.calYear,m).filter(Boolean).map(dayInfo); return {done:info.reduce((s,d)=>s+d.done.length,0),left:info.reduce((s,d)=>s+d.unfinished.length,0),late:info.reduce((s,d)=>s+d.unfinished.filter(isOverdue).length,0),active:info.filter(d=>d.done.length+d.unfinished.length).length}; }
const monthKpis=computed(()=>{const s=monthSummary(state.calMonth);return [{label:'Accomplished in '+MONTHS[state.calMonth],value:s.done,cls:'done'},{label:'Unfinished due this month',value:s.left,cls:'open'},{label:'Overdue on date',value:s.late,cls:'late'},{label:'Active days',value:s.active,cls:''}];});
function setView(v) {state.calView=v;saveUi();}
function shift(n) {if(state.calView==='year') state.calYear+=n; else {const d=new Date(state.calYear,state.calMonth+n,1);state.calYear=d.getFullYear();state.calMonth=d.getMonth();} saveUi();}
function goToday() {const d=fromISO(todayISO());state.calYear=d.getFullYear();state.calMonth=d.getMonth();state.selDate=toISO(d);saveUi();}
function openMonth(m) {state.calMonth=m;setView('month');}
function pickDay(iso, switchMonth=false) {state.selDate=iso;if(switchMonth){state.calMonth=fromISO(iso).getMonth();state.calView='month';}saveUi();}
</script>
