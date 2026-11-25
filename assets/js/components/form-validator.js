/* PawLink · validación avanzada de formularios (sin tooltips del navegador).
   <form data-module="form-validator" novalidate> y, en cada campo, data-v="reglas separadas por espacio":
     required  email  name  tel  url  cif  nif  password  money  date[:past|:future|:min=AAAA-MM-DD]
     min:N / max:N (longitud)   num:MIN:MAX (valor)   match:id-otro-campo   optional (solo valida si hay valor)
   Además respeta `required`, type=email|tel|url|date|number y min/max/minlength/maxlength nativos.
   Mensajes propios: data-msg="…" (obligatorio) · data-msg-<regla>="…".
   Tiempo real: al salir del campo (blur) y, una vez tocado o con error, en cada pulsación (input/change).
   Envío: valida todo, muestra un resumen accesible y lleva el foco al primer error; si todo es correcto
   lanza el evento `pawlink:valid` y aplica data-success-href / data-success-message / data-confirm (del botón o del form).
   Esta versión no envía nada al servidor (no hay backend): ver PawLink.validate para reutilizar las reglas. */
(function () {
  var D = PawLink.dom;
  var EMAIL = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
  var NAME = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'’.\-]*$/;
  var URLRE = /^https?:\/\/[^\s\/$.?#][^\s]*\.[^\s]{2,}$/i;
  var CIF = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/i;
  var LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

  function nifOk(v) {
    v = v.toUpperCase().replace(/[\s\-]/g, '');
    var m = /^([XYZ]|\d)(\d{7})([A-Z])$/.exec(v);
    if (!m) return false;
    var n = parseInt((m[1] === 'X' ? '0' : m[1] === 'Y' ? '1' : m[1] === 'Z' ? '2' : m[1]) + m[2], 10);
    return LETTERS.charAt(n % 23) === m[3];
  }
  function money(v) {
    v = v.replace(/[€\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
    if (!/^\d{1,7}([.,]\d{1,2})?$/.test(v)) return NaN;
    return parseFloat(v.replace(',', '.'));
  }
  function parseDate(v, isInput) {
    var y, mo, d, m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if (!isInput && (m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(v))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else return null;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }

  function tokens(el) {
    var s = el.getAttribute('data-v') || '', out = {}, parts = s.split(/\s+/), i, p, k;
    for (i = 0; i < parts.length; i++) { if (!parts[i]) continue; p = parts[i].split(':'); k = p[0]; out[k] = p.length > 1 ? p.slice(1).join(':') : true; }
    return out;
  }
  function msg(el, key, def) { return el.getAttribute('data-msg-' + key) || def; }

  function isEmpty(el, form) {
    if (el.type === 'checkbox') return !el.checked;
    if (el.type === 'radio') {
      var g = form.querySelectorAll('input[type=radio][name="' + el.name + '"]'), i;
      for (i = 0; i < g.length; i++) if (g[i].checked) return false;
      return true;
    }
    if (el.type === 'password') return el.value === '';
    return el.value.trim() === '';
  }

  /* Devuelve '' si es válido o el mensaje de error. */
  function check(el, form, force) {
    if (el.disabled || /^(hidden|submit|button|reset|file|search)$/.test(el.type)) return '';
    var t = tokens(el), type = el.type, v = el.value, vt = type === 'password' ? v : v.trim(),
        required = force || (!!(el.required || t.required) && !t.optional), empty = isEmpty(el, form);
    if (empty) {
      if (!required) return '';
      if (el.validity && el.validity.badInput) return msg(el, 'date', 'El valor no es válido.');
      if (el.getAttribute('data-msg')) return el.getAttribute('data-msg');
      if (type === 'checkbox') return 'Debes marcar esta casilla para continuar.';
      if (type === 'radio' || el.tagName === 'SELECT') return 'Elige una opción.';
      return 'Este campo es obligatorio.';
    }
    if (type === 'checkbox' || type === 'radio' || el.tagName === 'SELECT') return '';
    var n = vt.length, minL = t.min !== undefined && t.min !== true ? +t.min : (el.minLength > 0 ? el.minLength : 0),
        maxL = t.max !== undefined && t.max !== true ? +t.max : (el.maxLength > 0 ? el.maxLength : 0);

    if (type === 'email' || t.email) { if (!EMAIL.test(vt) || /\.\./.test(vt)) return msg(el, 'email', 'Escribe un correo válido, por ejemplo nombre@dominio.es.'); }
    if (type === 'tel' || t.tel) {
      var tel = vt.replace(/[\s.\-()]/g, '');
      if (!/^(\+|00)?\d{9,15}$/.test(tel) || (/^\d+$/.test(tel) && tel.length !== 9)) return msg(el, 'tel', 'Escribe un teléfono válido: 9 cifras, o con prefijo (por ejemplo +34 600 000 000).');
    }
    if (type === 'url' || t.url) { if (!URLRE.test(vt)) return msg(el, 'url', 'Escribe una dirección válida que empiece por http:// o https://.'); }
    if (t.name) { if (n < 2 || !NAME.test(vt)) return msg(el, 'name', 'Usa solo letras (mínimo 2 caracteres).'); }
    if (t.cif) { if (!CIF.test(vt.replace(/[\s\-]/g, ''))) return msg(el, 'cif', 'El CIF debe tener una letra, 7 números y un dígito o letra final (por ejemplo G12345678).'); }
    if (t.nif) { if (!nifOk(vt)) return msg(el, 'nif', 'NIF/NIE no válido: revisa los números y la letra final.'); }
    if (t.money) { var mv = money(vt); if (isNaN(mv) || mv <= 0) return msg(el, 'money', 'Escribe un importe válido mayor que 0, por ejemplo 450 o 450,50.'); }
    if (t.password) {
      var miss = [];
      if (v.length < 10) miss.push('10 caracteres como mínimo');
      if (!/[A-Za-z]/.test(v)) miss.push('una letra');
      if (!/[0-9]/.test(v)) miss.push('un número');
      if (!/[^A-Za-z0-9\s]/.test(v)) miss.push('un símbolo (por ejemplo ! ? # %)');
      if (miss.length) return 'La contraseña necesita ' + miss.join(', ') + '.';
    }
    if (type === 'number' || t.num) {
      var num = parseFloat(String(v).replace(',', '.')), lo = el.getAttribute('min'), hi = el.getAttribute('max');
      if (typeof t.num === 'string') { var r = t.num.split(':'); if (r[0] !== '') lo = r[0]; if (r[1] !== undefined && r[1] !== '') hi = r[1]; }
      if (isNaN(num)) return 'Escribe un número válido.';
      if (lo !== null && lo !== '' && num < +lo) return 'El valor mínimo es ' + lo + '.';
      if (hi !== null && hi !== '' && num > +hi) return 'El valor máximo es ' + hi + '.';
    }
    if (type === 'date' || t.date) {
      var dt = parseDate(vt, type === 'date');
      if (!dt) return msg(el, 'date', 'Escribe una fecha válida (día, mes y año).');
      if (dt.getFullYear() < 2000 || dt.getFullYear() > 2100) return 'El año no es válido.';
      if (t.date === 'past' && dt > today()) return 'La fecha no puede ser posterior a hoy.';
      if (t.date === 'future' && dt < today()) return 'La fecha no puede ser anterior a hoy.';
      if (typeof t.date === 'string' && t.date.indexOf('min=') === 0) {
        var mn = parseDate(t.date.slice(4), true);
        if (mn && dt < mn) return 'La fecha no puede ser anterior al ' + mn.toLocaleDateString('es-ES') + '.';
      }
    }
    if (t.match) {
      var other = document.getElementById(t.match);
      if (other && other.value !== v) return msg(el, 'match', 'Los dos campos deben coincidir.');
    }
    if (minL && n < minL) return 'Escribe al menos ' + minL + ' caracteres (llevas ' + n + ').';
    if (maxL && n > maxL) return 'Máximo ' + maxL + ' caracteres (llevas ' + n + ').';
    return '';
  }

  function fields(form) {
    return D.qsa('input,select,textarea', form).filter(function (el) { return !/^(hidden|submit|button|reset|file|search)$/.test(el.type); });
  }
  /* Un elemento por grupo de radios (el primero) */
  function unique(list) {
    var seen = {};
    return list.filter(function (el) {
      if (el.type !== 'radio') return true;
      if (seen[el.name]) return false;
      seen[el.name] = true; return true;
    });
  }
  function holder(el) {
    if (el.type === 'radio') { var fs = el.closest('fieldset'); return fs || el.closest('.chk') || el.parentNode; }
    return el.closest('.chk') || el.closest('.rc-pw') || el;
  }
  function errEl(el) {
    var key = el.id || el.name || ('f' + Math.random().toString(36).slice(2, 7));
    if (!el.id && el.type !== 'radio') el.id = key;
    var id = (el.type === 'radio' ? 'g-' + el.name : el.id) + '-err', e = document.getElementById(id);
    if (e) return e;
    e = document.createElement('p'); e.id = id; e.className = 'fld-err'; e.hidden = true;
    var h = holder(el);
    if (el.type === 'radio' && h.tagName === 'FIELDSET') h.appendChild(e);
    else h.parentNode.insertBefore(e, h.nextSibling);
    return e;
  }
  function setState(el, message) {
    var targets = el.type === 'radio' ? el.form.querySelectorAll('input[type=radio][name="' + el.name + '"]') : [el], i, e = errEl(el);
    for (i = 0; i < targets.length; i++) {
      targets[i].setAttribute('aria-invalid', message ? 'true' : 'false');
      targets[i].classList.toggle('is-invalid', !!message);
      var d = (targets[i].getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      var at = d.indexOf(e.id);
      if (message && at === -1) d.push(e.id); else if (!message && at !== -1) d.splice(at, 1);
      if (d.length) targets[i].setAttribute('aria-describedby', d.join(' ')); else targets[i].removeAttribute('aria-describedby');
      var chk = targets[i].closest('.chk'); if (chk) chk.classList.toggle('is-invalid', !!message);
    }
    e.textContent = message || ''; e.hidden = !message;
  }

  PawLink.validate = {
    check: check,
    /* Valida una lista de ids dentro de un formulario (todos obligatorios); devuelve true si todos son correctos. */
    fields: function (form, ids) {
      var ok = true;
      ids.forEach(function (id) { var el = document.getElementById(id); if (!el) return; var m = check(el, form, true); setState(el, m); if (m) ok = false; });
      return ok;
    }
  };

  PawLink.register('form-validator', function (form) {
    form.setAttribute('novalidate', '');
    var touched = {}, summary = null;
    function key(el) { return el.type === 'radio' ? 'g-' + el.name : (el.id || el.name); }

    D.qsa('[required]', form).forEach(function (el) { el.setAttribute('aria-required', 'true'); });
    D.qsa('[data-v~=required]', form).forEach(function (el) { el.setAttribute('aria-required', 'true'); });

    function one(el) { var m = check(el, form); setState(el, m); return m; }
    function refreshSummary() {
      if (!summary || summary.hidden) return;
      var bad = unique(fields(form)).filter(function (el) { return el.getAttribute('aria-invalid') === 'true'; });
      if (!bad.length) { summary.hidden = true; return; }
      fillSummary(bad);
    }
    function fillSummary(bad) {
      summary.innerHTML = '';
      var h = document.createElement('p'), ul = document.createElement('ul');
      h.className = 'form-sum-t'; h.textContent = bad.length === 1 ? 'Revisa 1 campo antes de continuar:' : 'Revisa ' + bad.length + ' campos antes de continuar:';
      bad.forEach(function (el) {
        var li = document.createElement('li'), a = document.createElement('a'), lab = form.querySelector('label[for="' + el.id + '"]'),
            name = lab ? lab.textContent.replace(/\s*\(opcional\)\s*/i, '').replace(/\s*\*\s*$/, '').trim() : (el.getAttribute('aria-label') || el.name || el.id);
        if (el.type === 'radio') { var fs = el.closest('fieldset'), lg = fs && fs.querySelector('legend'); name = lg ? lg.textContent.trim() : 'Elige una opción'; }
        if (name.length > 70) name = name.slice(0, 67) + '…';
        a.href = '#' + (el.id || ''); a.textContent = name;
        a.addEventListener('click', function (e) { e.preventDefault(); el.focus(); });
        li.appendChild(a); li.appendChild(document.createTextNode(': ' + errEl(el).textContent));
        ul.appendChild(li);
      });
      summary.appendChild(h); summary.appendChild(ul); summary.hidden = false;
    }

    /* Tiempo real */
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      if (!el.matches || !el.matches('input,select,textarea')) return;
      touched[key(el)] = true; one(el); refreshSummary();
    });
    function live(e) {
      var el = e.target;
      if (!el.matches || !el.matches('input,select,textarea')) return;
      var t = tokens(el), k = key(el);
      if (touched[k] || el.getAttribute('aria-invalid') === 'true' || t.password) { one(el); }
      D.qsa('[data-v*="match:' + el.id + '"]', form).forEach(function (o) { if (touched[key(o)] || o.value) one(o); });
      refreshSummary();
    }
    form.addEventListener('input', live);
    form.addEventListener('change', live);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var list = unique(fields(form)), bad = [];
      list.forEach(function (el) { touched[key(el)] = true; if (one(el)) bad.push(el); });
      if (bad.length) {
        e.stopImmediatePropagation();
        if (!summary) {
          summary = document.createElement('div'); summary.className = 'form-sum'; summary.setAttribute('role', 'alert');
          form.insertBefore(summary, form.firstChild);
        }
        fillSummary(bad);
        bad[0].focus();
        if (bad[0].scrollIntoView) bad[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      if (summary) summary.hidden = true;
      var sub = e.submitter || form.querySelector('[type=submit]');
      function go() {
        form.dispatchEvent(new CustomEvent('pawlink:valid', { bubbles: true, detail: { form: form, submitter: sub } }));
        if (form.hasAttribute('data-own-success')) return;
        var src = sub && sub.hasAttribute('data-success-href') ? sub : form,
            href = src.getAttribute('data-success-href'), m = (sub && sub.getAttribute('data-success-message')) || form.getAttribute('data-success-message');
        if (href) { if (m && PawLink.toast) PawLink.toast.flash(m, 'ok'); window.location.href = href; }
        else if (PawLink.toast) PawLink.toast.show(m || 'Datos correctos. (Prototipo: todavía no se envían al servidor.)', { type: 'ok' });
      }
      if (sub && sub.hasAttribute('data-confirm') && PawLink.modal) PawLink.modal.confirm(PawLink.modal.optionsFrom(sub, go));
      else go();
    });
  });
})();
