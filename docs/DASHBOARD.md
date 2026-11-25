# Dashboard (index.html): cómo inyectar las tarjetas

Piezas ya preparadas en `index.html`:

| Elemento | Para qué |
|---|---|
| `#dash-cards` | contenedor vacío donde van las tarjetas (contiene un aviso provisional que debes quitar al renderizar) |
| `<template id="tpl-card-pawfriend">` | tarjeta modelo con datos de ejemplo; cada parte variable lleva `data-field` |
| `#dash-q` | buscador en tiempo real (módulo `list-filter`); filtra por el texto de cada `<article>` de `#dash-cards` |
| `#dash-count`, `#dash-empty` | contador "N resultados" y aviso "sin resultados" (los escribe `list-filter`) |

Archivos: `assets/js/data/mockData.js` (relleno: sustitúyelo por el tuyo; se carga antes del controlador) y
`assets/js/controllers/dashboard-controller.js` (esqueleto con `render()` por completar).
El controlador busca los datos en `PawLink.data.mascotas`, o en una variable global `mockData` (array u objeto con `.mascotas`) o `mascotas`.

## Campos `data-field` del template
`seguir` (checkbox del corazón) · `foto` (img: src y alt) · `nombre` · `tratamiento` · `protectora` · `ciudad` ·
`progreso` (`aria-valuenow`) · `barra` (`style.width`) · `recaudado` · `objetivo` · `enlace` (href).
Además `data-id` en el `<article>` y el `title` / `aria-label` del corazón ("Seguir a …").

## Ejemplo con `<template>` (puedes usarlo tal cual o hacer el tuyo con createElement/innerHTML)
```js
function render(items) {
  list.innerHTML = '';                                   // quita el aviso provisional
  items.forEach(function (m) {
    var card = tpl.content.firstElementChild.cloneNode(true);
    var pct = Math.min(100, Math.round(m.recaudado / m.objetivo * 100));
    card.dataset.id = m.id;
    card.querySelector('.hrt').title = 'Seguir a ' + m.nombre;
    card.querySelector('[data-field=seguir]').setAttribute('aria-label', 'Seguir a ' + m.nombre);
    var img = card.querySelector('[data-field=foto]'); img.src = m.foto; img.alt = 'Foto de ' + m.nombre;
    ['nombre', 'tratamiento', 'protectora', 'ciudad', 'recaudado', 'objetivo'].forEach(function (k) {
      card.querySelector('[data-field=' + k + ']').textContent = m[k];
    });
    card.querySelector('[data-field=progreso]').setAttribute('aria-valuenow', pct);
    card.querySelector('[data-field=barra]').style.width = pct + '%';
    card.querySelector('[data-field=enlace]').href = m.enlace;
    list.appendChild(card);
  });
  refilter();                                            // reaplica el buscador
}
```
Si usas `innerHTML` con datos de usuario, escapa el texto (o usa `textContent`) para evitar inyección de HTML.

## Buscador
Ya funciona sin código adicional: escribe en `#dash-q` y se ocultan las tarjetas que no coinciden (clase `xh`). Si quieres filtrar solo
por algunos campos, añade `data-filter-attr="data-busqueda"` al input y pon ese atributo en cada tarjeta.
