/* PawLink · botón Mostrar/Ocultar contraseña. Módulo en el <button>, que va justo después del <input>. */
PawLink.register('password-toggle', function (btn) {
  btn.addEventListener('click', function () {
    var i = btn.previousElementSibling;
    if (!i) return;
    i.type = i.type === 'password' ? 'text' : 'password';
    btn.textContent = i.type === 'password' ? 'Mostrar' : 'Ocultar';
    btn.setAttribute('aria-pressed', i.type === 'password' ? 'false' : 'true');
  });
});
