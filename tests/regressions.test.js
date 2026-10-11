import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { scanPlaceholders, replacePlaceholders, buildTravelDocx, toInspect } from '../src/utils/docxEngine.js';
import { monthCells, reportRange, overlapsRange, travelDays, entriesForDate, summarize } from '../src/utils/trackerMetrics.js';
import { generateWeeklyPdf, weekScheduleData } from '../src/utils/pdfEngine.js';
import { formatDatePrepared, parseDateRangeToISO } from '../src/utils/dateUtils.js';
import { state, autoMigrateStorage } from '../src/store/state.js';

test('Word replacement preserves split runs, formatting, suffixes, and escaped values', () => {
  const xml='<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Before {</w:t></w:r><w:r><w:t>{ Pur</w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t>pose }} after {{Destination}}</w:t></w:r></w:p>';
  assert.deepEqual(scanPlaceholders(xml),{Purpose:1,Destination:1});
  const result=replacePlaceholders(xml,{Purpose:'A & B\nSecond line',Destination:'<Alcala>'});
  assert.match(result,/<w:b\/>/);assert.match(result,/<w:i\/>/);
  assert.equal((result.match(/<w:r>/g)||[]).length,3);
  assert.equal((result.match(/<\/w:r>/g)||[]).length,3);
  assert.match(result,/A &amp; B<\/w:t><w:br\/>/);
  assert.match(result,/ after &lt;Alcala&gt;/);
  assert.deepEqual(scanPlaceholders(result),{});
});
test('Word replacement handles multiple placeholders in one run and ignores unknown fields',()=>{
  const xml='<w:p><w:r><w:t>{{Purpose}} / {{Purpose}} / {{Unknown}}</w:t></w:r></w:p>';
  const out=replacePlaceholders(xml,{purpose:'Inspect'});
  assert.match(out,/Inspect \/ Inspect \/ \{\{Unknown\}\}/);
});
test('DOCX fills body, header and footer and keeps unrelated ZIP entries intact',async()=>{
  const zip=new JSZip();
  const paragraph=s=>`<w:p><w:r><w:t>${s}</w:t></w:r></w:p>`;
  zip.file('word/document.xml',paragraph('{{Purpose}}'));
  zip.file('word/header1.xml',paragraph('{{CreationDate}}'));
  zip.file('word/footer1.xml',paragraph('{{TravelDate}} {{Destination}}'));
  zip.file('word/media/logo.png',new Uint8Array([1,2,3]));
  const bytes=await zip.generateAsync({type:'uint8array'});
  const built=await buildTravelDocx(bytes,{CreationDate:'Saturday, 10 October 2026',Purpose:'Inspect',TravelDate:'October 10, 2026 (1 day)',Destination:'Alcala'});
  assert.equal(built.files,3);assert.equal(built.replaced.length,4);
  const out=await JSZip.loadAsync(built.bytes);
  assert.match(await out.file('word/header1.xml').async('string'),/Saturday/);
  assert.deepEqual(await out.file('word/media/logo.png').async('uint8array'),new Uint8Array([1,2,3]));
});
test('sample legacy Word template contains all four required fields',async()=>{
  const bytes=await readFile(new URL('../public/templates/Sample-Travel-Order-Template.docx',import.meta.url));
  const info=await toInspect(bytes);assert.deepEqual(info.missing,[]);
});
test('calendar honors Monday start and leap years',()=>{
  const cells=monthCells(2024,1,1);
  assert.equal(cells[3],'2024-02-01');assert.ok(cells.includes('2024-02-29'));assert.equal(cells.length%7,0);
});
test('calendar dates match the legacy modes; spanning work is separate from due work',()=>{
  const entry={status:'open',startDate:'2026-10-01',dueDate:'2026-10-10',completedDate:''};
  assert.equal(entriesForDate([entry],'2026-10-05').spanning.length,1);
  assert.equal(entriesForDate([entry],'2026-10-05').unfinished.length,0);
  const done={...entry,status:'done',completedDate:'2026-10-08'};
  assert.equal(entriesForDate([done],'2026-10-10','due').done.length,1);
  assert.equal(entriesForDate([done],'2026-10-08','auto').done.length,1);
});
test('report periods are to date, and cross-boundary travel overlaps the report',()=>{
  assert.deepEqual(reportRange('month','','','2026-10-10'),{from:'2026-10-01',to:'2026-10-10'});
  assert.deepEqual(reportRange('last-month','','','2026-01-10'),{from:'2025-12-01',to:'2025-12-31'});
  assert.deepEqual(reportRange('last-30','','','2026-10-10'),{from:'2026-09-11',to:'2026-10-10'});
  assert.ok(overlapsRange({from:'2026-09-01',to:'2026-11-01'},'2026-10-01','2026-10-10'));
  assert.equal(travelDays({from:'2026-10-10',to:'2026-10-12'}),3);
  assert.equal(summarize([{status:'done'},{status:'cancel'}]).rate,100);
});
test('multi-page weekly PDFs keep fonts and page object IDs distinct',()=>{
  const entries=Array.from({length:45},(_,i)=>({title:'Long scheduled task '+i+' requiring a report and field inspection',status:'pend',dueDate:'2026-10-05',category:'Engineering',location:'Alcala'}));
  const data=weekScheduleData('2026-10-05',entries,{});
  const pdf=new TextDecoder('latin1').decode(generateWeeklyPdf(data,{officeName:'ABE',tagline:'Office'},'Tester',{paper:'a4l'}));
  const count=Number(pdf.match(/\/Type \/Pages[\s\S]*?\/Count (\d+)/)[1]);assert.ok(count>2);
  assert.match(pdf,/5 0 obj\n<< \/Type \/Font/);
  assert.match(pdf,/9 0 obj\n<< \/Length/);
  const ids=[...pdf.matchAll(/^(\d+) 0 obj/gm)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
});

test('formatDatePrepared formats ISO dates as MMMM D, YYYY e.g. October 11, 2026', () => {
  assert.equal(formatDatePrepared('2026-10-11'), 'October 11, 2026');
  assert.equal(formatDatePrepared('October 11, 2026'), 'October 11, 2026');
  assert.equal(formatDatePrepared('46080.33333333333'), 'February 27, 2026');
  assert.match(formatDatePrepared(''), /^[A-Z][a-z]+\s+\d{1,2},\s*\d{4}$/);
});

test('parseDateRangeToISO correctly extracts from and to dates', () => {
  assert.deepEqual(parseDateRangeToISO('2026-10-11'), { from: '2026-10-11', to: '2026-10-11' });
  assert.deepEqual(parseDateRangeToISO('January 21, 2026'), { from: '2026-01-21', to: '2026-01-21' });
  assert.deepEqual(parseDateRangeToISO('January 28-30, 2026'), { from: '2026-01-28', to: '2026-01-30' });
  assert.deepEqual(parseDateRangeToISO('April 21, 2026 – April 24, 2026'), { from: '2026-04-21', to: '2026-04-24' });
});

test('Travel Order Template.docx fills {{Date_Prepared}} formatted as October 11, 2026', async () => {
  const bytes = await readFile(new URL('../public/templates/Travel Order Template.docx', import.meta.url));
  const built = await buildTravelDocx(bytes, {
    Date_Prepared: '2026-10-11',
    Destination: 'Tuguegarao City',
    Date_of_Travel: 'October 15, 2026',
    Purpose: 'Attend Regional Engineering Conference'
  });
  const out = await JSZip.loadAsync(built.bytes);
  const docXml = await out.file('word/document.xml').async('string');
  assert.ok(docXml.includes('October 11, 2026'));
  assert.ok(!docXml.includes('{{Date_Prepared}}'));
});

test('autoMigrateStorage preserves existing work entries while syncing TEV requests with purpose to calendar', () => {
  state.entries = [
    { id: 'custom-1', title: 'User Work Accomplishment 1', category: 'Engineering', status: 'open', dueDate: '2026-10-15' },
    { id: 'custom-2', title: 'User Work Accomplishment 2', category: 'Admin', status: 'done', dueDate: '2026-10-10', completedDate: '2026-10-09' }
  ];
  state.travels = [
    { id: 'old-trv-1', destination: 'Tuguegarao City', from: '2026-10-20', to: '2026-10-22', purpose: 'Old tab mission without requestId' }
  ];
  state.tevRequests = []; // Simulated existing storage with empty TEV

  autoMigrateStorage();

  // 1. Work entries are strictly preserved!
  assert.equal(state.entries.length, 2);
  assert.equal(state.entries[0].title, 'User Work Accomplishment 1');

  // 2. Old travel is migrated to TEV with linked requestId and purpose
  assert.ok(state.tevRequests.some(r => r.DESTINATION === 'Tuguegarao City' && r.PURPOSE === 'Old tab mission without requestId'));

  // 3. Calendar travels have purpose populated and valid dates
  const trv = state.travels.find(t => t.destination === 'Tuguegarao City');
  assert.ok(trv);
  assert.equal(trv.purpose, 'Old tab mission without requestId');
  assert.equal(trv.from, '2026-10-20');
  assert.equal(trv.to, '2026-10-22');
  assert.ok(trv.requestId);
});

