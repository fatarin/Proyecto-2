/* PawLink · formularios del prototipo: aún no envían nada (no hay backend). Evita la recarga de la página.
   La validación avanzada (Fase 4) se engancha sobre estos mismos formularios. */
PawLink.register('proto-form', function (form) {
  form.addEventListener('submit', function (e) { e.preventDefault(); });
});
