# ABE Office — Alcala · Work & Accomplishment Tracker & TEV Automation

Modern **Vite + Vue 3** web application for the Agricultural and Biosystems Engineering (ABE) Office of Alcala, Cagayan. Built for **offline-first reliability on office workstations**, featuring per-user tracking, weekly schedule exports, travel management, and comprehensive **TEV (Travel Expense Voucher) document automation**.

---

## Key Features Overview

- **Modular Vite + Vue 3 Architecture**: Fast, lightweight client-side application running completely in the browser without any remote server or database setup required.
- **Per-User Attribution & Security**: Every entry logs who encoded it and who marked it accomplished. Role-based access control (Administrator, Encoder, Viewer) with encrypted master password (`@EdiMAO2024`) and salted hash storage.
- **Travel Order**: Restored legacy form with four-field live preview, uploaded Word template, editable date wording, optional calendar recording, printing, and travel log CSV export.
- **Travel & Expenses Tab**: Integration of official Alcala travel automation formerly handled in Google Sheets/Apps Script. Generates **Travel Orders (TO)**, **Itinerary of Travel (IOT)**, **Certificate of Expenses (COE)**, and **Certificate of Travel Completed (CTC)** into formatted Word (`.docx`) and Excel (`.xlsx`) files.
- **Weekly Schedule Generator**: Monday–Friday schedule exportable to high-resolution PNG or printable vector PDF.
- **Programs, Projects & Activities (PPA)**: Upload and filter office PPAs directly with multi-column search and sorting.
- **Interactive Dashboards & Insights**: SVG-rendered 12-month accomplishment trends, overdue aging, personnel workload distribution, and year-over-year analytics.
- **Data Safety**: LocalStorage + IndexedDB browser persistence, JSON backup & restore, CSV imports/exports, and trash bin with undo protection.

---

## Project Structure

```
AlcalaMABEOtracker/
├── .github/
│   └── workflows/
│       └── static.yml              # Automated GitHub Pages build & deploy workflow
├── archive/                        # Preserved historical assets & reference files
│   ├── Generated TO, IOT, COE, CTC/# Historical Google Drive generated batch folders
│   ├── GScript/                    # Legacy Google Apps Script (code.gs, DataEntry.html)
│   ├── reference-files/            # Reference workbooks (TEV Automation.xlsx, etc.)
│   ├── Templates/                  # Original raw document templates
│   └── legacy-index.html           # Original 5,600+ line monolithic single-file app
├── docs/                           # Documentation and sample export files
│   ├── Sample-Travel-Order-Template.docx
│   ├── Sample-Weekly-Schedule.pdf
│   ├── Sample-Weekly-Schedule.png
│   └── Setup Guide.docx
├── public/                         # Public static assets & bundled templates
│   └── templates/
│       ├── Certificate of Expenses.xlsx
│       ├── Certificate of Travel Completed.xlsx
│       ├── Fare matrix.xlsx
│       ├── Itenerary of Travel.xlsx
│       └── Travel Order Template.docx
├── src/                            # Vue 3 Modular Source Code
│   ├── assets/styles/main.css      # Design tokens, typography, dark mode & components
│   ├── components/                 # View and modal components
│   │   ├── calendar/               # Month/Year views & Day modal
│   │   ├── common/                 # Header, Tabs, Lock Screen, Modals & Toast
│   │   ├── dashboard/              # KPI cards & activity stream
│   │   ├── insights/               # Visual charts & personnel performance
│   │   ├── ppa/                    # PPA overview table & search
│   │   ├── reports/                # Report generation & printable views
│   │   ├── settings/               # Accounts, backup, PPA upload & preferences
│   │   ├── tasks/                  # Work register, CSV import & templates
│   │   ├── tev/                    # TEV Automation view, request & fare modals
│   │   └── travel/                 # Travel order generation & travel logs
│   ├── store/state.js              # Reactive state store & business logic
│   ├── utils/                      # Core utility engines
│   │   ├── auth.js                 # PBKDF2 / SHA-256 password hashing & sessions
│   │   ├── constants.js            # Default datasets, roles & fare matrix
│   │   ├── csvEngine.js            # CSV parsing & column mapping
│   │   ├── dateUtils.js            # Date formatting & range helpers
│   │   ├── docxEngine.js           # JSZip Word document placeholder scanner/builder
│   │   ├── pdfEngine.js            # Client-side WkPdf timetable generator
│   │   ├── storage.js              # LocalStorage & IndexedDB storage layer
│   │   └── xlsxEngine.js           # ExcelJS workbook generation for IOT/COE/CTC
│   ├── App.vue                     # Root Vue component layout
│   └── main.js                     # Vue entrypoint
├── index.html                      # HTML shell for Vite
├── package.json                    # Project scripts and dependencies
├── vite.config.js                  # Vite bundler configuration (base: './')
└── README.md
```

