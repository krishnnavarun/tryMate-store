import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A centered dialog over a soft, blurred backdrop. Closes on Escape and on backdrop click
// (unless `locked`, e.g. while a request is running). Keyboard: Tab stays inside the dialog,
// and closing it puts focus back on whatever opened it.
export default function Modal({ title, onClose, children, locked = false, size = 'max-w-2xl' }) {
  const panelRef = useRef(null);

  // Remember what had focus (usually the button that opened the dialog) and return to it
  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !locked) onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      // Focus trap: wrap from the last element to the first (and back with Shift+Tab)
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items.at(-1);
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind from scrolling
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, locked]);

  // Move keyboard focus into the dialog when it opens
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-4"
      style={{ animationDuration: '0.35s' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`max-h-[95vh] w-full ${size} animate-rise overflow-y-auto rounded-t-[28px] bg-ivory shadow-[0_40px_90px_-30px_rgb(28_26_23/0.55)] outline-none sm:rounded-[28px]`}
        style={{ animationDuration: '0.6s' }}
      >
        <div className="flex items-center justify-between border-b border-sand px-6 py-5">
          <h2 className="heading-display text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-bone hover:text-ink disabled:opacity-40"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
