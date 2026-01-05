import React, { useState } from 'react'
import { UseFormReturn, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LabelWithColumn } from '@/components/ui/AdminColumnHint'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlatformInput } from './PlatformInput'
import { RightsCheckboxGroup } from './RightsCheckboxGroup'
import { CollectButton, CollectionConfirmDialog, IntelligenceResultsModal } from '@/components/tools'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import {
  collectIntelligenceByUrls,
  getIntelligenceTitleWithSources,
  directIngestToTitle,
  parseUrl,
  type IntelligenceTitleWithSources,
  type ExtractedIntelligenceData,
} from '@/services/intelligenceService'


const GENRE_OPTIONS = [
  'romance',
  'fantasy',
  'action',
  'drama',
  'comedy',
  'thriller',
  'horror',
  'sci_fi',
  'slice_of_life',
  'historical',
  'mystery',
  'sports',
  'other'
]

const CONTENT_FORMAT_OPTIONS = [
  'webtoon',
  'web_novel',
  'book',
  'script',
  'game',
  'animation',
  'other'
]

interface TitleData {
  title_id?: string;
  title_name_kr?: string | null;
  title_name_en?: string | null;
  views?: number | null;
  likes?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  chapters?: number | null;
  synopsis_kr?: string | null;
  genre?: string | string[] | null;
  keywords?: string[] | null;
  story_author?: string | null;
  title_image?: string | null;
  age_rating?: string | null;
  completed?: boolean | null;
}

interface Step1BasicInfoProps {
  form: UseFormReturn<any>
  /** Title data for pre-collection confirmation (EditTitle only) */
  title?: TitleData | null
  /** Title ID for ingestion (EditTitle only) */
  titleId?: string
  /** Callback when fields are updated via intelligence collection */
  onFieldsUpdated?: () => void
}

/**
 * Step1BasicInfo Component
 *
 * First step of the 5-step survey: Basic title information
 * Collects required fields, English title type, Hangul titles, rights holder info, and publishing platforms
 *
 * When editing an existing title, includes "Collect" buttons next to URL fields
 * to fetch platform data and auto-populate fields.
 */
