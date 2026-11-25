# PawLink · Guía de datos (LEEME-MOCKDATA)

Abre `index.html` con doble clic. No necesita servidor.

## 1. Los datos: un solo `mockdata.json`
- `assets/data/mockdata.json`: una variable (array de objetos) por tabla, nombres en minúscula y singular
  (`mascota`, `usuario`, `protectora`, `apadrinamiento`, `cuota_apadrinamiento`, `pago`, `tratamiento`,
  `aportacion_tratamiento`, `catalogo_regalo`, `producto_mascota`, `regalo`, `actualizacion`, `notificacion`,
  `seguimiento_mascota`, `mascota_imagen`, `cuenta_bancaria_protectora`, `verificacion_protectora`) + `_meta`.
- `assets/js/data/mockdata.js`: copia idéntica cargada con `<script>` (en file:// el navegador bloquea `fetch` de JSON local).
  Si editas el JSON ejecuta `python3 tools/json2js.py` (o pega el contenido en el .js). En un sitio publicado puedes usar `fetch`.
- Fecha de referencia "hoy" = 13/11/2026 (`_meta.hoy`). Umbral de "mucho tiempo en protectora" = 12 meses (`_meta.umbral_mucho_tiempo_meses`).
- Columnas añadidas respecto a la memoria v1.2 (a documentar): `apadrinamiento.modalidad` (MENSUAL|UNICO_30D),
  `pago.metodo_pago` (TARJETA|BIZUM), `tratamiento.urgente`, `tratamiento.categoria` (CIRUGIA|CUIDADOS).
- Usuario demo: Lucía Ferrer (id 1º de `usuario`); protectora demo: Huella Abierta. Cambiar: en la consola
  `PawLink.db.setUsuario(id)` / `PawLink.db.setProtectora(id)`; volver al estado inicial: `PawLink.db.reiniciarDemo()`.

## 2. MVC
- **M** `assets/js/models/db.js` → `PawLink.db` (`t('tabla')`, `byId`, `where`, `vista(mascota)`, `muchoTiempo`, `sigue`…).
- **V** `assets/js/views/cards.js` → `PawLink.cards` (HTML de tarjetas con las clases CSS existentes).
- **C** `assets/js/controllers/*.js` → un módulo por pantalla (se activa con `data-module` en el `<main>`).

## 3. FILTROS, PAGINACIÓN Y VALIDACIÓN (VERSIÓN BACKUP COMPLETA, 21/11/2026)
En esta versión **todo está activo**. (En la entrega del 18/11/2026 los filtros y la validación estaban desactivados.)

**Filtros** (interruptor único: `PawLink.FILTROS_ACTIVOS = true` en `assets/js/core/app.js`; con `false` se desactivan todos):
| Pantalla | Qué filtra | Dónde está el código |
|---|---|---|
| Dashboard (`index.html`) | buscador de tarjetas | `components/list-filter.js` (campo `#dash-q`) |
| PawMate (`views/public/apadrinar.html`) | chips (especie, urgente, mucho tiempo, edad…), ordenación y buscador por nombre | `controllers/mascotas-controller.js` y `list-filter.js` |
| PawCare (`views/public/tratamientos.html`) | chips y buscador | `controllers/tratamientos-controller.js` y `list-filter.js` |
| PawGift (`views/public/regalos.html`) | chips por categoría | `controllers/regalos-controller.js` |
| Protectoras (`views/public/protectoras.html`) | tipo, «Cerca de mí» (Valencia, ubicación de demostración), ciudad (el chip rota por las ciudades) y «Con tratamientos activos» | `controllers/protectoras-controller.js` |
| Ficha de mascota, Mi ayuda, Mis notificaciones | chips y desplegables | `ficha-controller.js` y `usuario-controller.js` |
| Preguntas frecuentes y diálogo de regalo | buscador de texto | `components/list-filter.js` |

**Paginación real** (`components/pager.js`): PawMate, PawCare y Protectoras muestran 6 tarjetas por página y PawGift 8. Los botones se generan
según el número real de tarjetas (con los datos actuales: 2 páginas en cada listado) y se recalculan al filtrar o buscar.
Uso: `PawLink.pager.attach({ grid, nav, per, nombre })` al final del controlador.

**Protectoras**: el listado y la ficha (`ficha-protectora.html?id=…`) se rellenan desde el mockdata
(solo protectoras VERIFICADAS; las cifras de «Cuentas claras» se calculan con los pagos completados del año).

**Validación de formularios** (`components/form-validator.js`, `match-check.js`, `password-rules.js`): activa en 26 formularios.
Valida al escribir y al salir del campo (`input`/`blur`), muestra los mensajes en el DOM (los formularios llevan `novalidate`: sin tooltips
del navegador) y, si todo es correcto, simula el resultado sin guardar datos. Las reglas están en los atributos `data-v` y `data-msg` de cada campo.

**Enlaces**: no queda ningún enlace sin destino. Las acciones que el prototipo no implementa (exportar CSV, editar plantillas, Cobros…) llevan
`data-sim="mensaje"` y muestran un aviso «Simulación» (`components/toast.js`).

## 4. Qué pantallas usan datos
Con datos: inicio (dashboard), Apadrinar (mascotas), Tratamientos, Regalos, Ficha de mascota (`mascota.html?id=`),
Mis PawFriends (incluye suspendido por impago, pago único 30 días y cancelación con modal), Mi ayuda, Mis notificaciones,
Mis preferidos, Resumen de usuario, Panel de protectora y PawGifts recibidos.
Siguen estáticas: panel de administración, protectoras, formularios, diálogos y el resto (sin cambios).
Las listas se filtran y se paginan (ver apartado 3).
Los cambios de la demo (cancelar, seguir, marcar leídas) se guardan solo en `localStorage` del navegador.

## 5. Modales y avisos
`components/modal.js` (`PawLink.modal.confirm({title,text,ok,cancel,tone,onOk})`, `options`, `notice`) y `components/toast.js` funcionan.
Ejemplo: Mis PawFriends > Cancelar apadrinamiento (`usuario-controller.js`) abre el modal de confirmación y muestra un aviso.
