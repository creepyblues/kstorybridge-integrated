import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { X, Plus, Award, TrendingUp } from 'lucide-react'


interface Step5ProfileProps {
  form: UseFormReturn<any>
}

/**
 * Step5Profile Component
 *
 * Fifth and final step of the 5-step survey: Content and Creator Profile
 * Collects achievements, sales records, and creator credentials
 */
export const Step5Profile: React.FC<Step5ProfileProps> = ({ form }) => {
  const { t } = useTranslation(['survey', 'titles'])
  const { register, watch, setValue } = form

  const awards = watch('awards') || []
  const printEditions = watch('print_editions')
  const creatorAchievements = watch('creator_achievements') || {}
  const notableWorks = creatorAchievements.notable_works || []
  const creatorAwards = creatorAchievements.awards_received || []

  const addAward = () => {
    setValue('awards', [...awards, ''])
  }

  const removeAward = (index: number) => {
    setValue(
      'awards',
      awards.filter((_: string, i: number) => i !== index)
    )
  }

  const updateAward = (index: number, value: string) => {
    const updated = [...awards]
    updated[index] = value
    setValue('awards', updated)
  }

  const addNotableWork = () => {
    setValue('creator_achievements', {
      ...creatorAchievements,
      notable_works: [...notableWorks, ''],
    })
  }

  const removeNotableWork = (index: number) => {
    setValue('creator_achievements', {
      ...creatorAchievements,
      notable_works: notableWorks.filter((_: string, i: number) => i !== index),
    })
  }

  const updateNotableWork = (index: number, value: string) => {
    const updated = [...notableWorks]
    updated[index] = value
    setValue('creator_achievements', {
      ...creatorAchievements,
      notable_works: updated,
    })
  }

  const addCreatorAward = () => {
    setValue('creator_achievements', {
      ...creatorAchievements,
      awards_received: [...creatorAwards, ''],
    })
  }

  const removeCreatorAward = (index: number) => {
    setValue('creator_achievements', {
      ...creatorAchievements,
      awards_received: creatorAwards.filter((_: string, i: number) => i !== index),
    })
  }

  const updateCreatorAward = (index: number, value: string) => {
    const updated = [...creatorAwards]
    updated[index] = value
    setValue('creator_achievements', {
      ...creatorAchievements,
      awards_received: updated,
    })
  }

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('survey:step5.title')}</h2>
        <p className="text-gray-600 mt-2">
          {t('survey:step5.subtitle')}
        </p>
      </div>

      {/* Section: Title Achievements */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step5.titleAchievementsSection')}</h3>
        </div>

        {/* Awards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('survey:step5.awardsLabel')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAward}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step5.addAward')}
            </Button>
          </div>

          {awards.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t('survey:step5.noAwardsYet')}</p>
          ) : (
            awards.map((award: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={t('survey:step5.awardPlaceholder', { index: index + 1 })}
                  value={award}
                  onChange={(e) => updateAward(index, e.target.value)}
                  className="bg-white border-gray-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAward(index)}
                  className="h-10 w-10 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Sales Records */}
        <div className="space-y-2">
          <Label htmlFor="sales_records">{t('survey:step5.salesRecordsLabel')}</Label>
          <Textarea
            id="sales_records"
            placeholder={t('survey:step5.salesRecordsPlaceholder')}
            {...register('sales_records')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step5.salesRecordsHelper')}
          </p>
        </div>

        {/* Merchandise Deals */}
        <div className="space-y-2">
          <Label htmlFor="merchandise_deals">{t('survey:step5.merchandiseLabel')}</Label>
          <Textarea
            id="merchandise_deals"
            placeholder={t('survey:step5.merchandisePlaceholder')}
            {...register('merchandise_deals')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step5.merchandiseHelper')}
          </p>
        </div>

        {/* Print Editions */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="print_editions"
              checked={printEditions}
              onCheckedChange={(checked) => setValue('print_editions', checked)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="print_editions"
                className="text-sm font-normal cursor-pointer"
              >
                {t('survey:step5.printEditionsCheckbox')}
              </Label>
              <p className="text-xs text-gray-500">
                {t('survey:step5.printEditionsHelper')}
              </p>
            </div>
          </div>

          {printEditions && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="print_edition_details">{t('survey:step5.printEditionDetailsLabel')}</Label>
              <Textarea
                id="print_edition_details"
                placeholder={t('survey:step5.printEditionDetailsPlaceholder')}
                {...register('print_edition_details')}
                rows={3}
                className="bg-white border-gray-300 resize-none"
              />
            </div>
          )}
        </div>

        {/* Media Coverage */}
        <div className="space-y-2">
          <Label htmlFor="media_coverage">{t('survey:step5.mediaCoverageLabel')}</Label>
          <Textarea
            id="media_coverage"
            placeholder={t('survey:step5.mediaCoveragePlaceholder')}
            {...register('media_coverage')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step5.mediaCoverageHelper')}
          </p>
        </div>

        {/* Celebrity Endorsements */}
        <div className="space-y-2">
          <Label htmlFor="celebrity_endorsements">{t('survey:step5.celebrityEndorsementsLabel')}</Label>
          <Textarea
            id="celebrity_endorsements"
            placeholder={t('survey:step5.celebrityEndorsementsPlaceholder')}
            {...register('celebrity_endorsements')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
        </div>
      </div>

      {/* Section: Creator Profile */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step5.creatorProfileSection')}</h3>
        </div>

        <p className="text-sm text-gray-600">
          {t('survey:step5.creatorProfileSubtitle')}
        </p>

        {/* Total Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="creator_total_titles">{t('survey:step5.totalTitlesLabel')}</Label>
            <Input
              id="creator_total_titles"
              type="number"
              placeholder={t('survey:step5.totalTitlesPlaceholder')}
              value={creatorAchievements.total_titles || ''}
              onChange={(e) =>
                setValue('creator_achievements', {
                  ...creatorAchievements,
                  total_titles: parseInt(e.target.value) || 0,
                })
              }
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creator_total_views">{t('survey:step5.totalViewsLabel')}</Label>
            <Input
              id="creator_total_views"
              placeholder={t('survey:step5.totalViewsPlaceholder')}
              value={creatorAchievements.total_views || ''}
              onChange={(e) =>
                setValue('creator_achievements', {
                  ...creatorAchievements,
                  total_views: e.target.value,
                })
              }
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        {/* Notable Works */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('survey:step5.notableWorksLabel')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNotableWork}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step5.addTitle')}
            </Button>
          </div>

          {notableWorks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t('survey:step5.noPreviousWorks')}</p>
          ) : (
            notableWorks.map((work: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={t('survey:step5.titlePlaceholder', { index: index + 1 })}
                  value={work}
                  onChange={(e) => updateNotableWork(index, e.target.value)}
                  className="bg-white border-gray-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotableWork(index)}
                  className="h-10 w-10 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Creator Awards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('survey:step5.creatorAwardsLabel')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCreatorAward}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step5.addAward')}
            </Button>
          </div>

          {creatorAwards.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t('survey:step5.noCreatorAwards')}</p>
          ) : (
            creatorAwards.map((award: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={t('survey:step5.awardPlaceholder', { index: index + 1 })}
                  value={award}
                  onChange={(e) => updateCreatorAward(index, e.target.value)}
                  className="bg-white border-gray-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCreatorAward(index)}
                  className="h-10 w-10 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Industry Recognition */}
        <div className="space-y-2">
          <Label htmlFor="creator_industry_recognition">
            {t('survey:step5.industryRecognitionLabel')}
          </Label>
          <Textarea
            id="creator_industry_recognition"
            placeholder={t('survey:step5.industryRecognitionPlaceholder')}
            value={creatorAchievements.industry_recognition || ''}
            onChange={(e) =>
              setValue('creator_achievements', {
                ...creatorAchievements,
                industry_recognition: e.target.value,
              })
            }
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            {t('survey:step5.industryRecognitionHelper')}
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('survey:step5.tipsTitle')}</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>{t('survey:step5.tip1')}</li>
          <li>{t('survey:step5.tip2')}</li>
          <li>{t('survey:step5.tip3')}</li>
          <li>{t('survey:step5.tip4')}</li>
          <li>{t('survey:step5.tip5')}</li>
          <li>{t('survey:step5.tip6')}</li>
        </ul>
      </div>

      {/* Final Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>{t('survey:step5.almostDoneTitle')}</strong> {t('survey:step5.almostDoneMessage')}
        </p>
      </div>
    </div>
  )
}
