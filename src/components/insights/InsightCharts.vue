<template>
  <div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><div class="cardHead"><div><h3>Monthly accomplishments</h3><div class="sub">Last 12 months · completion dates</div></div></div><svg class="chart" viewBox="0 0 600 230" role="img" aria-label="Accomplishments over the last 12 months"><line x1="25" y1="190" x2="590" y2="190" stroke="var(--line)"/><g v-for="(m,i) in months" :key="m.key"><rect :x="30+i*47" :y="190-m.done/maxMonthly*155" width="28" :height="m.done/maxMonthly*155" rx="4" fill="var(--done)"/><text :x="44+i*47" :y="180-m.done/maxMonthly*155" text-anchor="middle" class="axv">{{ m.done }}</text><text :x="44+i*47" y="211" text-anchor="middle" class="ax">{{ m.label }}</text></g></svg></div>
      <div class="card"><div class="cardHead"><div><h3>Overdue aging</h3><div class="sub">Days past the target date · ongoing and pending work</div></div></div><div v-for="b in aging" :key="b.label" class="hbar"><span class="nm">{{ b.label }}</span><span class="track"><i :style="{width:b.count/maxAging*100+'%',background:'var(--late)'}"></i></span><span class="n">{{ b.count }}</span></div><div v-if="!aging.some(b=>b.count)" class="empty">No overdue work.</div></div>
      <div class="card"><div class="cardHead"><div><h3>Year-over-year accomplishments</h3><div class="sub">Completed activities by month</div></div><select v-model="selectedYear" class="input" aria-label="Comparison year" style="width:auto"><option v-for="y in years" :key="y" :value="y">{{ y }}</option></select></div><svg class="chart" viewBox="0 0 600 230" role="img" aria-label="This year compared with the previous year"><g v-for="(m,i) in comparison" :key="m.label"><rect :x="28+i*47" :y="190-m.current/maxCompare*155" width="16" :height="m.current/maxCompare*155" fill="var(--done)"/><rect :x="45+i*47" :y="190-m.previous/maxCompare*155" width="16" :height="m.previous/maxCompare*155" fill="var(--open)"/><text :x="44+i*47" y="211" text-anchor="middle" class="ax">{{ m.label }}</text><title>{{ m.label }}: {{ selectedYear }} = {{ m.current }}, {{ selectedYear-1 }} = {{ m.previous }}</title></g></svg><div class="calendar-legend legend"><span><i style="background:var(--done)"></i>{{ selectedYear }}</span><span><i style="background:var(--open)"></i>{{ selectedYear-1 }}</span></div></div>
      <div class="card"><div class="cardHead"><h3>Completion timing</h3></div><div class="kpis"><div class="kpi done"><div class="lab">On-time accomplishments</div><div class="val">{{ timing.onTime }}</div><div class="small muted">Completed by the target date</div></div><div class="kpi late"><div class="lab">Late accomplishments</div><div class="val">{{ timing.late }}</div><div class="small muted">Completed after the target date</div></div><div class="kpi"><div class="lab">Average turnaround</div><div class="val">{{ timing.average }}d</div><div class="small muted">From start to completion</div></div></div></div>
    </div>
  </div>
</template>
<script setup>
import {computed,ref} from 'vue';
import {state} from '../../store/state';
import {todayISO,fromISO,toISO,mKey,diffDays,isDate} from '../../utils/dateUtils';
import {plotDate,isOverdue} from '../../utils/trackerMetrics';
import {MONTHS_S} from '../../utils/constants';
const thisYear=fromISO(todayISO()).getFullYear(),selectedYear=ref(thisYear);
const completed=computed(()=>state.entries.filter(e=>e.status==='done'));
const months=computed(()=>{const now=fromISO(todayISO());return Array.from({length:12},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-11+i,1),key=mKey(toISO(d));return {key,label:MONTHS_S[d.getMonth()],done:completed.value.filter(e=>mKey(plotDate(e))===key).length};});});
const maxMonthly=computed(()=>Math.max(1,...months.value.map(m=>m.done)));
const aging=computed(()=>[[1,7,'1–7 days'],[8,14,'8–14 days'],[15,30,'15–30 days'],[31,Infinity,'31+ days']].map(([min,max,label])=>({label,count:state.entries.filter(e=>isOverdue(e)&&diffDays(todayISO(),e.dueDate)>=min&&diffDays(todayISO(),e.dueDate)<=max).length})));
const maxAging=computed(()=>Math.max(1,...aging.value.map(b=>b.count)));
const years=computed(()=>[...new Set([thisYear,...completed.value.map(e=>Number(plotDate(e).slice(0,4)))])].filter(Number.isFinite).sort((a,b)=>b-a));
const comparison=computed(()=>MONTHS_S.map((label,m)=>({label,current:completed.value.filter(e=>mKey(plotDate(e))===`${selectedYear.value}-${String(m+1).padStart(2,'0')}`).length,previous:completed.value.filter(e=>mKey(plotDate(e))===`${selectedYear.value-1}-${String(m+1).padStart(2,'0')}`).length})));
const maxCompare=computed(()=>Math.max(1,...comparison.value.flatMap(m=>[m.current,m.previous])));
const timing=computed(()=>{const dated=completed.value.filter(e=>isDate(e.completedDate)&&isDate(e.dueDate)),duration=completed.value.filter(e=>isDate(e.completedDate)&&isDate(e.startDate)&&e.completedDate>=e.startDate);return {onTime:dated.filter(e=>e.completedDate<=e.dueDate).length,late:dated.filter(e=>e.completedDate>e.dueDate).length,average:duration.length?Math.round(duration.reduce((s,e)=>s+diffDays(e.completedDate,e.startDate),0)/duration.length):0};});
</script>
