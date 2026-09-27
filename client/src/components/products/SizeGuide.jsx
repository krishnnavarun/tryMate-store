const FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'length', label: 'Length' },
  { key: 'sleeve', label: 'Sleeve' },
];

function formatRange(range) {
  return range ? `${range[0]}–${range[1]}` : '—';
}

// Collapsible table of the product's size chart (body measurements in cm)
export default function SizeGuide({ sizeChart }) {
  const sizes = Object.entries(sizeChart ?? {});
  if (sizes.length === 0) return null;

  // Only show the columns that at least one size actually has
  const fields = FIELDS.filter((f) => sizes.some(([, ranges]) => ranges[f.key]));

  return (
    <details className="group border-y border-sand">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
        Size guide (cm)
        <span className="relative h-3 w-3" aria-hidden="true">
          <span className="absolute top-1/2 left-0 h-px w-3 bg-ink" />
          <span className="absolute top-0 left-1/2 h-3 w-px bg-ink transition-transform duration-300 group-open:rotate-90" />
        </span>
      </summary>
      <div className="animate-fade overflow-x-auto pb-5">
        <table className="w-full text-left text-sm tabular-nums">
          <thead>
            <tr className="border-b border-sand text-[11px] tracking-[0.12em] text-gray-500 uppercase">
              <th className="py-2.5 pr-4 font-semibold">Size</th>
              {fields.map((f) => (
                <th key={f.key} className="py-2.5 pr-4 font-semibold">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map(([size, ranges]) => (
              <tr key={size} className="border-b border-sand/60 last:border-0">
                <td className="py-2.5 pr-4 font-semibold text-ink">{size}</td>
                {fields.map((f) => (
                  <td key={f.key} className="py-2.5 pr-4 text-gray-600">
                    {formatRange(ranges[f.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          Chest, waist and shoulder are body measurements. Length (collar to hem) and sleeve (shoulder seam to cuff) are garment measurements.
        </p>
      </div>
    </details>
  );
}
