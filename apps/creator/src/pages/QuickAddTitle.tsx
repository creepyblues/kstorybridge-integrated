/**
 * Quick Add Title Page
 * Streamlined form for adding a new title with minimal required fields
 * Redesigned with sunrise-coral accents and modern layout
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Icon } from '@iconify/react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RightsCheckboxGroup } from '@/components/survey/RightsCheckboxGroup'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { draftService } from '@/services/draftService'
import { quickAddTitleSchema, type QuickAddTitleData } from '@/lib/surveySchema'

export default function QuickAddTitle() {
  const { t } = useTranslation(['titles', 'common'])
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuickAddTitleData>({
    resolver: zodResolver(quickAddTitleSchema),
    defaultValues: {
      title_name_kr: '',
      title_url: '',
      rights_holder_name: '',
      rights_available: [],
      title_name_en: '',
      title_url_en: '',
    },
  })

  const rightsAvailable = watch('rights_available')

  const onSubmit = async (data: QuickAddTitleData) => {
    if (!user?.id) {
      toast({
        title: t('common:messages.error'),
        description: 'User not authenticated',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      // Create draft with quick-add data
      const draft = await draftService.createDraft({
        creator_id: user.id,
        draft_data: {
          title_name_kr: data.title_name_kr,
          title_name_en: data.title_name_en || undefined,
          title_url: data.title_url,
          title_url_en: data.title_url_en || undefined,
          rights_holder_name: data.rights_holder_name,
          rights_available: data.rights_available,
        },
        current_step: 1,
      })

      // Immediately submit for review
      await draftService.submitDraftById(draft.id)

      toast({
        title: t('titles:quickAdd.submittedTitle', 'Title Submitted'),
        description: t('titles:quickAdd.submittedDescription', 'Your title has been submitted for review.'),
      })

      navigate('/titles')
    } catch (error) {
      console.error('Error submitting title:', error)
      toast({
        title: t('common:messages.error'),
        description: t('titles:quickAdd.errorMessage'),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sunrise-coral to-orange-400 mb-4 shadow-lg shadow-sunrise-coral/25">
            <Icon icon="solar:lightning-bold" className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
            {t('titles:quickAdd.title', 'Add Your Title')}
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            {t('titles:quickAdd.description', "Submit your title for our quick review. Once approved, you'll be asked to provide additional details.")}
          </p>
        </div>

        {/* Quick Tips */}
        <Card className="bg-gradient-to-br from-sunrise-coral/5 to-orange-50 border-sunrise-coral/20 shadow-none rounded-2xl mb-6">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 rounded-xl bg-sunrise-coral/10">
                <Icon icon="solar:lightbulb-bolt-bold-duotone" className="h-5 w-5 text-sunrise-coral" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-black mb-1">
                  {t('titles:quickAdd.tipTitle', 'How It Works')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('titles:quickAdd.tipDescription', 'Submit the essential information below. Our team will review your submission and notify you once approved.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="bg-white border-gray-200 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6 sm:p-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 rounded-xl bg-sunrise-coral/10">
                <Icon icon="solar:document-text-bold-duotone" className="h-5 w-5 text-sunrise-coral" />
              </div>
              <h2 className="text-lg font-bold text-black">
                {t('titles:quickAdd.requiredInfo')}
              </h2>
            </div>

            <form className="space-y-6">
              {/* Title Information Group */}
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:text-bold" className="h-4 w-4" />
                  Title Information
                </h3>

                {/* Title Name (Korean) - Required */}
                <div>
                  <Label htmlFor="title_name_kr" className="text-sm font-semibold text-black flex items-center gap-1">
                    {t('titles:quickAdd.fields.titleNameKr')}
                    <span className="text-sunrise-coral">*</span>
                  </Label>
                  <Input
                    id="title_name_kr"
                    {...register('title_name_kr')}
                    placeholder={t('titles:quickAdd.fields.titleNameKrPlaceholder')}
                    className={`mt-2 h-11 ${errors.title_name_kr ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.title_name_kr && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
                      {errors.title_name_kr.message}
                    </p>
                  )}
                </div>

                {/* Title Name (English) - Optional */}
                <div>
                  <Label htmlFor="title_name_en" className="text-sm font-semibold text-black">
                    {t('titles:quickAdd.fields.titleNameEn')}
                  </Label>
                  <Input
                    id="title_name_en"
                    {...register('title_name_en')}
                    placeholder={t('titles:quickAdd.fields.titleNameEnPlaceholder')}
                    className="mt-2 h-11"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Links Group */}
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:link-bold" className="h-4 w-4" />
                  Platform Links
                </h3>

                {/* Title Link (Korean) - Required */}
                <div>
                  <Label htmlFor="title_url" className="text-sm font-semibold text-black flex items-center gap-1">
                    {t('titles:quickAdd.fields.titleUrl')}
                    <span className="text-sunrise-coral">*</span>
                  </Label>
                  <Input
                    id="title_url"
                    type="url"
                    {...register('title_url')}
                    placeholder={t('titles:quickAdd.fields.titleUrlPlaceholder')}
                    className={`mt-2 h-11 ${errors.title_url ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  />
                  <p className="text-gray-500 text-xs mt-1.5 flex items-center gap-1">
                    <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                    {t('titles:quickAdd.fields.titleUrlHelper')}
                  </p>
                  {errors.title_url && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
                      {errors.title_url.message}
                    </p>
                  )}
                </div>

                {/* Title Link (English) - Optional */}
                <div>
                  <Label htmlFor="title_url_en" className="text-sm font-semibold text-black">
                    {t('titles:quickAdd.fields.titleUrlEn')}
                  </Label>
                  <Input
                    id="title_url_en"
                    type="url"
                    {...register('title_url_en')}
                    placeholder={t('titles:quickAdd.fields.titleUrlEnPlaceholder')}
                    className="mt-2 h-11"
                  />
                  {errors.title_url_en && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
                      {errors.title_url_en.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Rights Group */}
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:shield-check-bold" className="h-4 w-4" />
                  Rights Information
                </h3>

                {/* Rights Holder - Required */}
                <div>
                  <Label htmlFor="rights_holder_name" className="text-sm font-semibold text-black flex items-center gap-1">
                    {t('titles:quickAdd.fields.rightsHolder')}
                    <span className="text-sunrise-coral">*</span>
                  </Label>
                  <Input
                    id="rights_holder_name"
                    {...register('rights_holder_name')}
                    placeholder={t('titles:quickAdd.fields.rightsHolderPlaceholder')}
                    className={`mt-2 h-11 ${errors.rights_holder_name ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.rights_holder_name && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
                      {errors.rights_holder_name.message}
                    </p>
                  )}
                </div>

                {/* Rights Available - Required */}
                <div>
                  <Label className="text-sm font-semibold text-black flex items-center gap-1">
                    {t('titles:quickAdd.fields.rightsAvailable')}
                    <span className="text-sunrise-coral">*</span>
                  </Label>
                  <p className="text-gray-500 text-xs mt-1 mb-3 flex items-center gap-1">
                    <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                    {t('titles:quickAdd.fields.rightsAvailableHelper')}
                  </p>
                  <RightsCheckboxGroup
                    value={rightsAvailable || []}
                    onChange={(value) => setValue('rights_available', value)}
                  />
                  {errors.rights_available && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
                      {errors.rights_available.message}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/titles')}
            disabled={submitting}
            className="border-gray-300 hover:bg-gray-100"
          >
            <Icon icon="solar:arrow-left-linear" className="h-4 w-4 mr-2" />
            {t('common:buttons.cancel')}
          </Button>

          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={submitting}
            className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90 shadow-lg shadow-sunrise-coral/25"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('titles:quickAdd.submitting', 'Submitting...')}
              </>
            ) : (
              <>
                <Icon icon="solar:send-bold" className="h-4 w-4 mr-2" />
                {t('titles:quickAdd.submitForReview', 'Submit for Review')}
              </>
            )}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-gray-500 text-sm text-center mt-8 flex items-center justify-center gap-2">
          <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
          {t('titles:quickAdd.reviewHint', 'Your submission will be reviewed by our team before being published.')}
        </p>
      </div>
    </MainLayout>
  )
}
