/* Controlador PawMate: importe y periodicidad elegidos (Ficha de mascota → Pago → Confirmación).
   Guarda la selección en localStorage ("pawlink.pawmate") y actualiza los elementos marcados con
   data-pm-list, data-pm (texto) y data-pm-show (visible solo en "mes" o "once"). */
(function () {
  'use strict';
  var KEY = 'pawlink.pawmate', AMOUNTS = [5, 10, 20]; // sin comisión (memoria: 0 %)
  function proxCobro() { var h = (window.PawLink && PawLink.db && PawLink.db.hoy) || new Date().toISOString().slice(0, 10), d = new Date(String(h).slice(0, 10) + 'T12:00:00'); d.setMonth(d.getMonth() + 1); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  function fin30() { var h = (window.PawLink && PawLink.db && PawLink.db.hoy) || new Date().toISOString().slice(0, 10), d = new Date(String(h).slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + 30); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  function read() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    return { amount: AMOUNTS.indexOf(s.amount) > -1 ? s.amount : 10, freq: s.freq === 'once' ? 'once' : 'mes' };
  }
  function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function eur(n) { return n.toFixed(2).replace('.', ',') + ' €'; }
  function texts(s) {
    var monthly = s.freq !== 'once';
    return {
      importe: eur(s.amount), total: eur(s.amount),
      cuotaLabel: monthly ? 'Cuota mensual' : 'Pago único · apadrinamiento de 30 días',
      aviso: monthly ? 'Hoy se cobra la primera cuota. Próximo cobro: ' + proxCobro() + '. Puedes cancelar cuando quieras desde tu área.' : 'Serás PawMate de Luna durante 30 días desde la fecha de pago, hasta el ' + fin30() + '. No se renovará ni se volverá a cobrar; al terminar podrás renovarlo si quieres.',
      terminos: monthly ? 'Acepto los términos y entiendo que la cuota se cobrará cada mes.' : 'Acepto los términos y entiendo que el pago se cobrará una sola vez y que el apadrinamiento durará 30 días.',
      texto: monthly ? 'Hemos recibido tu pago. A partir de ahora acompañas a Luna cada mes y verás sus novedades en Mis PawFriends.' : 'Hemos recibido tu pago. Acompañas a Luna durante 30 días y verás sus novedades en Mis PawFriends. Antes de que termine te avisaremos por si quieres renovarlo.',
      avisoProt: monthly ? 'Huella Abierta sabe que ahora eres su PawMate.' : 'Huella Abierta sabe que eres su PawMate durante 30 días.',
      nota: monthly ? 'Cancela cuando quieras.' : 'Apadrinamiento de 30 días con un solo pago. No se renueva automáticamente.',
      pagoNota: monthly ? 'Pago seguro con tarjeta.' : 'Pago seguro con tarjeta o Bizum.'
    };
  }
  function buttons(list, s) {
    if (list.getAttribute('data-pm-list') === 'amounts') {
      list.innerHTML = AMOUNTS.map(function (v) {
        var on = s.amount === v;
        return '<button class="opt' + (on ? ' sel' : '') + '" type="button" aria-pressed="' + on + '" data-pm-amount="' + v + '">' + v + ' €</button>';
      }).join('');
    } else {
      list.innerHTML = [['mes', 'Cada mes'], ['once', 'Pago único · 30 días']].map(function (o) {
        var on = s.freq === o[0];
        return '<button class="opt fs-15' + (on ? ' sel' : '') + '" type="button" aria-pressed="' + on + '" data-pm-freq="' + o[0] + '">' + o[1] + '</button>';
      }).join('');
    }
  }
  function render() {
    var s = read(), t = texts(s), i, els;
    els = document.querySelectorAll('[data-pm-list]');
    for (i = 0; i < els.length; i++) buttons(els[i], s);
    els = document.querySelectorAll('[data-pm]');
    for (i = 0; i < els.length; i++) { var k = els[i].getAttribute('data-pm'); if (t[k] != null) { var rq = els[i].querySelector('.req'); els[i].textContent = t[k]; if (rq) els[i].appendChild(rq); } }
    els = document.querySelectorAll('[data-pm-show]');
    for (i = 0; i < els.length; i++) els[i].classList.toggle('d-none', els[i].getAttribute('data-pm-show') !== s.freq);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-pm-amount],[data-pm-freq],[data-pm-reset]') : null;
    if (!b) return;
    if (b.hasAttribute('data-pm-reset')) { write({ amount: 10, freq: 'once' }); return; }
    var s = read();
    if (b.hasAttribute('data-pm-amount')) s.amount = parseInt(b.getAttribute('data-pm-amount'), 10);
    else s.freq = b.getAttribute('data-pm-freq');
    write(s); render();
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) render(); });
  window.addEventListener('pageshow', render);
  write(read()); render();
})();
