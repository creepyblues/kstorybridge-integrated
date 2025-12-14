/**
 * TypewriterText Component
 *
 * A reusable component that displays text with a typewriter animation.
 * Uses the useTypewriter hook for the animation logic.
 */

import { useTypewriter } from '@/hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
  skipAnimation?: boolean;
}

// Stable reference for variance range to prevent re-renders
const DEFAULT_VARIANCE_RANGE: [number, number] = [-5, 15];

export function TypewriterText({
  text,
  className = '',
  speed = 25,
  startDelay = 0,
  onComplete,
  skipAnimation = false,
}: TypewriterTextProps) {
  const { displayedText, isTyping } = useTypewriter({
    text,
    speed,
    startDelay,
    onComplete,
    skipAnimation,
    varianceRange: DEFAULT_VARIANCE_RANGE,
    punctuationPause: 100,
  });

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
