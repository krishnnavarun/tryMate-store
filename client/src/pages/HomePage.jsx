import { Link } from 'react-router';
import { fetchProducts } from '../api/products.js';
import HeroGraphic from '../components/home/HeroGraphic.jsx';
import GarmentArt from '../components/products/GarmentArt.jsx';
import ProductGrid from '../components/products/ProductGrid.jsx';
import { CountUp, Reveal, RevealText } from '../components/ui/Motion.jsx';
import { useApi } from '../hooks/useApi.js';

const FACTS = [
  [1, 'photo is all it takes'],
  [6, 'body measurements'],
  [8, 'colours matched to your skin'],
];

const MARQUEE = [
  'Your size on every piece',
  'Colours for your skin tone',
  'See it on you before you buy',
  'A live fitting room',
  'Photos never stored',
];

const STEPS = [
  {
    title: 'One photo',
    text: 'Stand facing the camera and add your height. That is all we need to take six measurements.',
    icon: 'M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 100-8 4 4 0 000 8z',
  },
  {
    title: 'Your size, everywhere',
    text: 'Every shirt, tee and polo shows the size that fits you, with a note on how it will sit on your body.',
    icon: 'M3 16l13-13 5 5-13 13H3z M7 12l2 2 M10 9l2 2 M13 6l2 2',
  },
  {
    title: 'Colours and a preview',
    text: 'We read your skin tone to suggest colours that flatter you, and show how a piece looks on you before you buy.',
    icon: 'M12 3a2 2 0 012 2c0 1-1 1.5-2 2.3V9l9 6.5a1 1 0 01-.6 1.8H3.6a1 1 0 01-.6-1.8L12 9',
  },
];

