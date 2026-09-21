# ABE Office — Alcala · Work & Accomplishment Tracker — **Version B**

Single-file static web app (no server, no build step, no dependencies). **Version B = the per-user tracking
build**: on top of everything in Version A, every entry remembers **who encoded it** and **who marked it
accomplished**, and all views can be filtered/grouped by staff member. Built for **one shared office computer**.

> Version A (identical features minus attribution) stays in the sibling folder `abe-office-alcala/`.
> `version-2/` is a byte-for-byte snapshot of Version A taken just before this build.

## What's different from Version A

| | Version A | **Version B** |
|---|---|---|
| Data storage | `abe-alcala.*` browser keys | `abe-alcala-b.*` — **own records and own accounts** |
| Entry attribution | — | `Recorded by` + `Accomplished by` stamped automatically |
| Work register | filters: status, category, location, dates | **+ "Recorded by" filter incl. ⭐ My records only**, extra column |
| Dashboard | 7 KPI cards | **+ Team activity per staff member** and **My summary** (my entries, accomplished by me, my overdue) |
| Reports | KPI row, group-by category/location/personnel/status | **+ "Encoded by me" KPI**, group-by **Recorded by (staff)** and **Accomplished by (staff)** |
| CSV / report text | — | attribution columns and a "BY STAFF MEMBER" summary |
| Users table (Settings) | role, status, last sign-in | **+ Records column** (entries encoded / accomplished per account) |
| Travel Orders | — | **Word (.docx) template → filled document**, four placeholders, printable details, template up to **20 MB** kept in the browser |
| Travel marking | — | **“T” mark** on calendar days, day panel, dashboard and accounts · **travel log** · **destination on the overview** |
| Weekly schedule | — | **Monday–Friday schedule of tasks & activities** — no statuses, no travel rows — exported as an **image (PNG)** or **PDF** (or printed), offline, no external library |
| Faster encoding | — | **Activity templates**, **repeat / recurring work**, **duplicate**, **multi-select bulk actions**, **CSV import with column mapping**, **saved filters**, **undo + trash bin** |
| Evidence links | — | **Google Drive folder link on accomplished work** — a 📁 button that opens the folder in a new tab |
| Insights | — | **Insights tab** — 12-month trend, status mix and overdue aging charts, **personnel performance**, **year-over-year comparison** — plus a **printable month calendar sheet** |
| Programs, Projects & Activities | — | **“PPA Overview” tab** — upload the office PPA list as a **CSV in Settings** (no template needed) and read it as a **searchable, sortable table** with **your own columns, exactly as written** — no totals, no KPIs |
| Own rows | — | highlighted with a **"you"** chip and a soft green tint |
| Reopen an accomplished item | keeps the completion date | clears the completion credit (it is not accomplished any more) |

Because Version B uses its own storage keys, **both versions can live on the same computer without clashing** —
each keeps its own records and its own accounts. The master password is the same for both: **`@EdiMAO2024`**.

## Deploy on GitHub Pages

Either upload this folder as its own repository (recommended), or add it to an existing repository as a
sub-folder — GitHub Pages then serves it at `https://<user>.github.io/<repo>/version-b/`.

1. Upload **`index.html`** to the repository (root, or in `version-b/`).
2. **Settings → Pages → Deploy from a branch → `main` → `/ (root)`** → Save.

## Using it (one computer, several staff)

1. Sign in with the **master password** `@EdiMAO2024` (leave the username blank) → *Settings → Users & accounts → ＋ Add user*.
2. Give each person an account: **Administrator** (everything), **Encoder** (add/edit entries, settings, exports)
   or **Viewer** (read-only). Passwords are stored only as salted hashes on that computer.
3. Whoever is working opens the app, signs in, and their entries are stamped automatically.
   When finished for the day: **🔒 Lock now** or **⇄ Switch user** in the header.
4. Watch progress: dashboard → **Team activity** (who encoded what) and **My summary**;
   register → **Recorded by → ⭐ My records only**; reports → group by **Recorded by (staff)**.

**Note on older records:** entries created before accounts existed (including the built-in sample data) have no
owner and show *"not recorded"*. That is why the *My records only* filter explains itself when it comes up empty.

