import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

/**
 * AddTitleSurvey Page
 *
 * 5-step survey form for adding a new title with comprehensive information
 * Features: Multi-step navigation, auto-save, draft resume, form validation
 */
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

  // Navigation handlers
  const goToNextStep = () => {
    if (validateCurrentStep()) {
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
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/titles')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('survey:page.backToTitles')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t('survey:page.pageTitle')}</h1>
          <p className="text-gray-600 mt-2">
            {t('survey:page.pageSubtitle')}
          </p>
        </div>

        {/* Progress Bar */}
        <MultiStepProgressBar
          currentStep={currentStep}
          steps={getDefaultSteps(t)}
          onStepClick={goToStep}
          allowNavigation={true}
        />

        {/* Auto-Save Indicator */}
        <div className="flex justify-end mb-4">
          <AutoSaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step Content */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardContent className="p-6 md:p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('survey:navigation.previous')}
            </Button>

            <div className="text-sm text-gray-500">
              {t('survey:navigation.stepProgress', { current: currentStep, total: 5 })}
            </div>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="bg-black text-white hover:bg-gray-800"
              >
                {t('survey:navigation.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white" />
                    {t('survey:messages.submitting')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t('survey:navigation.submit')}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Save Draft Button */}
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => triggerSave(formValues, true)}
            className="text-sm text-gray-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {t('survey:page.saveDraftNow')}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
