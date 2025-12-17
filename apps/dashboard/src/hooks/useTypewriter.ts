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
  skipToEnd: () => void;
}

const PUNCTUATION_CHARS = new Set(['.', ',', '!', '?', ';', ':']);

function getRandomVariance(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.has(char);
}

// Default variance range as stable reference
const DEFAULT_VARIANCE: [number, number] = [-15, 30];

export function useTypewriter({
  text,
  speed = 50,
  startDelay = 0,
  onComplete,
  skipAnimation = false,
  varianceRange = DEFAULT_VARIANCE,
  punctuationPause = 200,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedText, setDisplayedText] = useState(skipAnimation ? text : '');
  const [isComplete, setIsComplete] = useState(skipAnimation);
  const [isTyping, setIsTyping] = useState(!skipAnimation);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const isMountedRef = useRef(true); // Track if component is mounted to prevent memory leaks

  // Store callbacks and values in refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const varianceRef = useRef(varianceRange);

  // Update refs when props change
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    varianceRef.current = varianceRange;
  }, [varianceRange]);

  // Track component mount status to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(true);
  }, []);

  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayedText(text);
    setIsComplete(true);
    setIsTyping(false);
    indexRef.current = text.length;
    onCompleteRef.current?.();
  }, [text]);

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
      // Prevent state updates if component unmounted (memory leak prevention)
      if (!isMountedRef.current) {
        return;
      }

      if (indexRef.current < text.length) {
        const char = text[indexRef.current];
        setDisplayedText(text.slice(0, indexRef.current + 1));

        // Calculate delay for next character
        let delay = speed + getRandomVariance(varianceRef.current);
        if (isPunctuation(char)) {
          delay += punctuationPause;
        }

        indexRef.current++;
        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    };

    // Start after initial delay
    timeoutRef.current = setTimeout(typeNextChar, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay, skipAnimation, punctuationPause]);

  return { displayedText, isComplete, isTyping, reset, skipToEnd };
}
