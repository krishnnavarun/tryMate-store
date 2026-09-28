import { useEffect, useRef, useState } from 'react';

const CM_PER_INCH = 2.54;
const MIN_CM = 120;
const MAX_CM = 230;
const UNIT_KEY = 'trymate.heightUnit';

// The last unit the shopper used (a per-browser convenience; falls back to cm)
function savedUnit() {
  try {
    return localStorage.getItem(UNIT_KEY) === 'ftin' ? 'ftin' : 'cm';
  } catch {
    return 'cm';
  }
}

const toFeetInches = (cm) => {
  const totalInches = Number(cm) / CM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  return { feet: String(feet), inches: String(Math.round(totalInches - feet * 12)) };
};

const label = 'mb-2 block text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase';
const input =
  'block w-full rounded-xl border border-smoke bg-coal px-4 py-3 text-sm text-alabaster transition-[border-color,box-shadow] duration-300 hover:border-gray-300 focus:border-alabaster focus:ring-4 focus:ring-alabaster/5 focus:outline-none';

/**
 * Height in centimetres or in feet + inches (many people know theirs in feet).
 * Whatever the unit, the form gets `heightCm` in centimetres.
 */
export default function HeightField({ defaultCm }) {
  const [unit, setUnit] = useState(savedUnit);
  const [cm, setCm] = useState(defaultCm ? String(defaultCm) : '');
  const [ftIn, setFtIn] = useState(() => (defaultCm ? toFeetInches(defaultCm) : { feet: '', inches: '' }));
  const feetRef = useRef(null);

  function chooseUnit(next) {
    setUnit(next);
    try {
      localStorage.setItem(UNIT_KEY, next);
    } catch {
      // private mode: the choice just isn't remembered
    }
    if (next === 'ftin' && cm) setFtIn(toFeetInches(cm));
  }

  function changeFtIn(changes) {
    const next = { ...ftIn, ...changes };
    setFtIn(next);
    const totalInches = Number(next.feet || 0) * 12 + Number(next.inches || 0);
    // Rounded to the nearest 0.5 cm, like the cm field
    setCm(next.feet ? String(Math.round(totalInches * CM_PER_INCH * 2) / 2) : '');
  }

  // Feet + inches outside the allowed range: let the browser show the message on submit
  const outOfRange = unit === 'ftin' && cm !== '' && (Number(cm) < MIN_CM || Number(cm) > MAX_CM);
  useEffect(() => {
    feetRef.current?.setCustomValidity(outOfRange ? 'Please enter a height between 4 ft 0 in and 7 ft 6 in.' : '');
  }, [outOfRange]);

  return (
    <div className="sm:col-span-1">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span id="height-label" className={`${label} mb-0`}>
          Height
        </span>
        <div role="radiogroup" aria-label="Height unit" className="inline-flex rounded-full border border-smoke bg-coal p-0.5">
          {[
            ['cm', 'cm'],
            ['ftin', 'ft in'],
          ].map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={unit === value}
              onClick={() => unit !== value && chooseUnit(value)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                unit === value ? 'bg-alabaster text-noir' : 'text-gray-600 hover:text-alabaster'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {unit === 'cm' ? (
        <input
          name="heightCm"
          type="number"
          min={MIN_CM}
          max={MAX_CM}
          step="0.5"
          required
          inputMode="decimal"
          value={cm}
          onChange={(e) => setCm(e.target.value)}
          aria-labelledby="height-label"
          aria-describedby="height-hint"
          className={input}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="relative">
              <input
                ref={feetRef}
                type="number"
                min={4}
                max={7}
                step="1"
                required
                inputMode="numeric"
                value={ftIn.feet}
                onChange={(e) => changeFtIn({ feet: e.target.value })}
                aria-label="Height, feet"
                className={`${input} pr-10`}
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-500">ft</span>
            </label>
            <label className="relative">
              <input
                type="number"
                min={0}
                max={11}
                step="1"
                inputMode="numeric"
                value={ftIn.inches}
                onChange={(e) => changeFtIn({ inches: e.target.value })}
                aria-label="Height, inches"
                className={`${input} pr-10`}
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-500">in</span>
            </label>
          </div>
          <input type="hidden" name="heightCm" value={cm} />
        </>
      )}
      <p id="height-hint" className="mt-1.5 text-xs text-gray-500" aria-live="polite">
        {unit === 'ftin' && cm ? `= ${cm} cm. ` : ''}Needed to turn the photo into centimetres.
      </p>
    </div>
  );
}
