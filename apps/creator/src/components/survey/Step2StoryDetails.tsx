import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Plus } from 'lucide-react'
import { CharacterDetailsInput, CharacterDetail } from './CharacterDetailsInput'

interface Step2FormData {
  // Content details (from AddTitle merge)
  synopsis?: string
  description?: string
  tagline?: string
  note?: string
  chapters?: number
  completed?: boolean

  // Story background
  inspiration: string
  comparables: string[]
  important_issues: string

  // World building (REQUIRED)
  setting_description: string
  world_lore: string
  supernatural_concepts: string

  // Characters (REQUIRED, managed separately)
  character_details: CharacterDetail[]
}

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
          <h3 className="text-lg font-semibold text-gray-900">Content Details</h3>
          <p className="text-sm text-gray-500 mt-1">
            Brief descriptions to help buyers discover your title
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="A compelling one-line description"
            {...register('tagline')}
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500">
            A catchy one-liner that captures your story's essence
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="synopsis">Synopsis</Label>
          <Textarea
            id="synopsis"
            placeholder="Brief synopsis of the title..."
            {...register('synopsis')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            A short summary of your story (2-3 paragraphs)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Detailed description of the title..."
            {...register('description')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            A more detailed description with plot points and character info
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Notes</Label>
          <Textarea
            id="note"
            placeholder="Additional notes or comments..."
            {...register('note')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            Any additional information for potential buyers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chapters">Number of Chapters</Label>
            <Input
              id="chapters"
              type="number"
              placeholder="120"
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
              Series Completed
            </Label>
          </div>
        </div>
      </div>

      {/* Section: Story Inspiration */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Story Background</h3>
          <p className="text-sm text-gray-500 mt-1">
            What inspired this story and what themes does it explore?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspiration">
            What inspired this story?
          </Label>
          <Textarea
            id="inspiration"
            placeholder="What inspired you to create this story? (personal experiences, historical events, other media, etc.)"
            {...register('inspiration')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            Share the creative spark behind your story
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="important_issues">
            Does it address any important issues?
          </Label>
          <Textarea
            id="important_issues"
            placeholder="What important issues or themes does your story address? (social justice, mental health, identity, etc.)"
            {...register('important_issues')}
            rows={3}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            Themes that resonate with modern audiences
          </p>
        </div>
      </div>

      {/* Section: Comparable Titles */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">
            Comparable Titles
          </Label>
          <p className="text-sm text-gray-500 mt-1">
            What existing titles is your story similar to? (e.g., "Tower of God meets Solo Leveling")
          </p>
        </div>

        {comparables.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">
              No comparable titles added yet
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addComparable}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Comparable Title
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {comparables.map((comparable: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Comparable title ${index + 1}`}
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
              Add Another
            </Button>
          </div>
        )}
      </div>

      {/* Section: World Building (REQUIRED) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            World Building <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Help buyers visualize your story's world
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="setting_description">
            Please describe the setting of your story (time, place, key locations) <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="setting_description"
            placeholder="Describe the time period, location, and key settings where your story takes place..."
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
            Include time period, location type (urban/rural/fantasy realm), and atmosphere
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="world_lore">
            Please describe the "rules" or lore of your world - magic systems, supernatural forces, sci-fi concepts, etc.
          </Label>
          <Textarea
            id="world_lore"
            placeholder="Describe the history, culture, and rules of your story's world..."
            {...register('world_lore')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            Background information that enriches the setting
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supernatural_concepts">
            Are there any supernatural or sci-fi concepts that separates this story from conventional reality? If so, is there any "lore" or "twist" or "big idea" or "high concept" crucial to understanding the story?
          </Label>
          <Textarea
            id="supernatural_concepts"
            placeholder="Describe any magic systems, supernatural forces, futuristic technology, or sci-fi concepts..."
            {...register('supernatural_concepts')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            Special abilities, magic systems, advanced technology, etc.
          </p>
        </div>
      </div>

      {/* Section: Characters (REQUIRED) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Main Characters <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Detailed information about your story's main characters
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
        <h4 className="text-sm font-medium text-gray-900 mb-2">Step 2 Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>
            <strong>Setting description</strong> is required - be specific about time and place
          </li>
          <li>
            <strong>Add at least one character</strong> with detailed demographics
          </li>
          <li>Comparable titles help buyers understand your story's genre and appeal</li>
          <li>Include diverse character backgrounds to showcase representation</li>
          <li>Describe your world's unique rules if it's fantasy or sci-fi</li>
        </ul>
      </div>
    </div>
  )
}
