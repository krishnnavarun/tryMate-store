import { useEffect, useRef, useState } from 'react';

// Small motion building blocks. All animation is CSS (index.css: animate-rise, animate-word);
// these only decide WHEN it starts. "Reduce motion" in the OS makes every animation
// land immediately (see the media query at the end of index.css).

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Fades + rises its content in when it scrolls into view (once).
 *   <Reveal delay={120}>…</Reveal>
 */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (shown) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`${shown ? 'animate-rise' : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A headline whose words slide up from behind a mask, one after another.
 * Wrap a word in *asterisks* to emphasise it (gradient text by default):
 *   text="Clothes cut to *your* measure."
 */
export function RevealText({ text, delay = 0, stagger = 70, emphasisClassName = 'text-sheen', className = '' }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text.replaceAll('*', '')}</span>
      {words.map((word, i) => {
        const emphasis = /^\*.*\*[.,!?]?$/.test(word);
        const clean = word.replaceAll('*', '');
        return (
          <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.14em] align-bottom">
            <span
              className={`inline-block animate-word ${emphasis ? emphasisClassName : ''}`}
              style={{ animationDelay: `${delay + i * stagger}ms` }}
            >
              {clean}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Counts up from 0 to `value` (ease-out) when it first appears.
 *   <CountUp value={98.4} decimals={1} />
 */
export function CountUp({ value, decimals = 0, duration = 1100, className = '' }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    const instant = prefersReducedMotion();
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = instant ? 1 : Math.min(1, (now - start) / duration);
      setCurrent(value * (1 - (1 - t) ** 4));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  if (typeof value !== 'number') return <span className={className}>—</span>;
  return (
    <span className={className}>
      <span className="sr-only">{value.toFixed(decimals)}</span>
      <span aria-hidden="true">{current.toFixed(decimals)}</span>
    </span>
  );
}
