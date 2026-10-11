// Select a single Vue view or sheet for the browser's print layout.
export function printArea(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('print-target');
  document.body.classList.add('printing-area');
  let cleaned = false;
  const clean = () => {
    if (cleaned) return;
    cleaned = true;
    target.classList.remove('print-target');
    document.body.classList.remove('printing-area');
    window.removeEventListener('afterprint', clean);
  };

  window.addEventListener('afterprint', clean);

  // Fallback cleanup if afterprint doesn't fire
  setTimeout(clean, 60000);

  // Give the browser time to paint and recalculate styles before triggering print
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        window.print();
      } catch {
        clean();
      }
    }, 20);
  });
}
