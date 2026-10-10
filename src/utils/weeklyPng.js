import { buildWeeklyRender, WK_COL } from './pdfEngine.js';

export async function generateWeeklyPng(data, settings, authName, opts, scale = 2) {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser.');
  const measure = (s, size, bold) => { ctx.font = `${bold ? 'bold ' : ''}${size}px Arial, sans-serif`; return ctx.measureText(String(s)).width; };
  const r = buildWeeklyRender(data, settings, authName, opts, measure);
  canvas.width = Math.round(r.w * scale);
  canvas.height = Math.round(r.h * scale * r.pages.length);
  ctx.scale(scale, scale);
  const rgb = a => `rgb(${a.join(',')})`;
  const text = (s, x, y, size, bold = false, color = 'ink') => {
    ctx.fillStyle = rgb(WK_COL[color]); ctx.font = `${bold ? 'bold ' : ''}${size}px Arial, sans-serif`; ctx.fillText(s, x, y);
  };
  r.pages.forEach((page, index) => {
    ctx.save(); ctx.translate(0, index * r.h);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, r.w, r.h);
    ctx.fillStyle = rgb(WK_COL.brand); ctx.fillRect(0, 0, r.w, 6);
    text(r.header.office,r.m,r.m+18,15,true,'brand');
    text(r.header.tagline,r.m,r.m+32,9,false,'muted');
    text(r.header.title,r.m,r.m+58,17,true);
    text(r.header.week+' · '+r.header.range,r.m,r.m+74,10,false,'brand2');
    page.cols.forEach(col => {
      ctx.fillStyle = rgb(WK_COL.soft); ctx.fillRect(col.x,col.y,col.w,col.h);
      ctx.strokeStyle = rgb(WK_COL.line); ctx.lineWidth = .6; ctx.strokeRect(col.x,col.y,col.w,col.h);
      ctx.fillStyle = rgb(WK_COL.brand); ctx.fillRect(col.x,col.y,col.w,col.headH);
      text(col.day.dow.toUpperCase()+(col.cont?' (cont.)':''),col.x+8,col.y+13,10.5,true,'white');
      text(col.day.label,col.x+8,col.y+25,9,false,'white');
      col.items.forEach(box => {
        ctx.fillStyle = box.bg; ctx.fillRect(box.x,box.y,box.w,box.h);
        ctx.strokeStyle = box.css; ctx.strokeRect(box.x,box.y,box.w,box.h);
        ctx.fillStyle = box.css; ctx.fillRect(box.x,box.y,2.6,box.h);
        box.lines.forEach(ln=>text(ln.text,ln.x,ln.y,ln.size,ln.bold,ln.color));
      });
      if (!col.items.length) text('No scheduled work',col.x+8,col.y+col.headH+16,8,false,'muted');
    });
    const fy = r.h-r.m-r.footH+14;
    ctx.strokeStyle = rgb(WK_COL.line); ctx.beginPath(); ctx.moveTo(r.m,fy-10); ctx.lineTo(r.w-r.m,fy-10); ctx.stroke();
    text(r.footer.preparedLine,r.m,fy+6,9);
    text(r.footer.notedLine,r.m+210,fy+6,9);
    text(r.footer.generated,r.m,fy+38,8,false,'muted');
    text(`Page ${index+1} of ${r.pages.length}`,r.w-r.m-70,fy+38,8,false,'muted');
    ctx.restore();
  });
  const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if (!blob) throw new Error('PNG export failed.');
  return new Uint8Array(await blob.arrayBuffer());
}
