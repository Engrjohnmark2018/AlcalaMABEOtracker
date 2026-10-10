import { MONTHS, DOW, DOW_S } from './constants.js';
import { fromISO, toISO, addDays, isDate, todayISO, fmtLong } from './dateUtils.js';

export const WK_PAPER = {
  a4l: { w: 842, h: 595, label: 'A4 landscape' },
  letterl: { w: 792, h: 612, label: 'Letter landscape' },
  a4p: { w: 595, h: 842, label: 'A4 portrait' }
};

export const WK_KIND = {
  late: { order: 0, css: '#b91c1c', bg: '#fdeaea', rgb: [185, 28, 28], bgrgb: [253, 234, 234] },
  due: { order: 1, css: '#1d4ed8', bg: '#e8efff', rgb: [29, 78, 216], bgrgb: [232, 239, 255] },
  ongoing: { order: 2, css: '#b45309', bg: '#fdf2e4', rgb: [180, 83, 9], bgrgb: [253, 242, 228] },
  done: { order: 3, css: '#15803d', bg: '#e7f6ec', rgb: [21, 128, 61], bgrgb: [231, 246, 236] }
};

export const WK_COL = {
  ink: [15, 27, 38],
  muted: [107, 124, 143],
  line: [214, 222, 232],
  soft: [248, 250, 252],
  brand: [20, 83, 45],
  brand2: [31, 122, 67],
  headBg: [20, 83, 45],
  white: [255, 255, 255]
};

export function wkMonday(iso) {
  const d = fromISO(isDate(iso) ? iso : todayISO());
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return toISO(d);
}

export const wkDates = (monISO) => [0, 1, 2, 3, 4].map((i) => addDays(monISO, i));

export const wkRangeLabel = (monISO) => {
  const a = fromISO(monISO);
  const b = fromISO(addDays(monISO, 4));
  const left = MONTHS[a.getMonth()] + ' ' + a.getDate();
  const right = (a.getMonth() !== b.getMonth() ? MONTHS[b.getMonth()] + ' ' : '') + b.getDate();
  return left + ' \u2013 ' + right + ', ' + b.getFullYear();
};

export const wkFileStamp = (monISO) => monISO + '_to_' + addDays(monISO, 4);

export function weekItemsForDay(iso, entries, opts) {
  const out = [];
  const today = todayISO();
  (entries || []).forEach((e) => {
    if (e.status === 'cancel') return;
    if (e.status === 'done') {
      if (opts.accomplished !== false && e.completedDate === iso) {
        out.push({
          kind: 'done',
          title: e.title,
          meta: [e.category, e.location, e.personnel].filter(Boolean).join(' · '),
          by: e.completedByName,
          entry: e
        });
      }
      return;
    }
    const isOverdue = e.dueDate && e.dueDate < today;
    if (e.dueDate === iso) {
      out.push({
        kind: isOverdue ? 'late' : 'due',
        title: e.title,
        meta: [e.category, e.location, e.personnel].filter(Boolean).join(' · '),
        by: e.createdByName,
        entry: e
      });
    } else if (isDate(e.startDate) && isDate(e.dueDate) && e.startDate <= iso && iso <= e.dueDate) {
      out.push({
        kind: 'ongoing',
        title: e.title,
        meta: [e.category, e.location, e.personnel].filter(Boolean).join(' · '),
        by: e.assignedToName || e.personnel || e.createdByName,
        entry: e
      });
    } else if (!isDate(e.dueDate) && e.startDate === iso) {
      out.push({
        kind: 'due',
        title: e.title,
        meta: [e.category, e.location, e.personnel].filter(Boolean).join(' · '),
        by: e.createdByName,
        entry: e
      });
    }
  });

  out.sort((a, b) => (WK_KIND[a.kind].order - WK_KIND[b.kind].order) || a.title.localeCompare(b.title));
  return out;
}

export function weekScheduleData(monISO, entries, opts) {
  const days = wkDates(monISO).map((iso) => ({
    iso,
    dow: DOW[fromISO(iso).getDay()],
    short: DOW_S[fromISO(iso).getDay()],
    label: MONTHS[fromISO(iso).getMonth()].slice(0, 3) + ' ' + fromISO(iso).getDate(),
    items: weekItemsForDay(iso, entries, opts || {})
  }));
  const all = days.reduce((acc, d) => acc.concat(d.items), []);
  const count = (k) => all.filter((x) => x.kind === k).length;
  return {
    mon: monISO,
    label: wkRangeLabel(monISO),
    days,
    total: all.length,
    done: count('done'),
    due: count('due'),
    late: count('late'),
    ongoing: count('ongoing')
  };
}

