import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

interface Step3FormData {
  // Narrative structure (REQUIRED)
  story_structure: string

  // Planned ending (REQUIRED if not completed)
  planned_ending: string
  completed: boolean // From parent form

  // Additional narrative info
  narrative_arc: string
}

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
  const { register, watch, formState: { errors } } = form

  const isCompleted = watch('completed')
  const storyStructure = watch('story_structure')
  const plannedEnding = watch('planned_ending')

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Narrative Structure</h2>
        <p className="text-gray-600 mt-2">
          Help buyers understand your story's narrative flow and how it develops from beginning
          to end.
        </p>
      </div>

      {/* Section: Story Structure (REQUIRED) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Story Structure <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Provide a high-level summary of your story's beginning, middle, and end
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="story_structure">
            Beginning / Middle / End Summary <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="story_structure"
            placeholder={`Example format:

BEGINNING: Introduce protagonist in their ordinary world, inciting incident occurs...

MIDDLE: Protagonist faces escalating challenges, key relationships develop...

END: Climax and resolution, how conflicts are resolved...`}
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
              {storyStructure.length} characters • Minimum 100 characters
            </p>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Break down your story into three acts. Describe key plot
              points, turning points, and how the story progresses from setup to resolution.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Planned Ending (Conditional) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Planned Ending
            {!isCompleted && <span className="text-red-500 ml-1">*</span>}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isCompleted
              ? 'How does your completed story end?'
              : 'For ongoing series, describe how you plan to end the story'}
          </p>
        </div>

        {!isCompleted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Required for ongoing series
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Since your title is marked as ongoing, please describe how you plan to conclude
                the story. This helps buyers understand the long-term vision.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="planned_ending">
            Ending Description
            {!isCompleted && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id="planned_ending"
            placeholder={
              isCompleted
                ? 'Describe how your story concludes...'
                : 'Describe how you plan to end your ongoing story...'
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
              {plannedEnding.length} characters
              {!isCompleted && ' • Minimum 50 characters'}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Avoid major spoilers, but provide enough detail to show you have a clear vision
          </p>
        </div>
      </div>

      {/* Section: Narrative Arc */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Narrative Arc</h3>
          <p className="text-sm text-gray-500 mt-1">
            How does your story's tension and stakes escalate?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="narrative_arc">
            Overall Narrative Arc
          </Label>
          <Textarea
            id="narrative_arc"
            placeholder="Describe the emotional or dramatic arc of your story... (rising tension, stakes, character growth, etc.)"
            {...register('narrative_arc')}
            rows={4}
            className="bg-white border-gray-300 resize-none"
          />
          <p className="text-xs text-gray-500">
            Examples: redemption arc, coming-of-age journey, revenge quest, mystery unraveling
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Step 3 Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>
            <strong>Story structure</strong> is required - provide a clear beginning/middle/end
            summary
          </li>
          <li>
            <strong>Planned ending</strong> is required for ongoing series to show your vision
          </li>
          <li>Focus on major plot points and turning points, not every detail</li>
          <li>Describe how conflicts escalate and resolve</li>
          <li>Show character growth and transformation throughout the narrative</li>
          <li>Balance detail with brevity - buyers want clarity, not spoilers</li>
        </ul>
      </div>
    </div>
  )
}
