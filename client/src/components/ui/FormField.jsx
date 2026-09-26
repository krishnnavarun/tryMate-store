// Label + input with consistent styling. Extra props go straight to the <input>.
//   <FormField label="Email" name="email" type="email" required autoComplete="email" />
export default function FormField({ label, hint, className = '', ...inputProps }) {
  const id = inputProps.id ?? `field-${inputProps.name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">
        {label}
      </label>
      <input
        id={id}
        className="block w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink transition-[border-color,box-shadow] duration-300 placeholder:text-gray-400 hover:border-gray-300 focus:border-ink focus:ring-4 focus:ring-ink/5 focus:outline-none"
        {...inputProps}
      />
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText = 'Please wait…', className = '' }) {
  return (
    <button type="submit" disabled={loading} className={`btn-primary w-full py-3.5 disabled:cursor-wait ${className}`}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-ivory/40 border-t-ivory" aria-hidden="true" />}
      {loading ? loadingText : children}
    </button>
  );
}
