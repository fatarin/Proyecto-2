/* PawLink · modales de confirmación y avisos.
   PawLink.modal.confirm({title, text, ok, cancel, tone:'danger', trigger, onOk, onCancel})
   PawLink.modal.notice({title, text, ok, trigger})
   Atributos en un enlace o botón (data-module="confirm-action"):
     data-confirm="Texto"  data-confirm-title  data-confirm-ok  data-confirm-cancel  data-confirm-tone="danger"  data-confirm-message="Aviso tras confirmar (si no navega ni envía)"
   Accesibilidad: role="dialog" aria-modal, foco dentro (Tab atrapado), Esc y clic en el fondo cierran, el foco vuelve al origen. */
(function () {
  var n = 0, current = null;

  function close(m, result) {
    if (!m || m.closed) return;
    m.closed = true;
    document.removeEventListener('keydown', m.onKey, true);
    if (m.root.parentNode) m.root.parentNode.removeChild(m.root);
    document.documentElement.classList.remove('mdl-open');
    current = null;
    if (m.trigger && m.trigger.focus && document.contains(m.trigger)) m.trigger.focus();
    if (result === 'ok' && m.opts.onOk) m.opts.onOk();
    if (result !== 'ok' && m.opts.onCancel) m.opts.onCancel();
  }

  function open(opts, withCancel) {
    if (current) close(current, 'cancel');
    var id = 'mdl-' + (++n), root = document.createElement('div'), box = document.createElement('div'),
        h = document.createElement('h2'), p = document.createElement('p'), act = document.createElement('div'),
        okB = document.createElement('button'), noB;
    root.className = 'mdl'; box.className = 'mdl-box' + (opts.tone === 'danger' ? ' mdl-box--danger' : '');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', id + '-t'); box.setAttribute('aria-describedby', id + '-d');
    h.id = id + '-t'; h.className = 'mdl-t'; h.textContent = opts.title || (withCancel ? 'Confirma la acción' : 'Aviso');
    p.id = id + '-d'; p.className = 'mdl-p'; p.textContent = opts.text || '';
    act.className = 'mdl-act';
    okB.type = 'button'; okB.className = 'btn'; okB.textContent = opts.ok || (withCancel ? 'Confirmar' : 'Entendido');
    if (withCancel) {
      noB = document.createElement('button'); noB.type = 'button'; noB.className = 'btn2'; noB.textContent = opts.cancel || 'Cancelar';
      act.appendChild(noB);
    }
    act.appendChild(okB);
    box.appendChild(h); box.appendChild(p); box.appendChild(act); root.appendChild(box);
    var m = { root: root, opts: opts, trigger: opts.trigger || document.activeElement, closed: false };
    m.onKey = function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); close(m, 'cancel'); return; }
      if (e.key !== 'Tab') return;
      var f = PawLink.dom.focusables(box);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    okB.addEventListener('click', function () { close(m, 'ok'); });
    if (noB) noB.addEventListener('click', function () { close(m, 'cancel'); });
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(m, 'cancel'); });
    document.addEventListener('keydown', m.onKey, true);
    document.body.appendChild(root);
    document.documentElement.classList.add('mdl-open');
    current = m;
    (noB || okB).focus();   /* en confirmaciones el foco inicial va a la opción segura (Cancelar) */
    return m;
  }

  PawLink.modal = {
    confirm: function (o) { return open(o || {}, true); },
    notice: function (o) { return open(o || {}, false); },
    closeAll: function () { if (current) close(current, 'cancel'); }
  };

  function opts(el, onOk) {
    return {
      title: el.getAttribute('data-confirm-title'), text: el.getAttribute('data-confirm'),
      ok: el.getAttribute('data-confirm-ok'), cancel: el.getAttribute('data-confirm-cancel'),
      tone: el.getAttribute('data-confirm-tone'), trigger: el, onOk: onOk
    };
  }
  PawLink.modal.optionsFrom = opts;

  /* Enlaces y botones con data-confirm. Los botones de envío dentro de un formulario validado los gestiona el validador. */
  PawLink.register('confirm-action', function (el) {
    var form = el.form || (el.closest ? el.closest('form') : null);
    if (el.type === 'submit' && form && /(^|\s)form-validator(\s|$)/.test(form.getAttribute('data-module') || '')) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      PawLink.modal.confirm(opts(el, function () {
        if (el.tagName === 'A' && el.getAttribute('href')) window.location.href = el.getAttribute('href');
        else if (el.type === 'submit' && form) { if (form.requestSubmit) form.requestSubmit(el); else form.submit(); }
        else {
          var m = el.getAttribute('data-confirm-message');
          if (m && PawLink.toast) PawLink.toast.show(m, { type: 'ok' });
          el.dispatchEvent(new CustomEvent('pawlink:confirmed', { bubbles: true }));
        }
      }));
    });
  });
})();
