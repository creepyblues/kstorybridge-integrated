/**
 * EnhancedSearchLoading Component
 *
 * Engaging loading experience for Comps Navigator searches.
 * Features rotating messages, progress simulation, and fun facts.
 */

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

// =====================================================================
// CONFIGURATION
// =====================================================================

const SEARCH_PHASES = [
  { id: 'describing', label: 'Understanding your comps' },
  { id: 'semantic', label: 'Scanning Korean title database' },
  { id: 'matching', label: 'Finding genre & tone matches' },
  { id: 'ranking', label: 'AI ranking by comp alignment' },
  { id: 'explaining', label: 'Generating match explanations' },
];

// Progress thresholds for phase transitions (based on asymptotic progress %)
// 5 phases now: describing (0%), semantic (15%), matching (35%), ranking (55%), explaining (75%)
const PHASE_THRESHOLDS = [0, 15, 35, 55, 75];

// Asymptotic progress constants
const TIME_CONSTANT = 8000;  // 8 seconds to reach ~63%
const MAX_PROGRESS = 95;

/**
 * Calculate asymptotic progress - always moving, never stopping
 * Formula: progress = maxProgress * (1 - e^(-elapsed / timeConstant))
 *
 * Timeline:
 * - 2s: 22%  - Fast start
 * - 6s: 53%  - Halfway
 * - 10s: 71% - Slowing but moving
 * - 15s: 85% - Final stretch
 * - 20s: 92% - Still moving!
 */
const calculateProgress = (elapsedMs: number): number => {
  const progress = MAX_PROGRESS * (1 - Math.exp(-elapsedMs / TIME_CONSTANT));
  return Math.min(Math.round(progress), MAX_PROGRESS);
};

const LOADING_MESSAGES = [
  { emoji: '🎬', text: "Consulting Hollywood's best matchmakers..." },
  { emoji: '🎭', text: 'Teaching AI about K-drama plot twists...' },
  { emoji: '🍿', text: 'Popping fresh comps for your search...' },
  { emoji: '🎯', text: 'Finding shows that would make Netflix jealous...' },
  { emoji: '🔮', text: "Reading the entertainment industry's crystal ball..." },
  { emoji: '📺', text: 'Scanning every binge-worthy show since 2010...' },
  { emoji: '🌏', text: 'Translating Korean magic into Hollywood gold...' },
  { emoji: '⚡', text: 'Speed-dating through the streaming catalog...' },
  { emoji: '🎪', text: 'Assembling the ultimate match squad...' },
  { emoji: '✨', text: 'Sprinkling some AI magic on your search...' },
  { emoji: '🎥', text: 'Auditioning Korean titles for your brief...' },
  { emoji: '🌟', text: 'Discovering hidden gems in the catalog...' },
];

const FUN_FACTS = [
  'Squid Game became Netflix\'s most-watched series with 1.65B viewing hours',
  'Korean webtoons have inspired 50+ Hollywood adaptations since 2020',
  'The K-content wave (Hallyu) reaches 180+ countries',
  'All of Us Are Dead was greenlit 12 years after its webtoon debut',
  'Sweet Home\'s webtoon had 1.2B views before becoming a Netflix series',
  'Parasite was the first non-English film to win Best Picture at the Oscars',
  'K-dramas are now available in 190+ countries worldwide',
  'The Glory became Netflix\'s #1 non-English series in 91 countries',
  'Physical: 100 sparked a global reality TV trend',
  'Moving had the highest production budget in Korean TV history',
];

interface EnhancedSearchLoadingProps {
  className?: string;
  compDescriptions?: Record<string, string> | null;
}

export function EnhancedSearchLoading({ className = '', compDescriptions }: EnhancedSearchLoadingProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
  const [elapsedTime, setElapsedTime] = useState(0);
  const [funFact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Progress simulation with asymptotic algorithm
  useEffect(() => {
    // Progress timer - updates every 100ms for smooth progress bar
    loadingTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    // Message rotation timer - changes every 3.5 seconds
    messageTimerRef.current = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3500);

    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (messageTimerRef.current) clearInterval(messageTimerRef.current);
    };
  }, []);

  // Calculate progress using asymptotic formula (always moving, never stopping)
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
    <div className={`py-8 flex flex-col items-center justify-center gap-6 ${className}`}>
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

      {/* AI Understanding - Show LLM-generated descriptions */}
      {compDescriptions && Object.keys(compDescriptions).length > 0 && (
        <div className="w-full max-w-sm mt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1.5">
              <Icon icon="solar:magic-stick-3-bold-duotone" className="h-4 w-4" />
              AI Understanding
            </p>
            <div className="space-y-2">
              {Object.entries(compDescriptions).map(([title, description]) => (
                <div key={title} className="text-xs text-blue-700">
                  <span className="font-semibold">{title}:</span>{' '}
                  <span className="text-blue-600">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fun fact - only show when descriptions not yet loaded */}
      {!compDescriptions && (
        <div className="text-center max-w-sm mt-2">
          <div className="bg-hanok-teal/5 border border-hanok-teal/20 rounded-lg p-3">
            <p className="text-xs text-hanok-teal flex items-start gap-2">
              <Icon icon="solar:lightbulb-bolt-bold-duotone" className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span><strong>Did you know?</strong> {funFact}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSearchLoading;
