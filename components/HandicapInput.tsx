import { useState } from 'react';
import { Input } from './ui';

// Keeps the typed string locally so partial decimals ("14.") don't get
// collapsed by Number() coercion. Syncs the form's numeric value only
// when the text parses cleanly.
export function HandicapInput({
  value,
  onChange,
  onBlur,
  error,
  label = 'Handicap index',
  placeholder = 'e.g. 14.2',
}: {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  onBlur: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(
    value === undefined || Number.isNaN(value) ? '' : String(value),
  );
  return (
    <Input
      label={label}
      error={error}
      value={text}
      onChangeText={(t) => {
        if (!/^-?\d*\.?\d*$/.test(t)) return;
        setText(t);
        if (t === '' || t === '-' || t === '.' || t === '-.') {
          onChange(undefined);
          return;
        }
        const n = parseFloat(t);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
      onBlur={() => {
        if (text.endsWith('.')) setText(text.slice(0, -1));
        onBlur();
      }}
      keyboardType="decimal-pad"
      placeholder={placeholder}
    />
  );
}
