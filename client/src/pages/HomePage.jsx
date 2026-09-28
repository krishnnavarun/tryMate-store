import { Link } from 'react-router';
import { fetchProducts } from '../api/products.js';
import HeroGraphic from '../components/home/HeroGraphic.jsx';
import { LogoMark } from '../components/layout/Header.jsx';
import GarmentArt from '../components/products/GarmentArt.jsx';
import ProductGrid from '../components/products/ProductGrid.jsx';
import { CountUp, Reveal, RevealText } from '../components/ui/Motion.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

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
  usePageTitle();

  return (
    <>
      {/* ---- Hero ------------------------------------------------------------------------ */}
      {/* Centred type on black between two lights: the red one comes from the Layout (behind
          the header), the cream one rises from this section's bottom-right corner. */}
      <section className="relative flex min-h-[calc(100svh-6.5rem)] items-center overflow-hidden">
        {/* Faded out over the last fifth, so the light doesn't end in a hard line at the section's edge */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_78%,transparent)]">
          <div className="glow-cream absolute -inset-[8%] -translate-y-[6%] origin-bottom-right animate-drift [animation-direction:alternate-reverse]" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 pt-10 pb-44 text-center sm:px-6 sm:pb-56">
          <p className="eyebrow animate-rise" style={{ animationDelay: '100ms' }}>
            Tailored by AI · Menswear
          </p>
          <h1 className="heading-display mt-8 text-[52px] leading-[0.98] sm:text-[84px] lg:text-[112px]">
            <RevealText text="Clothes cut to *your* *measure.*" delay={200} />
          </h1>
          <p
            className="mx-auto mt-7 max-w-xl animate-rise text-lg leading-relaxed text-gray-600 sm:text-xl"
            style={{ animationDelay: '650ms' }}
          >
            One photo and your height. Every shirt, tee and polo then shows the size that fits you and the colours that
            suit you.
          </p>
          <div className="mt-11 flex animate-rise flex-wrap items-center justify-center gap-4" style={{ animationDelay: '800ms' }}>
            <Link to="/shop" className="btn-primary px-8 py-4">
              Explore the collection
            </Link>
            <Link to="/fit-profile" className="btn-secondary px-8 py-4">
              Find your fit
            </Link>
          </div>

        </div>
      </section>

      {/* ---- Marquee ------------------------------------------------------------------------ */}
      <div className="overflow-hidden border-y border-white/[0.07] py-6">
        {/* Screen readers get the list once; the moving copy is decoration */}
        <p className="sr-only">{MARQUEE.join('. ')}.</p>
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {MARQUEE.map((text) => (
                <span key={text} className="flex items-center text-2xl font-medium tracking-[-0.03em] text-gray-600 sm:text-3xl">
                  <span className="px-9">{text}</span>
                  <LogoMark className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---- New arrivals ---------------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-28 pb-8 sm:px-6">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Just in</p>
            <h2 className="heading-display mt-4 text-5xl">New arrivals</h2>
          </div>
          <Link to="/shop" className="link-underline pb-1 text-[12px] font-semibold tracking-[0.18em] text-alabaster uppercase">
            View all
          </Link>
        </Reveal>
        <ProductGrid products={data?.items ?? []} loading={loading} skeletonCount={8} />
      </section>

      {/* ---- How it works ---------------------------------------------------------------------- */}
      <section id="find-your-fit" className="scroll-mt-24 py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-20 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <Reveal className="max-w-xl">
              <p className="eyebrow">How it works</p>
              <h2 className="heading-display mt-4 text-5xl leading-[1.05]">
                A tailor&rsquo;s eye, <span className="text-sheen">in your pocket.</span>
              </h2>
            </Reveal>
            <Reveal as="dl" className="mt-10 grid max-w-md grid-cols-3 divide-x divide-white/10">
              {FACTS.map(([value, label]) => (
                <div key={label} className="px-4 first:pl-0">
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <CountUp value={value} duration={1600} className="text-4xl font-semibold tracking-[-0.04em] text-alabaster" />
                    <p className="mt-1 text-xs leading-snug text-gray-500">{label}</p>
                  </dd>
                </div>
              ))}
            </Reveal>
            <ol className="mt-12">
              {STEPS.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={i * 140}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-t border-white/[0.08] py-7 last:border-b"
                >
                  <span className="pt-1 text-sm font-medium text-ember tabular-nums">0{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden="true">
                        <path d={step.icon} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <h3 className="text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                    </div>
                    <p className="mt-2 max-w-md leading-relaxed text-gray-600">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            <Reveal className="mt-10">
              <Link to="/fit-profile" className="btn-primary">
                Create your fit profile
              </Link>
            </Reveal>
          </div>
          <Reveal className="px-6 sm:px-10">
            <HeroGraphic />
          </Reveal>
        </div>
      </section>

      {/* ---- Live fitting room: the full gradient, as a panel ------------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="bg-luxe grain relative grid items-center gap-12 overflow-hidden rounded-[32px] px-8 py-14 ring-1 ring-white/10 sm:px-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.26em] text-alabaster uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Live
            </p>
            <h2 className="mt-5 text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">
              A fitting room that <span className="text-sheen">moves with you.</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-gray-600">
              Turn on your camera, drag a shirt onto yourself and switch colours and sizes as you move. It runs on your
              device: nothing is recorded or uploaded.
            </p>
            <Link to="/fitting-room" className="btn-primary mt-10 px-8 py-4">
              Step into the fitting room
            </Link>
          </div>
          <FittingRoomVisual />
        </Reveal>
      </section>

      {/* ---- Promise ------------------------------------------------------------------------------ */}
      <section className="mx-auto max-w-4xl px-4 pt-32 text-center sm:px-6">
        <Reveal>
          <svg className="mx-auto h-8 w-8 text-ember" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
          </svg>
          <p className="heading-display mt-7 text-3xl leading-snug font-medium sm:text-4xl">
            Your photo is used once, to measure you, and then it&rsquo;s gone.{' '}
            <span className="text-gray-500">Only your measurements are kept.</span>
          </p>
        </Reveal>
      </section>
    </>
  );
}

// A stylised live mirror: a garment floating in a dark frame, tracked by viewfinder corners
function FittingRoomVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[24px] bg-[radial-gradient(ellipse_at_50%_35%,#2c2622,#0b0a09_72%)] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
      <div className="absolute inset-[12%] animate-float">
        <GarmentArt name="Classic Pique Polo" type="polo" hex="#8B6D3F" backdrop={false} title="An illustrated polo" className="h-full w-full" />
      </div>
      {['top-6 left-6 border-t border-l', 'top-6 right-6 border-t border-r', 'bottom-6 left-6 border-b border-l', 'bottom-6 right-6 border-b border-r'].map(
        (corner) => (
          <span key={corner} className={`absolute h-7 w-7 animate-breathe border-ember ${corner}`} />
        ),
      )}
      <div className="pointer-events-none absolute inset-0 animate-scan bg-linear-to-b from-transparent via-transparent to-racing/25">
        <div className="absolute inset-x-0 bottom-0 h-px bg-ember shadow-[0_0_14px_2px_rgb(221_2_0/0.8)]" />
      </div>
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between text-[10px] font-semibold tracking-[0.2em] text-alabaster/80 uppercase">
        <span>Size M · Regular</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-emerald-600" /> Tracking
        </span>
      </div>
    </div>
  );
}
