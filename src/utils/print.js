// Select a single Vue view or sheet for the browser's print layout.
export function printArea(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('print-target');
  document.body.classList.add('printing-area');
  const clean = () => {
    target.classList.remove('print-target');
    document.body.classList.remove('printing-area');
    window.removeEventListener('afterprint', clean);
  };
  window.addEventListener('afterprint', clean);
  try { window.print(); } finally { clean(); }
}