---

## TEV Automation (TO, IOT, COE, CTC)

The **Travel & Expenses** tab sits directly beside the **Travel Order** tab in the main navigation. Travel Order preserves the legacy four-placeholder generator; Travel & Expenses handles requests and batch document processing:

### 1. Documents Generated
- **Travel Order (TO - `.docx`)**: Fills placeholders (`{{Destination}}`, `{{Purpose}}`, `{{Date_of_Travel}}`, `{{Date_Prepared}}`, `{{REQUEST_ID}}`, `{{FARE}}`, `{{DIEM}}`, etc.) while strictly preserving official headers, fonts, and borders.
- **Itinerary of Travel (IOT - `.xlsx`)**: Populates Row 22 onwards with Date, Destination, Purpose, Departure/Arrival times, Means of Transportation, Transportation Allowance, and Per Diem. Fills header cells `F16` and `F17` with total amounts.
- **Certificate of Expenses (COE - `.xlsx`)**: Automatically populates Row 11 onwards with Date, Description, and Destination.
- **Certificate of Travel Completed (CTC - `.xlsx`)**: Injects travel details and destination into cell `C21`.

### 2. Batch Processing & ZIP Bundling
- **Complete Package (`Complete-Package-BATCH-*.zip`)**: Generates and packages individual TO `.docx` files plus consolidated IOT, COE, and CTC `.xlsx` files into a single zip.
- **Batch Excel (`Batch-Documents-BATCH-*.zip`)**: Generates consolidated IOT, COE, and CTC spreadsheets for all selected requests.
- **Single TO**: Instantly produces and downloads a standalone `.docx` Travel Order for any selected request.

### 3. Integrated Fare Matrix
- Pre-loaded with official fares across 28 Alcala barangays and regional centers (e.g., Tuguegarao City, Aparri, Baybayog).
- Selecting a destination auto-fills the standard fare.
- Clicking **Fare Matrix** lets users review or adjust destination fare rates in real-time.

### 4. Excel Import & Export
- **⬇ Export to Excel**: Backs up all TEV requests into a structured `.xlsx` workbook.
- **⬆ Import from Excel**: Reads requests directly from any Excel workbook, auto-matching columns.

### 5. Template Customization
- Built-in templates are served from `public/templates/`.
- Users can upload customized `.docx` or `.xlsx` templates at any time via the **Templates & Settings** modal. Custom templates are securely saved in IndexedDB and persist across restarts.

---

## Weekly Schedule of Activities (PNG / PDF)

- **Monday to Friday** visual layout of all planned tasks and activities.
- **Color-coded status cards**: At-risk and overdue work stay at the top.
- **Export Options**:
  - **🖼️ Download PNG Image**: 2× print-quality picture rendered offline via HTML5 canvas.
  - **📄 Download PDF**: Real vector PDF written on-the-fly with official letterhead, per-day columns, and signatory footers (*Prepared by* / *Noted by*).
  - Samples available in [`docs/Sample-Weekly-Schedule.pdf`](file:///C:/Users/LENOVO/AlcalaMABEOtracker/docs/Sample-Weekly-Schedule.pdf) and [`docs/Sample-Weekly-Schedule.png`](file:///C:/Users/LENOVO/AlcalaMABEOtracker/docs/Sample-Weekly-Schedule.png).

---

## Development & Building

Regression checks: `npm test` verifies Word placeholder replacement, calendar date modes, report ranges, and multi-page PDF generation. `node tests/browser-smoke.mjs` checks the UI and downloads with a running Vite server and Puppeteer installed. It uses an isolated browser context and saves screenshots and exports in the system temporary directory.

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm

### Setup
```bash
# Install dependencies
npm install

# Start local development server with hot-reload
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### GitHub Pages Deployment
The repository includes an automated GitHub Actions workflow at [`.github/workflows/static.yml`](file:///C:/Users/LENOVO/AlcalaMABEOtracker/.github/workflows/static.yml).

When changes are pushed to the `main` branch, GitHub Actions automatically:
1. Installs npm dependencies
2. Runs `npm run build`
3. Deploys the resulting `dist/` directory directly to GitHub Pages.

---

## Security & Master Password

- **Default Master Password**: `@EdiMAO2024`
- **Initial Login**: Sign in with master password `@EdiMAO2024` (leave username blank) to access Administrator privileges.
- User accounts and salted password hashes are stored in the workstation browser. Use the JSON backup in **Settings** for periodic backups.
