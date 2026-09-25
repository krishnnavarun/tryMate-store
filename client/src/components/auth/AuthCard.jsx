// Centered card layout shared by the login and register pages
export default function AuthCard({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {children}
      </div>
      {footer && <p className="mt-6 text-center text-sm text-gray-600">{footer}</p>}
    </div>
  );
}
