/* PawLink · botón que solo muestra un aviso (toast). data-notify="Texto" data-notify-type="ok|info|error" */
PawLink.register('notify', function (btn) {
  btn.addEventListener('click', function () {
    PawLink.toast.show(btn.getAttribute('data-notify'), { type: btn.getAttribute('data-notify-type') || 'info' });
  });
});
