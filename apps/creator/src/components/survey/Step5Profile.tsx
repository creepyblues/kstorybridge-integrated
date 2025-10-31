import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { X, Plus, Award, TrendingUp } from 'lucide-react'

interface Step5FormData {
  // Title achievements
  awards: string[]
  sales_records: string
  merchandise_deals: string
  print_editions: boolean
  print_edition_details: string
  media_coverage: string
  celebrity_endorsements: string

  // Creator achievements
  creator_achievements: {
    total_titles?: number
    total_views?: string
    notable_works?: string[]
    awards_received?: string[]
    industry_recognition?: string
  }
}

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
  const { register, watch, setValue, formState: { errors } } = form

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
        <h2 className="text-2xl font-bold text-gray-900">Content & Creator Profile</h2>
        <p className="text-gray-600 mt-2">
          Showcase your title's success and your credentials as a creator to help buyers
          understand your track record.
        </p>
      </div>

      {/* Section: Title Achievements */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Title Achievements</h3>
        </div>

        {/* Awards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Awards & Recognition</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAward}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Award
            </Button>
          </div>

          {awards.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No awards added yet</p>
          ) : (
            awards.map((award: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Award ${index + 1}`}
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
          <Label htmlFor="sales_records">Sales Records</Label>
          <Textarea
            id="sales_records"
            placeholder="Any notable sales figures, download numbers, or monetization milestones..."
            {...register('sales_records')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            e.g., "10 million downloads", "Top 10 on platform for 6 months"
          </p>
        </div>

        {/* Merchandise Deals */}
        <div className="space-y-2">
          <Label htmlFor="merchandise_deals">Merchandise & Licensing Deals</Label>
          <Textarea
            id="merchandise_deals"
            placeholder="Any merchandise, toy deals, or licensing agreements..."
            {...register('merchandise_deals')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            e.g., "Plush toys released", "Mobile game adaptation"
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
                This title has print editions
              </Label>
              <p className="text-xs text-gray-500">
                Physical book versions published
              </p>
            </div>
          </div>

          {printEditions && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="print_edition_details">Print Edition Details</Label>
              <Textarea
                id="print_edition_details"
                placeholder="Publisher, release date, number of volumes, special editions..."
                {...register('print_edition_details')}
                rows={3}
                className="bg-white border-gray-300 resize-none"
              />
            </div>
          )}
        </div>

        {/* Media Coverage */}
        <div className="space-y-2">
          <Label htmlFor="media_coverage">Media Coverage</Label>
          <Textarea
            id="media_coverage"
            placeholder="Any press coverage, articles, or media mentions..."
            {...register('media_coverage')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            News articles, reviews, podcast appearances, etc.
          </p>
        </div>

        {/* Celebrity Endorsements */}
        <div className="space-y-2">
          <Label htmlFor="celebrity_endorsements">Celebrity Endorsements</Label>
          <Textarea
            id="celebrity_endorsements"
            placeholder="Any notable figures who have endorsed or promoted your title..."
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
          <h3 className="text-lg font-semibold text-gray-900">Your Creator Profile</h3>
        </div>

        <p className="text-sm text-gray-600">
          Highlight your overall credentials and track record as a creator
        </p>

        {/* Total Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="creator_total_titles">Total Titles Created</Label>
            <Input
              id="creator_total_titles"
              type="number"
              placeholder="0"
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
            <Label htmlFor="creator_total_views">Total Views Across All Works</Label>
            <Input
              id="creator_total_views"
              placeholder="e.g., 50 million"
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
            <Label>Notable Previous Works</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNotableWork}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Title
            </Button>
          </div>

          {notableWorks.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No previous works added</p>
          ) : (
            notableWorks.map((work: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Title ${index + 1}`}
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
            <Label>Awards & Recognition (as a Creator)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCreatorAward}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Award
            </Button>
          </div>

          {creatorAwards.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No creator awards added</p>
          ) : (
            creatorAwards.map((award: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Award ${index + 1}`}
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
            Industry Recognition & Achievements
          </Label>
          <Textarea
            id="creator_industry_recognition"
            placeholder="Any other notable achievements, collaborations, or industry recognition..."
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
            Keynote speeches, industry partnerships, mentorship programs, etc.
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Step 5 Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Quantify achievements when possible (numbers, dates, rankings)</li>
          <li>Include awards at both title and creator level to showcase expertise</li>
          <li>Sales records and view counts demonstrate market viability</li>
          <li>Media coverage and endorsements add credibility</li>
          <li>Your overall creator profile helps buyers assess your track record</li>
          <li>Don't be shy - this is your chance to shine!</li>
        </ul>
      </div>

      {/* Final Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Almost done!</strong> Once you complete this step, you'll be able to review
          and submit your title information. Your draft will be saved automatically as you work.
        </p>
      </div>
    </div>
  )
}
