/**
 * AddTitle Survey Page
 *
 * 5-step survey form for adding a new title with comprehensive information
 * Features: Multi-step navigation, auto-save, draft resume, form validation
 * Redesigned with sunrise-coral accents and modern layout
 */

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react'
import { supabase } from '@/lib/supabase'
import { trackSurveyStepComplete, trackTitleCreate, trackTitleSaveDraft } from '@/utils/analytics'

// Layout
import { MainLayout } from '@/components/layout/MainLayout'

// Components
import { MultiStepProgressBar, getDefaultSteps } from '@/components/survey/MultiStepProgressBar'
import { AutoSaveIndicator, useAutoSave } from '@/components/survey/AutoSaveIndicator'
import { Step1BasicInfo } from '@/components/survey/Step1BasicInfo'
import { Step2StoryDetails } from '@/components/survey/Step2StoryDetails'
import { Step3Narrative } from '@/components/survey/Step3Narrative'
import { Step4Materials } from '@/components/survey/Step4Materials'
import { Step5Profile } from '@/components/survey/Step5Profile'

// Services
import { draftService } from '@/services/draftService'

// Schema
import { surveyFormSchema, validateStep1, validateStep2, validateStep3, type SurveyFormData } from '@/lib/surveySchema'

export default function AddTitleSurvey() {
  const { t } = useTranslation(['survey', 'titles', 'common'])
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)

  // React Hook Form setup
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
    mode: 'onBlur',
    defaultValues: {
      // Step 1 defaults
      title_name_en: '',
      title_name_kr: '',
      title_url: '',
      title_image: '',
      story_author: '',
      genre: [],
      is_official_english_title: false,
      platforms: [],
      comparables: [],
      character_details: [],
      completed: false,
      uploaded_files: [],
      external_links: [],
      awards: [],
      print_editions: false,
      creator_achievements: {},
    },
  })

  const { watch, handleSubmit, setError, clearErrors } = form

  // Watch form values for auto-save
  const formValues = watch()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        // Redirect to login if not authenticated
        navigate('/signin')
      }
    }
    getUser()
  }, [navigate])

  // Get draftId from URL query parameter on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const draftIdParam = searchParams.get('draftId')
    if (draftIdParam) {
      setCurrentDraftId(draftIdParam)
    }
  }, [])

  // Load draft on mount (if draftId exists in URL)
  useEffect(() => {
    const loadDraft = async () => {
      if (!userId || isDraftLoaded) return

      try {
        // If draftId exists in URL, load that specific draft
        if (currentDraftId) {
          const draft = await draftService.getDraftById(currentDraftId)
          if (draft) {
            // Restore form data
            Object.keys(draft.draft_data).forEach((key) => {
              form.setValue(key as any, draft.draft_data[key])
            })
            // Restore current step
            setCurrentStep(draft.current_step)
            console.log('Draft loaded successfully:', currentDraftId)
          } else {
            // Draft not found, reset ID
            console.warn('Draft not found:', currentDraftId)
            setCurrentDraftId(null)
          }
        }
        // If no draftId, start fresh (don't auto-load any draft)

        setIsDraftLoaded(true)
      } catch (error) {
        console.error('Failed to load draft:', error)
        setIsDraftLoaded(true)
      }
    }

    loadDraft()
  }, [userId, currentDraftId, isDraftLoaded, form])

  // Auto-save functionality
  const { saveStatus, lastSavedAt, triggerSave } = useAutoSave({
    onSave: async (data) => {
      if (!userId) return

      if (currentDraftId) {
        // Update existing draft
        await draftService.updateDraftById(currentDraftId, {
          draft_data: data,
          current_step: currentStep,
        })
        // Track draft save
        trackTitleSaveDraft(currentStep)
      } else {
        // Create new draft and set ID
        const newDraft = await draftService.createDraft({
          creator_id: userId,
          draft_data: data,
          current_step: currentStep,
        })
        setCurrentDraftId(newDraft.id)
        // Update URL with new draftId (without page reload)
        window.history.replaceState(null, '', `/titles/add-title?draftId=${newDraft.id}`)
        // Track first draft save
        trackTitleSaveDraft(currentStep)
      }
    },
    debounceMs: 30000, // 30 seconds
    enabled: !!userId && isDraftLoaded,
  })

  // Trigger auto-save when form values change
  useEffect(() => {
    if (isDraftLoaded && userId) {
      triggerSave(formValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, isDraftLoaded, userId])

  // Step validation
  const validateCurrentStep = (): boolean => {
    clearErrors()

    switch (currentStep) {
      case 1: {
        // Step 1: Validate required basic fields
        const step1Errors = validateStep1(formValues)
        if (Object.keys(step1Errors).length > 0) {
          Object.entries(step1Errors).forEach(([field, message]) => {
            setError(field as any, { message })
          })
          return false
        }
        return true
      }

      case 2: {
        // Step 2: Validate setting description and characters
        const step2Errors = validateStep2(formValues)
        if (Object.keys(step2Errors).length > 0) {
          Object.entries(step2Errors).forEach(([field, message]) => {
            setError(field as any, { message })
          })
          return false
        }
        return true
      }

      case 3: {
        // Step 3: Validate story structure and planned ending
        const step3Errors = validateStep3(formValues)
        if (Object.keys(step3Errors).length > 0) {
          Object.entries(step3Errors).forEach(([field, message]) => {
            setError(field as any, { message })
          })
          return false
        }
        return true
      }

      case 4:
        // Step 4: No strict validation (optional materials)
        return true

      case 5:
        // Step 5: No strict validation (optional profile)
        return true

      default:
        return true
    }
  }

  // Step names for analytics
  const stepNames = ['', 'Basic Info', 'Story Details', 'Narrative', 'Materials', 'Profile']

  // Step icons
  const stepIcons = [
    '',
    'solar:document-text-bold-duotone',
    'solar:book-bold-duotone',
    'solar:pen-new-round-bold-duotone',
    'solar:folder-with-files-bold-duotone',
    'solar:user-check-bold-duotone',
  ]

  // Navigation handlers
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      // Track step completion before moving to next step
      trackSurveyStepComplete(currentStep, stepNames[currentStep])

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToStep = (step: number) => {
    // Allow navigation to previous steps without validation
    if (step < currentStep) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (step === currentStep) {
      // Do nothing
    } else {
      // Validate current step before moving forward
      if (validateCurrentStep()) {
        setCurrentStep(step)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // File upload handler
  const handleFileUpload = async (file: File, _documentType: string) => {
    if (!userId) throw new Error('User not authenticated')

    // In a real implementation, this would upload to Supabase Storage
    // For now, return a mock response
    return {
      file_url: URL.createObjectURL(file),
      id: `doc-${Date.now()}`,
    }
  }

  // Form submission
  const onSubmit = async (data: SurveyFormData) => {
    if (!userId) {
      alert(t('survey:messages.loginRequired'))
      return
    }

    // Validate all steps before submission
    const step1Errors = validateStep1(data)
    const step2Errors = validateStep2(data)
    const step3Errors = validateStep3(data)

    if (Object.keys(step1Errors).length > 0 || Object.keys(step2Errors).length > 0 || Object.keys(step3Errors).length > 0) {
      alert(t('survey:messages.completeRequired'))
      return
    }

    setIsSubmitting(true)

    try {
      // Ensure draft exists before submitting
      if (!currentDraftId) {
        // Create draft first if none exists
        const newDraft = await draftService.createDraft({
          creator_id: userId,
          draft_data: data,
          current_step: 5,
        })
        setCurrentDraftId(newDraft.id)
        // Submit the new draft
        await draftService.submitDraftById(newDraft.id)
      } else {
        // Update existing draft with final data
        await draftService.updateDraftById(currentDraftId, {
          draft_data: data,
          current_step: 5,
        })
        // Submit the existing draft
        await draftService.submitDraftById(currentDraftId)
      }

      console.log('Title submitted for approval')

      // Track title creation (use the draft ID as title ID since it becomes the title)
      const submittedDraftId = currentDraftId || 'new-title'
      trackTitleCreate(submittedDraftId, data.content_format)
      trackSurveyStepComplete(5, stepNames[5]) // Track final step completion

      // Navigate to titles list (submission will show as "Pending Approval")
      alert(t('survey:messages.submitReviewMessage'))
      navigate('/titles')
    } catch (error) {
      console.error('Submission error:', error)
      alert(t('survey:messages.submitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo form={form} />
      case 2:
        return <Step2StoryDetails form={form} />
      case 3:
        return <Step3Narrative form={form} />
      case 4:
        return <Step4Materials form={form} onUpload={handleFileUpload} />
      case 5:
        return <Step5Profile form={form} />
      default:
        return null
    }
  }

  if (!userId || !isDraftLoaded) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sunrise-coral/10 mb-4">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-sunrise-coral border-t-transparent" />
            </div>
            <p className="text-gray-500">{t('survey:messages.loading', 'Loading survey form...')}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-2xl bg-gradient-to-br from-sunrise-coral to-orange-400 shadow-lg shadow-sunrise-coral/25">
                <Icon icon={stepIcons[currentStep]} className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black">
                  {t('survey:page.pageTitle')}
                </h1>
                <p className="text-gray-500 mt-1">
                  {t('survey:page.pageSubtitle')}
                </p>
              </div>
            </div>

            {/* Auto-Save Indicator */}
            <div className="flex-shrink-0">
              <AutoSaveIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="bg-white border-gray-200 shadow-none rounded-2xl mb-6">
          <CardContent className="p-4 sm:p-6">
            <MultiStepProgressBar
              currentStep={currentStep}
              steps={getDefaultSteps(t)}
              onStepClick={goToStep}
              allowNavigation={true}
            />
          </CardContent>
        </Card>

        {/* Step Title Card */}
        <Card className="bg-gradient-to-br from-sunrise-coral/5 to-orange-50 border-sunrise-coral/20 shadow-none rounded-2xl mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sunrise-coral flex items-center justify-center text-white font-bold">
                {currentStep}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-black">
                  {getDefaultSteps(t)[currentStep - 1]?.title || `Step ${currentStep}`}
                </h2>
                <p className="text-sm text-gray-600">
                  {getStepDescription(currentStep, t)}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Icon icon="solar:checklist-bold-duotone" className="h-4 w-4" />
                {t('survey:navigation.stepProgress', { current: currentStep, total: 5 })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step Content */}
          <Card className="bg-white border-gray-200 shadow-none rounded-2xl mb-6">
            <CardContent className="p-6 md:p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto border-gray-300 hover:bg-gray-100 order-2 sm:order-1"
            >
              <Icon icon="solar:arrow-left-linear" className="w-4 h-4 mr-2" />
              {t('survey:navigation.previous')}
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500 order-1 sm:order-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    step === currentStep
                      ? 'bg-sunrise-coral'
                      : step < currentStep
                      ? 'bg-sunrise-coral/40'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="w-full sm:w-auto bg-sunrise-coral text-white hover:bg-sunrise-coral/90 shadow-lg shadow-sunrise-coral/25 order-3"
              >
                {t('survey:navigation.next')}
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-sunrise-coral text-white hover:bg-sunrise-coral/90 shadow-lg shadow-sunrise-coral/25 order-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('survey:messages.submitting')}
                  </>
                ) : (
                  <>
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4 mr-2" />
                    {t('survey:navigation.submit')}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Save Draft Button */}
        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => triggerSave(formValues, true)}
            className="text-sm text-gray-500 hover:text-sunrise-coral hover:bg-sunrise-coral/5"
          >
            <Icon icon="solar:diskette-bold-duotone" className="w-4 h-4 mr-2" />
            {t('survey:page.saveDraftNow')}
          </Button>
        </div>

        {/* Tips Section */}
        <Card className="bg-gray-50 border-gray-200 shadow-none rounded-2xl mt-8">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 rounded-xl bg-blue-500/10">
                <Icon icon="solar:lightbulb-minimalistic-bold-duotone" className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-black mb-1">
                  {t('survey:tips.title', 'Pro Tip')}
                </h3>
                <p className="text-sm text-gray-600">
                  {getStepTip(currentStep, t)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

// Helper function to get step descriptions
function getStepDescription(step: number, t: (key: string, fallback?: string) => string): string {
  const descriptions: Record<number, string> = {
    1: t('survey:steps.step1.description', 'Enter the basic information about your title'),
    2: t('survey:steps.step2.description', 'Describe your story world and characters'),
    3: t('survey:steps.step3.description', 'Share your narrative structure and themes'),
    4: t('survey:steps.step4.description', 'Upload supporting materials and documents'),
    5: t('survey:steps.step5.description', 'Complete your creator profile information'),
  }
  return descriptions[step] || ''
}

// Helper function to get step tips
function getStepTip(step: number, t: (key: string, fallback?: string) => string): string {
  const tips: Record<number, string> = {
    1: t('survey:tips.step1', 'Make sure to include a compelling Korean title and accurate genre tags. These help buyers find your content.'),
    2: t('survey:tips.step2', 'Rich character descriptions and unique world-building elements make your title stand out to potential buyers.'),
    3: t('survey:tips.step3', 'A clear story structure and well-defined themes help buyers understand your content\'s potential for adaptation.'),
    4: t('survey:tips.step4', 'High-quality pitch materials significantly increase buyer engagement. Consider adding translated samples.'),
    5: t('survey:tips.step5', 'A complete creator profile builds credibility and helps buyers connect with your work.'),
  }
  return tips[step] || ''
}
