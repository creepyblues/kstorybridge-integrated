import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, BookMarked, Lightbulb, FolderOpen, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'

// Survey step components
import { Step1BasicInfo } from '@/components/survey/Step1BasicInfo'
import { Step2StoryDetails } from '@/components/survey/Step2StoryDetails'
import { Step3Narrative } from '@/components/survey/Step3Narrative'
import { Step4Materials } from '@/components/survey/Step4Materials'
import { Step5Profile } from '@/components/survey/Step5Profile'
import { PitchDeckUpload } from '@/components/titles/PitchDeckUpload'

interface EditTitleFormData {
  // Step 1: Basic Information
  title_name_en: string
  title_name_kr: string
  title_url: string
  title_image: string
  story_author: string
  genre: string[]
  content_format?: string
  keywords?: string
  tone?: string
  art_author?: string
  author?: string
  writer?: string
  illustrator?: string
  is_official_english_title: boolean
  english_title_type: 'official' | 'translation'
  script_title_kr?: string
  script_title_en?: string
  art_title_kr?: string
  art_title_en?: string
  underlying_novel_kr?: string
  underlying_novel_en?: string
  rights_holder_name?: string
  rights_holder_company?: string
  rights_available?: string[]
  perfect_for?: string
  audience?: string
  platforms: Array<{
    platform_name: string
    platform_url: string
    views?: number
    subscribers?: number
    other_metrics?: Record<string, any>
  }>

  // Step 2: Story Details
  synopsis?: string
  tagline?: string
  tagline_kr?: string
  description_kr?: string
  inspiration?: string
  comparables?: string[]
  important_issues?: string
  setting_description?: string
  world_lore?: string
  supernatural_concepts?: string
  character_details?: Array<{
    name: string
    name_kr?: string
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
    age?: number | string
    gender?: string
    ethnicity?: string
    occupation?: string
    background?: string
    personality?: string
    arc?: string
    relationships?: string
  }>

  // Step 3: Narrative Structure
  story_structure?: string
  planned_ending?: string
  narrative_arc?: string

  // Step 4: Materials & Platforms
  chapters?: number
  completed?: boolean
  views?: number
  likes?: number
  rating?: number
  rating_count?: number
  documents: Array<{
    document_type: string
    file_url: string
    file_name: string
    file_size: number | null
    shareable_with_nda?: boolean
    external_url?: string | null
  }>

  // Step 5: Achievements & Profile
  awards?: string[]
  sales_records?: string
  merchandise_deals?: string
  print_editions?: boolean
  print_edition_details?: string
  media_coverage?: string
  celebrity_endorsements?: string
  creator_achievements?: {
    total_titles?: number
    total_views?: string
    notable_works?: string[]
    awards_received?: string[]
    industry_recognition?: string
  }
}

