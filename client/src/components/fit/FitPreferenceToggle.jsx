const OPTIONS = [
  { value: 'slim', label: 'Slim', hint: 'Close to the body' },
  { value: 'regular', label: 'Regular', hint: 'Classic fit' },
  { value: 'loose', label: 'Loose', hint: 'Relaxed, roomy' },
];

// Slim / Regular / Loose segmented control
export default function FitPreferenceToggle({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="Fit preference" className="inline-flex rounded-lg border border-gray-300 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={option.hint}
          disabled={disabled}
          onClick={() => value !== option.value && onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
            value === option.value ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
