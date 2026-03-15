/**
 * OtpInput.jsx
 *
 * 6 inputs individuales para el código OTP del ciudadano.
 * Replica el comportamiento de la maqueta (.otp-input + otpMove()).
 *
 * Props:
 *   value    → array de 6 strings ['', '1', '2', ...]
 *   onChange → fn(newArray) — el padre mantiene el estado
 *   disabled → bool
 *
 * Comportamiento:
 *   - Al escribir un dígito, el foco avanza automáticamente al siguiente input.
 *   - Backspace en input vacío mueve el foco al anterior.
 *   - Pegar (Ctrl+V) un código de 6 dígitos lo distribuye en todos los inputs.
 *   - Solo acepta dígitos (0-9).
 */

import { useRef } from 'react';

const inputStyle = {
  width: 46, height: 52,
  textAlign: 'center',
  fontFamily: 'var(--mono)',
  fontSize: 22, fontWeight: 600,
  border: '2px solid var(--gray-300)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  color: 'var(--gray-900)',
  transition: 'border-color .15s',
};

export default function OtpInput({ value, onChange, disabled = false }) {
  const refs = useRef([]);

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[i] = char;
    onChange(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    // Mover foco al último input llenado
    const lastIdx = Math.min(pasted.length, 5);
    refs.current[lastIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            ...inputStyle,
            borderColor: digit ? 'var(--primary)' : 'var(--gray-300)',
          }}
        />
      ))}
    </div>
  );
}
