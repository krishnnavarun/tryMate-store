// Drawn over a photo while it is being analysed: a soft tint, a measuring grid, viewfinder
// corners, a scan line sweeping down again and again, and the current status message.
export default function ScanOverlay({ message }) {
  return (
    <div className="pointer-events-none absolute inset-0 animate-fade overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-noir/35" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgb(250 248 244 / 0.25) 1px, transparent 1px), linear-gradient(90deg, rgb(250 248 244 / 0.25) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 animate-scan bg-linear-to-b from-transparent via-transparent to-ember-light/35">
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-ember shadow-[0_0_18px_3px_rgb(221_2_0/0.8)]" />
      </div>
      {['top-3 left-3 border-t-2 border-l-2', 'top-3 right-3 border-t-2 border-r-2', 'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map(
        (corner) => (
          <span key={corner} className={`absolute h-7 w-7 animate-breathe border-ember-light ${corner}`} />
        ),
      )}
      {message && (
        <p
          key={message}
          className="absolute inset-x-4 bottom-5 animate-rise rounded-full bg-alabaster/80 px-4 py-2 text-center text-xs font-medium tracking-wide text-noir backdrop-blur"
        >
          {message}
        </p>
      )}
    </div>
  );
}
