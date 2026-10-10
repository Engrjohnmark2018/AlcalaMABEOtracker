/*****************************************************************************************
 * TRAVEL DOCS AUTOMATION (FINAL - WITH YOUR TEMPLATE MAPPINGS + IDS)
 *
 * FEATURES
 * - Sidebar-only data entry (Add/Edit/Delete)
 * - Requests sheet locked from manual editing
 * - Fare matrix lookup: Destination → Route/Transportation/Fare auto-fill (no manual typing)
 * - Batch generation:
 *    - TO: DOCX per checked request
 *    - IOT: XLSX per batch (table rows) + consolidated Purpose in F17 (semicolon)
 *    - COE: XLSX per batch (table rows) Amount = Fare + Diem
 *    - CTC: XLSX per batch (dates semicolon in B22) TO Nos left blank
 *****************************************************************************************/

/***********************
 * CONFIG (ALL IDS FILLED)
 ***********************/
var CONFIG = {
  REQUESTS_SHEET_NAME: "Requests",
  HEADER_ROW: 1,

  // Output folder (Drive) - Configured via Menu > Setup
  OUTPUT_ROOT_FOLDER_ID: "",

  // Templates (Google native files) - Configured via Menu > Setup
  TO_TEMPLATE_DOC_ID: "",
  IOT_TEMPLATE_SHEET_ID: "",
  COE_TEMPLATE_SHEET_ID: "",
  CTC_TEMPLATE_SHEET_ID: "",

  // Fare Matrix (Google Sheet) - Configured via Menu > Setup
  FARE_MATRIX_SHEET_ID: "",
  FARE_MATRIX_TAB_NAME: "Matrix",

  // IOT (batch)
  IOT: {
    tabName: "Itinerary Of Travel",
    datesCellA1: "F16", // Cell to replace "Date of Travel" placeholder
    purposeCellA1: "F17", // Existing purpose cell
    tableStartRow: 22, // Start exactly on the placeholder row
    colDateOfTravel: 1, // A
    colDestination: 2, // B
    colTransportation: 6, // F
    colFare: 7, // G
    colDiem: 8, // H
  },

  // COE (batch)
  COE: {
    tabName: "COE",
    tableStartRow: 11, // Changed to 11 to overwrite the placeholders
    colDateOfTravel: 1, // A
    colRoute: 2, // B
    colDestination: 3, // C
    colAmount: 4, // D
  },

  // CTC (batch)
  CTC: {
    tabName: "APPENDIX B",
    datesCellA1: "C21", // semicolon list of dates written here
    // TO No/s left blank by design
  },

  // Optional admins who can still edit sheet manually (owner can always edit)
  ADMIN_EDITORS: [
    // "admin@domain.com"
  ],
};

// Attempt to load overrides from script properties
try {
  loadConfig_();
} catch (e) {
  console.warn("Config load failed (auth mode?): " + e);
}

/***********************
 * HEADERS in Requests sheet
 ***********************/
const H = {
  GENERATE: "GENERATE",
  REQUEST_ID: "REQUEST_ID",

  CREATION_DATE: "CREATION_DATE",
  DESTINATION: "DESTINATION",
  ROUTE: "ROUTE",
  TRANSPORTATION: "TRANSPORTATION",
  FARE: "FARE",
  DATE_OF_TRAVEL: "DATE_OF_TRAVEL",
  PURPOSE: "PURPOSE",
  DIEM: "DIEM",

  BATCH_ID: "BATCH_ID",
  OUTPUT_FOLDER_LINK: "OUTPUT_FOLDER_LINK",
  TO_FILE_LINK: "TO_FILE_LINK",
  IOT_FILE_LINK: "IOT_FILE_LINK",
  COE_FILE_LINK: "COE_FILE_LINK",
  CTC_FILE_LINK: "CTC_FILE_LINK",
};

/***********************
 * MENU
 ***********************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Travel Docs")
    .addItem("Open Data Entry Panel", "openDataEntrySidebar")
    .addSeparator()
    .addItem("Generate TO only", "generateTO_Only")
    .addItem("Generate Batch (IOT + COE + CTC)", "generateBatch_NoTO")
    .addSeparator()
    .addItem("Setup: Configure Folders", "promptForFolderConfig")
    .addItem("Setup: Create/Repair Headers", "setupRequestsSheet")
    .addItem("Lock Requests Sheet (Admin)", "lockRequestsSheet")
    .addToUi();
}

/***********************
 * TRIGGERS
 ***********************/
function onEdit(e) {
  if (!e) return;
  const range = e.range;
  const sh = range.getSheet();
  
  // 1. SELECT/DESELECT ALL logic in "Requests" sheet, cell A1
  if (sh.getName() === CONFIG.REQUESTS_SHEET_NAME && range.getRow() === 1 && range.getColumn() === 1) {
    const val = range.getValue();
    if (val === true || val === false) {
      const lastRow = sh.getLastRow();
      if (lastRow > 1) {
        sh.getRange(2, 1, lastRow - 1, 1).setValue(val);
      }
    }
  }
}

/***********************
 * CONFIG HELPERS
 ***********************/
function loadConfig_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  if (props.OUTPUT_ROOT_FOLDER_ID) CONFIG.OUTPUT_ROOT_FOLDER_ID = props.OUTPUT_ROOT_FOLDER_ID;
  if (props.TO_TEMPLATE_DOC_ID) CONFIG.TO_TEMPLATE_DOC_ID = props.TO_TEMPLATE_DOC_ID;
  if (props.IOT_TEMPLATE_SHEET_ID) CONFIG.IOT_TEMPLATE_SHEET_ID = props.IOT_TEMPLATE_SHEET_ID;
  if (props.COE_TEMPLATE_SHEET_ID) CONFIG.COE_TEMPLATE_SHEET_ID = props.COE_TEMPLATE_SHEET_ID;
  if (props.CTC_TEMPLATE_SHEET_ID) CONFIG.CTC_TEMPLATE_SHEET_ID = props.CTC_TEMPLATE_SHEET_ID;
  if (props.FARE_MATRIX_SHEET_ID) CONFIG.FARE_MATRIX_SHEET_ID = props.FARE_MATRIX_SHEET_ID;
}

