// A centered message for empty states and errors, with an optional action button.
export default function StatusMessage({ title, message, action }) {
  return (
    <div className="flex animate-rise flex-col items-center justify-center rounded-[28px] border border-sand bg-white/60 px-6 py-20 text-center">
      <span className="mb-6 block h-px w-12 bg-brass" aria-hidden="true" />
      <h3 className="heading-display text-3xl">{title}</h3>
      {message && <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">{message}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