export default function EditTitle() {
  const { titleId } = useParams<{ titleId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['titles', 'survey', 'common'])

  const [title, setTitle] = useState<Title | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('step1')

  const form = useForm<EditTitleFormData>({
    defaultValues: {
      // Step 1 defaults
      title_name_en: '',
      title_name_kr: '',
      title_url: '',
      title_image: '',
      story_author: '',
      genre: [],
      is_official_english_title: true,
      english_title_type: 'official',
      rights_available: [],
      platforms: [],

      // Step 2 defaults
      character_details: [],

      // Step 4 defaults
      completed: false,
      documents: [],

      // Step 5 defaults
      print_editions: false,
      awards: [],
    }
  })

  useEffect(() => {
    if (titleId) {
      loadTitle(titleId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleId])

  const loadTitle = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const data = await titlesService.getTitleById(id)

      if (!data) {
        setError(t('titles:edit.notFound', 'Title not found'))
        return
      }

      // Check if user owns this title
      if (data.creator_id !== user?.id) {
        setError(t('titles:edit.noPermission', 'You do not have permission to edit this title'))
        return
      }

      setTitle(data)

      // Pre-populate form with existing data
      form.reset({
        // Step 1: Basic Information
        title_name_en: data.title_name_en || '',
        title_name_kr: data.title_name_kr || '',
        title_url: data.title_url || '',
        title_image: data.title_image || '',
        story_author: data.story_author || '',
        genre: Array.isArray(data.genre) ? data.genre : (data.genre ? [data.genre] : []),
        content_format: data.content_format || '',
        keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : '',
        tone: data.tone || '',
        art_author: data.art_author || '',
        author: data.author || '',
        writer: data.writer || '',
        illustrator: data.illustrator || '',
        is_official_english_title: data.is_official_english_title ?? true,
        english_title_type: data.english_title_type || 'official',
        script_title_kr: data.script_title_kr || '',
        script_title_en: data.script_title_en || '',
        art_title_kr: data.art_title_kr || '',
        art_title_en: data.art_title_en || '',
        underlying_novel_kr: data.underlying_novel_kr || '',
        underlying_novel_en: data.underlying_novel_en || '',
        rights_holder_name: data.rights_holder_name || '',
        rights_holder_company: data.rights_holder_company || '',
        rights_available: Array.isArray(data.rights_available) ? data.rights_available : [],
        perfect_for: data.perfect_for || '',
        audience: data.audience || '',
        platforms: data.platforms || [],

        // Step 2: Story Details
        synopsis: data.synopsis || '',
        tagline: data.tagline || '',
        tagline_kr: data.tagline_kr || '',
        description_kr: data.description_kr || '',
        inspiration: data.inspiration || '',
        comparables: data.comps || [],
        important_issues: data.important_issues || '',
        setting_description: data.setting_description || '',
        world_lore: data.world_lore || '',
        supernatural_concepts: data.supernatural_concepts || '',
        character_details: data.character_details || [],

        // Step 3: Narrative Structure
        story_structure: data.story_structure || '',
        planned_ending: data.planned_ending || '',
        narrative_arc: data.narrative_arc || '',

        // Step 4: Materials & Platforms
        chapters: data.chapters || undefined,
        completed: data.completed || false,
        views: data.views || undefined,
        likes: data.likes || undefined,
        rating: data.rating || undefined,
        rating_count: data.rating_count || undefined,
        documents: data.documents || [],

        // Step 5: Achievements & Profile
        awards: data.awards || [],
        sales_records: data.sales_records || '',
        merchandise_deals: data.merchandise_deals || '',
        print_editions: data.print_editions || false,
        print_edition_details: data.print_edition_details || '',
        media_coverage: data.media_coverage || '',
        celebrity_endorsements: data.celebrity_endorsements || '',
        creator_achievements: data.creator_achievements || {},
      })
    } catch (err) {
      console.error('Error loading title:', err)
      setError(t('titles:edit.loadError', 'Failed to load title. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: EditTitleFormData) => {
    if (!titleId || !user?.id) {
      setError(t('titles:edit.missingInfo', 'Missing required information'))
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare update data (matching Title interface structure)
      const updateData: Partial<Title> = {
        // Step 1: Basic Information
        title_name_en: values.title_name_en.trim(),
        title_name_kr: values.title_name_kr.trim(),
        title_url: values.title_url.trim(),
        title_image: values.title_image.trim(),
        story_author: values.story_author.trim(),
        genre: values.genre.length > 0 ? values.genre : null,
        content_format: values.content_format || null,
        keywords: values.keywords
          ? values.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : null,
        tone: values.tone?.trim() || null,
        art_author: values.art_author?.trim() || null,
        is_official_english_title: values.is_official_english_title,
        english_title_type: values.english_title_type,
        script_title_kr: values.script_title_kr?.trim() || null,
        script_title_en: values.script_title_en?.trim() || null,
        art_title_kr: values.art_title_kr?.trim() || null,
        art_title_en: values.art_title_en?.trim() || null,
        underlying_novel_kr: values.underlying_novel_kr?.trim() || null,
        underlying_novel_en: values.underlying_novel_en?.trim() || null,
        rights_holder_name: values.rights_holder_name?.trim() || null,
        rights_holder_company: values.rights_holder_company?.trim() || null,
        rights_available: values.rights_available && values.rights_available.length > 0
          ? values.rights_available
          : null,
        perfect_for: values.perfect_for?.trim() || null,
        audience: values.audience?.trim() || null,

        // Step 2: Story Details
        synopsis: values.synopsis?.trim() || null,
        tagline: values.tagline?.trim() || null,
        tagline_kr: values.tagline_kr?.trim() || null,
        description_kr: values.description_kr?.trim() || null,
        inspiration: values.inspiration?.trim() || null,
        comps: values.comparables && values.comparables.length > 0
          ? values.comparables
          : null,
        important_issues: values.important_issues?.trim() || null,
        setting_description: values.setting_description?.trim() || null,
        world_lore: values.world_lore?.trim() || null,
        supernatural_concepts: values.supernatural_concepts?.trim() || null,
        character_details: values.character_details && values.character_details.length > 0
          ? values.character_details
          : null,

        // Step 3: Narrative Structure
        story_structure: values.story_structure?.trim() || null,
        planned_ending: values.planned_ending?.trim() || null,
        narrative_arc: values.narrative_arc?.trim() || null,

        // Step 4: Materials & Platforms
        chapters: values.chapters ? Number(values.chapters) : null,
        completed: values.completed || null,
        views: values.views ? Number(values.views) : null,
        likes: values.likes ? Number(values.likes) : null,
        rating: values.rating ? Number(values.rating) : null,
        rating_count: values.rating_count ? Number(values.rating_count) : null,

        // Step 5: Achievements & Profile
        awards: values.awards && values.awards.length > 0 ? values.awards : null,
        sales_records: values.sales_records?.trim() || null,
        merchandise_deals: values.merchandise_deals?.trim() || null,
        print_editions: values.print_editions || null,
        print_edition_details: values.print_edition_details?.trim() || null,
        media_coverage: values.media_coverage?.trim() || null,
        celebrity_endorsements: values.celebrity_endorsements?.trim() || null,
        creator_achievements: values.creator_achievements && Object.keys(values.creator_achievements).length > 0
          ? values.creator_achievements
          : null,
      }

      await titlesService.updateTitle(titleId, updateData)

      // Navigate to the title detail page
      navigate(`/titles/${titleId}`)
    } catch (err) {
      console.error('Failed to update title:', err)
      setError(t('titles:edit.saveError', 'Failed to update title. Please verify the form details and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">{t('titles:edit.loading', 'Loading title...')}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error && !title) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <div className="flex gap-3 justify-center mt-4">
              <Button
                onClick={() => navigate('/titles')}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                {t('common:backToTitles', 'Back to Titles')}
              </Button>
              {titleId && (
                <Button
                  onClick={() => loadTitle(titleId)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {t('common:retry', 'Retry')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              {t('titles:edit.title', 'Edit Title')}
            </h1>
            <p className="text-gray-600">
              {t('titles:edit.subtitle', 'Update your title information')}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8">
            <CardContent className="p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabbed Form */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                  <TabsTrigger value="step1" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('survey:step1.tab', 'Basic')}</span>
                    <span className="sm:hidden">1</span>
                  </TabsTrigger>
                  <TabsTrigger value="step2" className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('survey:step2.tab', 'Story')}</span>
                    <span className="sm:hidden">2</span>
                  </TabsTrigger>
                  <TabsTrigger value="step3" className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('survey:step3.tab', 'Structure')}</span>
                    <span className="sm:hidden">3</span>
                  </TabsTrigger>
                  <TabsTrigger value="step4" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('survey:step4.tab', 'Materials')}</span>
                    <span className="sm:hidden">4</span>
                  </TabsTrigger>
                  <TabsTrigger value="step5" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('survey:step5.tab', 'Profile')}</span>
                    <span className="sm:hidden">5</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="step1" className="space-y-6">
                  <Step1BasicInfo form={form} />
                </TabsContent>

                <TabsContent value="step2" className="space-y-6">
                  <Step2StoryDetails form={form} />
                </TabsContent>

                <TabsContent value="step3" className="space-y-6">
                  <Step3Narrative form={form} />
                </TabsContent>

                <TabsContent value="step4" className="space-y-6">
                  <Step4Materials form={form} />
                </TabsContent>

                <TabsContent value="step5" className="space-y-6">
                  <Step5Profile form={form} />
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/titles/${titleId}`)}
                  disabled={isSubmitting}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {t('common:cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sunrise-coral-500 text-white hover:bg-sunrise-coral-600"
                >
                  {isSubmitting
                    ? t('common:saving', 'Saving...')
                    : t('common:saveChanges', 'Save Changes')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Pitch Deck Upload Section */}
        {titleId && (
          <PitchDeckUpload
            titleId={titleId}
            currentPitchUrl={title?.pitch}
            onUploadSuccess={(url) => {
              // Update local title state
              if (title) {
                setTitle({ ...title, pitch: url })
              }
            }}
            onDelete={() => {
              // Update local title state
              if (title) {
                setTitle({ ...title, pitch: null })
              }
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}
