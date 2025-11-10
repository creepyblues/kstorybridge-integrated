import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'


interface Step3NarrativeProps {
  form: UseFormReturn<any>
}

/**
 * Step3Narrative Component
 *
 * Third step of the 5-step survey: Narrative structure and arc
 * Collects story structure (beginning/middle/end), planned ending, and narrative arc
 */
export const Step3Narrative: React.FC<Step3NarrativeProps> = ({ form }) => {
  const { t } = useTranslation(['survey', 'titles'])
  const { register, watch, formState: { errors } } = form

  const isCompleted = watch('completed')
  const storyStructure = watch('story_structure')
  const plannedEnding = watch('planned_ending')

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('survey:step3.title')}</h2>
        <p className="text-gray-600 mt-2">
          {t('survey:step3.subtitle')}
        </p>
      </div>

      {/* Section: Story Structure (REQUIRED) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('survey:step3.storyStructureSection')} <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step3.storyStructureSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="story_structure">
            {t('survey:step3.storyStructureLabel')} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="story_structure"
            placeholder={t('survey:step3.storyStructurePlaceholder')}
            {...register('story_structure', {
              required: 'Story structure is required',
              minLength: {
                value: 100,
                message: 'Please provide at least 100 characters describing your story structure',
              },
            })}
            rows={10}
            className="bg-white border-gray-300 resize-none font-mono text-sm"
          />
          {errors.story_structure && (
            <p className="text-sm text-red-600">{errors.story_structure.message as string}</p>
          )}
          {storyStructure && (
            <p className="text-xs text-gray-500">
              {t('survey:step3.storyStructureCharCount', { count: storyStructure.length })}
            </p>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-900">
              <strong>{t('survey:step3.storyStructureTip')}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Section: Planned Ending (Conditional) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('survey:step3.plannedEndingSection')}
            {!isCompleted && <span className="text-red-500 ml-1">*</span>}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isCompleted
              ? t('survey:step3.plannedEndingCompleted')
              : t('survey:step3.plannedEndingOngoing')}
          </p>
        </div>

        {!isCompleted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                {t('survey:step3.ongoingRequiredTitle')}
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                {t('survey:step3.ongoingRequiredMessage')}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="planned_ending">
            {t('survey:step3.endingLabel')}
            {!isCompleted && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id="planned_ending"
            placeholder={
              isCompleted
                ? t('survey:step3.endingPlaceholderCompleted')
                : t('survey:step3.endingPlaceholderOngoing')
            }
            {...register('planned_ending', {
              required: !isCompleted ? 'Planned ending is required for ongoing titles' : false,
              minLength: {
                value: 50,
                message: 'Please provide at least 50 characters describing the ending',
              },
            })}
            rows={5}
            className="bg-white border-gray-300 resize-none"
          />
          {errors.planned_ending && (
            <p className="text-sm text-red-600">{errors.planned_ending.message as string}</p>
          )}
          {plannedEnding && (
            <p className="text-xs text-gray-500">
              {!isCompleted
                ? t('survey:step3.endingCharCountMin', { count: plannedEnding.length })
                : t('survey:step3.endingCharCount', { count: plannedEnding.length })}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {t('survey:step3.endingHelper')}
          </p>
        </div>
      </div>

      {/* Section: Narrative Arc */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step3.narrativeArcSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step3.narrativeArcSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="narrative_arc">
            {t('survey:step3.narrativeArcLabel')}
          </Label>
          <Textarea
            id="narrative_arc"
            placeholder={t('survey:step3.narrativeArcPlaceholder')}
            {...register('narrative_arc')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step3.narrativeArcHelper')}
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('survey:step3.tipsTitle')}</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>{t('survey:step3.tip1')}</li>
          <li>{t('survey:step3.tip2')}</li>
          <li>{t('survey:step3.tip3')}</li>
          <li>{t('survey:step3.tip4')}</li>
          <li>{t('survey:step3.tip5')}</li>
          <li>{t('survey:step3.tip6')}</li>
        </ul>
      </div>
    </div>
  )
}
