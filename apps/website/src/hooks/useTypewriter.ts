import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
  skipAnimation?: boolean;
  varianceRange?: [number, number];
  punctuationPause?: number;
}

interface UseTypewriterReturn {
  displayedText: string;
  isComplete: boolean;
  isTyping: boolean;
  reset: () => void;
}

const PUNCTUATION_CHARS = new Set(['.', ',', '!', '?', ';', ':']);

function getRandomVariance(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.has(char);
}

export function useTypewriter({
  text,
  speed = 50,
  startDelay = 0,
  onComplete,
  skipAnimation = false,
  varianceRange = [-15, 30],
  punctuationPause = 200,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedText, setDisplayedText] = useState(skipAnimation ? text : '');
  const [isComplete, setIsComplete] = useState(skipAnimation);
  const [isTyping, setIsTyping] = useState(!skipAnimation);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(true);
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (skipAnimation || prefersReducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(true);

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current];
        setDisplayedText(text.slice(0, indexRef.current + 1));

        // Calculate delay for next character
        let delay = speed + getRandomVariance(varianceRange);
        if (isPunctuation(char)) {
          delay += punctuationPause;
        }

        indexRef.current++;
        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
    };

    // Start after initial delay
    timeoutRef.current = setTimeout(typeNextChar, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay, skipAnimation, varianceRange, punctuationPause, onComplete]);

  return { displayedText, isComplete, isTyping, reset };
}
