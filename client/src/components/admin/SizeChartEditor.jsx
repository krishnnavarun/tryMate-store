import { SIZE_FIELDS, nextSizeRow } from '../../utils/productForm.js';

const cell = 'w-16 rounded border border-gray-300 px-1.5 py-1 text-sm';

// Table editor for the size chart + stock. One row per size; each measurement is a
// [min, max] range in cm (leave both empty if the size chart doesn't use it).
export default function SizeChartEditor({ rows, onChange }) {
  const update = (index, patch) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const updateRange = (index, field, end, value) => {
    const range = [...rows[index][field]];
    range[end] = value;
    update(index, { [field]: range });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-2 py-2 font-medium">Size</th>
              {SIZE_FIELDS.map(([field, label]) => (
                <th key={field} className="px-2 py-2 font-medium">
                  {label} (cm)
                  <span className="block font-normal">min – max</span>
                </th>
              ))}
              <th className="px-2 py-2 font-medium">Stock</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-2 py-2">
                  <input
                    aria-label="Size label"
                    value={row.size}
                    maxLength={6}
                    onChange={(e) => update(i, { size: e.target.value.toUpperCase() })}
                    className={`${cell} w-14 font-semibold`}
                  />
                </td>
                {SIZE_FIELDS.map(([field, label]) => (
                  <td key={field} className="px-2 py-2 whitespace-nowrap">
                    {[0, 1].map((end) => (
                      <input
                        key={end}
                        aria-label={`${row.size} ${label} ${end ? 'max' : 'min'}`}
                        type="number"
                        step="0.5"
                        min="0"
                        value={row[field][end]}
                        onChange={(e) => updateRange(i, field, end, e.target.value)}
                        className={`${cell} ${end ? 'ml-1' : ''}`}
                      />
                    ))}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <input
                    aria-label={`${row.size} stock`}
                    type="number"
                    min="0"
                    step="1"
                    value={row.stock}
                    onChange={(e) => update(i, { stock: e.target.value })}
                    className={cell}
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    disabled={rows.length === 1}
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    className="text-xs font-medium text-gray-500 hover:text-red-600 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, nextSizeRow(rows)])}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
      >
        + Add size
      </button>
      <p className="text-xs text-gray-500">
        Ranges are the <strong>body</strong> measurements each size fits (length = garment back length). The AI size
        recommendation compares a shopper's measurements with these. A new size copies the last row plus the usual step
        (+6 cm chest/waist, +2 length, +1.5 shoulder).
      </p>
    </div>
  );
}
