import React, { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Layout
import { MainLayout } from '@/components/layout/MainLayout'

// Components
import { MultiStepProgressBar, DEFAULT_STEPS } from '@/components/survey/MultiStepProgressBar'
import { AutoSaveIndicator, useAutoSave } from '@/components/survey/AutoSaveIndicator'
import { Step1BasicInfo } from '@/components/survey/Step1BasicInfo'
import { Step2StoryDetails } from '@/components/survey/Step2StoryDetails'
import { Step3Narrative } from '@/components/survey/Step3Narrative'
import { Step4Materials } from '@/components/survey/Step4Materials'
import { Step5Profile } from '@/components/survey/Step5Profile'

// Services
import { draftService } from '@/services/draftService'
import { titlesService } from '@/services/titlesService'
import { documentsService } from '@/services/documentsService'

// Schema
import { surveyFormSchema, validateStep1, validateStep2, validateStep3, type SurveyFormData } from '@/lib/surveySchema'

/**
 * AddTitleSurvey Page
 *
 * 5-step survey form for adding a new title with comprehensive information
 * Features: Multi-step navigation, auto-save, draft resume, form validation
 */
export default function AddTitleSurvey() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)

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

  const { watch, handleSubmit, formState: { errors }, setError, clearErrors } = form

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

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!userId || isDraftLoaded) return

      try {
        const draft = await draftService.loadDraft(userId)
        if (draft) {
          // Restore form data
          Object.keys(draft.draft_data).forEach((key) => {
            form.setValue(key as any, draft.draft_data[key])
          })
          // Restore current step
          setCurrentStep(draft.current_step)
          console.log('Draft loaded successfully')
        }
        setIsDraftLoaded(true)
      } catch (error) {
        console.error('Failed to load draft:', error)
        setIsDraftLoaded(true)
      }
    }

    loadDraft()
  }, [userId, isDraftLoaded, form])

  // Auto-save functionality
  const { saveStatus, lastSavedAt, triggerSave } = useAutoSave({
    onSave: async (data) => {
      if (!userId) return
      await draftService.saveDraft({
        creator_id: userId,
        draft_data: data,
        current_step: currentStep,
      })
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
  const handleFileUpload = async (file: File, documentType: string) => {
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
      alert('You must be logged in to submit')
      return
    }

    // Validate all steps before submission
    const step1Errors = validateStep1(data)
    const step2Errors = validateStep2(data)
    const step3Errors = validateStep3(data)

    if (Object.keys(step1Errors).length > 0 || Object.keys(step2Errors).length > 0 || Object.keys(step3Errors).length > 0) {
      alert('Please complete all required fields before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare title data (merged from AddTitle.tsx + survey fields)
      const titleData = {
        // Required basic fields (from AddTitle merge)
        title_name_en: data.title_name_en,
        title_name_kr: data.title_name_kr,
        title_url: data.title_url,
        title_image: data.title_image,
        story_author: data.story_author,
        creator_id: userId,

        // Content classification (from AddTitle merge)
        genre: data.genre || [],
        content_format: data.content_format || null,
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(Boolean) : null,
        tone: data.tone || null,

        // Credits (from AddTitle merge)
        art_author: data.art_author || null,
        author: data.author || null,
        writer: data.writer || null,
        illustrator: data.illustrator || null,

        // Content details (from AddTitle merge - Step 2)
        synopsis: data.synopsis || null,
        description: data.description || null,
        tagline: data.tagline || null,
        note: data.note || null,
        chapters: data.chapters || null,

        // Rights & business (from AddTitle merge)
        rights: data.rights || null,
        perfect_for: data.perfect_for || null,
        audience: data.audience || null,

        // English title classification (Step 1 survey)
        is_official_english_title: data.is_official_english_title,
        english_title_type: data.english_title_type || null,
        script_title_kr: data.script_title_kr || null,
        script_title_en: data.script_title_en || null,
        art_title_kr: data.art_title_kr || null,
        art_title_en: data.art_title_en || null,
        underlying_novel_kr: data.underlying_novel_kr || null,
        underlying_novel_en: data.underlying_novel_en || null,

        // Rights holder (Step 1 survey)
        rights_holder_name: data.rights_holder_name || null,
        rights_holder_company: data.rights_holder_company || null,

        // Story details (Step 2 survey)
        inspiration: data.inspiration || null,
        comparables: data.comparables || null,
        important_issues: data.important_issues || null,
        setting_description: data.setting_description || null,
        world_lore: data.world_lore || null,
        supernatural_concepts: data.supernatural_concepts || null,
        character_details: data.character_details || null,

        // Narrative (Step 3 survey)
        story_structure: data.story_structure || null,
        planned_ending: data.planned_ending || null,
        narrative_arc: data.narrative_arc || null,
        completed: data.completed || false,

        // Profile (Step 5 survey)
        awards: data.awards || null,
        sales_records: data.sales_records || null,
        merchandise_deals: data.merchandise_deals || null,
        print_editions: data.print_editions || false,
        print_edition_details: data.print_edition_details || null,
        media_coverage: data.media_coverage || null,
        celebrity_endorsements: data.celebrity_endorsements || null,
        creator_achievements: data.creator_achievements || null,
      }

      // Prepare platforms data
      const platformsData = data.platforms.map((p) => ({
        platform_name: p.platform_name,
        platform_url: p.platform_url,
        views: p.views || 0,
        subscribers: p.subscribers || 0,
        other_metrics: p.other_metrics || {},
      }))

      // Prepare documents data (only metadata, files already uploaded)
      const documentsData = data.uploaded_files
        .filter((f) => f.file_url) // Only include successfully uploaded files
        .map((f) => ({
          document_type: f.document_type,
          file_url: f.file_url!,
          file_name: f.file_name,
          file_size: f.file_size,
          shareable_with_nda: f.shareable_with_nda,
          external_url: null,
        }))

      // Add external links as documents
      data.external_links.forEach((link) => {
        documentsData.push({
          document_type: link.type,
          file_url: link.url,
          file_name: link.description || link.type,
          file_size: 0,
          shareable_with_nda: link.shareable_with_nda,
          external_url: link.url,
        })
      })

      // Create title with related data using atomic transaction
      const result = await titlesService.createTitleWithRelated(
        titleData as any,
        platformsData,
        documentsData
      )

      console.log('Title created successfully:', result)

      // Delete draft after successful submission
      await draftService.deleteDraft(userId)

      // Navigate to success page or titles list
      alert('Title submitted successfully!')
      navigate('/titles')
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit title. Please try again.')
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
            Back to Titles
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Title</h1>
          <p className="text-gray-600 mt-2">
            Complete the 5-step survey to add comprehensive information about your title
          </p>
        </div>

        {/* Progress Bar */}
        <MultiStepProgressBar
          currentStep={currentStep}
          steps={DEFAULT_STEPS}
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
          <div className="bg-white border border-gray-300 rounded-2xl p-6 md:p-8 mb-8">
            {renderStep()}
          </div>

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
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of 5
            </div>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="bg-black text-white hover:bg-gray-800"
              >
                Next
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Submit Title
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
            Save Draft Now
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
