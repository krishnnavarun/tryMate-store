import { Link } from 'react-router';
import { Logo } from './Header.jsx';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['/shop?type=shirt', 'Shirts'],
      ['/shop?type=tshirt', 'T-shirts'],
      ['/shop?type=polo', 'Polos'],
      ['/shop', 'All pieces'],
    ],
  },
  {
    title: 'Your fit',
    links: [
      ['/fit-profile', 'Fit profile'],
      ['/fitting-room', 'Live fitting room'],
      ['/shop?suitsMe=true', 'Colours that suit you'],
      ['/orders', 'Your orders'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-white/[0.06]">
      {/* The cream light again, rising from the bottom-right corner (where there's no text) */}
      <div aria-hidden="true" className="glow-cream pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="max-w-md text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">
              Dressed to <span className="text-sheen">your measure.</span>
            </p>
            <Link
              to="/fit-profile"
              className="link-underline mt-8 inline-flex items-center gap-2 pb-1 text-[11.5px] font-semibold tracking-[0.2em] text-alabaster uppercase"
            >
              Create your fit profile <span aria-hidden="true">→</span>
            </Link>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="eyebrow">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="link-underline text-sm text-gray-600 transition-colors hover:text-alabaster">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col-reverse gap-6 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-gray-500">
            Your photos are never stored: only your measurements are saved to your profile.
            <br />© {new Date().getFullYear()} tryMate
          </p>
          <Logo />
        </div>
      </div>
    </footer>
  );
}
