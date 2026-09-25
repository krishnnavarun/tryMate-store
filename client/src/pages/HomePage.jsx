import { Link } from 'react-router';
import { fetchProducts } from '../api/products.js';
import ProductGrid from '../components/products/ProductGrid.jsx';
import { useApi } from '../hooks/useApi.js';

const FIT_FEATURES = [
  {
    title: 'Your size, every time',
    text: 'One photo and your height give us your measurements. Every product then shows the size that fits you.',
  },
  {
    title: 'Colors that suit you',
    text: 'We read your skin tone and undertone and highlight the colors that flatter you most.',
  },
  {
    title: 'See it on you',
    text: 'Virtual try-on shows how a shirt looks on you before you buy it.',
  },
];

export default function HomePage() {
  const { data, loading } = useApi((signal) => fetchProducts({ sort: 'newest', limit: 8 }, { signal }), []);

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">AI fit, no guesswork</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-brand sm:text-5xl">
              Clothes that actually fit.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Shirts, tees and polos with a size recommendation made for your body, colors picked for your skin
              tone, and a preview of how they look on you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-light"
              >
                Shop now
              </Link>
              <a
                href="#find-your-fit"
                className="rounded-lg border border-brand px-6 py-3 text-base font-semibold text-brand transition hover:bg-white"
              >
                Find your perfect fit
              </a>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid">
            {(data?.items ?? []).slice(0, 4).map((p, i) => (
              <img
                key={p._id}
                src={p.images[0]}
                alt={p.name}
                className={`aspect-[3/4] w-full rounded-2xl object-cover shadow-sm ${i % 2 ? 'mt-8' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Featured products ---- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">New arrivals</h2>
          <Link to="/shop" className="text-sm font-semibold text-brand-accent hover:underline">
            View all →
          </Link>
        </div>
        <ProductGrid products={data?.items ?? []} loading={loading} skeletonCount={8} />
      </section>

      {/* ---- Find your fit (the scan page arrives in Phase 3) ---- */}
      <section id="find-your-fit" className="scroll-mt-20 bg-brand text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Find your perfect fit</h2>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Coming soon
            </span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {FIT_FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-white/75">{f.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-white/60">
            Your photo is only used to take your measurements and is never stored.
          </p>
        </div>
      </section>
    </>
  );
}