## Travel Orders (Word template → filled .docx)

**One-time setup:** *Settings → Travel Order template* → upload your Word **`.docx`** template. The app scans it
and tells you exactly which placeholders it found:

| Placeholder | Filled with |
|---|---|
| `{{CreationDate}}` | the creation date (e.g. *September 21, 2026*) |
| `{{Purpose}}` | the purpose text (multi-line is allowed) |
| `{{TravelDate}}` | the inclusive dates **with day count** (e.g. *September 22–24, 2026 (3 days)*) |
| `{{Destination}}` | the destination |

Placeholders can sit in normal text (e.g. `Date: {{CreationDate}}`), in tables, headers or footers. **Letter case
and extra spaces are forgiven**, and it works even when Word splits a placeholder across formatting
(`{{` + bold `Purpose` + `}}`) — a common Word quirk that breaks plain find-and-replace scripts.

**Making an order:** *Travel Order* tab → pick the creation date, type the purpose and destination, choose the
travel **from** and **to** dates. The travel-date wording (with the automatic day count) is generated for you and
can be edited if you prefer different phrasing → **Generate & download .docx**. The file lands in your Downloads
folder, ready for printing and signature. Nothing is saved in the app — keep the downloaded file.

**Included sample:** `Sample-Travel-Order-Template.docx` in this folder is a working example (letterhead, table
rows, header and footer, all four placeholders). Upload it to try the feature end-to-end, then replace it with
the office's official template — your letterhead, fonts and layout are never modified.

**Limits & notes**
- Only `.docx`. A legacy `.doc` must be re-saved with *Save as → .docx*.
- Templates **up to 20 MB** work. The file is kept in the browser's own database (IndexedDB) exactly as uploaded,
  so a heavy letterhead or scanned logo costs no extra space — the old 1.5 MB ceiling is gone.
- The template is stored **in this browser on this computer only** — nothing is uploaded anywhere. Use
  **Settings → Export template** to keep a copy or to move it to another computer (upload the exported `.docx`
  there). A JSON backup does **not** contain the template, so keep that exported file safe too.
- Very old browsers without IndexedDB fall back to ordinary browser storage, where the 1.5 MB ceiling and its
  message still apply.
- **Viewers** can open the Travel Order tab but cannot generate documents; template upload is limited to
  Administrators and Encoders.

## “T” — who is on travel (and where)

Every travel record drives a **T** mark and a **destination** everywhere it matters:

| Where | What you see |
|---|---|
| **Calendar, month view** | a violet **T** badge on every day covered by a travel (e.g. `T2` when two people are out), plus a line `🧳 Name → Destination` in the day box |
| **Calendar, day panel** | an **“On travel this day”** section listing traveller, destination, inclusive dates, day count and purpose — with edit/delete for admins and encoders |
| **Calendar, year view** | a violet strip on every day that has travel |
| **Dashboard** | **“On travel today”** KPI (with names + destinations), a **Personnel on travel** card (today + next 30 days, destination, returns/departs), **Travel this month** bars by day count, travellers marked **T** inside **Team activity**, and a line in *Today at a glance* |
| **Header** | the signed-in user’s own chip shows **T · Destination** while they are away |
| **Settings → Users & accounts** | a **Travel** column marking any account that is out today, with the destination |

**How a travel gets recorded** (two ways):
1. **Automatically when you generate a Travel Order** — the generator has a *Traveller* picker (defaults to the signed-in
   account) and an **“Also record this travel”** checkbox that is on by default. Generating then files the record.
2. **Manually** — *Travel Order tab → Travel log → ＋ Record a travel*, for orders prepared on paper.

The **Travel log** under the generator lists every record (traveller, destination, inclusive dates, days, purpose, order
date, who recorded it) with **edit** and **delete**, and can be exported to **CSV**. Records are saved with the rest of
the tracker data, survive reloads, and travel inside **JSON backups** (restore them on another computer with *Import*).

**Roles:** administrators and encoders can record, edit and delete travels; **viewers** can read the log and see the T
marks but get no add/edit/delete buttons.

