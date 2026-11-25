/* PawLink · botones que muestran/ocultan avisos o marcan casillas.
   data-hide="id|self"   oculta ese elemento (o el propio botón)
   data-show="id"        muestra ese elemento
   data-check=".sel" data-check-value="true|false"   marca o desmarca las casillas
   data-validate="id1,id2"   antes de actuar valida esos campos (PawLink.validate) y no hace nada si hay errores */
PawLink.register('reveal', function (btn) {
  btn.addEventListener('click', function () {
    var v = btn.getAttribute('data-validate');
    if (v && PawLink.validate && !PawLink.validate.fields(btn.form || btn.closest('form') || document, v.split(','))) return;
    var h = btn.getAttribute('data-hide'), s = btn.getAttribute('data-show'), c = btn.getAttribute('data-check');
    if (c) {
      var val = btn.getAttribute('data-check-value') === 'true';
      PawLink.dom.qsa(c).forEach(function (el) { el.checked = val; });
    }
    if (h) { var t = h === 'self' ? btn : PawLink.dom.byId(h); if (t) t.hidden = true; }
    if (s) { var u = PawLink.dom.byId(s); if (u) u.hidden = false; }
  });
});
