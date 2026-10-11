import JSZip from 'jszip';
import { TO_DOCX_MIME, TO_MAX_BYTES } from './storage.js';
import { formatDatePrepared } from './dateUtils.js';

export const TO_FIELDS = ['CreationDate', 'Purpose', 'TravelDate', 'Destination'];

export function xmlEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function scanPlaceholders(xml) {
  const out = {};
  for (const paragraph of xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) || []) {
    const text = [...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => m[1]).join('');
    for (const m of text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
      const key = m[1].trim();
      out[key] = (out[key] || 0) + 1;
    }
  }
  return out;
}

export function replacePlaceholders(xml, map) {
  const values = Object.fromEntries(Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]));
  return xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, paragraph => {
    let offset = 0;
    const nodes = [...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => {
      const node = { start: offset, end: offset + m[1].length, text: m[1] };
      offset = node.end;
      return node;
    });
    const text = nodes.map(n => n.text).join('');
    // Work backwards so original character offsets remain valid. Remove only
    // placeholder text, preserving every run, style, bookmark and XML tag.
    const matches = [...text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].reverse();
    for (const m of matches) {
      const key = m[1].trim().toLowerCase();
      if (!Object.hasOwn(values, key)) continue;
      const start = m.index, end = start + m[0].length;
      const replacement = xmlEsc(values[key]).replace(/\r?\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
      for (const node of nodes) {
        if (node.end <= start || node.start >= end) continue;
        const a = Math.max(0, start - node.start), b = Math.min(node.end, end) - node.start;
        node.text = node.text.slice(0, a) + (node.start <= start ? replacement : '') + node.text.slice(b);
      }
    }
    let index = 0;
    return paragraph.replace(/<w:t\b([^>]*)>[\s\S]*?<\/w:t>/g, (_, attrs) => `<w:t${/xml:space=/.test(attrs) ? attrs : attrs + ' xml:space="preserve"'}>${nodes[index++].text}</w:t>`);
  });
}

export function toXmlPaths(zip) {
  return Object.keys(zip.files).filter((p) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(p)).sort();
}

export async function toInspect(ab) {
  if (ab.byteLength > TO_MAX_BYTES) throw new Error('Template must be no larger than 20 MB.');
  const zip = await JSZip.loadAsync(ab);
  const paths = toXmlPaths(zip);
  if (!zip.file('word/document.xml')) throw new Error('Not a valid Word .docx file.');
  const counts = {}, perFile = {};
  for (const p of paths) {
    const xml = await zip.file(p).async('string');
    const c = scanPlaceholders(xml);
    perFile[p] = c;
    Object.keys(c).forEach((k) => { counts[k] = (counts[k] || 0) + c[k]; });
  }
  const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
  const allKnown = [...TO_FIELDS, 'Date_Prepared', 'Date_of_Travel', 'REQUEST_ID', 'BATCH_ID', 'ROUTE', 'TRANSPORTATION', 'FARE', 'DIEM'];
  const found = allKnown.filter((f) => Object.keys(counts).some((k) => eq(k, f)));
  const missing = TO_FIELDS.filter((f) => !found.some((x) => eq(x, f)));
  const extra = Object.keys(counts).filter((k) => !allKnown.some((f) => eq(f, k)));
  return { paths: paths.length, counts, found, missing, extra };
}

export async function buildTravelDocx(ab, values) {
  if (typeof JSZip === 'undefined') throw new Error('JSZip library did not load.');
  const mergedValues = { ...values };
  for (const k of Object.keys(mergedValues)) {
    if (k.toLowerCase() === 'date_prepared') {
      mergedValues[k] = formatDatePrepared(mergedValues[k]);
    }
  }
  const zip = await JSZip.loadAsync(ab);
  const paths = toXmlPaths(zip);
  if (!paths.length) throw new Error('Not a valid Word .docx file (no document part found).');
  const used = {};
  for (const p of paths) {
    const xml = await zip.file(p).async('string');
    const before = scanPlaceholders(xml);
    Object.keys(before).forEach((k) => { used[k] = (used[k] || 0) + before[k]; });
    zip.file(p, replacePlaceholders(xml, mergedValues));
  }
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: TO_DOCX_MIME });
  const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
  const keys = Object.keys(mergedValues);
  const replaced = keys.filter((k) => Object.keys(used).some((u) => eq(u, k)));
  const missing = keys.filter((k) => !Object.keys(used).some((u) => eq(u, k)));
  return { bytes, replaced, missing, files: paths.length };
}