> Note: if you tick “also record this travel” but give no traveller name, the document is still generated — you simply
> get a reminder that nothing was marked, because a T mark always belongs to a named person.

## Weekly schedule of activities (PNG / PDF)

The **Weekly Schedule** tab lays out one week — **Monday to Friday** — with the **tasks and activities** planned for
each day, and exports the sheet three ways. Everything is generated inside the app: no internet connection, no
add-on library.

**The sheet carries no statuses** — no *Due / Ongoing / Overdue / Accomplished* labels and no travel rows, just the
work. Colour still separates the cards so the day stays readable, and the order inside a day keeps at-risk work on top:

| What lands on the day | Card |
|---|---|
| Work that **falls due** that day | blue-tinted card |
| Work that is **past its target date** | red-tinted card, sorted first |
| Work that **runs across** the day (multi-day) | amber-tinted card (a canal repair spanning Mon–Thu shows on all four days) |
| Work already **ticked off** that day | green-tinted card, with who ticked it off |

Each card shows the activity, its category · location · personnel, and who it belongs to. Personnel **on travel** stay
marked with their **T** badge on the calendar, the day panel and the dashboard — the weekly sheet itself is only the
tasks and activities.

**Getting the file**
- **🖼️ Download PNG image** — a 2× (print-quality) picture of the whole sheet, sized to the chosen paper.
- **📄 Download PDF** — a real PDF written by the app itself: A4 landscape (default), Letter landscape or A4 portrait.
  It carries the office letterhead, week heading, per-day columns, colour-coded status cards, totals, and a
  **Prepared by / Noted by** footer with page numbers. Long weeks spill onto extra pages with `(cont.)` headings.
- **🖨️ Print** — the same sheet through the browser's print dialog if you'd rather not download.