function promptForFolderConfig() {
  const ui = SpreadsheetApp.getUi();

  // 1. Template Folder
  const tmplResp = ui.prompt(
    "Configuration Step 1/2", 
    "Enter the TEMPLATE Folder ID containing:\n" +
    "- Travel Order Template\n- Itenary of Travel\n- Fare matrix\n- Certificate of Travel Completed\n- Cetificate of Expenses",
    ui.ButtonSet.OK_CANCEL
  );
  if (tmplResp.getSelectedButton() !== ui.Button.OK) return;
  const tmplId = tmplResp.getResponseText().trim();
  if (!tmplId) { ui.alert("Template Folder ID cannot be empty."); return; }

  // 2. Output Folder
  const outResp = ui.prompt(
    "Configuration Step 2/2", 
    "Enter the OUTPUT Folder ID:",
    ui.ButtonSet.OK_CANCEL
  );
  if (outResp.getSelectedButton() !== ui.Button.OK) return;
  const outId = outResp.getResponseText().trim();
  if (!outId) { ui.alert("Output Folder ID cannot be empty."); return; }

  // 3. Scan & Save
  scanAndSaveConfig(tmplId, outId);
}

function scanAndSaveConfig(tmplId, outId) {
  const ui = SpreadsheetApp.getUi();
  try {
    const tmplFolder = DriveApp.getFolderById(tmplId);
    // verify output folder exists
    DriveApp.getFolderById(outId);

    const files = tmplFolder.getFiles();
    const props = {};
    const log = [];
    
    // Always save output folder
    props["OUTPUT_ROOT_FOLDER_ID"] = outId;

// Scan for templates (Keys = Filenames in Drive, Values = Script Property Name)
    // We include multiple variations to handle typos or missing extensions
    const map = {
      // Travel Order
      "Travel Order Template.docx": "TO_TEMPLATE_DOC_ID",
      "Travel Order Template": "TO_TEMPLATE_DOC_ID",

      // Itinerary of Travel
      "Itenerary of Travel.xlsx": "IOT_TEMPLATE_SHEET_ID",
      "Itenerary of Travel": "IOT_TEMPLATE_SHEET_ID",

      // Fare Matrix
      "Fare matrix.xlsx": "FARE_MATRIX_SHEET_ID",
      "Fare matrix": "FARE_MATRIX_SHEET_ID",

      // Certificate of Travel Completed
      "Certificate of Travel Completed.xlsx": "CTC_TEMPLATE_SHEET_ID",
      "Certificate of Travel Completed": "CTC_TEMPLATE_SHEET_ID",

      // Certificate of Expenses
      "Certificate of Expenses.xlsx": "COE_TEMPLATE_SHEET_ID",
      "Certificate of Expenses": "COE_TEMPLATE_SHEET_ID"
    };

    // Verify Drive API is enabled
    try {
      const test = Drive.Files; 
    } catch (e) {
      ui.alert("⚠️ IMPORTANT Setup Required:\n\nTo automatically convert Microsoft files, you must enable the 'Drive API' service.\n\n1. Look at the left sidebar (Services +)\n2. Click +\n3. Select 'Drive API' > Add\n4. Run this 'Configure Folders' menu again.");
      return;
    }

    const convertedLog = [];
    const invalidFiles = [];

    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName().trim();
      const mime = f.getMimeType();
      
      if (map[name]) {
        let finalId = f.getId();
        let finalName = name;

        // Validation: Is it Office?
        const isExcel = (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        const isWord = (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        
        const isGoogleSheet = (mime === MimeType.GOOGLE_SHEETS);
        const isGoogleDoc = (mime === MimeType.GOOGLE_DOCS);

        if (isExcel || isWord) {
          // Attempt verify if we already converted it (to avoid duplicate conversions)
          // We look for a file with the SAME NAME (minus extension) and GOOGLE MIME type in the same folder
          const baseName = name.replace(/\.(xlsx|docx)$/i, "").trim();
          const targetMime = isExcel ? MimeType.GOOGLE_SHEETS : MimeType.GOOGLE_DOCS;
          
          const existing = tmplFolder.getFilesByName(baseName);
          let foundConverted = null;
          while (existing.hasNext()) {
            const cand = existing.next();
            if (cand.getMimeType() === targetMime) {
              foundConverted = cand;
              break;
            }
          }

          if (foundConverted) {
            finalId = foundConverted.getId();
            log.push(`Found (Already Converted): ${baseName}`);
            
            // Clean up original Office file if it still exists alongside the converted one
            try { f.setTrashed(true); } catch(e) {} 
            
          } else {
            // CONVERT NOW
            try {
              const conversion = Drive.Files.copy({
                title: baseName,
                parents: [{id: tmplId}],
                mimeType: targetMime
              }, f.getId());
              
              finalId = conversion.id;
              convertedLog.push(`${name} ➔ ${baseName}`);
              log.push(`Converted & Linked: ${baseName}`);
              
              // Remove the original Office file to prevent duplicates
              f.setTrashed(true);
              
            } catch (e) {
              invalidFiles.push(`${name} (Conversion Failed: ${e.message})`);
              continue; // Skip setting property
            }
          }
        } 
        else if (isGoogleSheet || isGoogleDoc) {
          log.push(`Found: ${name}`);
        } 
        else {
          invalidFiles.push(`${name} (Unknown Type: ${mime})`);
          continue;
        }

        // Map property to the (possibly new) ID
        props[map[name]] = finalId;
      }
    }

    // Save found properties
    PropertiesService.getScriptProperties().setProperties(props);
    
    // Auto-load headers config so it's active immediately
    loadConfig_();

    // Verify what is still missing
    const requiredKeys = {
      "TO_TEMPLATE_DOC_ID": "Travel Order Template",
      "IOT_TEMPLATE_SHEET_ID": "Itinerary of Travel",
      "FARE_MATRIX_SHEET_ID": "Fare Matrix",
      "CTC_TEMPLATE_SHEET_ID": "Certificate of Travel Completed",
      "COE_TEMPLATE_SHEET_ID": "Certificate of Expenses"
    };

    // Check which IDs were NOT set in 'props'
    const missingNames = Object.keys(requiredKeys)
      .filter(key => !props[key])
      .map(key => requiredKeys[key]);

    let msg = "Configuration Saved!\n\nOutput Folder: OK\n";
    if (convertedLog.length > 0) msg += "✅ Auto-Converted:\n- " + convertedLog.join("\n- ") + "\n\n";
    if (log.length > 0) msg += "Templates Linked:\n- " + log.join("\n- ");
    
    if (invalidFiles.length > 0) {
      msg += "\n\n❌ ERRORS:\n- " + invalidFiles.join("\n- ");
    }

    if (missingNames.length > 0) {
      msg += "\n\n⚠️ MISSING TEMPLATES for:\n- " + missingNames.join("\n- ");
    } else {
      if (invalidFiles.length === 0) msg += "\n\n✅ All templates valid and found.";
    }
    
    ui.alert(msg);

  } catch (e) {
    ui.alert("Configuration Error: " + e.message);
  }
}

function openDataEntrySidebar() {
  const html =
    HtmlService.createHtmlOutputFromFile("DataEntry").setTitle(
      "Travel Data Entry",
    );
  SpreadsheetApp.getUi().showSidebar(html);
}

/***********************
 * SETUP
 ***********************/
function setupRequestsSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.REQUESTS_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(CONFIG.REQUESTS_SHEET_NAME);

  const headers = [
    H.GENERATE,
    H.REQUEST_ID,
    H.CREATION_DATE,
    H.DESTINATION,
    H.ROUTE,
    H.TRANSPORTATION,
    H.FARE,
    H.DATE_OF_TRAVEL,
    H.PURPOSE,
    H.DIEM,
    H.BATCH_ID,
    H.OUTPUT_FOLDER_LINK,
    H.TO_FILE_LINK,
    H.IOT_FILE_LINK,
    H.COE_FILE_LINK,
    H.CTC_FILE_LINK,
  ];

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Master checkbox in A1
  sh.getRange(1, 1).insertCheckboxes();
  
  // Checkboxes for all rows below
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), 1).insertCheckboxes();

  SpreadsheetApp.getUi().alert(
    "Requests headers created/repaired.\nNext: Lock Requests Sheet.",
  );
}

