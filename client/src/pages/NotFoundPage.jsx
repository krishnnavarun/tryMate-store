import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      {/* An empty hanger, drawn line by line */}
      <svg className="h-28 w-40 text-brass" viewBox="0 0 160 110" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path
          d="M80 10a10 10 0 0110 10c0 5-5 8-10 12v8l70 44c4 3 2 8-3 8H13c-5 0-7-5-3-8l70-44"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="400"
          className="animate-draw"
          style={{ '--dash': 400, animationDuration: '2.4s' }}
        />
      </svg>
      <p className="eyebrow mt-8">Error 404</p>
      <h1 className="heading-display mt-3 text-5xl">Nothing on this hanger</h1>
      <p className="mt-4 text-gray-600">We couldn&rsquo;t find the page you&rsquo;re looking for.</p>
      <Link to="/shop" className="btn-primary mt-10">
        Back to the collection
      </Link>
    </div>
  );
}
