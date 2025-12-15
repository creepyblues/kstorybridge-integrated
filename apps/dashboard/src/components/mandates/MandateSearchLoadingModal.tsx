/**
 * MandateSearchLoadingModal Component
 *
 * Modal with progress bar for Mandate Matcher searches.
 * Features rotating messages, progress simulation, and fun facts.
 * Adapted from Comps Navigator's SearchLoadingModal.
 */

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// =====================================================================
// CONFIGURATION
// =====================================================================

const SEARCH_PHASES = [
  { id: 'understanding', label: 'Analyzing your mandate' },
  { id: 'embedding', label: 'Processing text semantics' },
  { id: 'searching', label: 'Scanning title database' },
  { id: 'explaining', label: 'Generating AI insights' },
];

// Progress thresholds for phase transitions (based on asymptotic progress %)
const PHASE_THRESHOLDS = [0, 20, 45, 70];

// Asymptotic progress constants
const TIME_CONSTANT = 6000;  // 6 seconds to reach ~63% (slightly faster than comps)
const MAX_PROGRESS = 95;

/**
 * Calculate asymptotic progress - always moving, never stopping
 * Formula: progress = maxProgress * (1 - e^(-elapsed / timeConstant))
 */
const calculateProgress = (elapsedMs: number): number => {
  const progress = MAX_PROGRESS * (1 - Math.exp(-elapsedMs / TIME_CONSTANT));
  return Math.min(Math.round(progress), MAX_PROGRESS);
};

const LOADING_MESSAGES = [
  { emoji: '🎯', text: 'Finding your perfect Korean IP...' },
  { emoji: '🔍', text: 'Searching through hidden gems...' },
  { emoji: '🎬', text: 'Matching narrative elements...' },
  { emoji: '📚', text: 'Analyzing story themes...' },
  { emoji: '🌟', text: 'Discovering rising stars...' },
  { emoji: '🎭', text: 'Comparing tone and style...' },
  { emoji: '💡', text: 'AI is connecting the dots...' },
  { emoji: '🏆', text: 'Ranking the best matches...' },
  { emoji: '✨', text: 'Sprinkling some AI magic...' },
  { emoji: '🎪', text: 'Assembling your match squad...' },
];

const FUN_FACTS = [
  'Over 5,000 webtoons are published weekly in Korea',
  'K-dramas are now watched in 190+ countries',
  'Korean content exports grew 600% in the last decade',
  'The webtoon industry is valued at $4+ billion globally',
  "Netflix's top 10 often features Korean content",
  'Sweet Home had 1.2B webtoon views before becoming a series',
  'Squid Game is Netflix\'s most-watched series ever',
  'Korean webtoons have inspired 50+ Hollywood adaptations',
];

interface MandateSearchLoadingModalProps {
  isOpen: boolean;
}

export function MandateSearchLoadingModal({ isOpen }: MandateSearchLoadingModalProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
  const [elapsedTime, setElapsedTime] = useState(0);
  const [funFact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPhase(0);
      setElapsedTime(0);
      setCurrentMessage(Math.floor(Math.random() * LOADING_MESSAGES.length));
    }
  }, [isOpen]);

  // Progress simulation with asymptotic algorithm
  useEffect(() => {
    if (!isOpen) return;

    // Progress timer - updates every 100ms for smooth progress bar
    loadingTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    // Message rotation timer - changes every 3 seconds
    messageTimerRef.current = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (messageTimerRef.current) clearInterval(messageTimerRef.current);
    };
  }, [isOpen]);

  // Calculate progress using asymptotic formula
  const progressPercent = calculateProgress(elapsedTime);

  // Update phase based on progress thresholds
  useEffect(() => {
    for (let i = PHASE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (progressPercent >= PHASE_THRESHOLDS[i]) {
        setCurrentPhase(i);
        break;
      }
    }
  }, [progressPercent]);

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-md rounded-2xl"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <DialogTitle className="sr-only">Searching for Matches</DialogTitle>
        <DialogDescription className="sr-only">
          Please wait while we find Korean titles matching your mandate
        </DialogDescription>

        <div className="py-6 flex flex-col items-center justify-center gap-5">
          {/* Rotating entertaining message */}
          <div className="text-center transition-opacity duration-300" key={currentMessage}>
            <span className="text-4xl mb-3 block">{LOADING_MESSAGES[currentMessage].emoji}</span>
            <p className="text-lg font-medium text-gray-700 italic">
              "{LOADING_MESSAGES[currentMessage].text}"
            </p>
          </div>

          {/* Phase stepper */}
          <div className="w-full max-w-sm space-y-2">
            {SEARCH_PHASES.map((phase, index) => {
              const isComplete = index < currentPhase;
              const isCurrent = index === currentPhase;
              const isPending = index > currentPhase;

              return (
                <div
                  key={phase.id}
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    isComplete ? 'text-green-600' :
                    isCurrent ? 'text-hanok-teal font-medium' :
                    'text-gray-400'
                  }`}
                >
                  {/* Status indicator */}
                  <span className="w-5 flex justify-center">
                    {isComplete && (
                      <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-green-500" />
                    )}
                    {isCurrent && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hanok-teal/60 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-hanok-teal"></span>
                      </span>
                    )}
                    {isPending && (
                      <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                    )}
                  </span>
                  {/* Phase label */}
                  <span>{phase.label}{isCurrent && '...'}</span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-hanok-teal to-hanok-teal/80 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Fun fact */}
          <div className="text-center max-w-sm mt-1">
            <div className="bg-hanok-teal/5 border border-hanok-teal/20 rounded-lg p-3">
              <p className="text-xs text-hanok-teal flex items-start gap-2">
                <Icon icon="solar:lightbulb-bolt-bold-duotone" className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><strong>Did you know?</strong> {funFact}</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MandateSearchLoadingModal;
