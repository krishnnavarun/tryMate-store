const OPTIONS = [
  { value: 'slim', label: 'Slim', hint: 'Close to the body' },
  { value: 'regular', label: 'Regular', hint: 'Classic fit' },
  { value: 'loose', label: 'Loose', hint: 'Relaxed, roomy' },
];

// Slim / Regular / Loose segmented control
export default function FitPreferenceToggle({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="Fit preference" className="inline-flex rounded-full border border-smoke bg-coal p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={option.hint}
          disabled={disabled}
          onClick={() => value !== option.value && onChange(option.value)}
          className={`rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors duration-300 disabled:opacity-60 ${
            value === option.value ? 'bg-alabaster text-noir' : 'text-gray-600 hover:text-alabaster'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
