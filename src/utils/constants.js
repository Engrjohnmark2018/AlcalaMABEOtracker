// Constants & Default Data for ABE Office — Alcala Tracker & TEV Automation

export const KEY = {
  state: 'abe-alcala-b.state.v1',
  ui: 'abe-alcala-b.ui.v1',
  tev: 'abe-alcala-b.tev.v1',
};

export const AKEY = {
  ses: 'abe-alcala-b.auth.session',
  dev: 'abe-alcala-b.auth.device',
  fails: 'abe-alcala-b.auth.fails'
};

export const MAX_TRIES = 5;
export const COOL_MS = 45000;

export const AUTH = {
  salt: 'abe-alcala|',
  sha256: 'd37ce47be484c21af04fee55d419ea2d081ab71b62ff46162328007cafe7fd1e',
  fallback: '3bda205f'
};

export const ROLES = {
  admin: {
    label: 'Administrator',
    short: 'Admin',
    desc: 'Full access: entries, settings, accounts, backups and imports.',
    can: { edit: 1, settings: 1, users: 1, danger: 1 }
  },
  editor: {
    label: 'Encoder / Staff',
    short: 'Encoder',
    desc: 'Add, edit and accomplish work entries; edit settings and export reports. No account management.',
    can: { edit: 1, settings: 1, users: 0, danger: 0 }
  },
  viewer: {
    label: 'Viewer',
    short: 'Viewer',
    desc: 'Read-only: can view, filter, print and copy reports.',
    can: { edit: 0, settings: 0, users: 0, danger: 0 }
  }
};

export const STATUS = {
  done:   { label: 'Accomplished',          short: 'Accomplished', chip: 'done',   ev: 'd', icon: 'check', color: '#22c55e' },
  open:   { label: 'Ongoing / In progress', short: 'Ongoing',      chip: 'open',   ev: 'o', icon: 'refresh', color: '#3b82f6' },
  pend:   { label: 'Pending / Not started', short: 'Pending',      chip: 'pend',   ev: 'p', icon: 'clock', color: '#f59e0b' },
  cancel: { label: 'Cancelled / Deferred',  short: 'Cancelled',    chip: 'cancel', ev: 'c', icon: 'ban', color: '#94a3b8' }
};

export const STATUS_ORDER = ['done', 'open', 'pend', 'cancel'];

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const DOW_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export const DEFAULT_SETTINGS = {
  officeName: 'ABE Office — Alcala',
  tagline: 'Agricultural and Biosystems Engineering Services',
  logoText: 'ABE',
  footer: 'ABE Office — Alcala · Work & Accomplishment Tracker',
  weekStart: 0,
  calMode: 'auto',
  categories: [
    'Machinery & Equipment', 'Irrigation & Water Management', 'Land Preparation',
    'Surveying & Mapping', 'Postharvest Facilities', 'Farm Structures',
    'Extension & Training', 'Administrative & Reporting', 'Others'
  ],
  locations: [
    'Municipal Hall / ABE Office', 'Poblacion', 'Demo Farm', 'Rice Processing Center',
    'Irrigation Service Area', 'Agri-Machinery Shed', 'Barangay (specify)'
  ],
  personnel: [
    'Municipal Agriculturist', 'ABE Staff / Engineer', 'Farm Machinery Operator',
    'Irrigation Technician', 'ABE Technician', 'Job Order Personnel'
  ]
};

