const STEPS = ['Cart', 'Details', 'Done'];

// Where the shopper is in buying: Cart → Details → Done. `current` is 1, 2 or 3.
export default function CheckoutSteps({ current }) {
  return (
    <ol className="flex flex-wrap items-center gap-3 text-[11px] font-semibold tracking-[0.16em] uppercase" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        // The last step counts as done once you're on it (the order is placed)
        const done = n < current || (n === current && n === STEPS.length);
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] tracking-normal ${
                done || active ? 'bg-alabaster text-noir' : 'border border-smoke text-gray-500'
              }`}
              aria-hidden="true"
            >
              {done ? (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M2.5 6.5l2.2 2.2L9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                n
              )}
            </span>
            <span className={done || active ? 'text-alabaster' : 'text-gray-500'}>
              {label}
              {done && <span className="sr-only"> (done)</span>}
            </span>
            {n < STEPS.length && <span className="h-px w-8 bg-smoke sm:w-14" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
