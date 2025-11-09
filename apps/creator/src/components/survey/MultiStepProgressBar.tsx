import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'

interface Step {
  number: number
  label: string
  description: string
}

interface MultiStepProgressBarProps {
  currentStep: number
  steps: Step[]
  onStepClick?: (step: number) => void
  allowNavigation?: boolean
}

/**
 * MultiStepProgressBar Component
 *
 * Visual progress indicator for the 5-step survey form
 * Shows completed, current, and upcoming steps with interactive navigation
 *
 * @param currentStep - Current active step (1-5)
 * @param steps - Array of step definitions with labels and descriptions
 * @param onStepClick - Optional callback when step is clicked
 * @param allowNavigation - Whether to allow clicking on steps to navigate
 */
export const MultiStepProgressBar: React.FC<MultiStepProgressBarProps> = ({
  currentStep,
  steps,
  onStepClick,
  allowNavigation = false,
}) => {
  const { t } = useTranslation(['survey'])

  const handleStepClick = (stepNumber: number) => {
    if (allowNavigation && onStepClick) {
      onStepClick(stepNumber)
    }
  }

  return (
    <div className="w-full py-8">
      {/* Progress bar for mobile */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {t('survey:navigation.stepProgress', { current: currentStep, total: steps.length })}
          </span>
          <span className="text-sm text-gray-500">
            {t('survey:navigation.percentComplete', { percent: Math.round((currentStep / steps.length) * 100) })}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">{steps[currentStep - 1]?.label}</p>
      </div>

      {/* Step indicators for desktop */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-black transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />

          {/* Step circles and labels */}
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isCompleted = step.number < currentStep
              const isCurrent = step.number === currentStep
              const isUpcoming = step.number > currentStep
              const isClickable = allowNavigation && (isCompleted || isCurrent)

              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / steps.length}%` }}
                >
                  {/* Step circle */}
                  <button
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                    className={`
                      relative z-10 flex items-center justify-center
                      w-10 h-10 rounded-full border-2 transition-all duration-300
                      ${isCompleted ? 'bg-black border-black text-white' : ''}
                      ${isCurrent ? 'bg-white border-black text-black ring-4 ring-gray-100' : ''}
                      ${isUpcoming ? 'bg-white border-gray-300 text-gray-400' : ''}
                      ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                      ${isClickable && !isCurrent ? 'hover:ring-4 hover:ring-gray-100' : ''}
                    `}
                    aria-label={`${step.label} - Step ${step.number}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </button>

                  {/* Step label */}
                  <div className="mt-3 text-center">
                    <p
                      className={`
                        text-sm font-medium transition-colors
                        ${isCurrent ? 'text-black' : ''}
                        ${isCompleted ? 'text-gray-700' : ''}
                        ${isUpcoming ? 'text-gray-400' : ''}
                      `}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="mt-1 text-xs text-gray-500 max-w-[120px]">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Get default step configuration for 5-step title questionnaire
 * @param t - Translation function from useTranslation hook
 * @returns Array of localized step definitions
 */
export const getDefaultSteps = (t: (key: string) => string): Step[] => [
  {
    number: 1,
    label: t('survey:steps.step1Label'),
    description: t('survey:steps.step1Description'),
  },
  {
    number: 2,
    label: t('survey:steps.step2Label'),
    description: t('survey:steps.step2Description'),
  },
  {
    number: 3,
    label: t('survey:steps.step3Label'),
    description: t('survey:steps.step3Description'),
  },
  {
    number: 4,
    label: t('survey:steps.step4Label'),
    description: t('survey:steps.step4Description'),
  },
  {
    number: 5,
    label: t('survey:steps.step5Label'),
    description: t('survey:steps.step5Description'),
  },
]

/**
 * @deprecated Use getDefaultSteps(t) instead
 * Legacy constant for backward compatibility
 */
export const DEFAULT_STEPS: Step[] = [
  {
    number: 1,
    label: 'Basic Info',
    description: 'Title details and rights',
  },
  {
    number: 2,
    label: 'Story Details',
    description: 'Setting and characters',
  },
  {
    number: 3,
    label: 'Narrative',
    description: 'Structure and arc',
  },
  {
    number: 4,
    label: 'Materials',
    description: 'Documents and links',
  },
  {
    number: 5,
    label: 'Profile',
    description: 'Achievements and awards',
  },
]
