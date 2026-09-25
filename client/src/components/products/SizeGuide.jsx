const FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'length', label: 'Length' },
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
    <details className="group rounded-lg border border-gray-200">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
        Size guide (cm)
        <span className="text-gray-400 transition group-open:rotate-180">▾</span>
      </summary>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-4 font-medium">Size</th>
              {fields.map((f) => (
                <th key={f.key} className="py-2 pr-4 font-medium">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map(([size, ranges]) => (
              <tr key={size} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 font-medium text-gray-900">{size}</td>
                {fields.map((f) => (
                  <td key={f.key} className="py-2 pr-4 text-gray-600">
                    {formatRange(ranges[f.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          Chest, waist and shoulder are body measurements. Length is the garment's back length.
        </p>
      </div>
    </details>
  );
}
