/* PawLink · botón "Volver"/"Cancelar": regresa a la página anterior; si no hay historial, va a data-back-href. */
PawLink.register('go-back', function (btn) {
  btn.addEventListener('click', function () {
    var ref = document.referrer, href = btn.getAttribute('data-back-href');
    if (history.length > 1 && ref) history.back();
    else if (href) window.location.href = href;
  });
});