export function pdfCharWidth(ch, bold) {
  if (ch === ' ' || ch === '.' || ch === ',' || ch === ':' || ch === ';') return 278;
  if (ch === 'i' || ch === 'l' || ch === 'I' || ch === '!') return 278;
  if (ch === 'j' || ch === 'f' || ch === 'r' || ch === 't') return bold ? 389 : 333;
  if (ch === 'm' || ch === 'M' || ch === 'w' || ch === 'W') return bold ? 944 : 889;
  if (ch >= 'A' && ch <= 'Z') return bold ? 722 : 667;
  if (ch >= '0' && ch <= '9') return bold ? 611 : 556;
  if (ch >= 'a' && ch <= 'z') return bold ? 611 : 556;
  return bold ? 600 : 556;
}

export function pdfMeasure(str, size, bold) {
  let w = 0;
  const s = String(str == null ? '' : str);
  for (let i = 0; i < s.length; i++) w += pdfCharWidth(s[i], bold);
  return (w / 1000) * size;
}

export function pdfSafe(str) {
  return String(str || '')
    .replace(/[\\()]/g, '\\$&')
    .replace(/\r?\n/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

export function wkWrap(str, maxW, size, bold, measure) {
  const words = String(str || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  words.forEach((word) => {
    const test = cur ? cur + ' ' + word : word;
    if (measure(test, size, bold) <= maxW || !cur) cur = test;
    else {
      lines.push(cur);
      cur = word;
    }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

export function wkEllipsis(str, maxW, size, bold, measure) {
  let t = String(str || '');
  if (measure(t, size, bold) <= maxW) return t;
  while (t.length > 4 && measure(t + '\u2026', size, bold) > maxW) t = t.slice(0, -1);
  return t + '\u2026';
}

export function wkItemHeight(item, w, measure) {
  const titleLines = wkWrap(item.title, w - 10, 8.5, true, measure).length;
  const metaLines = item.meta ? wkWrap(item.meta, w - 10, 7.2, false, measure).length : 0;
  const byLines = item.by ? 1 : 0;
  return 8 + titleLines * 10.4 + 3 + metaLines * 8.6 + byLines * 8.4 + 4;
}

export function wkItemBox(item, x, y, w, h, measure) {
  const kind = WK_KIND[item.kind];
  const titleLines = wkWrap(item.title, w - 10, 8.5, true, measure);
  const metaLines = item.meta ? wkWrap(item.meta, w - 10, 7.2, false, measure) : [];
  let ty = y + 10;
  const lines = titleLines.map((t) => {
    const o = { text: t, x: x + 5, y: ty, size: 8.5, bold: true, color: 'ink' };
    ty += 10.4;
    return o;
  });
  metaLines.forEach((t) => {
    lines.push({ text: t, x: x + 5, y: ty, size: 7.2, bold: false, color: 'muted' });
    ty += 8.6;
  });
  if (item.by) {
    lines.push({ text: wkEllipsis('by ' + item.by, w - 10, 6.8, false, measure), x: x + 5, y: ty, size: 6.8, bold: false, color: 'muted' });
    ty += 8.4;
  }
  return {
    kind: item.kind,
    css: kind.css,
    bg: kind.bg,
    rgb: kind.rgb,
    bgrgb: kind.bgrgb,
    lines,
    x,
    y,
    w,
    h
  };
}

export function buildWeeklyRender(data, settings, authName, opts, measure) {
  const paper = WK_PAPER[opts.paper] || WK_PAPER.a4l;
  const W = paper.w, H = paper.h;
  const M = 32;
  const header = {
    office: settings.officeName || 'ABE Office — Alcala',
    tagline: settings.tagline || 'Agricultural and Biosystems Engineering Services',
    title: 'WEEKLY SCHEDULE OF ACTIVITIES',
    week: data.label,
    range: 'Monday \u2013 Friday'
  };
  const headH = 84;
  const footH = 62;
  const cols = 5, gap = 8;
  const colW = (W - M * 2 - gap * (cols - 1)) / cols;
  const top = M + headH;
  const bottom = H - M - footH;
  const dayHeadH = 30;

  const itemW = colW - 16;
  const fit = (items, from, avail) => {
    let y = 0, n = 0;
    for (let i = from; i < items.length; i++) {
      const h = wkItemHeight(items[i], itemW, measure);
      if (y + h > avail && n > 0) break;
      y += h + 5;
      n++;
    }
    return n;
  };
  const avail = bottom - (top + dayHeadH);

  const pages = [];
  const cursor = [0, 0, 0, 0, 0];
  let guard = 0;
  while (guard++ < 40) {
    const page = { cols: [], any: false };
    for (let c = 0; c < cols; c++) {
      const day = data.days[c], from = cursor[c];
      const n = fit(day.items, from, avail);
      if (n > 0) page.any = true;
      const items = [];
      let y = top + dayHeadH;
      for (let i = from; i < from + n; i++) {
        const h = wkItemHeight(day.items[i], itemW, measure);
        items.push(wkItemBox(day.items[i], M + c * (colW + gap) + 8, y, itemW, h, measure));
        y += h + 5;
      }
      cursor[c] = from + n;
      page.cols.push({
        day,
        x: M + c * (colW + gap),
        y: top,
        w: colW,
        h: bottom - top,
        headH: dayHeadH,
        cont: from > 0,
        items,
        more: day.items.length - cursor[c]
      });
    }
    pages.push(page);
    if (cursor.every((c, i) => c >= data.days[i].items.length)) break;
    if (!page.any) break;
  }

  const footer = {
    preparedBy: authName || 'ABE Staff',
    generated: 'Generated ' + fmtLong(todayISO()),
    notedBy: 'Noted by:'
  };
  footer.preparedLine = wkEllipsis('Prepared by: ' + footer.preparedBy, 186, 9, false, measure);
  footer.notedLine = wkEllipsis('Noted by: ______________________', 186, 9, false, measure);

  return { paper, w: W, h: H, m: M, header, headH, footH, top, bottom, colW, gap, pages, footer, data };
}

export function WkPdf(w, h) {
  this.w = w;
  this.h = h;
  this.pages = [];
  this.cur = null;
  this.newPage();
}
WkPdf.prototype.newPage = function () {
  this.cur = { ops: [] };
  this.pages.push(this.cur);
  return this.cur;
};
WkPdf.prototype.Y = function (y) {
  return this.h - y;
};
WkPdf.prototype.op = function (s) {
  this.cur.ops.push(s);
};
WkPdf.prototype.text = function (x, y, str, o = {}) {
  const size = o.size || 9;
  const font = o.bold ? 'F2' : o.italic ? 'F3' : 'F1';
  const col = (o.color || WK_COL.ink).map((v) => (v / 255).toFixed(3)).join(' ');
  const txt = pdfSafe(str);
  if (!txt) return;
  const xx = o.right ? x - pdfMeasure(txt, size, o.bold) : o.center ? x - pdfMeasure(txt, size, o.bold) / 2 : x;
  this.op(col + ' rg BT /' + font + ' ' + size + ' Tf ' + xx.toFixed(2) + ' ' + this.Y(y).toFixed(2) + ' Td (' + txt + ') Tj ET');
};
WkPdf.prototype.rect = function (x, y, w, h, o = {}) {
  if (o.fill) this.op(o.fill.map((v) => (v / 255).toFixed(3)).join(' ') + ' rg');
  if (o.stroke) this.op(o.stroke.map((v) => (v / 255).toFixed(3)).join(' ') + ' RG ' + (o.lw || 0.7) + ' w');
  this.op(
    x.toFixed(2) + ' ' + this.Y(y + h).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re ' +
    (o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S')
  );
};
WkPdf.prototype.line = function (x1, y1, x2, y2, o = {}) {
  this.op(
    (o.color || WK_COL.line).map((v) => (v / 255).toFixed(3)).join(' ') + ' RG ' + (o.lw || 0.7) + ' w ' +
    x1.toFixed(2) + ' ' + this.Y(y1).toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + this.Y(y2).toFixed(2) + ' l S'
  );
};
WkPdf.prototype.serialize = function () {
  const objs = [];
  const enc = (s) => {
    const str = String(s).replace(/[^\u0000-\u00FF]/g, '?');
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  };
  const fontObjs = [
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>'
  ];
  const nPages = this.pages.length;
  const firstPageObj = 6;
  const kids = [];
  for (let i = 0; i < nPages; i++) kids.push(firstPageObj + i * 2 + ' 0 R');
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + nPages + ' >>';
  objs[3] = fontObjs[0];
  objs[4] = fontObjs[1];
  const fontIds = { F1: 3, F2: 4, F3: 5 };
  objs[5] = fontObjs[2];
  for (let i = 0; i < nPages; i++) {
    const pageId = firstPageObj + i * 2;
    const contentId = pageId + 1;
    const content = this.pages[i].ops.join('\n');
    objs[pageId] =
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + this.w + ' ' + this.h + '] ' +
      '/Resources << /Font << /F1 ' + fontIds.F1 + ' 0 R /F2 ' + fontIds.F2 + ' 0 R /F3 ' + fontIds.F3 + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>';
    objs[contentId] = { stream: content };
  }
  let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];
  const ids = Object.keys(objs).filter((k) => objs[k] != null).map(Number).sort((a, b) => a - b);
  const maxId = ids[ids.length - 1];
  ids.forEach((id) => {
    offsets[id] = out.length;
    const o = objs[id];
    if (o && typeof o === 'object' && o.stream !== undefined) {
      out += id + ' 0 obj\n<< /Length ' + enc(o.stream).length + ' >>\nstream\n' + o.stream + '\nendstream\nendobj\n';
    } else {
      out += id + ' 0 obj\n' + o + '\nendobj\n';
    }
  });
  const xrefPos = out.length;
  out += 'xref\n0 ' + (maxId + 1) + '\n0000000000 65535 f \n';
  for (let id = 1; id <= maxId; id++) {
    out += offsets[id] !== undefined ? String(offsets[id]).padStart(10, '0') + ' 00000 n \n' : '0000000000 65535 f \n';
  }
  out += 'trailer\n<< /Size ' + (maxId + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n';
  return enc(out);
};

export function generateWeeklyPdf(data, settings, authName, opts) {
  const r = buildWeeklyRender(data, settings, authName, opts, pdfMeasure);
  const pdf = new WkPdf(r.w, r.h);
  r.pages.forEach((page, pi) => {
    if (pi > 0) pdf.newPage();
    // Header
    pdf.rect(0, 0, r.w, 6, { fill: WK_COL.brand });
    pdf.text(r.m, r.m + 14, r.header.office, { size: 15, bold: true, color: WK_COL.brand });
    pdf.text(r.m, r.m + 28, r.header.tagline, { size: 9, color: WK_COL.muted });
    pdf.text(r.m, r.m + 54, r.header.title, { size: 17, bold: true });
    pdf.text(r.m, r.m + 70, r.header.week + '  ·  ' + r.header.range, { size: 10, color: WK_COL.brand2 });
    pdf.line(r.m, r.m + 80, r.w - r.m, r.m + 80, { color: WK_COL.line });

    // Day columns
    page.cols.forEach((col) => {
      pdf.rect(col.x, col.y, col.w, col.headH, { fill: WK_COL.headBg });
      pdf.text(col.x + 7, col.y + 12, col.day.dow.toUpperCase() + (col.cont ? ' (cont.)' : ''), { size: 10.5, bold: true, color: WK_COL.white });
      pdf.text(col.x + 7, col.y + 24, col.day.label, { size: 9, color: WK_COL.white });
      pdf.rect(col.x, col.y + col.headH, col.w, col.h - col.headH, { fill: [252, 253, 254], stroke: WK_COL.line });
      col.items.forEach((box) => {
        pdf.rect(box.x, box.y, box.w, box.h, { fill: box.bgrgb, stroke: box.rgb, lw: 0.7 });
        pdf.rect(box.x, box.y, 2.6, box.h, { fill: box.rgb });
        box.lines.forEach((ln) =>
          pdf.text(ln.x, ln.y, ln.text, {
            size: ln.size,
            bold: ln.bold,
            color: ln.color === 'ink' ? WK_COL.ink : WK_COL.muted
          })
        );
      });
      if (col.more > 0) pdf.text(col.x + 7, col.y + col.h - 10, '+ ' + col.more + ' more on next page', { size: 8, italic: true, color: WK_COL.muted });
    });

    // Footer
    const fy = r.h - r.m - r.footH + 14;
    pdf.line(r.m, fy - 10, r.w - r.m, fy - 10, { color: WK_COL.line });
    pdf.text(r.m, fy + 2, r.footer.preparedLine, { size: 9 });
    pdf.line(r.m, fy + 10, r.m + 190, fy + 10, { color: WK_COL.muted });
    pdf.text(r.m + 210, fy + 2, r.footer.notedBy, { size: 9 });
    pdf.line(r.m + 210, fy + 10, r.m + 400, fy + 10, { color: WK_COL.muted });
    pdf.text(r.w - r.m, fy + 2, r.footer.generated + ' · page ' + (pi + 1) + ' of ' + r.pages.length, { size: 8, color: WK_COL.muted, right: true });
  });
  return pdf.serialize();
}
