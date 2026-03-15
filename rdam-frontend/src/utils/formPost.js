/**
 * formPost.js
 *
 * Construye un <form method="POST"> dinámico y lo submitea.
 * Se usa para redirigir al ciudadano a la pasarela de PlusPagos,
 * que requiere un POST con los campos encriptados como inputs hidden.
 *
 * @param {string} action  - URL destino (pasarelaUrl del backend)
 * @param {Object} fields  - { name: value } para cada input hidden
 */
export function submitFormPost(action, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = name;
    input.value = value ?? '';
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}