function lockRequestsSheet() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CONFIG.REQUESTS_SHEET_NAME);
  if (!sh) throw new Error("Requests sheet not found.");

  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach((p) =>
    p.remove(),
  );

  const p = sh.protect().setDescription("Locked: edit only via sidebar/script");
  p.setWarningOnly(false);

  const editors = p.getEditors();
  if (editors.length) p.removeEditors(editors);
  if (CONFIG.ADMIN_EDITORS.length) p.addEditors(CONFIG.ADMIN_EDITORS);

  if (p.canDomainEdit()) p.setDomainEdit(false);

  SpreadsheetApp.getUi().alert(
    "Requests sheet locked. Encoders must use the sidebar.",
  );
}

/***********************
 * FARE MATRIX API (for sidebar)
 ***********************/
function getDestinations() {
  const rows = readFareMatrix_();
  const set = new Set();
  rows.forEach((r) => set.add(String(r.DESTINATION || "").trim()));
  return Array.from(set).filter(Boolean).sort();
}

function lookupFareByDestination(destination) {
  destination = String(destination || "").trim();
  if (!destination) return null;

  const rows = readFareMatrix_();
  const match = rows.find((r) => String(r.DESTINATION).trim() === destination);
  if (!match) return null;

  return {
    DESTINATION: match.DESTINATION,
    ROUTE: match.ROUTE,
    TRANSPORTATION: match.TRANSPORTATION,
    FARE: match.FARE,
  };
}

function readFareMatrix_() {
  if (!CONFIG.FARE_MATRIX_SHEET_ID) return [];
  
  let ss;
  try {
    ss = SpreadsheetApp.openById(CONFIG.FARE_MATRIX_SHEET_ID);
  } catch (e) {
    console.error("Failed to open Fare Matrix: " + e.message);
    throw new Error("Unable to open Fare Matrix. Please ensure the file is a GOOGLE SHEET, not an Excel file. (ID: " + CONFIG.FARE_MATRIX_SHEET_ID + ")");
  }

  const sh = ss.getSheetByName(CONFIG.FARE_MATRIX_TAB_NAME);
  if (!sh)
    throw new Error(
      `Fare matrix tab not found: ${CONFIG.FARE_MATRIX_TAB_NAME}`,
    );

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map((x) =>
    String(x || "")
      .trim()
      .toLowerCase(),
  );
  const idx = {};
  headers.forEach((h, i) => (idx[h] = i));

  const required = ["destination", "route", "transportation", "fare"];
  required.forEach((k) => {
    if (!(k in idx)) throw new Error(`Fare matrix missing column header: ${k}`);
  });

  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const destination = r[idx["destination"]];
    if (!destination) continue;

    out.push({
      DESTINATION: String(destination).trim(),
      ROUTE: String(r[idx["route"]] || "").trim(),
      TRANSPORTATION: String(r[idx["transportation"]] || "").trim(),
      FARE: num_(r[idx["fare"]]),
    });
  }
  return out;
}

/***********************
 * SIDEBAR CRUD
 ***********************/
function listRequests(limit = 200) {
  const { idx, rows } = readRequests_();

  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    const requestId = String(r[idx[H.REQUEST_ID]] || "").trim();
    const destination = String(r[idx[H.DESTINATION]] || "").trim();
    const dateOfTravel = String(r[idx[H.DATE_OF_TRAVEL]] || "").trim();
    const purpose = String(r[idx[H.PURPOSE]] || "").trim();

    // ✅ Skip empty/irrelevant rows
    if (!requestId) continue;
    if (!destination && !dateOfTravel && !purpose) continue;

    out.push({
      REQUEST_ID: requestId,
      GENERATE: r[idx[H.GENERATE]] === true,
      DESTINATION: destination,
      DATE_OF_TRAVEL: dateOfTravel,
      PRETTY_DATE: formatTravelDate_(dateOfTravel),
      PURPOSE: purpose,
    });

    if (out.length >= limit) break;
  }

  // newest first
  return out.reverse();
}

