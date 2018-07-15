export function getViewportSize() {
  let e = window
  let a = 'inner';

  if (!('innerWidth' in window)) {
    a = 'client';
    e = document.documentElement || document.body;
  }

  return { width: e[a + 'Width'], height: e[a + 'Height'] };
}
