import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterLine {
  text: string;
  className?: string;
  delay?: number;
}

interface TypewriterTextProps {
  lines: TypewriterLine[];
  cursorClassName?: string;
  storageKey?: string;
  onAllComplete?: () => void;
  baseSpeed?: number;
  lineBreakPause?: number;
}

const PUNCTUATION_CHARS = new Set(['.', ',', '!', '?', ';', ':']);

function getRandomVariance(): number {
  return Math.floor(Math.random() * 45) - 15; // -15 to +30
}

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.has(char);
}

export function TypewriterText({
  lines,
  cursorClassName = 'text-hanok-teal',
  storageKey = 'typewriter-played',
  onAllComplete,
  baseSpeed = 50,
  lineBreakPause = 400,
}: TypewriterTextProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedTexts, setDisplayedTexts] = useState<string[]>(() =>
    lines.map(() => '')
  );
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);

  // Check session storage and reduced motion on mount
  useEffect(() => {
    const hasPlayed = sessionStorage.getItem(storageKey);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasPlayed || prefersReducedMotion) {
      setShouldSkip(true);
      setDisplayedTexts(lines.map(line => line.text));
      setCurrentLineIndex(lines.length);
      setIsAllComplete(true);
    }
  }, [storageKey, lines]);

  // Full text for accessibility
  const fullText = useMemo(() =>
    lines.map(line => line.text).join(' '),
    [lines]
  );

  // Type the current line
  useEffect(() => {
    if (shouldSkip || currentLineIndex >= lines.length) return;

    const currentLine = lines[currentLineIndex];
    const lineDelay = currentLineIndex === 0 ? 200 : (currentLine.delay ?? lineBreakPause);
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (charIndex < currentLine.text.length) {
        const char = currentLine.text[charIndex];

        setDisplayedTexts(prev => {
          const newTexts = [...prev];
          newTexts[currentLineIndex] = currentLine.text.slice(0, charIndex + 1);
          return newTexts;
        });

        let delay = baseSpeed + getRandomVariance();
        if (isPunctuation(char)) {
          delay += 200; // punctuation pause
        }

        charIndex++;
        timeoutId = setTimeout(typeNextChar, delay);
      } else {
        // Line complete, move to next
        if (currentLineIndex < lines.length - 1) {
          setCurrentLineIndex(prev => prev + 1);
        } else {
          // All lines complete
          setIsAllComplete(true);
          sessionStorage.setItem(storageKey, 'true');
          onAllComplete?.();
        }
      }
    };

    // Start after line delay
    timeoutId = setTimeout(typeNextChar, lineDelay);

    return () => clearTimeout(timeoutId);
  }, [currentLineIndex, shouldSkip, lines, baseSpeed, lineBreakPause, storageKey, onAllComplete]);

  const isTyping = !isAllComplete && currentLineIndex < lines.length;

  return (
    <div
      role="heading"
      aria-level={1}
      aria-label={fullText}
    >
      {lines.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const showCursor = isTyping && isCurrentLine && !shouldSkip;
        const text = displayedTexts[index] || '';

        // Handle line breaks for the main heading
        const isMainHeading = index < 2;

        return (
          <span key={index}>
            <span className={line.className}>
              {text}
              {showCursor && (
                <span
                  className={cn('animate-cursor-blink ml-0.5', cursorClassName)}
                  aria-hidden="true"
                >
                  |
                </span>
              )}
            </span>
            {/* Add line break between first two heading parts on desktop */}
            {isMainHeading && index === 0 && (
              <br className="hidden md:block" />
            )}
          </span>
        );
      })}
    </div>
  );
}
