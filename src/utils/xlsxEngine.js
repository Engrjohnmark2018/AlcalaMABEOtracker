import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { buildTravelDocx } from './docxEngine.js';
import { formatTravelDate } from './dateUtils.js';
import { XLSX_MIME } from './storage.js';

function unique(arr) {
  const out = [];
  const seen = new Set();
  arr.forEach((x) => {
    const k = String(x || '').trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  });
  return out;
}

export async function loadDefaultTemplate(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load template from ${url}`);
  return await res.arrayBuffer();
}

/**
 * Generate Itinerary of Travel (IOT) XLSX
 */
export async function generateIOT(templateBuffer, payloads) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);

  const ws = wb.getWorksheet('Itinerary Of Travel') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet "Itinerary Of Travel" not found in template.');

  // 1. Unique purposes and dates
  const purposes = unique(payloads.map((p) => p.PURPOSE));
  const datesList = unique(payloads.map((p) => formatTravelDate(p.DATE_OF_TRAVEL)));

  ws.getCell('F16').value = datesList.join('; ');
  ws.getCell('F17').value = purposes.join('; ');

  // 2. Table entries start at Row 22
  const startRow = 22;
  const n = payloads.length;

  for (let i = 0; i < n; i++) {
    const rowNum = startRow + i;
    const row = ws.getRow(rowNum);
    const p = payloads[i];

    row.getCell(1).value = p.DATE_OF_TRAVEL;      // Col A
    row.getCell(2).value = p.DESTINATION;         // Col B
    row.getCell(6).value = p.TRANSPORTATION;      // Col F
    row.getCell(7).value = Number(p.FARE) || 0;   // Col G (Fare)
    row.getCell(8).value = Number(p.DIEM) || 0;   // Col H (Diem)
    
    // Total Amount formula for column J (10)
    row.getCell(10).value = { formula: `IF(G${rowNum}+H${rowNum}+I${rowNum}=0, "", G${rowNum}+H${rowNum}+I${rowNum})` };
    row.commit();
  }

  return await wb.xlsx.writeBuffer();
}

/**
 * Generate Certificate of Expenses (COE) XLSX
 */
export async function generateCOE(templateBuffer, payloads) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);

  const ws = wb.getWorksheet('COE') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet "COE" not found in template.');

  const startRow = 11;
  const n = payloads.length;

  for (let i = 0; i < n; i++) {
    const rowNum = startRow + i;
    const row = ws.getRow(rowNum);
    const p = payloads[i];

    row.getCell(1).value = p.DATE_OF_TRAVEL;      // Col A
    row.getCell(2).value = p.ROUTE;               // Col B
    row.getCell(3).value = p.DESTINATION;         // Col C
    row.getCell(4).value = Number(p.FARE) || 0;   // Col D (Amount)
    row.commit();
  }

  return await wb.xlsx.writeBuffer();
}

/**
 * Generate Certificate of Travel Completed (CTC) XLSX
 */
export async function generateCTC(templateBuffer, payloads) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);

  const ws = wb.getWorksheet('APPENDIX B') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet "APPENDIX B" not found in template.');

  const datesList = unique(payloads.map((p) => formatTravelDate(p.DATE_OF_TRAVEL)));
  ws.getCell('C21').value = datesList.join('; ');

  return await wb.xlsx.writeBuffer();
}

/**
 * Generate a complete ZIP containing TO, IOT, COE, CTC
 */
export async function generateBatchZip({
  toTemplateBuffer,
  iotTemplateBuffer,
  coeTemplateBuffer,
  ctcTemplateBuffer,
  payloads,
  batchId,
  includeTO = true
}) {
  const zip = new JSZip();

  // 1. Batch XLSX files
  if (iotTemplateBuffer) {
    const iotBytes = await generateIOT(iotTemplateBuffer, payloads);
    zip.file(`IOT - ${batchId}.xlsx`, iotBytes);
  }

  if (coeTemplateBuffer) {
    const coeBytes = await generateCOE(coeTemplateBuffer, payloads);
    zip.file(`COE - ${batchId}.xlsx`, coeBytes);
  }

  if (ctcTemplateBuffer) {
    const ctcBytes = await generateCTC(ctcTemplateBuffer, payloads);
    zip.file(`CTC - ${batchId}.xlsx`, ctcBytes);
  }

  // 2. Individual TO DOCX files
  if (includeTO && toTemplateBuffer) {
    const toFolder = zip.folder(`TO-${batchId}`);
    for (const p of payloads) {
      const values = {
        REQUEST_ID: p.REQUEST_ID || '',
        BATCH_ID: batchId || '',
        CREATION_DATE: p.CREATION_DATE || '',
        Date_Prepared: p.CREATION_DATE || '',
        CreationDate: p.CREATION_DATE || '',
        DESTINATION: p.DESTINATION || '',
        Destination: p.DESTINATION || '',
        ROUTE: p.ROUTE || '',
        TRANSPORTATION: p.TRANSPORTATION || '',
        FARE: String(p.FARE || '0'),
        DATE_OF_TRAVEL: p.DATE_OF_TRAVEL || '',
        Date_of_Travel: p.DATE_OF_TRAVEL || '',
        TravelDate: p.DATE_OF_TRAVEL || '',
        PURPOSE: p.PURPOSE || '',
        Purpose: p.PURPOSE || '',
        DIEM: String(p.DIEM || '0')
      };

      const docxResult = await buildTravelDocx(toTemplateBuffer, values);
      const safeDest = (p.DESTINATION || 'Destination').replace(/[\\/:*?"<>|]/g, '-').slice(0, 30);
      const safeDate = (p.DATE_OF_TRAVEL || 'Date').replace(/[\\/:*?"<>|]/g, '-').slice(0, 30);
      const filename = `TO - ${safeDest} - ${safeDate} - ${p.REQUEST_ID || 'REQ'}.docx`;
      toFolder.file(filename, docxResult.bytes);
    }
  }

  return await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

/**
 * Export requests list to an Excel workbook matching TEV Automation - Template.xlsx
 */
export async function exportRequestsToXlsx(requests) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Requests');

  // Headers
  const headers = [
    'GENERATE', 'REQUEST_ID', 'CREATION_DATE', 'DESTINATION', 'ROUTE',
    'TRANSPORTATION', 'FARE', 'DATE_OF_TRAVEL', 'PURPOSE', 'DIEM',
    'BATCH_ID', 'OUTPUT_FOLDER_LINK', 'TO_FILE_LINK', 'IOT_FILE_LINK',
    'COE_FILE_LINK', 'CTC_FILE_LINK'
  ];
  ws.addRow(headers);

  // Rows
  requests.forEach((r) => {
    ws.addRow([
      r.GENERATE ? 1 : 0,
      r.REQUEST_ID || '',
      r.CREATION_DATE || '',
      r.DESTINATION || '',
      r.ROUTE || '',
      r.TRANSPORTATION || '',
      Number(r.FARE) || 0,
      r.DATE_OF_TRAVEL || '',
      r.PURPOSE || '',
      Number(r.DIEM) || 0,
      r.BATCH_ID || '',
      r.OUTPUT_FOLDER_LINK || '',
      r.TO_FILE_LINK || '',
      r.IOT_FILE_LINK || '',
      r.COE_FILE_LINK || '',
      r.CTC_FILE_LINK || ''
    ]);
  });

  return await wb.xlsx.writeBuffer();
}

/**
 * Parse uploaded Excel workbook to extract travel requests
 */
export async function importRequestsFromXlsx(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet('Requests') || wb.worksheets[0];
  if (!ws) throw new Error('No valid worksheet found in Excel file.');

  const rows = [];
  const headerMap = {};

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        const val = String(cell.value || '').trim().toUpperCase();
        headerMap[val] = colNumber;
      });
    } else {
      const getVal = (key) => {
        const col = headerMap[key];
        if (!col) return '';
        const cell = row.getCell(col);
        return cell.value != null ? String(cell.value) : '';
      };

      const reqId = getVal('REQUEST_ID') || getVal('REQ_ID');
      const dest = getVal('DESTINATION');
      if (reqId || dest) {
        rows.push({
          GENERATE: getVal('GENERATE') === '1' || getVal('GENERATE').toLowerCase() === 'true',
          REQUEST_ID: reqId,
          CREATION_DATE: getVal('CREATION_DATE'),
          DESTINATION: dest,
          ROUTE: getVal('ROUTE'),
          TRANSPORTATION: getVal('TRANSPORTATION'),
          FARE: Number(getVal('FARE')) || 0,
          DATE_OF_TRAVEL: getVal('DATE_OF_TRAVEL'),
          PURPOSE: getVal('PURPOSE'),
          DIEM: Number(getVal('DIEM')) || 0,
          BATCH_ID: getVal('BATCH_ID')
        });
      }
    }
  });

  return rows;
}