**Controls:** `‹` / `›` step one week at a time, **This week** returns to the current one, the date box jumps to any
week (it snaps to that week's Monday), and a checkbox decides whether work that has already been ticked off is
listed or left out. There is no status summary and no counters — the sheet shows the work only.

A sample of each export sits next to this README: **`Sample-Weekly-Schedule.pdf`** and **`Sample-Weekly-Schedule.png`**.

## Faster daily encoding

Everything here is about getting a day's work into the register in seconds instead of minutes.

**🧩 Activity templates** — save a repeating activity once (title, category, location, default personnel, typical
duration, remarks) and reuse it forever.
- From any row: **🧩** saves that entry as a template. Saving the same title again just refreshes it.
- From the **Work & Accomplishments** tab: **🧩 Templates** lists them all; clicking one opens a ready-filled new
  entry with the dates already worked out from the typical duration.
- Inside the entry editor: pick a template and press **Use template** to fill the form in place.
- Settings shows how many times each template has been used, so the useful ones float to the top.

**🔁 Repeating work** — for routines (weekly meetings, monthly reports, quarterly inspections):
- While adding an entry, choose **Every week** / **Every month** and how many times in total — the whole series is
  created at once, each occurrence marked *pending* and linked to the original.
- On an existing entry, **🔁** offers *Next week* / *Next month* and adds just the next one.
- Dates move sensibly: a 31 January activity repeated monthly lands on 28 February, and the duration of the work
  is carried over.

**📄 Duplicate** — **📄** on any row opens a copy (status reset to pending, completion date cleared) so a similar
activity can be entered without retyping anything.

**Multi-select and bulk actions** — tick the boxes on the left of the list (or the header box for all shown) and a
**bulk bar** appears: *Mark accomplished*, *Reopen*, *Set category*, *Delete*. Bulk accomplishments are credited to
the signed-in account, exactly like doing it one by one.

**🗑️ Undo and the Trash bin** — nothing is deleted outright any more. Every deletion goes to **Settings → Trash bin**
first, and the toast offers **Undo** for the next few seconds. From the Trash bin you can restore an item or purge
it for good. The bin keeps the most recent 200 deletions.

**⬆️ Import from CSV** — for the lists still living in Excel or Google Sheets:
1. Save the sheet as CSV (or copy the rows) and open **⬆️ Import CSV** on the Work & Accomplishments tab.
2. The app reads the header line and **matches your columns automatically** — *Activity / Task*, *Assigned to*,
   *Target date*, *Date accomplished*, *Barangay*, *Participants*, *Remarks* and more are all recognised. Correct
   anything that was guessed wrongly from the dropdowns.
3. Check the **preview** (the first five rows, with a warning if any row has no title) and press **Import**.
- Dates are understood in the formats Excel produces: `2026-09-21`, `9/21/2026`, `21/9/2026`, `September 21, 2026`,
  `21 Sep 2026`. Status words map to the app's statuses (*Done* / *Accomplished*, *Ongoing*, *Pending*, *Cancelled*),
  and a *Recorded by* column is kept as the attribution.

**⭐ Saved filters** — set up any combination of search, quick filter, status, category, location, staff and dates,
then **＋ Save current filter** and name it (for example *My overdue items*). It appears as a chip you can apply in
one click. Saved filters live in this browser, like the rest of the interface settings.

## Insights & oversight

The **Insights** tab answers the questions an office gets asked, using only the records on this computer.

- **KPI strip** — accomplished this month (against last month), completion rate for the last 12 months, overdue
  right now with the age of the oldest item, beneficiaries served, busiest month, and how many people are involved.
- **12-month trend** — a bar per month: green for work accomplished, a lighter bar behind for work logged.
- **Status mix** — a donut of accomplished / ongoing / pending / cancelled for the period chosen in Reports.
- **Overdue aging** — how late the unfinished work is, in four buckets (1–7, 8–30, 31–90, over 90 days), with the
  oldest item named underneath. This is the list to bring to a management meeting.
- **Personnel performance** — activities, accomplished, completion %, overdue, beneficiaries, travel days and the
  average days to finish, per person, ranked by work actually accomplished. Someone is credited when their name is
  in the personnel field, when they encoded the entry, or when they ticked it off. Exportable with **⬇️ Personnel CSV**.
- **Year over year** — this year against last year: activities recorded, accomplished, completion rate,
  beneficiaries, travel orders and travel days, each with a change badge.
- **Accomplished by category** — where the effort went in the selected period.

Charts are drawn as plain SVG inside the app — no chart library, no internet, nothing to load. Everything is
read-only for **Viewers**, who can see all of it.

**🖨️ Calendar print sheet** — the Calendar tab has a **Print sheet** button that lays the month out for paper: a
real month grid, each day carrying its activities (green = accomplished, red = overdue), travel rows marked **T**,
with the office heading, month and a colour key.

## Google Drive links on accomplished work

Every accomplished task can carry a link to the **Google Drive folder** that holds its evidence — photos, reports,
signed papers — with a button that opens it in a new tab.

**How it works day to day**
1. Press **✅ Done** (or **✅ Mark accomplished** on the calendar day panel). A small dialog appears asking for the
   folder link, on top of the work's title so you know which item you are closing out.
2. Paste the address and press **📁 Save link & mark accomplished**. The app confirms what it recognised —
   *Drive folder*, *Google Doc*, *Google Sheet* — before saving. Press **Skip — no link** to accomplish the work
   without one, or **Cancel** to leave everything untouched.
3. From then on that work shows a **📁 Drive folder** button (on the register row and on the calendar day panel).
   One click opens the folder in a new tab.

**Changing or adding it later** — every entry has a **Google Drive link (optional)** field in its editor. Clear the
box to remove the button; type a new address to move it. The field warns you immediately if something is not a
usable address. (Bulk *Mark accomplished* deliberately does not pop a dialog for every row — add those links from
the editor.)

**Pasting is forgiving** — all of these are accepted:
- `drive.google.com/drive/folders/1AbC…` (no `https://` typed)
- `<https://drive.google.com/…>` copied with brackets
- a link broken across two lines by an email or chat
- Google **Docs / Sheets / Slides** links and Drive **file** links as well as folders
- any other `https://` address, if you keep evidence somewhere else

**What is refused:** anything that is not a plain web address — `javascript:`, `data:`, `file:`, bare words. The app
never fetches the link, so it can never run anything; it only stores and opens an address.

**Sharing** — the folder must be shared in Google Drive as **Anyone with the link → Viewer** for it to open on the
office computer without a Google sign-in (that reminder is printed right in the dialog). The app cannot check
sharing, and it never contacts Google: **no API key, no login, no internet needed until the moment you click**.

**Where the link lives** — inside the entry, in the same browser storage as the rest of the records. It travels in
**JSON backups**, and the **CSV export** gained a final **Google Drive link** column so the address stays clickable
in Excel. The weekly schedule, PDF exports and report text deliberately stay clean, as you asked.

## Programs, Projects & Activities (PPA) overview

The tab bar has a new **PPA Overview** tab, sitting **right after Dashboard**. It shows the office's **Programs,
Projects & Activities** list — the one your office already keeps in a spreadsheet — as a plain table **with your own
columns, exactly as written**.

**You upload it in Settings, not in the tab.** The control lives in **Settings → Programs, Projects & Activities
(PPA)**, so the new tab stays clean-looking: no upload buttons, no clutter while a program is on screen. Pick the
**.csv** and the list appears in the tab immediately.

**Nothing is invented.** There is **no starter template** — the app reads the file you give it. The **first line**
becomes the column headings, every following line becomes one row, and the headings and their order are shown
**exactly as you wrote them**. There are **no totals, no counts, no KPI cards**: as you asked, it is a table.

* **Your columns, in your order** — in the sample that is `Program · Project · Activity · Status · Location ·
  Fund Source · Budget · Beneficiaries · Responsible`, but the app never renames, reorders or sums anything.
* **Search** — one box looks in **every column** at once. `canal` finds the canal-lining activity, `engr. c`
  finds everything that official touches. A count line says how many of how many rows are showing, and a search
  with no hits says so plainly instead of showing an empty page.
* **Sortable headings** — click a heading to sort, click again to reverse; an arrow marks the active column.
  Money sorts **as a number**, so `45000`, `"1,020,000"` and `"2 000 000"` come out in the correct order.
* **Quoted commas stay together** — `"Rehabilitation of communal irrigation, phase 2"` stays one cell and the rest
  of the row keeps its columns aligned.
* **Duplicate headings are told apart** — two columns called *Remarks* show as **Remarks** and **Remarks (2)**.
* **Big lists are fine** — up to **5,000 rows × 40 columns** are read (a few hundred is typical). The table draws
  the first 400 rows and tells you when there are more.
* **Replace or remove any time** — a new CSV replaces the list; **Remove the list** clears it. The PPA tab goes
  back to its short "upload it in Settings" note.
* **A bad file changes nothing** — a file that cannot be read is refused **with the reason** (empty file, headings
  line only, too many columns) and the list you already have stays exactly as it was.

**Excel / Google Sheets** — save the sheet as **CSV (Comma delimited)** in Excel, or *File → Download → CSV* in
Google Sheets; that reminder is printed in Settings next to the upload box.

**Who can do what** — administrators and encoders can upload, replace or remove the list; **viewers can read and
search** it, but their upload control is disabled and the remove button is hidden.

**Where the list lives** — in this browser on this computer, in the same storage as the rest of the records, and it
travels in **JSON backups** with everything else. The other exports (CSV, PDF, weekly sheet, report text) are not
touched by it.

## Everything from Version A is still here

Dashboard (KPIs, 8-month trend, status donut, needs-attention list), the work register with search/quick
filters/sorts, the **calendar** (day panel showing accomplished vs unfinished work for the clicked date, year
view, month KPIs), reports with printing and "copy report text", accounts with roles, master-password recovery,
JSON backup/restore, CSV export, `data.json` for the repo, dark mode and responsive/mobile layout.

## Backups

*Settings → Backup (JSON)* includes the entries, **the accounts** and the **uploaded PPA list**, so restoring on
another computer carries the records, the sign-in accounts and the PPA table over. Keep a weekly backup — that is also how you move data to a
second computer.

## Honest limitation

Accounts, roles and attribution live in the browser on that one computer; they are privacy and bookkeeping
conveniences, **not security**. Anyone who can read the file (or the browser's saved data) can see the records.
For sensitive data you would need hosting with real server-side authentication.
