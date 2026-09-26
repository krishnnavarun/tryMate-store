// Small round swatches for product cards: "● ● ● +2"
export default function ColorDots({ colors, max = 4 }) {
  const shown = colors.slice(0, max);
  const extra = colors.length - shown.length;

  return (
    <div className="flex items-center gap-1" aria-label={`${colors.length} colors`}>
      {shown.map((color) => (
        <span
          key={color.name}
          title={color.name}
          className="h-3 w-3 rounded-full ring-1 ring-black/10 ring-inset"
          style={{ backgroundColor: color.hex }}
        />
      ))}
      {extra > 0 && <span className="ml-0.5 text-[11px] text-gray-500">+{extra}</span>}
    </div>
  );
}
