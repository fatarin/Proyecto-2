/* PawLink · núcleo. Define el espacio de nombres `PawLink` y arranca los módulos.
   Uso en HTML:  <div data-module="nav-toggle other-module"> …
   Uso en JS:    PawLink.register('nombre', function (el) { … });
   Cada módulo se inicia una sola vez por elemento. Scripts clásicos (funcionan con doble clic, sin servidor). */
(function (w, d) {
  var PL = w.PawLink = w.PawLink || {};
  PL.modules = {};
  /* VERSIÓN BACKUP COMPLETA (21/11/2026): filtros y validación de formularios ACTIVOS (en la entrega del 18/11/2026 estaban desactivados).
     Poner a false para desactivar los filtros (ver LEEME-MOCKDATA.md, apartado 3). */
  PL.FILTROS_ACTIVOS = true;
  PL.register = function (name, fn) { PL.modules[name] = fn; };
  PL.init = function (root) {
    var els = (root || d).querySelectorAll('[data-module]'), i, j, names, el, n;
    for (i = 0; i < els.length; i++) {
      el = els[i];
      names = el.getAttribute('data-module').split(/\s+/);
      el.__plDone = el.__plDone || {};
      for (j = 0; j < names.length; j++) {
        n = names[j];
        if (!n || el.__plDone[n]) continue;
        if (!PL.modules[n]) { if (w.console) console.warn('PawLink: módulo no cargado →', n); continue; }
        el.__plDone[n] = true;
        PL.modules[n](el);
      }
    }
  };
  /* Los scripts con defer se ejecutan en orden antes de DOMContentLoaded: todos los módulos ya están registrados. */
  if (d.readyState === 'complete') PL.init();
  else d.addEventListener('DOMContentLoaded', function () { PL.init(); });
})(window, document);
