/* PawLink · CONTROLADOR del listado de mascotas (views/public/apadrinar.html).  data-module="mascotas" en <main>.
   Lee la tabla `mascota` del modelo (PawLink.db), pinta una tarjeta por cada mascota PUBLICADA y aplica los filtros de los chips.

   ┌─ DÓNDE TOCAR PARA TUS FILTROS ───────────────────────────────────────────────────────────────┐
   │  1) FILTROS: el objeto `FILTROS` (más abajo). Cada filtro es una función (v) → true/false,   │
   │     donde `v` es la mascota «plana» (PawLink.db.vista): v.m = fila de la tabla mascota,        │
   │     v.urgente, v.muchoTiempo, v.edad, v.protectora, v.tratamiento, v.pawmate…                  │
   │  2) CHIPS: qué filtro activa cada botón → el mapa `CHIP` (texto del botón → clave de FILTROS). │
   │  3) ORDEN: las funciones de `ORDEN` (chips «Edad» y «Protectora»).                             │
   └────────────────────────────────────────────────────────────────────────────────────────────────┘
   El buscador por nombre sigue siendo el módulo `list-filter` (componente aparte): este controlador solo avisa
   a ese buscador después de pintar para que reaplique el texto escrito. */
/* BACKUP COMPLETO 21/11/2026: filtros ACTIVOS (PawLink.FILTROS_ACTIVOS = true en core/app.js).
   Para la entrega del 25/11/2026: poner PawLink.FILTROS_ACTIVOS = true (core/app.js) y revisar las funciones de abajo. */
PawLink.register('mascotas', function (root) {
  var db = PawLink.db, C = PawLink.cards;
  var grid = root.querySelector('.g'), bar = root.querySelector('[role=group][aria-label=Filtros]'), search = root.querySelector('#pks');
  if (!grid || !bar) return;

  /* ── 1) Filtros: cada uno recibe la mascota «plana» y devuelve true si debe mostrarse ── */
  var FILTROS = {
    todos:        function (v) { return true; },
    perros:       function (v) { return v.m.especie === 'PERRO'; },
    gatos:        function (v) { return v.m.especie === 'GATO'; },
    otros:        function (v) { return v.m.especie !== 'PERRO' && v.m.especie !== 'GATO'; },   // conejos y otras especies
    urgente:      function (v) { return v.urgente; },                                           // tratamiento abierto marcado como urgente
    muchoTiempo:  function (v) { return v.muchoTiempo; }                                       // entró hace 12 meses o más (umbral en mockdata._meta)
  };
  /* ── 2) Qué filtro activa cada chip (por el texto del botón) ──
     «Excluyentes»: Todos / Perros / Gatos / Otros (solo uno a la vez). «Acumulables»: Urgente y Mucho tiempo. */
  var CHIP = { 'Todos': 'todos', 'Perros': 'perros', 'Gatos': 'gatos', 'Otros': 'otros', 'Urgente': 'urgente', 'Mucho tiempo en protectora': 'muchoTiempo' };
  var EXCLUYENTES = ['todos', 'perros', 'gatos', 'otros'];
  /* ── 3) Orden de los chips «Edad» y «Protectora» (pulsar alterna ascendente → descendente → sin orden) ── */
  var ORDEN = {
    edad:       function (a, b) { return (db.edadAnios(a.m) || 0) - (db.edadAnios(b.m) || 0); },
    protectora: function (a, b) { return (a.protectora.nombre).localeCompare(b.protectora.nombre, 'es'); }
  };

  var todas = db.where('mascota', { estado: 'PUBLICADA' }).map(db.vista);      // solo las publicadas (RN-20, RN-34)
  var est = { grupo: 'todos', acumulables: {}, orden: '', dir: 1 };

  function lista() {
    var f = [FILTROS[est.grupo]].concat(Object.keys(est.acumulables).filter(function (k) { return est.acumulables[k]; }).map(function (k) { return FILTROS[k]; }));
    var r = todas.filter(function (v) { return f.every(function (fn) { return fn(v); }); });
    if (est.orden) r.sort(function (a, b) { return est.dir * ORDEN[est.orden](a, b); });
    return r;
  }
  function render() {
    var r = lista();
    grid.innerHTML = r.map(C.mascota).join('');
    var vacio = root.querySelector('#mc-vacio');
    if (!vacio) { vacio = document.createElement('p'); vacio.id = 'mc-vacio'; vacio.className = 'm-0-0-20 c-muted'; vacio.setAttribute('role', 'status'); grid.parentNode.insertBefore(vacio, grid); }
    vacio.textContent = r.length ? '' : 'No hay ninguna mascota con estos filtros.';
    if (search) search.dispatchEvent(new Event('input'));                      // reaplica el buscador por nombre
    Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) {
      var k = c.getAttribute('data-f'), o = c.getAttribute('data-o');
      c.classList.toggle('on', (k && (k === est.grupo || est.acumulables[k])) || (o && est.orden === o));
    });
  }
  if (PawLink.FILTROS_ACTIVOS) Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) {
    var t = c.textContent.trim();
    if (CHIP[t]) c.setAttribute('data-f', CHIP[t]);
    else if (t === 'Edad') c.setAttribute('data-o', 'edad');
    else if (t === 'Protectora') c.setAttribute('data-o', 'protectora');
    else if (t === 'Cerca de mí') { c.disabled = true; c.title = 'Requiere geolocalización (no incluida en el prototipo)'; c.classList.add('chip--off'); }
  });
  if (PawLink.FILTROS_ACTIVOS) bar.addEventListener('click', function (ev) {
    var c = ev.target.closest ? ev.target.closest('.chip') : null; if (!c || c.disabled) return;
    var k = c.getAttribute('data-f'), o = c.getAttribute('data-o');
    if (k) {
      if (EXCLUYENTES.indexOf(k) > -1) { est.grupo = k; if (k === 'todos') { est.acumulables = {}; est.orden = ''; } }
      else est.acumulables[k] = !est.acumulables[k];
    } else if (o) {
      if (est.orden !== o) { est.orden = o; est.dir = 1; } else if (est.dir === 1) est.dir = -1; else est.orden = '';
    }
    render();
  });
  /* Corazón «seguir»: se guarda en el navegador sobre los datos simulados */
  grid.addEventListener('change', function (ev) { var i = ev.target; if (i && i.hasAttribute && i.hasAttribute('data-follow')) db.setSigue(i.getAttribute('data-follow'), i.checked); });
  PawLink.mascotas = { render: render, filtros: FILTROS, todas: todas };
  render();
  if (PawLink.pager) PawLink.pager.attach({ grid: grid, nav: root.querySelector('.pgn'), per: 6, nombre: 'mascotas' });   // paginación real (6 por página)
});
