import { useEffect, useState, useRef } from 'react';
import { ScrollReveal } from './ScrollReveal';

interface Stat {
  value: string;
  label: string;
}

interface StatsSectionProps {
  stats: [Stat, Stat, Stat];
  accentColor?: 'teal' | 'purple';
}

/**
 * StatsSection Component
 *
 * Animated stats display with:
 * - 3 key metrics
 * - Counter animation on scroll
 * - Responsive layout
 */
export function StatsSection({ stats, accentColor = 'teal' }: StatsSectionProps) {
  const colorClasses = {
    teal: 'text-hanok-teal',
    purple: 'text-[#AF52DE]'
  };

  const textColor = colorClasses[accentColor];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {stats.map((stat, index) => (
            <ScrollReveal key={index} delay={index * 100} animation="scale-in">
              <div className="text-center">
                <AnimatedValue value={stat.value} className={`text-2xl sm:text-4xl lg:text-5xl font-bold ${textColor}`} />
                <p className="text-sm sm:text-base text-midnight-ink-600 mt-2">
                  {stat.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * AnimatedValue Component
 *
 * Animates the number counter on visibility
 */
function AnimatedValue({ value, className }: { value: string; className: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateValue();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const animateValue = () => {
    // Extract numeric part
    const numericMatch = value.match(/[\d.]+/);
    if (!numericMatch) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(numericMatch[0]);
    const prefix = value.substring(0, value.indexOf(numericMatch[0]));
    const suffix = value.substring(value.indexOf(numericMatch[0]) + numericMatch[0].length);

    const duration = 1000;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = targetNum * easeOut;

      // Format based on original value
      let formatted: string;
      if (numericMatch[0].includes('.')) {
        formatted = currentValue.toFixed(numericMatch[0].split('.')[1]?.length || 0);
      } else {
        formatted = Math.round(currentValue).toString();
      }

      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, stepDuration);
  };

  return (
    <div ref={ref} className={className}>
      {displayValue}
    </div>
  );
}

export default StatsSection;
