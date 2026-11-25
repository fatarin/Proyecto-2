/* PawLink · contador de caracteres. <textarea data-module="char-counter" data-counter="id" data-counter-max="200"> */
PawLink.register('char-counter', function (ta) {
  var out = PawLink.dom.byId(ta.getAttribute('data-counter')), max = ta.getAttribute('data-counter-max');
  function run() { if (out) out.textContent = ta.value.length + '/' + max; }
  ta.addEventListener('input', run);
});
