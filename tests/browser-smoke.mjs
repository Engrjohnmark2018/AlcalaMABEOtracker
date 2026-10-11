// Optional UI check: requires Puppeteer and a running Vite server.
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import {mkdir,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
const output=path.resolve(process.env.TEMP||'.','abe-vue-verification');
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({headless:true});
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});
await page.setViewport({width:1440,height:1000});
const client=await page.createCDPSession();
await client.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:output});
async function clickText(text,exact=false){const handle=await page.evaluateHandle((text,exact)=>[...document.querySelectorAll('button')].find(e=>e.offsetParent!==null&&(exact?e.textContent.trim()===text:e.textContent.includes(text))),text,exact);const el=handle.asElement();assert.ok(el,`Button missing: ${text}`);await el.click();await handle.dispose();}
async function tab(label){const handle=await page.evaluateHandle(label=>[...document.querySelectorAll('.tab')].find(e=>e.textContent.includes(label)),label);await handle.asElement().click();await handle.dispose();}
async function fill(selector,value){await page.$eval(selector,(el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);}
try{
  await page.goto(process.env.APP_URL||'http://localhost:5173/',{waitUntil:'networkidle0'});
  await page.type('#lockPass','@EdiMAO2024');await page.click('.lockBtn');await page.waitForSelector('.lock',{hidden:true});
  assert.ok(await page.$eval('main',e=>e.textContent.includes('Accomplishment trend')));
  await page.screenshot({path:path.join(output,'dashboard.png'),fullPage:true});
  const labels=await page.$$eval('.tab',els=>els.map(e=>e.textContent));
  assert.ok(labels.some(t=>t.includes('Travel & Expenses')));
  assert.ok(!labels.some(t=>t.trim()==='Travel Order'));
  assert.equal(await page.$('.workspace-tabs'),null);
  await tab('Travel & Expenses');
  await page.screenshot({path:path.join(output,'travel-expenses.png'),fullPage:true});
  // Seed deterministic dates and a spanning travel through the app store in this
  // isolated browser context. No existing workstation records are touched.
  await page.evaluate(async()=>{
    const moduleUrl=performance.getEntriesByType('resource').find(e=>e.name.includes('/src/store/state.js'))?.name || '/src/store/state.js';
    const {state,saveState,saveUi}=await import(moduleUrl);
    state.entries=[
      {id:'done',title:'Completed inspection',category:'Engineering',status:'done',startDate:'2026-10-01',dueDate:'2026-10-10',completedDate:'2026-10-08',location:'Alcala',personnel:'Ana, Ben',beneficiaries:10,remarks:'Verified',createdBy:'master',createdByName:'Administrator',completedBy:'master',completedByName:'Administrator'},
      {id:'open',title:'Pending field report',category:'Engineering',status:'open',startDate:'2026-10-01',dueDate:'2026-10-10',completedDate:'',location:'Alcala',personnel:'Ana',beneficiaries:5,remarks:'In progress',createdBy:'master',createdByName:'Administrator'},
      {id:'cancel',title:'Deferred activity',category:'Admin',status:'cancel',dueDate:'2026-10-09',personnel:'Ben',beneficiaries:0,createdBy:'master',createdByName:'Administrator'}];
    state.travels.push({id:'spanning',travellerName:'Spanning Traveller',destination:'Regional Office',from:'2026-09-01',to:'2026-11-01',purpose:'Multi-month mission',orderDate:'2026-09-01'});
    state.calYear=2026;state.calMonth=9;state.selDate='2026-10-10';state.settings.weekStart=1;
    saveState();saveUi();
  });
  await tab('Calendar');await page.waitForSelector('.calGrid');
  assert.equal(await page.$eval('.calGrid th',e=>e.textContent),'Mon');
  await fill('select[aria-label="Calendar date mode"]','due');
  await page.waitForFunction(()=>document.querySelector('#calendar-day-report')?.textContent.includes('Completed inspection'));
  await clickText('Year',true);await page.waitForSelector('.mini');assert.equal((await page.$$('.mini')).length,12);
  await page.screenshot({path:path.join(output,'calendar-year.png'),fullPage:true});
  await clickText('October',true);await page.waitForSelector('.calGrid');
  await page.screenshot({path:path.join(output,'calendar-month.png'),fullPage:true});
  await tab('Reports');await fill('#report-period','custom');await fill('#report-from','2026-10-01');await fill('#report-to','2026-10-10');
  await page.waitForFunction(()=>document.querySelector('#reportPrintArea')?.textContent.includes('Spanning Traveller'));
  assert.ok(await page.$eval('#reportPrintArea',e=>e.textContent.includes('Deferred activity')));
  await fill('#report-group','personnel');
  await page.waitForFunction(()=>document.querySelector('#reportPrintArea .tableWrap tbody tr')?.cells[0].textContent.includes('Ana'));
  assert.equal(await page.$eval('#reportPrintArea .tableWrap tbody tr',e=>e.cells[1].textContent),'2');
  await page.screenshot({path:path.join(output,'reports.png'),fullPage:true});
  await clickText('CSV',true);
  await tab('Weekly Schedule');await clickText('Export PNG');await clickText('Export PDF');
  await page.waitForFunction(()=>document.querySelector('.toast')?.textContent.includes('PDF downloaded'));
  await tab('Travel & Expenses');await page.waitForSelector('button[title="Templates & Settings"]');
  await page.click('button[title="Templates & Settings"]');await page.waitForSelector('.modalBg');assert.ok(await page.$eval('.modalBg',e=>e.textContent.includes('{{Destination}}')));await clickText('Close',true);
  await tab('Insights');await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('Year-over-year accomplishments'));assert.ok(await page.$eval('main',e=>e.textContent.includes('Year-over-year accomplishments')));
  await tab('PPA Overview');await tab('Settings');
  await page.reload({waitUntil:'networkidle0'});await tab('Calendar');assert.equal(await page.$eval('.calNav h2',e=>e.textContent),'October 2026');
  await page.setViewport({width:390,height:844});await tab('Travel & Expenses');await page.waitForSelector('.topActions');
  await page.screenshot({path:path.join(output,'travel-mobile.png'),fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile page overflows');
  assert.deepEqual(errors,[]);
  // Give Chromium downloads time to finish before reading the files.
  await new Promise(resolve=>setTimeout(resolve,800));
  const files=await readdir(output);
  assert.ok(files.some(f=>f.startsWith('Weekly-Schedule')&&f.endsWith('.png')));
  assert.ok(files.some(f=>f.startsWith('Weekly-Schedule')&&f.endsWith('.pdf')));
  assert.ok(files.some(f=>f.startsWith('ABE-Report')&&f.endsWith('.csv')));
  console.log(JSON.stringify({passed:true,errors,output,files},null,2));
}catch(e){console.error('Page at failure:',await page.$eval('main',e=>e.innerText.slice(0,1500)));await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});throw e;}finally{await browser.close();}
