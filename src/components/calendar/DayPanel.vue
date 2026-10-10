<template>
  <div class="card daypanel" id="calendar-day-report" style="margin-top:14px">
    <div class="dpHead"><div><div class="dpDate">{{ fmtLong(state.selDate) }}</div><div class="dpSub">{{ relDay(state.selDate) }} · {{ info.done.length + info.unfinished.length }} work items logged on this date</div></div><div class="flexrow no-print"><button class="btn sm" @click="move(-1)">‹ Day</button><button class="btn sm" @click="move(1)">Day ›</button><button v-if="canEdit" class="btn sm primary" @click="emit('add-task',state.selDate)">+ Add entry</button></div></div>
    <div class="dpStats"><span class="chip done">{{ info.done.length }} accomplished</span><span class="chip pend">{{ info.unfinished.length }} unfinished</span><span v-if="state.selDate === todayISO()" class="chip">Today</span></div>
    <div v-for="section in sections" :key="section.title" class="dpSec"><h4>{{ section.title }} <span class="n">{{ section.entries.length }}</span></h4><div v-if="!section.entries.length" class="empty">{{ section.empty }}</div><div v-for="e in section.entries" :key="e.id" :class="['evItem',isOverdue(e)?'l':STATUS[e.status].ev]"><div class="t">{{ e.title }}</div><div class="meta"><span class="chip cat">{{ e.category }}</span><span>{{ e.location }}</span><span>{{ e.personnel }}</span><span>{{ e.status === 'done' ? 'Accomplished ' + fmtMed(e.completedDate) : 'Target ' + fmtMed(e.dueDate) }}</span><span v-if="e.createdByName">Encoded by {{ e.createdByName }}</span><span v-if="e.completedByName">Accomplished by {{ e.completedByName }}</span></div><div v-if="e.remarks" class="rm">{{ e.remarks }}</div><div class="acts no-print"><a v-if="e.driveUrl" :href="e.driveUrl" class="btn sm drv" target="_blank" rel="noopener">Supporting file</a><template v-if="canEdit"><button class="btn sm" @click="toggle(e)">{{ e.status === 'done' ? 'Reopen' : 'Mark accomplished' }}</button><button class="btn sm" @click="emit('edit-task',e)">Edit</button><button class="btn sm danger" @click="remove(e)">Delete</button></template></div></div></div>
    <div v-if="travels.length" class="dpSec"><h4>On travel this day <span class="chip t">T</span></h4><div v-for="t in travels" :key="t.id" class="evItem t"><div class="t">{{ t.travellerName }}</div><div class="meta"><b>{{ t.destination }}</b><span>{{ fmtRange(t.from,t.to) }} · {{ travelDays(t) }} days</span><span v-if="t.docGenerated">TO generated</span></div><div class="rm">{{ t.purpose }}</div><div v-if="canEdit" class="acts no-print"><button class="btn sm" @click="editingTravel={...t};showTravel=true">Edit travel</button><button class="btn sm danger" @click="removeTravel(t)">Delete</button></div></div></div>
    <hr class="sep"><div class="flexrow no-print"><button class="btn sm" @click="showList">Show all entries of this date in a list</button><button class="btn sm" @click="printArea('calendar-day-report')">Printable day report</button></div>
    <TravelModal v-model="showTravel" :editing-item="editingTravel" />
  </div>
</template>
<script setup>
import {computed, ref} from 'vue';
import {state,saveUi,updateEntry,deleteEntry,deleteTravel} from '../../store/state';
import {canDo} from '../../utils/auth';
import {todayISO,addDays,fmtLong,fmtMed,fmtRange,relDay} from '../../utils/dateUtils';
import {entriesForDate,travelsOn,travelDays,isOverdue} from '../../utils/trackerMetrics';
import {STATUS} from '../../utils/constants';
import {printArea} from '../../utils/print';
import TravelModal from '../travel/TravelModal.vue';
const emit=defineEmits(['edit-task','add-task']);
const canEdit=computed(()=>canDo(state.auth.role,'edit'));
const info=computed(()=>entriesForDate(state.entries,state.selDate,state.calMode));
const travels=computed(()=>travelsOn(state.travels,state.selDate));
const showTravel=ref(false),editingTravel=ref(null);
const sections=computed(()=>[{title:'Accomplished on this date',entries:info.value.done,empty:'No accomplishments recorded on this date.'},{title:'Unfinished / not yet accomplished',entries:info.value.unfinished,empty:'No unfinished work targeted for this date.'},...(info.value.spanning.length ? [{title:'Ongoing work covering this date',entries:info.value.spanning,empty:''}] : [])]);
function move(n){state.selDate=addDays(state.selDate,n);saveUi();}
function toggle(e){updateEntry(e.id,{status:e.status==='done'?'open':'done',completedDate:e.status==='done'?'':state.selDate});}
function remove(e){if(confirm(`Move "${e.title}" to the trash bin?`)) deleteEntry(e.id);}
function removeTravel(t){if(confirm(`Delete travel to ${t.destination}?`))deleteTravel(t.id);}
function showList(){Object.assign(state.filters,{quick:'all',from:state.selDate,to:state.selDate,q:'',status:'',category:'',location:'',user:''});state.activeTab='tasks';saveUi();}
</script>
