import { useState } from 'react';

const LABEL = 'mb-2 block text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase';
const INPUT =
  'block w-full rounded-xl border border-smoke bg-coal px-4 py-3 text-sm text-alabaster transition-[border-color,box-shadow] duration-300 placeholder:text-gray-500 hover:border-gray-300 focus:border-alabaster focus:ring-4 focus:ring-alabaster/5 focus:outline-none';

// Label + input with consistent styling. Extra props go straight to the <input>.
//   <FormField label="Email" name="email" type="email" required autoComplete="email" />
export default function FormField({ label, hint, className = '', ...inputProps }) {
  const id = inputProps.id ?? `field-${inputProps.name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={INPUT} {...inputProps} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * A password field with a Show/Hide button. With `requirement={8}` it also shows a live
 * "At least 8 characters" check.
 */
export function PasswordField({ label = 'Password', requirement, className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const id = inputProps.id ?? `field-${inputProps.name}`;
  const met = requirement ? value.length >= requirement : false;

  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={requirement ? `${id}-rule` : undefined}
          className={`${INPUT} pr-20`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-gray-600 uppercase transition-colors hover:bg-onyx hover:text-alabaster"
        >
          {visible ? 'Hide' : 'Show'}
          <span className="sr-only"> password</span>
        </button>
      </div>
      {requirement && (
        <p
          id={`${id}-rule`}
          className={`mt-1.5 flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-700' : 'text-gray-500'}`}
        >
          <span aria-hidden="true">{met ? '✓' : '•'}</span> At least {requirement} characters
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText = 'Please wait…', className = '' }) {
  return (
    <button type="submit" disabled={loading} className={`btn-primary w-full py-3.5 disabled:cursor-wait ${className}`}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-noir/40 border-t-noir" aria-hidden="true" />}
      {loading ? loadingText : children}
    </button>
  );
}