function getRequestById(requestId) {
  const found = findRowByRequestId_(requestId);
  if (!found) throw new Error("Request not found: " + requestId);

  const idx = indexMap_(found.headers);
  const row = found.row;

  return {
    REQUEST_ID: String(row[idx[H.REQUEST_ID]] || ""),
    GENERATE: row[idx[H.GENERATE]] === true,
    CREATION_DATE: toIsoDate_(row[idx[H.CREATION_DATE]]),
    DESTINATION: String(row[idx[H.DESTINATION]] || ""),
    ROUTE: String(row[idx[H.ROUTE]] || ""),
    TRANSPORTATION: String(row[idx[H.TRANSPORTATION]] || ""),
    FARE: String(row[idx[H.FARE]] || "0"),
    DATE_OF_TRAVEL: String(row[idx[H.DATE_OF_TRAVEL]] || ""),
    PURPOSE: String(row[idx[H.PURPOSE]] || ""),
    DIEM: String(row[idx[H.DIEM]] || "0"),
  };
}

function addRequest(payload) {
  validatePayload_(payload);

  const { sh, headers, idx } = readRequests_({ includeRows: false });

  const requestId = makeRequestId_();
  const creationDate = payload.CREATION_DATE
    ? new Date(payload.CREATION_DATE)
    : new Date();

  const fareObj = lookupFareByDestination(payload.DESTINATION);
  if (!fareObj)
    throw new Error(
      "Destination not found in fare matrix: " + payload.DESTINATION,
    );

  // ✅ Insert new row right under headers
  sh.insertRowBefore(2);

  const row = new Array(headers.length).fill("");
  row[idx[H.GENERATE]] = payload.GENERATE === true;
  row[idx[H.REQUEST_ID]] = requestId;

  row[idx[H.CREATION_DATE]] = creationDate;
  row[idx[H.DESTINATION]] = fareObj.DESTINATION;
  row[idx[H.ROUTE]] = fareObj.ROUTE;
  row[idx[H.TRANSPORTATION]] = fareObj.TRANSPORTATION;
  row[idx[H.FARE]] = fareObj.FARE;

  row[idx[H.DATE_OF_TRAVEL]] = formatTravelDate_(payload.DATE_OF_TRAVEL);
  row[idx[H.PURPOSE]] = payload.PURPOSE || "";
  row[idx[H.DIEM]] = num_(payload.DIEM);

  sh.getRange(2, 1, 1, headers.length).setValues([row]);

  // Force DATE_OF_TRAVEL cell to plain text so Sheets won't auto-convert
  sh.getRange(2, idx[H.DATE_OF_TRAVEL] + 1).setNumberFormat('@');

  // ✅ Keep checkbox in GENERATE column
  sh.getRange(2, 1).insertCheckboxes();
  sortRequestsSheet_(sh, idx);
  return { ok: true, REQUEST_ID: requestId, ROW_NUMBER: 2 };
}

function updateRequest(requestId, payload) {
  validatePayload_(payload);

  const found = findRowByRequestId_(requestId);
  if (!found) throw new Error("Request not found: " + requestId);

  const { sh, rowNumber, headers } = found;
  const idx = indexMap_(headers);

  const fareObj = lookupFareByDestination(payload.DESTINATION);
  if (!fareObj)
    throw new Error(
      "Destination not found in fare matrix: " + payload.DESTINATION,
    );

  const range = sh.getRange(rowNumber, 1, 1, headers.length);
  const row = range.getValues()[0];

  row[idx[H.GENERATE]] = payload.GENERATE === true;
  row[idx[H.CREATION_DATE]] = payload.CREATION_DATE
    ? new Date(payload.CREATION_DATE)
    : row[idx[H.CREATION_DATE]];

  row[idx[H.DESTINATION]] = fareObj.DESTINATION;
  row[idx[H.ROUTE]] = fareObj.ROUTE;
  row[idx[H.TRANSPORTATION]] = fareObj.TRANSPORTATION;
  row[idx[H.FARE]] = fareObj.FARE;

  row[idx[H.DATE_OF_TRAVEL]] = formatTravelDate_(payload.DATE_OF_TRAVEL);
  row[idx[H.PURPOSE]] = payload.PURPOSE || "";
  row[idx[H.DIEM]] = num_(payload.DIEM);

  // Force DATE_OF_TRAVEL cell to plain text so Sheets won't auto-convert
  sh.getRange(rowNumber, idx[H.DATE_OF_TRAVEL] + 1).setNumberFormat('@');

  range.setValues([row]);
  sortRequestsSheet_(sh, idx);
  return { ok: true };
}

function deleteRequest(requestId) {
  const found = findRowByRequestId_(requestId);
  if (!found) throw new Error("Request not found: " + requestId);
  
  const formulaRow = found.sh.getRange(found.rowNumber, 1, 1, found.headers.length).getFormulas()[0];
  
  // 🗑️ Trash linked Drive files/folders (passing both values and formulas)
  trashLinkedDriveFiles_(found.row, formulaRow, indexMap_(found.headers));
  
  found.sh.deleteRow(found.rowNumber);
  return { ok: true };
}

/***********************
 * BATCH GENERATION
 ***********************/
function generateBatch_NoTO() {
  generateBatch_({ genTO: false });
}

function generateBatch_WithTO() {
  generateBatch_({ genTO: true });
}

