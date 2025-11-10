import React from 'react'
import { UseFormReturn, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Step1BasicInfoProps {
  form: UseFormReturn<any>
}

/**
 * Step1BasicInfo Component
 *
 * First step of the 5-step survey: Basic title information
 * Collects required fields, English title type, Hangul titles, rights holder info, and publishing platforms
 */
export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ form }) => {
  const { t } = useTranslation(['survey', 'titles', 'common'])
  const { register, watch, setValue, control, formState: { errors } } = form

  const isOfficialEnglish = watch('is_official_english_title')
  const englishTitleType = watch('english_title_type')
  const platforms = watch('platforms') || []

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
            <Label htmlFor="title_name_en">
              {t('survey:step1.titleNameEn')} <span className="text-red-500">*</span>
            </Label>
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
            <Label htmlFor="title_name_kr">
              {t('survey:step1.titleNameKr')} <span className="text-red-500">*</span>
            </Label>
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

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title_url">
              {t('survey:step1.titleUrl')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title_url"
              type="url"
              placeholder={t('survey:step1.titleUrlPlaceholder')}
              {...register('title_url', { required: 'Title URL is required' })}
              className="bg-white border-gray-300"
            />
            {errors.title_url && (
              <p className="text-sm text-red-600">{errors.title_url.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_image">
              {t('survey:step1.coverImage')} <span className="text-red-500">*</span>
            </Label>
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
        </div>

        {/* Underlying Novel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="underlying_novel_kr">
              {t('survey:step1.underlyingNovelKr')}
              <span className="text-xs text-gray-500 ml-2">{t('survey:step1.underlyingNovelKrHelper')}</span>
            </Label>
            <Input
              id="underlying_novel_kr"
              placeholder={t('survey:step1.underlyingNovelKrPlaceholder')}
              {...register('underlying_novel_kr')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="underlying_novel_en">
              {t('survey:step1.underlyingNovelEn')}
            </Label>
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
            <Label>
              {t('survey:step1.genre')} <span className="text-red-500">*</span>
            </Label>
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
            <Label>{t('survey:step1.contentFormat')}</Label>
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
            <Label htmlFor="keywords">{t('survey:step1.keywords')}</Label>
            <Input
              id="keywords"
              placeholder={t('survey:step1.keywordsPlaceholder')}
              {...register('keywords')}
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500">{t('survey:step1.keywordsHelper')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">{t('survey:step1.tone')}</Label>
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
          <Label htmlFor="rights_holder_name">
            {t('survey:step1.rightsHolderName')}
          </Label>
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
          <Label htmlFor="story_author">
            {t('survey:step1.storyAuthor')} <span className="text-red-500">*</span>
          </Label>
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
            <Label htmlFor="art_author">{t('survey:step1.artAuthor')}</Label>
            <Input
              id="art_author"
              placeholder={t('survey:step1.artAuthorPlaceholder')}
              {...register('art_author')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="writer">{t('survey:step1.originalAuthor')}</Label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rights">{t('survey:step1.rightsAvailable')}</Label>
            <Input
              id="rights"
              placeholder={t('survey:step1.rightsAvailablePlaceholder')}
              {...register('rights')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfect_for">{t('survey:step1.perfectFor')}</Label>
            <Input
              id="perfect_for"
              placeholder={t('survey:step1.perfectForPlaceholder')}
              {...register('perfect_for')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">{t('survey:step1.targetAudience')}</Label>
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
    </div>
  )
}
