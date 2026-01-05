import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LabelWithColumn } from '@/components/ui/AdminColumnHint'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Plus } from 'lucide-react'
import { CharacterDetailsInput } from './CharacterDetailsInput'


interface Step2StoryDetailsProps {
  form: UseFormReturn<any>
}

/**
 * Step2StoryDetails Component
 *
 * Second step of the 5-step survey: Story details and world-building
 * Collects inspiration, setting, world lore, and character details
 */
export const Step2StoryDetails: React.FC<Step2StoryDetailsProps> = ({ form }) => {
  const { t } = useTranslation(['survey', 'titles'])
  const { register, watch, setValue, formState: { errors } } = form

  const comparables = watch('comparables') || []
  const characters = watch('character_details') || []
  const completed = watch('completed') || false

  const addComparable = () => {
    setValue('comparables', [...comparables, ''])
  }

  const removeComparable = (index: number) => {
    setValue(
      'comparables',
      comparables.filter((_: string, i: number) => i !== index)
    )
  }

  const updateComparable = (index: number, value: string) => {
    const updated = [...comparables]
    updated[index] = value
    setValue('comparables', updated)
  }

  return (
    <div className="space-y-8">
      {/* Section: Content Details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step2.contentDetailsSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step2.contentDetailsSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="tagline" label={t('survey:step2.tagline')} column="tagline" />
          <Input
            id="tagline"
            placeholder={t('survey:step2.taglinePlaceholder')}
            {...register('tagline')}
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.taglineHelper')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="synopsis" label={t('survey:step2.synopsis')} column="synopsis" />
          <Textarea
            id="synopsis"
            placeholder={t('survey:step2.synopsisPlaceholder')}
            {...register('synopsis')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.synopsisHelper')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="description" label={t('survey:step2.description')} column="description" />
          <Textarea
            id="description"
            placeholder={t('survey:step2.descriptionPlaceholder')}
            {...register('description')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.descriptionHelper')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="note" label={t('survey:step2.notes')} column="note" />
          <Textarea
            id="note"
            placeholder={t('survey:step2.notesPlaceholder')}
            {...register('note')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.notesHelper')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn htmlFor="chapters" label={t('survey:step2.chapters')} column="chapters" />
            <Input
              id="chapters"
              type="number"
              placeholder={t('survey:step2.chaptersPlaceholder')}
              {...register('chapters', { valueAsNumber: true })}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="completed"
              checked={completed}
              onCheckedChange={(checked) => setValue('completed', checked as boolean)}
            />
            <Label
              htmlFor="completed"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t('survey:step2.seriesCompleted')}
            </Label>
          </div>
        </div>
      </div>

      {/* Section: Story Inspiration */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step2.storyBackgroundSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step2.storyBackgroundSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="inspiration" label={t('survey:step2.inspiration')} column="inspiration" />
          <Textarea
            id="inspiration"
            placeholder={t('survey:step2.inspirationPlaceholder')}
            {...register('inspiration')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.inspirationHelper')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="important_issues" label={t('survey:step2.importantIssues')} column="important_issues" />
          <Textarea
            id="important_issues"
            placeholder={t('survey:step2.importantIssuesPlaceholder')}
            {...register('important_issues')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.importantIssuesHelper')}
          </p>
        </div>
      </div>

      {/* Section: Comparable Titles */}
      <div className="space-y-4">
        <div>
          <LabelWithColumn label={t('survey:step2.comparableTitles')} column="comparables" className="text-base font-medium" />
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step2.comparableTitlesSubtitle')}
          </p>
        </div>

        {comparables.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">
              {t('survey:step2.noComparables')}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addComparable}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step2.addComparable')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {comparables.map((comparable: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={t('survey:step2.comparablePlaceholder', { index: index + 1 })}
                  value={comparable}
                  onChange={(e) => updateComparable(index, e.target.value)}
                  className="bg-white border-gray-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeComparable(index)}
                  className="h-10 w-10 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addComparable}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step2.addAnother')}
            </Button>
          </div>
        )}
      </div>

      {/* Section: World Building (REQUIRED) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('survey:step2.worldBuildingSection')} <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step2.worldBuildingSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="setting_description" label={t('survey:step2.settingDescription')} column="setting_description" required />
          <Textarea
            id="setting_description"
            placeholder={t('survey:step2.settingPlaceholder')}
            {...register('setting_description', {
              required: 'Setting description is required',
            })}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          {errors.setting_description && (
            <p className="text-sm text-red-600">{errors.setting_description.message as string}</p>
          )}
          <p className="text-xs text-gray-500">
            {t('survey:step2.settingHelper')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="world_lore" label={t('survey:step2.worldLore')} column="world_lore" />
          <Textarea
            id="world_lore"
            placeholder={t('survey:step2.worldLorePlaceholder')}
            {...register('world_lore')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.worldLoreHelper')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn htmlFor="supernatural_concepts" label={t('survey:step2.supernaturalConcepts')} column="supernatural_concepts" />
          <Textarea
            id="supernatural_concepts"
            placeholder={t('survey:step2.supernaturalPlaceholder')}
            {...register('supernatural_concepts')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step2.supernaturalHelper')}
          </p>
        </div>
      </div>

      {/* Section: Characters (REQUIRED) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('survey:step2.mainCharactersSection')} <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step2.mainCharactersSubtitle')}
          </p>
        </div>

        <CharacterDetailsInput
          characters={characters}
          onChange={(newCharacters) => setValue('character_details', newCharacters)}
          error={errors.character_details?.message as string}
          required={true}
        />
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('survey:step2.tipsTitle')}</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>{t('survey:step2.tip1')}</li>
          <li>{t('survey:step2.tip2')}</li>
          <li>{t('survey:step2.tip3')}</li>
          <li>{t('survey:step2.tip4')}</li>
          <li>{t('survey:step2.tip5')}</li>
        </ul>
      </div>
    </div>
  )
}
