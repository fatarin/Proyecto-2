/* PawLink · avisos (toasts) no bloqueantes. Módulo en <body>.
   PawLink.toast.show('Texto', {type:'ok|error|info', timeout:5000})
   PawLink.toast.flash('Texto', 'ok')  → se muestra en la SIGUIENTE página (sessionStorage), útil antes de navegar. */
(function () {
  var KEY = 'pawlink.flash', box = null;
  function region() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Avisos');
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
    return box;
  }
  function remove(t) { if (t.parentNode) t.parentNode.removeChild(t); }
  var api = {
    show: function (msg, o) {
      o = o || {};
      var t = document.createElement('div'), type = o.type || 'ok', b = document.createElement('button'), p = document.createElement('p');
      t.className = 'toast toast--' + type;
      p.textContent = msg;
      b.type = 'button'; b.className = 'toast-x'; b.setAttribute('aria-label', 'Cerrar aviso'); b.textContent = '×';
      b.addEventListener('click', function () { remove(t); });
      t.appendChild(p); t.appendChild(b);
      region().appendChild(t);
      var ms = o.timeout === undefined ? 5000 : o.timeout;
      if (ms > 0) setTimeout(function () { remove(t); }, ms);
      return t;
    },
    flash: function (msg, type) {
      try { sessionStorage.setItem(KEY, JSON.stringify({ msg: msg, type: type || 'ok' })); } catch (e) {}
    }
  };
  PawLink.toast = api;
  PawLink.register('toast', function () {
    var f = null;
    try { f = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (f && f.msg) api.show(f.msg, { type: f.type });
  });
})();

/* Enlaces de simulación: <a href="#" data-sim="Mensaje"> no navega; muestra el aviso (acciones que el prototipo no implementa). */
document.addEventListener('click', function (ev) {
  var a = ev.target.closest ? ev.target.closest('a[data-sim]') : null; if (!a) return;
  ev.preventDefault();
  if (window.PawLink && PawLink.toast) PawLink.toast.show(a.getAttribute('data-sim'), { type: 'info' });
});
