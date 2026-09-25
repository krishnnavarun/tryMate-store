// Label + input with consistent styling. Extra props go straight to the <input>.
//   <FormField label="Email" name="email" type="email" required autoComplete="email" />
export default function FormField({ label, hint, className = '', ...inputProps }) {
  const id = inputProps.id ?? `field-${inputProps.name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
        {...inputProps}
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText = 'Please wait…', className = '' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-light disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? loadingText : children}
    </button>
  );
}
