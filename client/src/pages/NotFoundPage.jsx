import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Page not found</h1>
      <p className="mt-3 text-gray-600">We couldn't find the page you're looking for.</p>
      <Link to="/shop" className="mt-8 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">
        Go to the shop
      </Link>
    </div>
  );
}
