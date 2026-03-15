/**
 * cuil.js
 *
 * Validación de CUIL/CUIT argentino.
 *
 * Formato esperado: XX-XXXXXXXX-X
 * Ejemplo válido:   20-12345678-9
 *
 * Algoritmo del dígito verificador:
 *   Multiplicadores: [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
 *   Suma = Σ(dígito[i] * mult[i])
 *   Resto = Suma % 11
 *   DV = resto === 0 → 0 | resto === 1 → 9 | resto > 1 → 11 - resto
 */

const MULT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Valida formato y dígito verificador de un CUIL.
 * @param {string} cuil - con guiones, ej: "20-12345678-9"
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCuil(cuil) {
  if (!cuil) return { valid: false, message: 'El CUIL es obligatorio.' };

  const formatRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!formatRegex.test(cuil)) {
    return { valid: false, message: 'El CUIL debe tener el formato XX-XXXXXXXX-X.' };
  }

  const digits = cuil.replace(/-/g, '');
  const prefix = Number(digits.slice(0, 2));

  // Prefijos válidos: 20 (M), 23 (indistinto), 24, 27 (F), 30/33/34 (empresa)
  const validPrefixes = [20, 23, 24, 27, 30, 33, 34];
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, message: 'El prefijo del CUIL no es válido.' };
  }

  const sum = MULT.reduce((acc, m, i) => acc + m * Number(digits[i]), 0);
  const resto = sum % 11;
  const dv = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

  if (dv !== Number(digits[10])) {
    return { valid: false, message: 'El dígito verificador del CUIL no es válido.' };
  }

  return { valid: true, message: '' };
}