function generateBatch_({ genTO }) {
  const { sh, headers, idx, rows } = readRequests_();

  const selected = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][idx[H.GENERATE]] === true) {
      selected.push({ rowNumber: i + 2, row: rows[i] });
    }
  }

  if (!selected.length) {
    SpreadsheetApp.getUi().alert(
      "No rows selected. Tick GENERATE checkboxes first.",
    );
    return;
  }

  const batchId = makeBatchId_();
  const rootFolder = DriveApp.getFolderById(CONFIG.OUTPUT_ROOT_FOLDER_ID);
  const batchFolder = rootFolder.createFolder(batchId);

  const payloads = selected.map((s) => payloadFromRow_(s.row, idx, batchId));

  // TO per row (DOCX)
  if (genTO) {
    payloads.forEach((p, i) => {
      const toDocx = {
        templateDocId: CONFIG.TO_TEMPLATE_DOC_ID,
        folder: batchFolder,
        outBaseName: `TO - ${p.DESTINATION} - ${p.DATE_OF_TRAVEL} - ${p.REQUEST_ID}`,
        payload: p,
      };

      writeBack_(sh, selected[i].rowNumber, headers, {
        [H.TO_FILE_LINK]: toDocx.url,
        [H.BATCH_ID]: batchId,
      });
    });
  } else {
    selected.forEach((s) =>
      writeBack_(sh, s.rowNumber, headers, { [H.BATCH_ID]: batchId }),
    );
  }

  // Batch files
  const iot = generateIOT_BatchXlsx_({
    templateSheetId: CONFIG.IOT_TEMPLATE_SHEET_ID,
    folder: batchFolder,
    outBaseName: `IOT - ${batchId}`,
    payloads,
  });

  const coe = generateCOE_BatchXlsx_({
    templateSheetId: CONFIG.COE_TEMPLATE_SHEET_ID,
    folder: batchFolder,
    outBaseName: `COE - ${batchId}`,
    payloads,
  });

  const ctc = generateCTC_BatchXlsx_({
    templateSheetId: CONFIG.CTC_TEMPLATE_SHEET_ID,
    folder: batchFolder,
    outBaseName: `CTC - ${batchId}`,
    payloads,
  });

  selected.forEach((s) => {
    writeBack_(sh, s.rowNumber, headers, {
      [H.OUTPUT_FOLDER_LINK]: batchFolder.getUrl(),
      [H.IOT_FILE_LINK]: iot.url,
      [H.COE_FILE_LINK]: coe.url,
      [H.CTC_FILE_LINK]: ctc.url,
      [H.GENERATE]: false,
    });
  });

  SpreadsheetApp.getUi().alert(
    `Batch generated:\n${batchId}\nEntries: ${selected.length}\nFolder: ${batchFolder.getUrl()}`,
  );
}
function generateTO_Only() {
  const { sh, headers, idx, rows } = readRequests_();

  // collect checked rows
  const selected = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][idx[H.GENERATE]] === true) {
      selected.push({ rowNumber: i + 2, row: rows[i] });
    }
  }

  if (!selected.length) {
    SpreadsheetApp.getUi().alert(
      "No rows selected. Tick GENERATE checkboxes first.",
    );
    return;
  }

  const rootFolder = DriveApp.getFolderById(CONFIG.OUTPUT_ROOT_FOLDER_ID);
  const batchId = makeBatchId_();
  const batchFolder = rootFolder.createFolder("TO-" + batchId);

  selected.forEach((sel) => {
    const payload = payloadFromRow_(sel.row, idx, batchId);

    const toDocx = generateTO_Docx_({
      templateDocId: CONFIG.TO_TEMPLATE_DOC_ID,
      folder: batchFolder,
      outBaseName: `TO - ${payload.DESTINATION} - ${payload.DATE_OF_TRAVEL} - ${payload.REQUEST_ID}`,
      payload,
    });

    // write back TO link only
    writeBack_(sh, sel.rowNumber, headers, {
      [H.TO_FILE_LINK]: toDocx.url,
      [H.BATCH_ID]: batchId,
      [H.GENERATE]: false,
    });
  });

  SpreadsheetApp.getUi().alert(
    `TO generation completed.\nEntries: ${selected.length}\nFolder: ${batchFolder.getUrl()}`,
  );
}

/***********************
 * GENERATORS
 ***********************/
function exportGoogleDocToDocx_(docFileId, outName) {
  const url =
    "https://www.googleapis.com/drive/v3/files/" +
    encodeURIComponent(docFileId) +
    "/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error(
      "DOCX export failed: " +
        resp.getResponseCode() +
        " — " +
        resp.getContentText(),
    );
  }

  return resp.getBlob().setName(outName);
}

function generateTO_Docx_({ templateDocId, folder, outBaseName, payload }) {
  if (!templateDocId) throw new Error("TO template ID is not set.");

  // 1) Copy Google Doc template
  const template = DriveApp.getFileById(templateDocId);
  const copy = template.makeCopy(outBaseName, folder);

  // 2) Replace placeholders
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();
  Object.keys(payload).forEach((k) => {
    body.replaceText(`\\{\\{${k}\\}\\}`, String(payload[k] ?? ""));
  });
  doc.saveAndClose();

  // 3) Export using Drive API (DOCX)
  const blob = exportGoogleDocToDocx_(copy.getId(), outBaseName + ".docx");
  const file = folder.createFile(blob);

  // Clean up the intermediate Google Doc
  copy.setTrashed(true);

  return { url: file.getUrl(), id: file.getId() };
}