export const SEED_ENTRIES_RAW = [
  ['Land preparation services for rice farmers (wet season batch 2)', 'Land Preparation', 'done', -40, -40, -39, 32, 'Thirty-two farmers served; two 4WD tractors deployed.'],
  ['Operation test and evaluation of rice combine harvester', 'Machinery & Equipment', 'done', -36, -35, -35, 0, 'Test report submitted to the Municipal Agriculture Office.'],
  ['Repair of water pump unit — Irrigation Service Area 2', 'Irrigation & Water Management', 'done', -34, -33, -33, 18, 'Replaced worn impeller and gaskets; output flow restored.'],
  ['Survey and layout of proposed shallow tube well site', 'Surveying & Mapping', 'done', -31, -30, -30, 0, 'Coordinates and elevation points logged for the design stage.'],
  ['Inspection of solar dryer facility with farmers\' association', 'Postharvest Facilities', 'done', -28, -27, -27, 24, 'Recommended repair of the polycarbonate cover.'],
  ['Training on rice mechanization and farm machinery safety', 'Extension & Training', 'done', -26, -25, -25, 45, '45 participants; lecture and hands-on demonstration.'],
  ['Preparation of ABE Office quarterly accomplishment report', 'Administrative & Reporting', 'done', -23, -22, -22, 0, 'Submitted to the Office of the Mayor and DA Provincial Office.'],
  ['Irrigation canal clearing and desilting operation', 'Irrigation & Water Management', 'done', -21, -20, -20, 60, 'Canal rehabilitation cleared water flow to 26 hectares.'],
  ['Fabrication and installation of compost shed', 'Farm Structures', 'done', -19, -18, -18, 12, 'Materials from the municipal agri fund; local labor used.'],
  ['Accreditation assistance for agri-machinery service providers', 'Machinery & Equipment', 'done', -16, -15, -15, 9, 'Nine service providers assisted with documentary requirements.'],
  ['Soil and water conservation assessment (sloping areas)', 'Irrigation & Water Management', 'done', -13, -12, -12, 15, 'Recommended contouring and cover cropping measures.'],
  ['Distribution of agri-machinery subsidy — hand tractors', 'Machinery & Equipment', 'done', -11, -10, -10, 12, 'Twelve qualified beneficiaries; turn-over with photo documentation.'],
  ['Site validation for biogas digester installation', 'Farm Structures', 'done', -9, -8, -8, 4, 'Two of four sites validated as technically feasible.'],
  ['Farm-to-market road condition assessment', 'Farm Structures', 'done', -7, -6, -6, 38, 'Thirty-eight farmers consulted on priority road segments.'],
  ['Rice processing center operation assessment', 'Postharvest Facilities', 'done', -49, -48, -48, 21, 'Assessment of mill capacity, water supply, and drying area.'],
  ['Barangay consultation on ABE programs and services', 'Extension & Training', 'done', -46, -45, -45, 57, 'Gathered priority machinery and irrigation requests.'],
  ['Canal lining and repair of diversion dam', 'Irrigation & Water Management', 'done', -53, -52, -52, 44, 'Completed with LGU-funded materials and communal labor.'],
  ['Farm machinery inventory and tagging', 'Machinery & Equipment', 'done', -59, -58, -58, 0, 'Nineteen (19) units tagged and encoded in the equipment registry.'],
  ['Calibration of rice thresher units', 'Machinery & Equipment', 'open', -4, 3, null, 0, 'Ongoing at the machinery shed; six units scheduled.'],
  ['Design of small-scale irrigation system (canal lining)', 'Irrigation & Water Management', 'open', -6, 6, null, 0, 'For review and cost estimate by the Municipal Engineer.'],
  ['Evaluation of solar-powered water pump pilot', 'Irrigation & Water Management', 'open', -2, 2, null, 0, 'Monitor discharge rate versus conventional pump.'],
  ['Preparation of geotagged map of agri-machinery', 'Surveying & Mapping', 'open', 0, 9, null, 0, 'Field mapping ongoing; GPS data processing in progress.'],
  ['Submission of farmer beneficiaries masterlist', 'Administrative & Reporting', 'pend', -12, -6, null, 0, 'Awaiting validation of names from barangay coordinators.'],
  ['Replacement of damaged thresher blade — 2 units', 'Machinery & Equipment', 'open', -8, -2, null, 0, 'Spare parts requested; pending delivery from supplier.'],
  ['Agricultural baseline assessment (ABA) data gathering', 'Surveying & Mapping', 'pend', null, 4, null, 0, 'Assign enumerators and prepare data forms.'],
  ['Municipal Agriculture and Fishery Council meeting', 'Administrative & Reporting', 'pend', null, 1, null, 0, 'Include machinery utilization and irrigation status updates.'],
  ['Coordination meeting with DA on agri-machinery grant', 'Machinery & Equipment', 'pend', null, 7, null, 0, 'Prepare inventory of serviceable units and utilization records.'],
  ['Demonstration on mechanized rice transplanting', 'Extension & Training', 'pend', null, 12, null, 60, 'Invite farmer cooperators; prepare demo area.'],
  ['Postharvest losses monitoring (rainy season cropping)', 'Postharvest Facilities', 'pend', null, 14, null, 0, 'Coordinate with grain traders for drying and storage data.'],
  ['Training on biogas digester operation and maintenance', 'Extension & Training', 'pend', null, 18, null, 25, 'For validated hog-raisers\' households.']
];

