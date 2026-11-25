/* PawLink · sesión de prueba del prototipo (se sustituirá por la sesión real del backend).
   Elementos: [data-sw="rol"] (selector de pruebas), [data-login="rol"], [data-logout]. Módulo en <body>.
   Un botón de envío con data-login solo inicia sesión cuando el formulario valida (evento pawlink:valid). */
PawLink.register('session', function () {
  var K = 'pawlink.session', R = document.documentElement, S = PawLink.storage;
  function set(v) {
    if (v === 'visitante') S.remove(K); else S.set(K, v);
    R.setAttribute('data-sess', v);
  }
  function validated(t) {
    var f = t.form || (t.closest ? t.closest('form') : null);
    return t.type === 'submit' && f && /(^|\s)form-validator(\s|$)/.test(f.getAttribute('data-module') || '');
  }
  PawLink.dom.delegate(document, 'click', '[data-sw],[data-login],[data-logout]', function (e, t) {
    if (t.hasAttribute('data-sw')) set(t.getAttribute('data-sw'));
    else if (t.hasAttribute('data-login')) { if (!validated(t)) set(t.getAttribute('data-login')); }
    else set('visitante');
  });
  document.addEventListener('pawlink:valid', function (e) {
    var s = e.detail && e.detail.submitter;
    if (s && s.hasAttribute && s.hasAttribute('data-login')) set(s.getAttribute('data-login'));
  });
});