export default function HomePage() {
  const { data, loading } = useApi((signal) => fetchProducts({ sort: 'newest', limit: 8 }, { signal }), []);

  return (
    <>
      {/* ---- Hero ------------------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        {/* A faint tailor's grid in the background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-sand) 1px, transparent 1px), linear-gradient(90deg, var(--color-sand) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pt-14 pb-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-32">
          <div>
            <p className="eyebrow animate-rise" style={{ animationDelay: '100ms' }}>
              Tailored by AI · Menswear
            </p>
            <h1 className="heading-display mt-6 text-[56px] leading-[0.95] sm:text-[76px] lg:text-[88px]">
              <RevealText text="Clothes cut to *your* measure." delay={200} italicClassName="italic text-brass" />
            </h1>
            <p className="mt-8 max-w-lg animate-rise text-lg leading-relaxed text-gray-600" style={{ animationDelay: '650ms' }}>
              One photo and your height give us your measurements and skin tone. Every shirt, tee and polo then shows the
              size that fits you and the colours that suit you.
            </p>
            <div className="mt-10 flex animate-rise flex-wrap items-center gap-6" style={{ animationDelay: '800ms' }}>
              <Link to="/shop" className="btn-primary px-8 py-4">
                Explore the collection
              </Link>
              <Link
                to="/fit-profile"
                className="link-underline group inline-flex items-center gap-2 pb-1 text-[12px] font-semibold tracking-[0.18em] text-ink uppercase"
              >
                Find your fit
                <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <dl className="mt-14 grid max-w-lg animate-rise grid-cols-3 divide-x divide-sand border-t border-sand pt-6" style={{ animationDelay: '950ms' }}>
              {FACTS.map(([value, label]) => (
                <div key={label} className="px-4 first:pl-0">
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <CountUp value={value} duration={1600} className="font-display text-4xl text-ink" />
                    <p className="mt-1 text-xs leading-snug text-gray-500">{label}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise px-6 sm:px-10" style={{ animationDelay: '300ms' }}>
            <HeroGraphic />
          </div>
        </div>
      </section>

      {/* ---- Marquee ------------------------------------------------------------------------ */}
      <div className="overflow-hidden border-y border-ink bg-ink py-4 text-ivory">
        {/* Screen readers get the list once; the moving copy is decoration */}
        <p className="sr-only">{MARQUEE.join('. ')}.</p>
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {MARQUEE.map((text) => (
                <span key={text} className="flex items-center font-display text-2xl italic">
                  <span className="px-8">{text}</span>
                  <span className="text-sm text-brass-light not-italic">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---- New arrivals ---------------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Just in</p>
            <h2 className="heading-display mt-3 text-5xl">New arrivals</h2>
          </div>
          <Link to="/shop" className="link-underline pb-1 text-[12px] font-semibold tracking-[0.18em] text-ink uppercase">
            View all
          </Link>
        </Reveal>
        <ProductGrid products={data?.items ?? []} loading={loading} skeletonCount={8} />
      </section>

      {/* ---- How it works ---------------------------------------------------------------------- */}
      <section id="find-your-fit" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="heading-display mt-3 text-5xl leading-tight">
              A tailor&rsquo;s eye, <em className="text-brass">in your pocket</em>.
            </h2>
          </Reveal>
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 140} className="border-t border-ink/80 pt-6">
                <div className="flex items-start justify-between">
                  <span className="font-display text-6xl leading-none text-brass">0{i + 1}</span>
                  <svg className="h-8 w-8 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.1}>
                    <path d={step.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="heading-display mt-8 text-3xl">{step.title}</h3>
                <p className="mt-3 max-w-sm leading-relaxed text-gray-600">{step.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-14">
            <Link to="/fit-profile" className="btn-secondary">
              Create your fit profile
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---- Live fitting room ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="grid items-center gap-12 overflow-hidden rounded-[32px] bg-ink px-8 py-14 text-ivory sm:px-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-brass-light uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass-light opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brass-light" />
              </span>
              Live
            </p>
            <h2 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
              A fitting room that <em className="text-brass-light">moves with you</em>.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-ivory/70">
              Turn on your camera, drag a shirt onto yourself and switch colours and sizes as you move. It runs on your
              device: nothing is recorded or uploaded.
            </p>
            <Link to="/fitting-room" className="btn-light mt-10 px-8 py-4">
              Step into the fitting room
            </Link>
          </div>
          <FittingRoomVisual />
        </Reveal>
      </section>

      {/* ---- Promise ------------------------------------------------------------------------------ */}
      <section className="mx-auto max-w-4xl px-4 pt-28 text-center sm:px-6">
        <Reveal>
          <svg className="mx-auto h-8 w-8 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
          </svg>
          <p className="heading-display mt-6 text-3xl leading-snug sm:text-4xl">
            Your photo is used once, to measure you, and then it&rsquo;s gone. Only your measurements are kept.
          </p>
        </Reveal>
      </section>
    </>
  );
}

// A stylised live mirror: a garment floating in a dark frame, tracked by viewfinder corners
function FittingRoomVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[24px] bg-[radial-gradient(ellipse_at_50%_35%,#3b3731,#1c1a17_70%)] ring-1 ring-ivory/10">
      <div className="absolute inset-[12%] animate-float">
        <GarmentArt name="Classic Pique Polo" type="polo" hex="#8B6D3F" backdrop={false} title="An illustrated polo" className="h-full w-full" />
      </div>
      {['top-6 left-6 border-t border-l', 'top-6 right-6 border-t border-r', 'bottom-6 left-6 border-b border-l', 'bottom-6 right-6 border-b border-r'].map(
        (corner) => (
          <span key={corner} className={`absolute h-7 w-7 animate-breathe border-brass-light ${corner}`} />
        ),
      )}
      <div className="pointer-events-none absolute inset-0 animate-scan bg-linear-to-b from-transparent via-transparent to-brass-light/20">
        <div className="absolute inset-x-0 bottom-0 h-px bg-brass-light/80" />
      </div>
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between text-[10px] font-semibold tracking-[0.2em] text-ivory/70 uppercase">
        <span>Size M · Regular</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-emerald-400" /> Tracking
        </span>
      </div>
    </div>
  );
}
