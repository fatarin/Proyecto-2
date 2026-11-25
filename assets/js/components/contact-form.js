/* PawLink · formulario de Contacto: medios de contacto (.ct-via), medio preferido, organización obligatoria
   para protectoras y mensaje de confirmación. Módulo en el <form>. */
PawLink.register('contact-form', function (form) {
  var D = PawLink.dom, err = D.byId('ct-err');

  function checked() { return D.qsa('.ct-sw:checked', form); }

  D.qsa('.ct-sw', form).forEach(function (cb) {
    cb.addEventListener('change', function () {
      var via = cb.closest('.ct-via'), field = via.querySelector('.ct-i'), pref = via.querySelector('.ct-pref input'), sel = checked();
      field.required = cb.checked; field.disabled = !cb.checked; pref.disabled = !cb.checked;
      if (cb.checked && sel.length === 1) pref.checked = true;
      else if (!cb.checked && pref.checked && sel[0]) sel[0].closest('.ct-via').querySelector('.ct-pref input').checked = true;
      if (err) err.hidden = true;
    });
  });

  D.qsa('[data-org-toggle]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      var org = D.byId('ct-org'), prot = D.byId('rol-p');
      if (org && prot) org.required = prot.checked;
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!checked().length) { if (err) err.hidden = false; return; }
    D.show(D.byId('ct-card'), false);
    D.show(D.byId('ct-ok'), true);
  });
});