function generateIOT_BatchXlsx_({
  templateSheetId,
  folder,
  outBaseName,
  payloads,
}) {
  const cfg = CONFIG.IOT;

  const file = DriveApp.getFileById(templateSheetId).makeCopy(
    sanitize_(outBaseName),
    folder,
  );
  const ss = SpreadsheetApp.openById(file.getId());
  const sh = ss.getSheetByName(cfg.tabName);

  if (!sh) throw new Error("IOT tab not found: " + cfg.tabName);

  // 1. Handle Joined Headers (F16 and F17)
  const purposes = unique_(
    payloads.map((p) => String(p.PURPOSE || "").trim()).filter(Boolean),
  );
  sh.getRange(cfg.purposeCellA1).setValue(purposes.join("; "));

  const datesList = unique_(
    payloads
      .map((p) => {
        // We normalize every date string to your "MMMM d, yyyy" format before unique check
        return formatTravelDate_(p.DATE_OF_TRAVEL);
      })
      .filter(Boolean),
  );
  sh.getRange(cfg.datesCellA1).setValue(datesList.join("; "));

  // 2. Surgical Clear and Write
  const startRow = cfg.tableStartRow; // Row 22
  const n = payloads.length;

  // ONLY clear the specific rows we are using (e.g., Row 22 to 22 + n)
  // This protects your footer notes below the table
  sh.getRange(startRow, 1, n, 8).clearContent();

  for (let i = 0; i < n; i++) {
    const row = startRow + i;
    const p = payloads[i];

    sh.getRange(row, cfg.colDateOfTravel).setValue(p.DATE_OF_TRAVEL);
    sh.getRange(row, cfg.colDestination).setValue(p.DESTINATION);
    sh.getRange(row, cfg.colTransportation).setValue(p.TRANSPORTATION);
    sh.getRange(row, cfg.colFare).setValue(p.FARE);
    sh.getRange(row, cfg.colDiem).setValue(p.DIEM);
  }

  SpreadsheetApp.flush();

  const xlsxBlob = exportGoogleSheetToXlsx_(
    file.getId(),
    `${sanitize_(outBaseName)}.xlsx`,
  );
  const xlsxFile = folder.createFile(xlsxBlob);

  // Clean up intermediate Google Sheet
  file.setTrashed(true);

  return { url: xlsxFile.getUrl(), id: xlsxFile.getId() };
}

function generateCOE_BatchXlsx_({
  templateSheetId,
  folder,
  outBaseName,
  payloads,
}) {
  const cfg = CONFIG.COE;

  const file = DriveApp.getFileById(templateSheetId).makeCopy(
    sanitize_(outBaseName),
    folder,
  );
  const ss = SpreadsheetApp.openById(file.getId());
  const sh = ss.getSheetByName(cfg.tabName);

  if (!sh) throw new Error("COE tab not found: " + cfg.tabName);

  const startRow = cfg.tableStartRow; // Row 11
  const n = payloads.length;

  // Clear ONLY the rows being populated
  sh.getRange(startRow, 1, n, 4).clearContent();

  for (let i = 0; i < payloads.length; i++) {
    const row = startRow + i;
    const p = payloads[i];
    const amount = num_(p.FARE);

    sh.getRange(row, cfg.colDateOfTravel).setValue(p.DATE_OF_TRAVEL);
    sh.getRange(row, cfg.colRoute).setValue(p.ROUTE);
    sh.getRange(row, cfg.colDestination).setValue(p.DESTINATION);
    sh.getRange(row, cfg.colAmount).setValue(amount);
  }

  SpreadsheetApp.flush();

  const xlsxBlob = exportGoogleSheetToXlsx_(
    file.getId(),
    `${sanitize_(outBaseName)}.xlsx`,
  );
  const xlsxFile = folder.createFile(xlsxBlob);

  // Clean up intermediate Google Sheet
  file.setTrashed(true);

  return { url: xlsxFile.getUrl(), id: xlsxFile.getId() };
}

function generateCTC_BatchXlsx_({
  templateSheetId,
  folder,
  outBaseName,
  payloads,
}) {
  const cfg = CONFIG.CTC;

  // 1. Create a copy of the template
  const file = DriveApp.getFileById(templateSheetId).makeCopy(
    sanitize_(outBaseName),
    folder,
  );
  const ss = SpreadsheetApp.openById(file.getId());
  const sh = ss.getSheetByName(cfg.tabName);

  if (!sh) throw new Error("CTC tab not found: " + cfg.tabName);

  // 2. Collect unique dates and format them as a semicolon-separated string
  // const dates = unique_(payloads.map(p => String(p.DATE_OF_TRAVEL || "").trim()).filter(Boolean));
  const dates = unique_(
    payloads
      .map((p) => {
        // We normalize every date string to your "MMMM d, yyyy" format before unique check
        return formatTravelDate_(p.DATE_OF_TRAVEL);
      })
      .filter(Boolean),
  );
  // 3. Set the value specifically in C21 (replacing the "Date of Travel" text)
  sh.getRange(cfg.datesCellA1).setValue(dates.join("; "));

  SpreadsheetApp.flush();

  // 4. Export to XLSX and return the URL
  const xlsxBlob = exportGoogleSheetToXlsx_(
    file.getId(),
    `${sanitize_(outBaseName)}.xlsx`,
  );
  const xlsxFile = folder.createFile(xlsxBlob);

  // Clean up intermediate Google Sheet
  file.setTrashed(true);

  return { url: xlsxFile.getUrl(), id: xlsxFile.getId() };
}

/***********************
 * PAYLOAD / VALIDATION
 ***********************/
function payloadFromRow_(row, idx, batchId) {
  const CREATION_DATE = formatDatePretty_(row[idx[H.CREATION_DATE]]);
  const DESTINATION = String(row[idx[H.DESTINATION]] || "");
  const ROUTE = String(row[idx[H.ROUTE]] || "");
  const TRANSPORTATION = String(row[idx[H.TRANSPORTATION]] || "");
  const FARE = num_(row[idx[H.FARE]]);
  const DATE_OF_TRAVEL = formatTravelDate_(row[idx[H.DATE_OF_TRAVEL]]);
  const PURPOSE = String(row[idx[H.PURPOSE]] || "");
  const DIEM = num_(row[idx[H.DIEM]]);

  return {
    REQUEST_ID: String(row[idx[H.REQUEST_ID]] || ""),
    BATCH_ID: batchId,

    // ✅ New standard placeholders (if you later update template)
    CREATION_DATE,
    DESTINATION,
    ROUTE,
    TRANSPORTATION,
    FARE,
    DATE_OF_TRAVEL,
    PURPOSE,
    DIEM,

    // ✅ Compatibility placeholders (your current template)
    Date_Prepared: CREATION_DATE,
    Destination: DESTINATION,
    Date_of_Travel: DATE_OF_TRAVEL,
    Purpose: PURPOSE,
  };
}

/***********************
 * REQUESTS READ/WRITE
 ***********************/