export const DEFAULT_FARE_MATRIX = [
  {
    "destination": "Abbeg",
    "route": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Abbeg to Municipal Hall",
    "transportation": "Tricycle, Boat",
    "fare": 150.0
  },
  {
    "destination": "Afusing Bato",
    "route": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Abbeg Bangkero to Afusing Bato to  Municipal Hall",
    "transportation": "Tricycle, Boat",
    "fare": 160.0
  },
  {
    "destination": "Afusing Daga",
    "route": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Afusing Daga to Municipal Hall",
    "transportation": "Tricycle, Boat",
    "fare": 140.0
  },
  {
    "destination": "Agani",
    "route": "Municipal Hall to Agani to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 110.0
  },
  {
    "destination": "Baculod",
    "route": "Municipal Hall to Baculod to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 60.0
  },
  {
    "destination": "Baybayog",
    "route": "Municipal Hall to Baybayog  to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 70.0
  },
  {
    "destination": "Cabuluan",
    "route": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Cabuluan to Municipal Hall",
    "transportation": "Tricycle, Boat",
    "fare": 160.0
  },
  {
    "destination": "Calantac",
    "route": "Municipal Hall to Baybayog to Calantac to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 140.0
  },
  {
    "destination": "Carallangan",
    "route": "Municipal Hall to Tupang Bangkero to Carallangan Bangkero to Carallangan to Municipal Hall",
    "transportation": "Tricycle, Boat",
    "fare": 150.0
  },
  {
    "destination": "Centro Norte",
    "route": "Municipal Hall to Centro Norte to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 60.0
  },
  {
    "destination": "Centro Sur",
    "route": "Municipal Hall to Centro Sur to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 50.0
  },
  {
    "destination": "Dalaoig",
    "route": "Municipal Hall to Dalaoig to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 120.0
  },
  {
    "destination": "Damurog",
    "route": "Municipal Hall to Baybayog to Damurog to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 140.0
  },
  {
    "destination": "Jurisdiction",
    "route": "Municipal Hall to Baybayog to Jurisdiccion to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 120.0
  },
  {
    "destination": "Malalatan",
    "route": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Malalatan to Municipal Hall",
    "transportation": "Tricycle, Boat",
    "fare": 130.0
  },
  {
    "destination": "Maraburab",
    "route": "Municipal Hall to Maraburab to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 70.0
  },
  {
    "destination": "Masin",
    "route": "Municipal Hall to Masin to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 100.0
  },
  {
    "destination": "Pagbangkeruan",
    "route": "Municipal Hall to Baybayog to Pagbangkeruan to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 110.0
  },
  {
    "destination": "Pared",
    "route": "Municipal Hall to Pared  to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 60.0
  },
  {
    "destination": "Piggatan",
    "route": "Municipal Hall to Piggatan  to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 80.0
  },
  {
    "destination": "Pinopoc",
    "route": "Municipal Hall to Baybayog to Pinopoc to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 130.0
  },
  {
    "destination": "Pussian",
    "route": "Municipal Hall to Pussian to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 110.0
  },
  {
    "destination": "San Esteban",
    "route": "Municipal Hall to San Esteban to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 140.0
  },
  {
    "destination": "Tamban",
    "route": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Tamban Proper to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 130.0
  },
  {
    "destination": "Tupang",
    "route": "Municipal Hall to Tupang to Municipal Hall",
    "transportation": "Tricycle",
    "fare": 50.0
  },
  {
    "destination": "DA-SCRC",
    "route": "Municipal Hall  to DA-SCRC Iguig to Municipal Hall",
    "transportation": "PUV",
    "fare": 160.0
  },
  {
    "destination": "DA-ATI",
    "route": "Mun. hall - Tuguegarao Van Terminal - Magno Van Terminal - San Mateo, Isabela - ATI RTC2  & vise versa",
    "transportation": "Tricycle, PUV",
    "fare": 930.0
  },
  {
    "destination": "DA-RFO2",
    "route": "Municipal Hall to Pengue Highway to DA-RFO2 (San Gabriel, Tug. City) to Municipal Hall",
    "transportation": "Tricycle, PUV",
    "fare": 250.0
  }
];

