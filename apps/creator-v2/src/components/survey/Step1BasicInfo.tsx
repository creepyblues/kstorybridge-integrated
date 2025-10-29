import React from 'react'
import { UseFormReturn, Controller } from 'react-hook-form'
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
import { PlatformInput, PlatformData } from './PlatformInput'

interface Step1FormData {
  // Required basic fields (from AddTitle merge)
  title_name_en: string
  title_name_kr: string
  title_url: string
  title_image: string
  story_author: string
  genre: string[]
  content_format?: string
  keywords?: string
  tone?: string

  // Credits (additional authors)
  art_author?: string
  author?: string
  writer?: string
  illustrator?: string

  // English title classification
  is_official_english_title: boolean
  english_title_type: 'official' | 'translation'

  // Hangul titles
  script_title_kr: string
  script_title_en: string
  art_title_kr: string
  art_title_en: string
  underlying_novel_kr: string
  underlying_novel_en: string

  // Rights holder
  rights_holder_name: string
  rights_holder_company: string

  // Rights & business
  rights?: string
  perfect_for?: string
  audience?: string

  // Platforms (managed separately)
  platforms: PlatformData[]
}

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
  const { register, watch, setValue, control, formState: { errors } } = form

  const isOfficialEnglish = watch('is_official_english_title')
  const englishTitleType = watch('english_title_type')
  const platforms = watch('platforms') || []

  return (
    <div className="space-y-8">
      {/* Section: Required Basic Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <p className="text-sm text-gray-500 mt-1">
            Core information required for all titles
          </p>
        </div>

        {/* Title Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title_name_en">
              English Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title_name_en"
              placeholder="I Became a Doting Father"
              {...register('title_name_en', { required: 'English title is required' })}
              className="bg-white border-gray-300"
            />
            {errors.title_name_en && (
              <p className="text-sm text-red-600">{errors.title_name_en.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_name_kr">
              Korean Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title_name_kr"
              placeholder="한국어 제목"
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
              Title URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title_url"
              type="url"
              placeholder="https://example.com/your-title"
              {...register('title_url', { required: 'Title URL is required' })}
              className="bg-white border-gray-300"
            />
            {errors.title_url && (
              <p className="text-sm text-red-600">{errors.title_url.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_image">
              Cover Image URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title_image"
              type="url"
              placeholder="https://example.com/cover.jpg"
              {...register('title_image', { required: 'Cover image URL is required' })}
              className="bg-white border-gray-300"
            />
            {errors.title_image && (
              <p className="text-sm text-red-600">{errors.title_image.message as string}</p>
            )}
          </div>
        </div>

        {/* Story Author */}
        <div className="space-y-2">
          <Label htmlFor="story_author">
            Story Author <span className="text-red-500">*</span>
          </Label>
          <Input
            id="story_author"
            placeholder="Author name"
            {...register('story_author', { required: 'Story author is required' })}
            className="bg-white border-gray-300"
          />
          {errors.story_author && (
            <p className="text-sm text-red-600">{errors.story_author.message as string}</p>
          )}
        </div>

        {/* Genre and Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Genre <span className="text-red-500">*</span>
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
                    <SelectValue placeholder="Select genre" />
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
            <Label>Content Format</Label>
            <Controller
              name="content_format"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select format" />
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
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              placeholder="magic, school, friendship (comma-separated)"
              {...register('keywords')}
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500">Separate multiple keywords with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Input
              id="tone"
              placeholder="e.g., lighthearted, dark, inspirational"
              {...register('tone')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Section: English Title */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">English Title Classification</h3>

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
              This English title is official (not a direct translation)
            </Label>
            <p className="text-xs text-gray-500">
              Check this if the title has been officially published in English
            </p>
          </div>
        </div>

        {isOfficialEnglish && (
          <div className="ml-6 space-y-3">
            <Label className="text-sm font-medium">English Title Type</Label>
            <RadioGroup
              value={englishTitleType}
              onValueChange={(value) =>
                setValue('english_title_type', value as 'official' | 'translation')
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="official" id="official" />
                <Label htmlFor="official" className="font-normal cursor-pointer">
                  Official English title (published version)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="translation" id="translation" />
                <Label htmlFor="translation" className="font-normal cursor-pointer">
                  Direct translation for reference
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Section: Hangul Titles */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hangul Titles</h3>
          <p className="text-sm text-gray-500 mt-1">
            Provide Korean titles for script, art, and underlying work (if different)
          </p>
        </div>

        {/* Script Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="script_title_kr">
              Script Title (Korean)
            </Label>
            <Input
              id="script_title_kr"
              placeholder="웹툰 제목"
              {...register('script_title_kr')}
              className="bg-white border-gray-300"
            />
            {errors.script_title_kr && (
              <p className="text-sm text-red-600">{errors.script_title_kr.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="script_title_en">
              Script Title (English)
            </Label>
            <Input
              id="script_title_en"
              placeholder="Webtoon Title"
              {...register('script_title_en')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        {/* Art Title (if different) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="art_title_kr">
              Art Title (Korean)
              <span className="text-xs text-gray-500 ml-2">if different from script</span>
            </Label>
            <Input
              id="art_title_kr"
              placeholder="작화 제목 (선택사항)"
              {...register('art_title_kr')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="art_title_en">
              Art Title (English)
            </Label>
            <Input
              id="art_title_en"
              placeholder="Art Title (optional)"
              {...register('art_title_en')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        {/* Underlying Novel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="underlying_novel_kr">
              Underlying Novel (Korean)
              <span className="text-xs text-gray-500 ml-2">if adapted</span>
            </Label>
            <Input
              id="underlying_novel_kr"
              placeholder="원작 소설 제목 (선택사항)"
              {...register('underlying_novel_kr')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="underlying_novel_en">
              Underlying Novel (English)
            </Label>
            <Input
              id="underlying_novel_en"
              placeholder="Original Novel Title (optional)"
              {...register('underlying_novel_en')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Section: Rights Holder */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rights Holder</h3>
          <p className="text-sm text-gray-500 mt-1">
            Who owns the rights to this title?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rights_holder_name">
              Rights Holder Name
            </Label>
            <Input
              id="rights_holder_name"
              placeholder="Individual or company name"
              {...register('rights_holder_name')}
              className="bg-white border-gray-300"
            />
            {errors.rights_holder_name && (
              <p className="text-sm text-red-600">{errors.rights_holder_name.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights_holder_company">
              Rights Holder Company
              <span className="text-xs text-gray-500 ml-2">if applicable</span>
            </Label>
            <Input
              id="rights_holder_company"
              placeholder="Company name (optional)"
              {...register('rights_holder_company')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Section: Additional Credits */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Additional Credits</h3>
          <p className="text-sm text-gray-500 mt-1">
            Other contributors to this title (if different from story author)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="art_author">Art Author</Label>
            <Input
              id="art_author"
              placeholder="Artist name"
              {...register('art_author')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author (General)</Label>
            <Input
              id="author"
              placeholder="Author name"
              {...register('author')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="writer">Writer</Label>
            <Input
              id="writer"
              placeholder="Writer name"
              {...register('writer')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="illustrator">Illustrator</Label>
            <Input
              id="illustrator"
              placeholder="Illustrator name"
              {...register('illustrator')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Section: Rights & Business */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rights & Business</h3>
          <p className="text-sm text-gray-500 mt-1">
            Information about available rights and target markets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rights">Rights Available</Label>
            <Input
              id="rights"
              placeholder="e.g., Film, TV, Merchandise"
              {...register('rights')}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfect_for">Perfect For</Label>
            <Input
              id="perfect_for"
              placeholder="e.g., Streaming series, Feature film"
              {...register('perfect_for')}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Input
            id="audience"
            placeholder="e.g., Young adults, Family"
            {...register('audience')}
            className="bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Section: Publishing Platforms */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Publishing Platforms</h3>
          <p className="text-sm text-gray-500 mt-1">
            Where is this title currently published? Add platform URLs and metrics.
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
        <h4 className="text-sm font-medium text-gray-900 mb-2">Step 1 Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Provide both Korean and English titles for better searchability</li>
          <li>If adapted from a novel, include the original source title</li>
          <li>Add all platforms where your title is published for visibility</li>
          <li>Include view counts and subscriber numbers to showcase popularity</li>
        </ul>
      </div>
    </div>
  )
}