function readRequests_({ includeRows = true } = {}) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CONFIG.REQUESTS_SHEET_NAME);
  if (!sh) throw new Error(`Sheet not found: ${CONFIG.REQUESTS_SHEET_NAME}`);

  const values = sh.getDataRange().getValues();
  if (!values.length) throw new Error("Requests sheet is empty.");

  const headers = values[0].map((h) => String(h || "").trim());
  const idx = indexMap_(headers);

  // If A1 is a checkbox, the text "GENERATE" is missing. We manually map it to column 0.
  if (!(H.GENERATE in idx)) {
    idx[H.GENERATE] = 0;
  }

  const mustHave = [
    H.REQUEST_ID,
    H.CREATION_DATE,
    H.DESTINATION,
    H.ROUTE,
    H.TRANSPORTATION,
    H.FARE,
    H.DATE_OF_TRAVEL,
    H.PURPOSE,
    H.DIEM,
  ];
  mustHave.forEach((h) => {
    if (!(h in idx)) throw new Error(`Missing header in Requests sheet: ${h}`);
  });

  return { sh, headers, idx, rows: includeRows ? values.slice(1) : [] };
}

function findRowByRequestId_(requestId) {
  const { sh, headers, idx } = readRequests_({ includeRows: true });
  // Get all data including the header row
  const values = sh.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    // Check the specific REQUEST_ID column (H.REQUEST_ID)
    if (String(values[i][idx[H.REQUEST_ID]]) === String(requestId)) {
      return {
        sh: sh,
        rowNumber: i + 1, // +1 because array is 0-indexed and Sheet is 1-indexed
        headers: headers,
        row: values[i],
      };
    }
  }
  return null;
}

function writeBack_(sh, rowNumber, headers, kv) {
  const idx = indexMap_(headers);
  Object.keys(kv).forEach((k) => {
    if (k in idx) {
      let value = kv[k];

      // If the key is a link (ends with _LINK), format it as a clickable HYPERLINK
      if (
        typeof value === "string" &&
        value.startsWith("http") &&
        k.endsWith("_LINK")
      ) {
        const label = k.replace("_LINK", "").replace(/_/g, " ");
        value = `=HYPERLINK("${value}", "🔗 View ${label}")`;
      }

      sh.getRange(rowNumber, idx[k] + 1).setValue(value);
    }
  });
}

function exportGoogleDocToDocx_(docFileId, outName) {
  const url =
    "https://www.googleapis.com/drive/v3/files/" +
    encodeURIComponent(docFileId) +
    "/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error(
      "DOCX export failed: " +
        resp.getResponseCode() +
        " — " +
        resp.getContentText(),
    );
  }

  return resp.getBlob().setName(outName);
}

function generateTO_Docx_({ templateDocId, folder, outBaseName, payload }) {
  if (!templateDocId) throw new Error("TO template ID is not set.");

  const template = DriveApp.getFileById(templateDocId);
  const copy = template.makeCopy(outBaseName, folder);

  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();
  Object.keys(payload).forEach((k) => {
    body.replaceText(`\\{\\{${k}\\}\\}`, String(payload[k] ?? ""));
  });
  doc.saveAndClose();

  const blob = exportGoogleDocToDocx_(copy.getId(), outBaseName + ".docx");
  const file = folder.createFile(blob);

  return { url: file.getUrl(), id: file.getId() };
}

/***********************
 * HELPERS
 ***********************/
function indexMap_(headers) {
  const m = {};
  headers.forEach((h, i) => {
    if (h) m[h] = i;
  });
  return m;
}

function makeRequestId_() {
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, "yyyyMMdd-HHmmss");
  return `REQ-${stamp}-${Math.floor(Math.random() * 1000)}`;
}

function makeBatchId_() {
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, "yyyyMMdd-HHmmss");
  return `BATCH-${stamp}`;
}

function sanitize_(s) {
  return String(s)
    .replace(/[\\/:*?"<>|#%{}[\]~]/g, "-")
    .trim();
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function toIsoDate_(v) {
  if (v instanceof Date) {
    const tz = Session.getScriptTimeZone();
    return Utilities.formatDate(v, tz, "yyyy-MM-dd");
  }
  return v ? String(v) : "";
}

function formatDatePretty_(v) {
  const d = v instanceof Date ? v : v ? new Date(v) : null;
  if (d && isFinite(d)) {
    const tz = Session.getScriptTimeZone();
    return Utilities.formatDate(d, tz, "MMMM d, yyyy");
  }
  return "";
}

function unique_(arr) {
  const out = [];
  const seen = new Set();
  arr.forEach((x) => {
    const k = String(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  });
  return out;
}
function exportGoogleDocToDocx_(docFileId, outName) {
  const url =
    "https://www.googleapis.com/drive/v3/files/" +
    encodeURIComponent(docFileId) +
    "/export" +
    "?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  if (code !== 200) {
    throw new Error(
      "DOCX export failed. HTTP " + code + " — " + resp.getContentText(),
    );
  }

  return resp.getBlob().setName(outName);
}
function formatTravelDate_(value) {
  if (!value) return "";

  const tz = Session.getScriptTimeZone();

  if (typeof value === "string") {
    // 1. Handle Ranges with " to " separator (e.g., "2026-02-11 to 2026-02-12")
    if (value.toLowerCase().includes(" to ")) {
      const parts = value.split(/ to /i).map((v) => v.trim());
      if (parts.length === 2) {
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        if (!isNaN(start) && !isNaN(end)) {
          return formatDateRange_(start, end, tz);
        }
      }
    }
    
    // 2. Handle simple strings that might already be pretty (e.g. "February 10, 2026")
    // If it contains a comma or letters and no "to", it might be already formatted
    if (/[a-z]/i.test(value) && value.includes(",") && !value.includes("to")) {
      return value;
    }
  }

  // 2. Handle Single Dates (e.g., Date object, "2026-02-11")
  
  // A. Strict string "YYYY-MM-DD" handling (Deterministic, no timezone issues)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    const [yStr, mStr, dStr] = value.split('-');
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    return `${months[m - 1]} ${d}, ${yStr}`;
  }

  // B. Date Objects or other formats
  let d = value instanceof Date ? value : null;
  if (!d) {
    // Try standard parsing
    const potentialDate = new Date(value);
    if (!isNaN(potentialDate.getTime())) {
      d = potentialDate;
    }
  }

  if (d) {
    return Utilities.formatDate(d, tz, "MMMM d, yyyy");
  }

  return String(value).trim();
}

function formatDateRange_(start, end, tz) {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  // Result: February 10–12, 2026
  if (sameMonth && sameYear) {
    return (
      Utilities.formatDate(start, tz, "MMMM d") +
      "-" +
      Utilities.formatDate(end, tz, "d, yyyy")
    );
  }

  // Result: February 28 – March 2, 2026
  if (!sameMonth && sameYear) {
    return (
      Utilities.formatDate(start, tz, "MMMM d") +
      " – " +
      Utilities.formatDate(end, tz, "MMMM d, yyyy")
    );
  }

  // Result: December 30, 2025 – January 2, 2026
  return (
    Utilities.formatDate(start, tz, "MMMM d, yyyy") +
    " – " +
    Utilities.formatDate(end, tz, "MMMM d, yyyy")
  );
}

/**
 * Ensures the required fields are present before saving to the sheet.
 */
function validatePayload_(p) {
  if (!p) throw new Error("No data received.");
  if (!p.DESTINATION) throw new Error("Destination is required.");
  if (!p.DATE_OF_TRAVEL) throw new Error("Date of Travel is required.");
  if (!p.PURPOSE) throw new Error("Purpose is required.");
}

/**
 * Helper to export Google Sheets to XLSX blob
 */
function exportGoogleSheetToXlsx_(ssId, outName) {
  const url =
    "https://docs.google.com/spreadsheets/d/" + ssId + "/export?format=xlsx";
  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error("XLSX export failed: " + resp.getContentText());
  }
  return resp.getBlob().setName(outName);
}

function deleteCheckedRequests() {
  const { sh, headers, idx, rows } = readRequests_();
  // Fetch formulas to get URLs from HYPERLINK cells
  const formulas = sh.getDataRange().getFormulas().slice(1);

  // We loop backwards
  let deleteCount = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row[idx[H.GENERATE]] === true) {
      // 🗑️ Trash linked Drive files/folders (passing formulas for that row)
      trashLinkedDriveFiles_(row, formulas[i] || [], idx);
      
      sh.deleteRow(i + 2);
      deleteCount++;
    }
  }
  return { ok: true, count: deleteCount };
}

