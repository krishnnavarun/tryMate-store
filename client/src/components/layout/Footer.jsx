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
    <footer className="mt-24 bg-ink text-ivory">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="max-w-md font-display text-4xl leading-[1.1] sm:text-5xl">
              Dressed to <em className="text-brass-light">your</em> measure.
            </p>
            <Link
              to="/fit-profile"
              className="link-underline mt-8 inline-flex items-center gap-2 pb-1 text-[11.5px] font-semibold tracking-[0.2em] text-ivory/90 uppercase"
            >
              Create your fit profile <span aria-hidden="true">→</span>
            </Link>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[11px] font-semibold tracking-[0.22em] text-brass-light uppercase">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="link-underline text-sm text-ivory/75 transition-colors hover:text-ivory">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-ivory/15 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <Logo light />
          <p className="max-w-md text-xs leading-relaxed text-ivory/55 sm:text-right">
            Your photos are never stored: only your measurements are saved to your profile.
            <br />© {new Date().getFullYear()} tryMate
          </p>
        </div>
      </div>
    </footer>
  );
}