export const DEFAULT_TEV_REQUESTS = [
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260422-091151-373",
    "CREATION_DATE": "2026-04-22",
    "DESTINATION": "Calantac, Cabuluan, Carallangan, and Dalaoig",
    "ROUTE": "Municipal Hall to Baybayog to Calantac to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "April 21, 2026 \u2013 April 24, 2026",
    "PURPOSE": "conduct agri-machinery inventory with DA RAED staff",
    "DIEM": 540.0,
    "BATCH_ID": "BATCH-20260520-083019",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260518-071229-432",
    "CREATION_DATE": "46159.33333333333",
    "DESTINATION": "Tamban, Carallangan, and Jurisdiccion",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Carallangan Bangkero to Carallangan to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "May 14,15,18, 2026",
    "PURPOSE": "facilitate General Assembly of Tamban Farmers' Association, and Carallangan Farmers' Association; facilitate the filling and submission of documentary requirements for DSWD ECT Program",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260518-071339",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260227-082123-280",
    "CREATION_DATE": "46080.33333333333",
    "DESTINATION": "Tamban",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Tamban Proper to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "January 21, 2026",
    "PURPOSE": "provide technical assistance and organize FCA financial  records for BIR Filing, FS preparation, Book of Accounts",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260310-103238",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260227-082227-145",
    "CREATION_DATE": "46080.33333333333",
    "DESTINATION": "Malalatan",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Malalatan to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "January 23, 2026",
    "PURPOSE": "provide technical assistance and organize FCA financial  records for BIR Filing, FS preparation, Book of Accounts",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260310-103238",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260227-082520-283",
    "CREATION_DATE": "46080.33333333333",
    "DESTINATION": "Afusing Daga",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Afusing Daga to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "January 26, 2026",
    "PURPOSE": "assist Alcala West OFW Association in finalizing their DOLE registration",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260310-103238",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260227-083023-117",
    "CREATION_DATE": "46080.33333333333",
    "DESTINATION": "Dalaoig",
    "ROUTE": "Municipal Hall to Dalaoig to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 120.0,
    "DATE_OF_TRAVEL": "January 28-30, 2026",
    "PURPOSE": "assist in the conduct of topographic survey by DA-RAED on the requested canal of Dalaoig SWIP",
    "DIEM": 405.0,
    "BATCH_ID": "BATCH-20260310-103238",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260227-083513-162",
    "CREATION_DATE": "46080.33333333333",
    "DESTINATION": "Agani",
    "ROUTE": "Municipal Hall to Agani to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 100.0,
    "DATE_OF_TRAVEL": "February 18, 2026",
    "PURPOSE": "assist in the monitoring of Automated Weather Station with BSWM staff and interview of Agani MPC Officers",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260310-103238",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260305-105705-313",
    "CREATION_DATE": "46086.33333333333",
    "DESTINATION": "Carallangan, Pared, and Dalaoig",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Carallangan Bangkero to Carallangan to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "March 6, 2026",
    "PURPOSE": "validate Proposed Farm-to-Market Road with DA-RAED and PLGU staff",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260406-145151",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260310-103552-949",
    "CREATION_DATE": "46091.33333333333",
    "DESTINATION": "Damurog and Jurisdiccion",
    "ROUTE": "Municipal Hall to Baybayog to Damurog to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "March 10, 2026",
    "PURPOSE": "turnover Books of accounts, 2025 Financial Statement, and BIR filing documents.",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260406-145151",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260317-143853-162",
    "CREATION_DATE": "46098.33333333333",
    "DESTINATION": "Calantac",
    "ROUTE": "Municipal Hall to Baybayog to Calantac to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "March 18, 2026",
    "PURPOSE": "conduct a meeting with FCAs under NIA",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260406-145151",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260324-125745-171",
    "CREATION_DATE": "46105.33333333333",
    "DESTINATION": "Abbeg and Cabuluan",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Abbeg to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "March 25, 2026",
    "PURPOSE": "attend the meeting of Abbeg Producers Cooperative and Cabuluan Farmers MPC",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260406-145151",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260325-120316-203",
    "CREATION_DATE": "46106.33333333333",
    "DESTINATION": "Baculod and DA-RFO2, San Gabriel, Tuguegarao City",
    "ROUTE": "Municipal Hall to Baculod to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 50.0,
    "DATE_OF_TRAVEL": "March 26, 2026",
    "PURPOSE": "assist DA RAED staff in validating agri-machinery request; submit RCEF Machinery request and DA CSO Accreditation documents of FCAs",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260406-145151",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260407-082135-750",
    "CREATION_DATE": "46119.33333333333",
    "DESTINATION": "Masin, San Esteban, Pinopoc",
    "ROUTE": "Municipal Hall to Masin to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 100.0,
    "DATE_OF_TRAVEL": "April 7, 2026",
    "PURPOSE": "monitor and validate Solar-powered Irrigation Systems (SPIS)",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260520-083019",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260415-075229-504",
    "CREATION_DATE": "46126.33333333333",
    "DESTINATION": "Pussian and Afusing Daga",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Afusing Daga to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "April 14, 2026",
    "PURPOSE": "facilitate general assembly of Abbeg Cooperative; geotag and interview Alcala West OFW Association in preparation of their business plan",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260520-083019",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260416-073932-752",
    "CREATION_DATE": "46127.33333333333",
    "DESTINATION": "Carallangan and Cabuluan",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Carallangan Bangkero to Carallangan to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "April 16, 2026",
    "PURPOSE": "assist in the final inspection of the concreted Carallangan FMR; validate proposed Zone 6-7 Cabuluan FMR",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260520-083019",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260506-141852-237",
    "CREATION_DATE": "46148.33333333333",
    "DESTINATION": "Damurog",
    "ROUTE": "Municipal Hall to Baybayog to Damurog to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "May 6, 2026",
    "PURPOSE": "facilitate the signing of pertinent documents for the requested corn seeder from DA Region",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260520-083019",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260521-083545-290",
    "CREATION_DATE": "46163.33333333333",
    "DESTINATION": "Dalaoig and Agani",
    "ROUTE": "Municipal Hall to Dalaoig to Agani to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 120.0,
    "DATE_OF_TRAVEL": "May 21, 2026",
    "PURPOSE": "attend the meeting of officers of the Dalaoig Multi-purpose Cooperative; facilitate the profiling of DSWD ECT corn farmer-beneficiaries",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260521-083848",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260611-072057-471",
    "CREATION_DATE": "46183.33333333333",
    "DESTINATION": "Cabuluan",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Cabuluan to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 150.0,
    "DATE_OF_TRAVEL": "June 10-11, 2026",
    "PURPOSE": "assist in the topographic survey of Cabuluan Farm-to-Market Road",
    "DIEM": 270.0,
    "BATCH_ID": "BATCH-20260611-072119",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260625-083345-271",
    "CREATION_DATE": "46198.33333333333",
    "DESTINATION": "DA-SCRC",
    "ROUTE": "Municipal Hall  to DA-SCRC Iguig to Municipal Hall",
    "TRANSPORTATION": "PUV",
    "FARE": 160.0,
    "DATE_OF_TRAVEL": "June 25, 2026",
    "PURPOSE": "attend the 2nd Quarter ABE Meeting",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260625-083403",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260701-110338-581",
    "CREATION_DATE": "46204.33333333333",
    "DESTINATION": "Pussian and Damurog",
    "ROUTE": "Municipal Hall to Pussian to Baybayog to Damurog to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 140.0,
    "DATE_OF_TRAVEL": "July 1, 2026",
    "PURPOSE": "facilitate the signing of MOA with FCAs; and submit DED and POW of the Concreting of Cabuluan FMR",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260701-110529",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260708-163727-469",
    "CREATION_DATE": "46211.33333333333",
    "DESTINATION": "Masin and Baybayog",
    "ROUTE": "Municipal Hall to Masin to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 100.0,
    "DATE_OF_TRAVEL": "July 9, 2026",
    "PURPOSE": "facilitate the signing of docs and geotagging for the rehabilitation of Masin 1 & 2 SPIS; and convey the docs to the notary office.",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260708-163810",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260721-150640-388",
    "CREATION_DATE": "46224.33333333333",
    "DESTINATION": "Malalatan",
    "ROUTE": "Municipal Hall to Tupang Bangkero to Tamban Bangkero to Malalatan to Municipal Hall",
    "TRANSPORTATION": "Tricycle, Boat",
    "FARE": 130.0,
    "DATE_OF_TRAVEL": "July 22, 2026",
    "PURPOSE": "facilitate the Special General Assembly Meeting of Malalatan Farmers Association",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260721-150656",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260805-134534-974",
    "CREATION_DATE": "46239.33333333333",
    "DESTINATION": "Masin",
    "ROUTE": "Municipal Hall to Masin to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 100.0,
    "DATE_OF_TRAVEL": "August 5, 2026",
    "PURPOSE": "convey and facilitate the signing of documents for the requested agri-machinery of White Corn Growers Association",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260910-082039",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260810-193049-187",
    "CREATION_DATE": "46244.33333333333",
    "DESTINATION": "Maraburab, Baculod, and Pussian",
    "ROUTE": "Municipal Hall to Maraburab to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 70.0,
    "DATE_OF_TRAVEL": "August 11, 2026",
    "PURPOSE": "convey documentary requirements for FCAs' agri-machinery request (PTR,JEV, Usufruct) and SPIS rehabilitation",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260910-082039",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260812-082349-219",
    "CREATION_DATE": "46246.33333333333",
    "DESTINATION": "Masin and Calantac",
    "ROUTE": "Municipal Hall to Masin to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 100.0,
    "DATE_OF_TRAVEL": "August 12, 2026",
    "PURPOSE": "conduct validation of sites with DA RAED staff for the requested agri-machinery of LGU and FCA",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260910-082039",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260813-090535-66",
    "CREATION_DATE": "46247.33333333333",
    "DESTINATION": "Landbank Capitol, Carig Sur, Tuguegarao CIty",
    "ROUTE": "Municipal Hall to Carig Highway to LandBank Capitol, Carig Sur, Tuguegarao City to Municipal Hall",
    "TRANSPORTATION": "Tricycle, PUV",
    "FARE": 250.0,
    "DATE_OF_TRAVEL": "August 14, 2026",
    "PURPOSE": "facilitate the payment of CNC Application fee of Masin 1 and 2 SPIS Rehabilitation Project",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260910-082039",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260824-124150-993",
    "CREATION_DATE": "46258.33333333333",
    "DESTINATION": "NGN Gran Hotel, Tuguegarao City",
    "ROUTE": "Municipal Hall to Carig Highway to NGN Gran Hotel, Caggay Tuguegarao City to Municipal Hall",
    "TRANSPORTATION": "Tricycle, PUV",
    "FARE": 250.0,
    "DATE_OF_TRAVEL": "August 26-28, 2026",
    "PURPOSE": "attend the Cagayan Information Officers Summit: Basic Journalism for Information Officers (Level 1)",
    "DIEM": 405.0,
    "BATCH_ID": "BATCH-20260910-082039",
    "OUTPUT_FOLDER_LINK": "\ud83d\udd17 View OUTPUT FOLDER",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "\ud83d\udd17 View IOT FILE",
    "COE_FILE_LINK": "\ud83d\udd17 View COE FILE",
    "CTC_FILE_LINK": "\ud83d\udd17 View CTC FILE"
  },
  {
    "GENERATE": false,
    "REQUEST_ID": "REQ-20260907-113431-492",
    "CREATION_DATE": "46272.33333333333",
    "DESTINATION": "Agani and Pussian",
    "ROUTE": "Municipal Hall to Agani to Municipal Hall",
    "TRANSPORTATION": "Tricycle",
    "FARE": 100.0,
    "DATE_OF_TRAVEL": "September 7, 2026",
    "PURPOSE": "assist CSU BS Biology students on their field interview and collection for their thesis",
    "DIEM": 135.0,
    "BATCH_ID": "BATCH-20260907-140024",
    "OUTPUT_FOLDER_LINK": "",
    "TO_FILE_LINK": "\ud83d\udd17 View TO FILE",
    "IOT_FILE_LINK": "",
    "COE_FILE_LINK": "",
    "CTC_FILE_LINK": ""
  }
];
