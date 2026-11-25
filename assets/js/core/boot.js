/* PawLink · arranque (se carga en <head>, sin defer).
   1) Marca <html class="js"> para que el CSS distinga "con JS" de "sin JS".
   2) Refleja la sesión de prueba en <html data-sess> antes de pintar (evita parpadeos). */
(function () {
  var R = document.documentElement, K = 'pawlink.session';
  R.classList.add('js');
  function get() {
    try { var v = localStorage.getItem(K); return v === 'usuario' || v === 'protectora' || v === 'admin' ? v : 'visitante'; } catch (e) { return 'visitante'; }
  }
  R.setAttribute('data-sess', get());
  window.addEventListener('storage', function (e) { if (e.key === K) R.setAttribute('data-sess', get()); });
})();
