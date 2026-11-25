/* PawLink · lista de requisitos de contraseña en vivo. Módulo en el <input>; los requisitos son
   elementos [data-r="len|let|num|esp"] dentro del contenedor .rc-pw y reciben la clase `ok`. */
PawLink.register('password-rules', function (input) {
  var rules = { len: /.{10}/, let: /[A-Za-z]/, num: /[0-9]/, esp: /[^A-Za-z0-9\s]/ };
  function run() {
    var wrap = input.closest('.rc-pw'), k, el;
    if (!wrap) return;
    for (k in rules) { el = wrap.querySelector('[data-r=' + k + ']'); if (el) el.classList.toggle('ok', rules[k].test(input.value)); }
  }
  input.addEventListener('input', run);
});
