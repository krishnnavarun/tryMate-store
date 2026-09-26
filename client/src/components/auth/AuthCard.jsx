import GarmentArt from '../products/GarmentArt.jsx';

const COLLAGE = [
  { name: 'Classic Oxford Shirt', type: 'shirt', hex: '#7FA7D9', className: 'left-[8%] top-[10%] w-[46%] rotate-[-6deg]', delay: '0s' },
  { name: 'Knit Polo', type: 'polo', hex: '#C19A6B', className: 'right-[6%] top-[22%] w-[44%] rotate-[5deg]', delay: '-2.5s' },
  { name: 'Striped Breton Tee', type: 'tshirt', hex: '#1F2A44', className: 'left-[24%] bottom-[17%] w-[46%] rotate-[2deg]', delay: '-5s' },
];

// Login and register: the form on the left, an editorial panel on the right (large screens)
export default function AuthCard({ title, children, footer }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
      <div className="mx-auto w-full max-w-md animate-rise lg:py-10">
        <p className="eyebrow">tryMate account</p>
        <h1 className="heading-display mt-3 mb-10 text-5xl">{title}</h1>
        {children}
        {footer && <p className="mt-8 text-sm text-gray-600">{footer}</p>}
      </div>

      <div className="relative hidden min-h-[560px] overflow-hidden rounded-[32px] bg-bone lg:block" aria-hidden="true">
        {COLLAGE.map((piece) => (
          <div key={piece.name} className={`absolute aspect-[3/4] ${piece.className}`}>
            <div className="h-full w-full animate-float overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgb(28_26_23/0.45)]" style={{ animationDelay: piece.delay }}>
              <GarmentArt name={piece.name} type={piece.type} hex={piece.hex} className="h-full w-full" />
            </div>
          </div>
        ))}
        <p className="absolute right-8 bottom-8 left-8 font-display text-3xl leading-tight text-ink">
          Your measurements, <em className="text-brass">not a guess</em>.
        </p>
      </div>
    </div>
  );
}