/**
 * Internal helper to move linked Drive items to Trash
 */
function trashLinkedDriveFiles_(row, formulas, idx) {
  const linkKeys = [
    H.OUTPUT_FOLDER_LINK,
    H.TO_FILE_LINK,
    H.IOT_FILE_LINK,
    H.COE_FILE_LINK,
    H.CTC_FILE_LINK
  ];

  linkKeys.forEach(key => {
    let link = row[idx[key]];
    const formula = formulas[idx[key]] || "";
    
    // If it's a HYPERLINK formula, extract the URL
    if (formula.toUpperCase().startsWith("=HYPERLINK(")) {
      const match = formula.match(/"(http[^"]+)"/i);
      if (match) link = match[1];
    }

    if (link && typeof link === 'string' && link.startsWith('http')) {
      try {
        const match = link.match(/[-\w]{25,}/);
        if (match) {
          const id = match[0];
          
          // Double check it's not a template or important root folder
          if (id !== CONFIG.TO_TEMPLATE_DOC_ID && 
              id !== CONFIG.IOT_TEMPLATE_SHEET_ID &&
              id !== CONFIG.OUTPUT_ROOT_FOLDER_ID) {
            
            // Try as file first, then as folder if file check fails
            try {
              DriveApp.getFileById(id).setTrashed(true);
            } catch (e) {
              DriveApp.getFolderById(id).setTrashed(true);
            }
          }
        }
      } catch (e) {
        console.warn("Could not trash file/folder: " + link + " Error: " + e.message);
      }
    }
  });
}

/**
 * Helper to sort the Requests sheet by DATE_OF_TRAVEL (Ascending)
 */
function sortRequestsSheet_(sh, idx) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return; // Nothing to sort

  const dateCol = idx[H.DATE_OF_TRAVEL] + 1; // 1-indexed column
  const range = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn());
  const values = range.getValues();
  const dateColIdx = idx[H.DATE_OF_TRAVEL];

  values.sort((a, b) => {
    const dateA = parseSortDate_(a[dateColIdx]);
    const dateB = parseSortDate_(b[dateColIdx]);
    return dateA - dateB;
  });

  // Re-format all dates as pretty text strings
  for (let i = 0; i < values.length; i++) {
    values[i][dateColIdx] = formatTravelDate_(values[i][dateColIdx]);
  }

  // Force entire DATE_OF_TRAVEL column to plain text BEFORE writing values
  sh.getRange(2, dateCol, lastRow - 1).setNumberFormat('@');

  range.setValues(values);
}

/**
 * Parse a date value (Date object or formatted string) into a sortable timestamp.
 */
function parseSortDate_(v) {
  // Handle Date objects directly (Google Sheets may return these from getValues)
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? Infinity : v.getTime();
  }

  let s = String(v).trim();
  // Strip any leftover leading apostrophe
  if (s.startsWith("'")) s = s.substring(1).trim();
  if (!s) return Infinity;

  // 1. Try ISO format "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  // 2. Check for RANGE patterns FIRST (before new Date, which may incorrectly parse them)
  //    Matches: "February 10-18, 2026" or "January 8 – February 1, 2026"
  //    A range has a month name followed by a number, then a separator (-/–), then more text
  if (/[a-z]+\s+\d+\s*[-–]/i.test(s)) {
    const matchYear = s.match(/(\d{4})/);
    if (matchYear) {
      const year = matchYear[1];
      // Extract just the month and start day: everything before the first - or –
      const startMatch = s.match(/^([a-z]+\s+\d+)/i);
      if (startMatch) {
        const d = new Date(startMatch[1] + ", " + year);
        if (!isNaN(d.getTime())) return d.getTime();
      }
    }
  }

  // 3. Try parsing directly (works for simple "February 11, 2026")
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d.getTime();

  return 0; // Fallback
}
