import React, { useEffect, useState, useRef } from 'react';

/**
 * Custom hook: triggers when element enters viewport
 */
export function useInView(options: IntersectionObserverInit = { threshold: 0.15 }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}

/**
 * 1. ANIMATED COUNT-UP NUMBER COMPONENT
 */
interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [value, setValue] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.1 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTimestamp: number | null = null;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        // Ease-out cubic formula
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = easeOut * end;
        setValue(currentVal);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setValue(end);
        }
      };

      window.requestAnimationFrame(step);
    }
  }, [inView, end, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <span ref={ref} className={`font-mono-num inline-block ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

/**
 * 2. SCROLL REVEAL WRAPPER
 */
interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'fade';
  delayMs?: number;
  durationMs?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delayMs = 0,
  durationMs = 500,
  className = '',
}) => {
  const { ref, inView } = useInView({ threshold: 0.12 });

  const getTransform = () => {
    if (inView) return 'translate3d(0,0,0) scale(1)';
    switch (animation) {
      case 'fade-up':
        return 'translate3d(0, 24px, 0) scale(1)';
      case 'fade-down':
        return 'translate3d(0, -24px, 0) scale(1)';
      case 'fade-left':
        return 'translate3d(24px, 0, 0) scale(1)';
      case 'fade-right':
        return 'translate3d(-24px, 0, 0) scale(1)';
      case 'zoom-in':
        return 'translate3d(0, 0, 0) scale(0.95)';
      default:
        return 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: getTransform(),
        transitionProperty: 'opacity, transform',
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
};

/**
 * 3. STAGGERED CONTAINER & ITEM
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  staggerDelayMs?: number;
  className?: string;
}> = ({ children, staggerDelayMs = 80, className = '' }) => {
  const { ref, inView } = useInView({ threshold: 0.08 });

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <div
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translate3d(0,0,0)' : 'translate3d(0, 20px, 0)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '450ms',
              transitionDelay: `${index * staggerDelayMs}ms`,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 4. INFINITE MARQUEE TICKER
 */
interface MarqueeProps {
  items: string[];
  speedSeconds?: number;
  reverse?: boolean;
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  items,
  speedSeconds = 30,
  reverse = false,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden w-full select-none ${className}`}>
      {/* Subtle fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div
        className="flex whitespace-nowrap w-max gap-8 items-center hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${speedSeconds}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
        }}
      >
        {[...items, ...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-mono font-bold tracking-wider uppercase text-slate-700">
            <span>{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500/60 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 5. AUTO-SCROLLING HORIZONTAL DATA CARD STRIP
 */
interface AutoScrollCardsProps {
  children: React.ReactNode;
  speedSeconds?: number;
  className?: string;
}

export const AutoScrollCards: React.FC<AutoScrollCardsProps> = ({
  children,
  speedSeconds = 25,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden w-full ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-4 w-max hover:[animation-play-state:paused] py-1"
        style={{
          animation: `marquee ${speedSeconds}s linear infinite`,
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
};

/**
 * 6. REVEALING SECTION HEADER WITH EXPANDING DIVIDER
 */
interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  action,
  className = '',
}) => {
  const { ref, inView } = useInView({ threshold: 0.15 });

  return (
    <div ref={ref} className={`space-y-2.5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <span
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translate3d(0,0,0)' : 'translate3d(-12px,0,0)',
              transition: 'opacity 400ms ease, transform 400ms ease',
            }}
            className="text-[11px] font-mono font-bold text-teal-700 uppercase tracking-widest block"
          >
            {eyebrow}
          </span>
          <h2
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translate3d(0,0,0)' : 'translate3d(0,10px,0)',
              transition: 'opacity 500ms ease 100ms, transform 500ms ease 100ms',
            }}
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Syne']"
          >
            {title}
          </h2>
        </div>

        {action && (
          <div
            style={{
              opacity: inView ? 1 : 0,
              transition: 'opacity 400ms ease 200ms',
            }}
          >
            {action}
          </div>
        )}
      </div>

      {subtitle && (
        <p
          style={{
            opacity: inView ? 1 : 0,
            transition: 'opacity 500ms ease 200ms',
          }}
          className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed"
        >
          {subtitle}
        </p>
      )}

      {/* Expanding divider line */}
      <div className="w-full bg-slate-200 h-px relative overflow-hidden rounded-full mt-2">
        <div
          style={{
            width: inView ? '100%' : '0%',
            transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1) 250ms',
          }}
          className="h-full bg-gradient-to-r from-teal-600 via-sky-500 to-amber-500"
        />
      </div>
    </div>
  );
};

/**
 * 7. GENTLE FLOATING BADGE / ELEMENT
 */
export const FloatingElement: React.FC<{
  children: React.ReactNode;
  durationSec?: number;
  offsetPx?: number;
  className?: string;
}> = ({ children, durationSec = 4, offsetPx = 5, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        animation: `floatSlow ${durationSec}s ease-in-out infinite`,
        ['--float-offset' as any]: `${offsetPx}px`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * 8. LIVE PULSE INDICATOR
 */
export const PulseIndicator: React.FC<{ label?: string; className?: string }> = ({
  label = 'LIVE',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
      </span>
      <span>{label}</span>
    </span>
  );
};

/**
 * 9. SLIDE-OVER DETAIL MODAL DRAWER
 */
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-700 uppercase tracking-widest">
                MANZIL Operational Detail
              </span>
              <h3 className="text-xl font-black text-slate-900 font-['Syne']">{title}</h3>
              {subtitle && <p className="text-xs text-slate-600 font-mono mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">{children}</div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn-manzil-teal text-xs uppercase tracking-wider px-5 py-2.5 shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
