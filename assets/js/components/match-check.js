/* PawLink · aviso si dos campos no coinciden. <input data-module="match-check" data-match-with="id" data-match-error="id-del-aviso"> */
PawLink.register('match-check', function (input) {
  var other = PawLink.dom.byId(input.getAttribute('data-match-with')), err = PawLink.dom.byId(input.getAttribute('data-match-error'));
  input.addEventListener('input', function () { if (err && other) err.hidden = input.value === other.value; });
});
