// Small round swatches for product cards: "● ● ● +2"
export default function ColorDots({ colors, max = 4 }) {
  const shown = colors.slice(0, max);
  const extra = colors.length - shown.length;

  return (
    <div className="flex items-center gap-1.5" aria-label={`${colors.length} colors`}>
      {shown.map((color) => (
        <span
          key={color.name}
          title={color.name}
          className="h-3.5 w-3.5 rounded-full border border-gray-300"
          style={{ backgroundColor: color.hex }}
        />
      ))}
      {extra > 0 && <span className="text-xs text-gray-500">+{extra}</span>}
    </div>
  );
}