export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  form,
  title,
  titleId,
  onFieldsUpdated
}) => {
  const { t } = useTranslation(['survey', 'titles', 'common'])
  const { register, watch, setValue, control, formState: { errors } } = form
  const { user } = useAuth()
  const { toast } = useToast()

  // Intelligence collection state
  const [koConfirmOpen, setKoConfirmOpen] = useState(false)
  const [enConfirmOpen, setEnConfirmOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [collectingKo, setCollectingKo] = useState(false)
  const [collectingEn, setCollectingEn] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [intelligenceResults, setIntelligenceResults] = useState<IntelligenceTitleWithSources | null>(null)

  const isOfficialEnglish = watch('is_official_english_title')
  const englishTitleType = watch('english_title_type')
  const platforms = watch('platforms') || []
  const titleUrl = watch('title_url')
  const titleUrlEn = watch('title_url_en')

  // Can only collect if we have a titleId (editing existing title)
  const canCollect = !!titleId

  /**
   * Handle Korean URL collection
   */
  const handleKoCollect = async () => {
    if (!titleUrl || !user?.email || !titleId) return

    setCollectingKo(true)
    try {
      const parsed = parseUrl(titleUrl)
      if (!parsed.valid || parsed.platform === 'unknown') {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid platform URL',
          variant: 'destructive',
        })
        return
      }

      const response = await collectIntelligenceByUrls(
        { urls: [parsed] },
        user.email
      )

      if (response.intelligenceTitleId) {
        const results = await getIntelligenceTitleWithSources(response.intelligenceTitleId)
        setIntelligenceResults(results)
        setResultsOpen(true)
        toast({
          title: 'Data collected',
          description: `Successfully collected data from ${response.sourcesCollected.join(', ')}`,
        })
      }
    } catch (error) {
      console.error('Collection error:', error)
      toast({
        title: 'Collection failed',
        description: error instanceof Error ? error.message : 'Failed to collect data',
        variant: 'destructive',
      })
    } finally {
      setCollectingKo(false)
    }
  }

  /**
   * Handle English URL collection
   */
  const handleEnCollect = async () => {
    if (!titleUrlEn || !user?.email || !titleId) return

    setCollectingEn(true)
    try {
      const parsed = parseUrl(titleUrlEn)
      if (!parsed.valid || parsed.platform === 'unknown') {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid platform URL',
          variant: 'destructive',
        })
        return
      }

      const response = await collectIntelligenceByUrls(
        { urls: [parsed] },
        user.email
      )

      if (response.intelligenceTitleId) {
        const results = await getIntelligenceTitleWithSources(response.intelligenceTitleId)
        setIntelligenceResults(results)
        setResultsOpen(true)
        toast({
          title: 'Data collected',
          description: `Successfully collected data from ${response.sourcesCollected.join(', ')}`,
        })
      }
    } catch (error) {
      console.error('Collection error:', error)
      toast({
        title: 'Collection failed',
        description: error instanceof Error ? error.message : 'Failed to collect data',
        variant: 'destructive',
      })
    } finally {
      setCollectingEn(false)
    }
  }

  /**
   * Handle field ingestion into title
   */
  const handleIngest = async (selectedFields: Partial<ExtractedIntelligenceData>) => {
    if (!titleId) return

    setIsIngesting(true)
    try {
      await directIngestToTitle(titleId, selectedFields)

      // Update form with new values
      Object.entries(selectedFields).forEach(([key, value]) => {
        setValue(key, value, { shouldDirty: true })
      })

      toast({
        title: 'Fields updated',
        description: `Successfully updated ${Object.keys(selectedFields).length} field(s)`,
      })

      // Notify parent to refresh data
      onFieldsUpdated?.()
    } catch (error) {
      console.error('Ingestion error:', error)
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update fields',
        variant: 'destructive',
      })
    } finally {
      setIsIngesting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Section: Required Basic Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step1.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step1.subtitle')}
          </p>
        </div>

        {/* Title Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="title_name_en"
              label={t('survey:step1.titleNameEn')}
              column="title_name_en"
              required
            />
            <Input
              id="title_name_en"
              placeholder={t('survey:step1.titleNameEnPlaceholder')}
              {...register('title_name_en', { required: 'English title is required' })}
              className="bg-white border-gray-300"
            />
            {errors.title_name_en && (
              <p className="text-sm text-red-600">{errors.title_name_en.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="title_name_kr"
              label={t('survey:step1.titleNameKr')}
              column="title_name_kr"
              required
            />
            <Input
              id="title_name_kr"
              placeholder={t('survey:step1.titleNameKrPlaceholder')}
              {...register('title_name_kr', { required: 'Korean title is required' })}
              className="bg-white border-gray-300"
            />
            {errors.title_name_kr && (
              <p className="text-sm text-red-600">{errors.title_name_kr.message as string}</p>
            )}
          </div>
        </div>

        {/* URLs with Collect Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="title_url"
              label={t('survey:step1.titleUrl')}
              column="title_url"
              required
            />
            <div className="flex gap-2">
              <Input
                id="title_url"
                type="url"
                placeholder={t('survey:step1.titleUrlPlaceholder')}
                {...register('title_url', { required: 'Title URL is required' })}
                className="bg-white border-gray-300 flex-1"
              />
              {canCollect && (
                <CollectButton
                  url={titleUrl || ''}
                  onClick={() => setKoConfirmOpen(true)}
                  isCollecting={collectingKo}
                  disabled={!titleUrl?.trim()}
                />
              )}
            </div>
            {errors.title_url && (
              <p className="text-sm text-red-600">{errors.title_url.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="title_url_en"
              label={t('survey:step1.titleUrlEn')}
              column="title_url_en"
            />
            <div className="flex gap-2">
              <Input
                id="title_url_en"
                type="url"
                placeholder={t('survey:step1.titleUrlEnPlaceholder')}
                {...register('title_url_en')}
                className="bg-white border-gray-300 flex-1"
              />
              {canCollect && (
                <CollectButton
                  url={titleUrlEn || ''}
                  onClick={() => setEnConfirmOpen(true)}
                  isCollecting={collectingEn}
                  disabled={!titleUrlEn?.trim()}
                />
              )}
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <LabelWithColumn
            htmlFor="title_image"
            label={t('survey:step1.coverImage')}
            column="title_image"
            required
          />
          <Input
            id="title_image"
            type="url"
            placeholder={t('survey:step1.coverImagePlaceholder')}
            {...register('title_image', { required: 'Cover image URL is required' })}
            className="bg-white border-gray-300"
          />
          {errors.title_image && (
            <p className="text-sm text-red-600">{errors.title_image.message as string}</p>
          )}
        </div>

        {/* Underlying Novel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="underlying_novel_kr"
              label={`${t('survey:step1.underlyingNovelKr')} `}
              column="underlying_novel_kr"
            />
            <span className="text-xs text-gray-500 -mt-1 block">{t('survey:step1.underlyingNovelKrHelper')}</span>
            <Input
              id="underlying_novel_kr"
              placeholder={t('survey:step1.underlyingNovelKrPlaceholder')}
              {...register('underlying_novel_kr')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="underlying_novel_en"
              label={t('survey:step1.underlyingNovelEn')}
              column="underlying_novel_en"
            />
            <Input
              id="underlying_novel_en"
              placeholder={t('survey:step1.underlyingNovelEnPlaceholder')}
              {...register('underlying_novel_en')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        {/* Genre and Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn
              label={t('survey:step1.genre')}
              column="genre"
              required
            />
            <Controller
              name="genre"
              control={control}
              rules={{ required: 'Genre is required' }}
              render={({ field }) => (
                <Select
                  value={field.value?.[0] || ''}
                  onValueChange={(value) => field.onChange([value])}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder={t('survey:step1.genreSelect')} />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.genre && (
              <p className="text-sm text-red-600">{errors.genre.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithColumn
              label={t('survey:step1.contentFormat')}
              column="content_format"
            />
            <Controller
              name="content_format"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder={t('survey:step1.formatSelect')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMAT_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Keywords and Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="keywords"
              label={t('survey:step1.keywords')}
              column="keywords"
            />
            <Input
              id="keywords"
              placeholder={t('survey:step1.keywordsPlaceholder')}
              {...register('keywords')}
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500">{t('survey:step1.keywordsHelper')}</p>
          </div>

          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="tone"
              label={t('survey:step1.tone')}
              column="tone"
            />
            <Input
              id="tone"
              placeholder={t('survey:step1.tonePlaceholder')}
              {...register('tone')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Section: English Title */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('survey:step1.englishTitleSection')}</h3>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="is_official_english_title"
            checked={isOfficialEnglish}
            onCheckedChange={(checked) =>
              setValue('is_official_english_title', checked)
            }
          />
          <div className="space-y-1">
            <Label
              htmlFor="is_official_english_title"
              className="text-sm font-normal cursor-pointer"
            >
              {t('survey:step1.officialEnglishCheckbox')}
            </Label>
            <p className="text-xs text-gray-500">
              {t('survey:step1.officialEnglishHelper')}
            </p>
          </div>
        </div>

        {isOfficialEnglish && (
          <div className="ml-6 space-y-3">
            <Label className="text-sm font-medium">{t('survey:step1.englishTitleType')}</Label>
            <RadioGroup
              value={englishTitleType}
              onValueChange={(value) =>
                setValue('english_title_type', value as 'official' | 'translation')
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="official" id="official" />
                <Label htmlFor="official" className="font-normal cursor-pointer">
                  {t('survey:step1.englishTitleTypeOfficial')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="translation" id="translation" />
                <Label htmlFor="translation" className="font-normal cursor-pointer">
                  {t('survey:step1.englishTitleTypeTranslation')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Section: Rights Holder */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step1.rightsHolderSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step1.rightsHolderSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn
            htmlFor="rights_holder_name"
            label={t('survey:step1.rightsHolderName')}
            column="rights_holder_name"
          />
          <Input
            id="rights_holder_name"
            placeholder={t('survey:step1.rightsHolderNamePlaceholder')}
            {...register('rights_holder_name')}
            className="bg-white border-gray-300"
          />
          {errors.rights_holder_name && (
            <p className="text-sm text-red-600">{errors.rights_holder_name.message as string}</p>
          )}
        </div>
      </div>

      {/* Section: Credits */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step1.creditsSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step1.creditsSubtitle')}
          </p>
        </div>

        <div className="space-y-2">
          <LabelWithColumn
            htmlFor="story_author"
            label={t('survey:step1.storyAuthor')}
            column="story_author"
            required
          />
          <Input
            id="story_author"
            placeholder={t('survey:step1.storyAuthorPlaceholder')}
            {...register('story_author', { required: 'Story author is required' })}
            className="bg-white border-gray-300"
          />
          {errors.story_author && (
            <p className="text-sm text-red-600">{errors.story_author.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="art_author"
              label={t('survey:step1.artAuthor')}
              column="art_author"
            />
            <Input
              id="art_author"
              placeholder={t('survey:step1.artAuthorPlaceholder')}
              {...register('art_author')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <LabelWithColumn
              htmlFor="writer"
              label={t('survey:step1.originalAuthor')}
              column="writer"
            />
            <Input
              id="writer"
              placeholder={t('survey:step1.originalAuthorPlaceholder')}
              {...register('writer')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Section: Rights & Business */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step1.rightsBusinessSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step1.rightsBusinessSubtitle')}
          </p>
        </div>

        {/* Rights Available - Multi-select checkboxes */}
        <div className="space-y-2">
          <LabelWithColumn
            label={t('survey:step1.rightsAvailable')}
            column="rights_available"
          />
          <Controller
            name="rights_available"
            control={control}
            render={({ field }) => (
              <RightsCheckboxGroup
                value={field.value || []}
                onChange={field.onChange}
              />
            )}
          />
          <p className="text-sm text-gray-500">
            {t('survey:step1.rightsAvailableHelper')}
          </p>
        </div>

        {/* Perfect For field */}
        <div className="space-y-2">
          <LabelWithColumn
            htmlFor="perfect_for"
            label={t('survey:step1.perfectFor')}
            column="perfect_for"
          />
          <Input
            id="perfect_for"
            placeholder={t('survey:step1.perfectForPlaceholder')}
            {...register('perfect_for')}
            className="bg-white border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <LabelWithColumn
            htmlFor="audience"
            label={t('survey:step1.targetAudience')}
            column="audience"
          />
          <Input
            id="audience"
            placeholder={t('survey:step1.targetAudiencePlaceholder')}
            {...register('audience')}
            className="bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Section: Publishing Platforms */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step1.platformsSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step1.platformsSubtitle')}
          </p>
        </div>

        <PlatformInput
          platforms={platforms}
          onChange={(newPlatforms) => setValue('platforms', newPlatforms)}
          error={errors.platforms?.message as string}
        />
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('survey:step1.tipsTitle')}</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>{t('survey:step1.tip1')}</li>
          <li>{t('survey:step1.tip2')}</li>
          <li>{t('survey:step1.tip3')}</li>
          <li>{t('survey:step1.tip4')}</li>
        </ul>
      </div>

      {/* Intelligence Collection Dialogs */}
      {canCollect && (
        <>
          {/* Korean URL Pre-Collection Confirmation */}
          <CollectionConfirmDialog
            open={koConfirmOpen}
            onOpenChange={setKoConfirmOpen}
            url={titleUrl || ''}
            currentTitle={title || null}
            onConfirm={handleKoCollect}
            isCollecting={collectingKo}
          />

          {/* English URL Pre-Collection Confirmation */}
          <CollectionConfirmDialog
            open={enConfirmOpen}
            onOpenChange={setEnConfirmOpen}
            url={titleUrlEn || ''}
            currentTitle={title || null}
            onConfirm={handleEnCollect}
            isCollecting={collectingEn}
          />

          {/* Post-Collection Results Modal */}
          <IntelligenceResultsModal
            open={resultsOpen}
            onOpenChange={setResultsOpen}
            results={intelligenceResults}
            onIngest={handleIngest}
            isIngesting={isIngesting}
          />
        </>
      )}
    </div>
  )
}
