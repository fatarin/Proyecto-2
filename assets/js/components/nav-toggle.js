/* PawLink · menú hamburguesa de la cabecera (≤900 px). Se aplica sobre `.hd` con data-module="nav-toggle".
   Botón .hd-burger con aria-expanded/aria-controls. Cierra con Esc (devuelve el foco al botón), clic fuera,
   clic en un enlace del menú y al pasar a pantalla ancha. Mientras está abierto, Tab no sale de la cabecera.
   Sin JS el CSS deja el menú desplegado (la clase `js` la pone core/boot.js). */
PawLink.register('nav-toggle', function (hd) {
  var btn = hd.querySelector('.hd-burger');
  if (!btn) return;
  var open = false, mq = window.matchMedia ? window.matchMedia('(max-width:900px)') : null;

  function set(state, giveFocus) {
    open = state;
    hd.classList.toggle('is-open', state);
    btn.setAttribute('aria-expanded', state ? 'true' : 'false');
    btn.setAttribute('aria-label', state ? 'Cerrar el menú de navegación' : 'Abrir el menú de navegación');
    if (!state && giveFocus) btn.focus();
  }

  btn.addEventListener('click', function () { set(!open); });

  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape' || e.key === 'Esc') { set(false, true); return; }
    if (e.key !== 'Tab') return;
    var f = PawLink.dom.focusables(hd);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('click', function (e) { if (open && !hd.contains(e.target)) set(false); });
  hd.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (open && a) set(false);
  });

  function onChange(e) { if (!e.matches && open) set(false); }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange); }

  set(false);
});
