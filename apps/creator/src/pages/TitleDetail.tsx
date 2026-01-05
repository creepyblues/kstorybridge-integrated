import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { titlesService } from '@/services/titlesService'
import { formatFitService, type FormatFitRecord } from '@/services/formatFitService'
import type { SuggestedComp } from '@/services/compsGeneratorService'

// Components
import { TitleDetailSection, FieldDisplay } from '@/components/titles/TitleDetailSection'
import { PlatformMetricsDisplay } from '@/components/titles/PlatformMetricsDisplay'
import { DocumentsList } from '@/components/titles/DocumentsList'
import { CharacterDetailsDisplay } from '@/components/titles/CharacterDetailsDisplay'
import { CreatorAchievementsDisplay } from '@/components/titles/CreatorAchievementsDisplay'
import { PitchDeckThumbnail } from '@/components/titles/PitchDeckThumbnail'
import { PitchDeckViewer } from '@/components/titles/PitchDeckViewer'

// AI Tools Components
import {
  CompsGeneratorModal,
  FormatFitAnalyzerModal,
  CompsDisplayCard,
  FormatFitDisplayCard,
} from '@/components/tools'

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['titles', 'common'])
  useAuth() // Ensures user is authenticated
  const [title, setTitle] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null)

  // AI Tools state
  const [isCompsModalOpen, setIsCompsModalOpen] = useState(false)
  const [isFormatFitModalOpen, setIsFormatFitModalOpen] = useState(false)
  const [formatFit, setFormatFit] = useState<FormatFitRecord | null>(null)

  useEffect(() => {
    if (titleId) {
      loadTitle(titleId)
    }
  }, [titleId])

  const loadTitle = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await titlesService.getTitleById(id)
      setTitle(data)
      // Load format fit data
      loadFormatFit(id)
    } catch (err) {
      console.error('Error loading title:', err)
      setError('Failed to load title details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadFormatFit = async (id: string) => {
    try {
      const data = await formatFitService.getFormatFit(id)
      setFormatFit(data)
    } catch (err) {
      console.error('Error loading format fit:', err)
      // Don't show error for format fit, it's optional
    }
  }

  const handleCompsSaved = () => {
    // Reload title to get updated comps data
    if (titleId) {
      loadTitle(titleId)
    }
  }

  const handleFormatFitComplete = () => {
    // Reload format fit data
    if (titleId) {
      loadFormatFit(titleId)
    }
  }

  const formatViews = (views: number | null | undefined) => {
    if (!views) return '0'
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toLocaleString()
  }

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24">
            <Icon
              icon="solar:spinner-bold"
              className="h-8 w-8 animate-spin text-sunrise-coral mb-3"
            />
            <p className="text-gray-500">{t('titles:detail.loading', 'Loading title details...')}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !title) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-24">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                className="h-8 w-8 text-red-500"
              />
            </div>
            <p className="text-red-600 mb-4">{error || 'Title not found'}</p>
            <Button
              onClick={() => navigate('/titles')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:arrow-left-linear" className="h-4 w-4 mr-2" />
              {t('titles:detail.backToList', 'Back to Titles')}
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Check if sections have data
  const hasStep1Data = true // Always show basic info
  const hasStep2Data = title.synopsis || title.tagline || title.inspiration || title.setting_description || title.character_details?.length > 0
  const hasStep3Data = true // Always show narrative structure section
  const hasStep4Data = (title.views && title.views > 0) || (title.chapters && title.chapters > 0) || title.platforms?.length > 0 || title.documents?.length > 0
  const hasStep5Data = title.awards?.length > 0 || title.sales_records || title.media_coverage || title.creator_achievements

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Navigation */}
        <nav className="mb-6">
          <button
            onClick={() => navigate('/titles')}
            className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sunrise-coral transition-colors"
          >
            <Icon
              icon="solar:arrow-left-linear"
              className="h-4 w-4 group-hover:-translate-x-1 transition-transform"
            />
            <span>Back to My Titles</span>
          </button>
        </nav>

        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-sunrise-coral/5 to-orange-50 border-sunrise-coral/20 shadow-none rounded-2xl overflow-hidden mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Title Image */}
              <div className="w-36 h-48 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
                {title.title_image ? (
                  <img
                    src={title.title_image}
                    alt={title.title_name_en || title.title_name_kr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Icon icon="solar:book-2-bold-duotone" className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title & Korean Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 leading-tight">
                  {title.title_name_en || title.title_name_kr}
                </h1>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg text-gray-600 font-medium mb-4">
                    {title.title_name_kr}
                  </p>
                )}

                {/* Genre & Format Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {title.content_format && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-sunrise-coral text-white">
                      <Icon icon="solar:document-text-bold" className="h-3 w-3" />
                      {formatContentFormat(title.content_format)}
                    </span>
                  )}
                  {title.completed !== undefined && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                      title.completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Icon icon={title.completed ? 'solar:check-circle-bold' : 'solar:play-circle-bold'} className="h-3 w-3" />
                      {title.completed ? 'Completed' : 'Ongoing'}
                    </span>
                  )}
                </div>

                {/* Author info */}
                <div className="flex flex-row flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  {title.story_author && (
                    <span className="flex items-center gap-2">
                      <Icon icon="solar:pen-bold-duotone" className="h-4 w-4 text-sunrise-coral" />
                      <span className="font-medium">{title.story_author}</span>
                    </span>
                  )}
                  {title.art_author && (
                    <span className="flex items-center gap-2">
                      <Icon icon="solar:palette-bold-duotone" className="h-4 w-4 text-sunrise-coral" />
                      <span className="font-medium">{title.art_author}</span>
                    </span>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex flex-row items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full">
                    <Icon icon="solar:eye-bold" className="h-4 w-4 text-sunrise-coral" />
                    <span className="font-medium">{formatViews(title.views)} views</span>
                  </div>
                  {title.chapters && (
                    <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full">
                      <Icon icon="solar:book-bold" className="h-4 w-4 text-sunrise-coral" />
                      <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                    </div>
                  )}
                  {title.rating && (
                    <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full">
                      <Icon icon="solar:star-bold" className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">{title.rating}/10</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                <Button
                  onClick={() => navigate(`/titles/${title.title_id}/edit`)}
                  className="flex-1 lg:flex-none bg-sunrise-coral text-white hover:bg-sunrise-coral/90 shadow-lg shadow-sunrise-coral/25"
                >
                  <Icon icon="solar:pen-new-round-bold" className="h-4 w-4 mr-2" />
                  {t('titles:detail.editButton', 'Edit Title')}
                </Button>

                {title.title_url && (
                  <Button
                    onClick={() => window.open(title.title_url, '_blank')}
                    variant="outline"
                    className="flex-1 lg:flex-none border-gray-300 hover:bg-white"
                  >
                    <Icon icon="solar:link-round-bold" className="h-4 w-4 mr-2" />
                    {t('titles:detail.viewOriginal', 'View Original')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pitch Deck Section */}
        {title.pitch && title.pitch.trim() !== '' && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Pitch Deck</h3>
              <PitchDeckThumbnail
                pdfUrl={title.pitch}
                onClick={() => {
                  setCurrentPdfUrl(title.pitch);
                  setIsPdfModalOpen(true);
                }}
                alt={`${title.title_name_en || title.title_name_kr} pitch deck`}
              />
            </CardContent>
          </Card>
        )}

        {/* AI Tools Section */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon icon="solar:magic-stick-3-bold-duotone" className="h-5 w-5 text-purple-500" />
                <h3 className="text-xl font-semibold text-gray-900">AI Tools</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsCompsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <Icon icon="solar:stars-bold" className="h-4 w-4 mr-1" />
                  Generate Comps
                </Button>
                <Button
                  onClick={() => setIsFormatFitModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <Icon icon="solar:chart-bold" className="h-4 w-4 mr-1" />
                  Analyze Format Fit
                </Button>
              </div>
            </div>

            {/* Display saved results */}
            <div className="space-y-4">
              <CompsDisplayCard
                comps={title.comps || []}
                compsAnalysis={title.comps_analysis as SuggestedComp[] | undefined}
                onGenerate={() => setIsCompsModalOpen(true)}
              />
              <FormatFitDisplayCard
                formatFit={formatFit}
                onAnalyze={() => setIsFormatFitModalOpen(true)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Basic Information */}
        <TitleDetailSection
          stepNumber={1}
          title={t('survey:step1.title', 'Basic Information')}
          icon={<Icon icon="solar:document-text-bold-duotone" className="w-5 h-5" />}
          defaultExpanded={true}
          isEmpty={!hasStep1Data}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldDisplay
              label={t('survey:step1.titleNameEn', 'Title Name (English)')}
              value={title.title_name_en}
            />
            <FieldDisplay
              label={t('survey:step1.titleNameKr', 'Title Name (Korean)')}
              value={title.title_name_kr}
            />
            <FieldDisplay
              label={t('titles:detail.titleUrlKr', 'Title URL (Korean)')}
              value={title.title_url && (
                <a href={title.title_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {title.title_url}
                </a>
              )}
            />
            <FieldDisplay
              label={t('titles:detail.titleUrlEn', 'Title URL (English)')}
              value={title.title_url_en && (
                <a href={title.title_url_en} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {title.title_url_en}
                </a>
              )}
            />
            <FieldDisplay
              label={t('survey:step1.isOfficialEnglish', 'Official English Title')}
              value={title.is_official_english_title ? 'Yes' : 'No'}
              isEmpty={title.is_official_english_title === null || title.is_official_english_title === undefined}
            />
            <FieldDisplay
              label={t('titles:detail.englishTitleType', 'English Title Type')}
              value={title.english_title_type && formatContentFormat(title.english_title_type)}
            />
            <FieldDisplay
              label={t('survey:step1.genre', 'Genre')}
              value={title.genre && (
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(title.genre) ? title.genre : [title.genre]).map((g: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs border-gray-300 text-gray-700">
                      {g}
                    </Badge>
                  ))}
                </div>
              )}
            />
            <FieldDisplay
              label={t('survey:step1.contentFormat', 'Content Format')}
              value={title.content_format && formatContentFormat(title.content_format)}
            />
            <FieldDisplay
              label={t('survey:step1.storyAuthor', 'Story Author')}
              value={title.story_author}
            />
            <FieldDisplay
              label={t('titles:detail.storyAuthorKr', 'Story Author (Korean)')}
              value={title.story_author_kr}
            />
            <FieldDisplay
              label={t('survey:step1.artAuthor', 'Art Author')}
              value={title.art_author}
            />
            <FieldDisplay
              label={t('titles:detail.artAuthorKr', 'Art Author (Korean)')}
              value={title.art_author_kr}
            />
            <FieldDisplay
              label={t('survey:step1.originalAuthor', 'Original Author')}
              value={title.original_author}
            />
            <FieldDisplay
              label={t('titles:detail.originalAuthorKr', 'Original Author (Korean)')}
              value={title.original_author_kr}
            />
            <FieldDisplay
              label={t('titles:detail.scriptTitleKr', 'Script Title (Korean)')}
              value={title.script_title_kr}
            />
            <FieldDisplay
              label={t('titles:detail.scriptTitleEn', 'Script Title (English)')}
              value={title.script_title_en}
            />
            <FieldDisplay
              label={t('titles:detail.artTitleKr', 'Art Title (Korean)')}
              value={title.art_title_kr}
            />
            <FieldDisplay
              label={t('titles:detail.artTitleEn', 'Art Title (English)')}
              value={title.art_title_en}
            />
            <FieldDisplay
              label={t('survey:step1.rightsHolderName', 'Rights Holder')}
              value={title.rights_holder_name}
            />
            <FieldDisplay
              label={t('titles:detail.rightsHolderCompany', 'Rights Holder Company')}
              value={title.rights_holder_company}
              isEmpty={!title.rights_holder_company}
            />
            <FieldDisplay
              label={t('titles:detail.underlyingNovelKr', 'Underlying Novel (Korean)')}
              value={title.underlying_novel_kr}
              isEmpty={!title.underlying_novel_kr}
            />
            <FieldDisplay
              label={t('titles:detail.underlyingNovelEn', 'Underlying Novel (English)')}
              value={title.underlying_novel_en}
              isEmpty={!title.underlying_novel_en}
            />
            <FieldDisplay
              label={t('survey:step1.keywords', 'Keywords')}
              value={title.keywords && (
                <div className="flex flex-wrap gap-1">
                  {title.keywords.map((keyword: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs border-gray-300 text-blue-600">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
              fullWidth
            />
            <FieldDisplay
              label={t('titles:detail.rightsAvailable', 'Rights Available')}
              value={title.rights_available && title.rights_available.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {title.rights_available.map((right: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs border-gray-300 text-gray-700">
                      {right.replace('_', ' & ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              )}
              fullWidth
            />
            <FieldDisplay
              label={t('titles:detail.tone', 'Tone')}
              value={title.tone && formatContentFormat(title.tone)}
            />
            <FieldDisplay
              label={t('titles:detail.audience', 'Target Audience')}
              value={title.audience}
            />
            <FieldDisplay
              label={t('titles:detail.ageRating', 'Age Rating')}
              value={title.age_rating}
            />
            <FieldDisplay
              label={t('titles:detail.perfectFor', 'Perfect For')}
              value={title.perfect_for}
            />
            <FieldDisplay
              label={t('titles:detail.contentProvider', 'Content Provider')}
              value={title.cp}
            />
            <FieldDisplay
              label={t('titles:detail.note', 'Notes')}
              value={title.note}
              fullWidth
            />
            <FieldDisplay
              label={t('titles:detail.noteKr', 'Notes (Korean)')}
              value={title.note_kr}
              fullWidth
            />
          </div>
        </TitleDetailSection>

        {/* Step 2: Story Details */}
        <TitleDetailSection
          stepNumber={2}
          title={t('survey:step2.title', 'Story Details')}
          icon={<Icon icon="solar:book-bold-duotone" className="w-5 h-5" />}
          defaultExpanded={true}
          isEmpty={!hasStep2Data}
        >
          <div className="space-y-6">
            {/* Content Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.contentDetails', 'Content Details')}</h3>
              <div className="grid grid-cols-1 gap-4">
                <FieldDisplay
                  label={t('survey:step2.tagline', 'Tagline')}
                  value={title.tagline}
                  fullWidth
                />
                <FieldDisplay
                  label={t('titles:detail.taglineKr', 'Tagline (Korean)')}
                  value={title.tagline_kr}
                  fullWidth
                />
                <FieldDisplay
                  label={t('survey:step2.synopsis', 'Synopsis')}
                  value={title.synopsis && (
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {title.synopsis}
                    </p>
                  )}
                  fullWidth
                />
                <FieldDisplay
                  label={t('titles:detail.synopsisKr', 'Synopsis (Korean)')}
                  value={title.synopsis_kr && (
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {title.synopsis_kr}
                    </p>
                  )}
                  fullWidth
                />
                <FieldDisplay
                  label={t('titles:detail.genreKr', 'Genre (Korean)')}
                  value={title.genre_kr && title.genre_kr.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {title.genre_kr.map((g: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs border-gray-300 text-gray-700">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  )}
                  fullWidth
                />
                <div className="grid grid-cols-2 gap-4">
                  <FieldDisplay
                    label={t('survey:step2.chapters', 'Chapters')}
                    value={title.chapters}
                  />
                  <FieldDisplay
                    label={t('survey:step2.seriesCompleted', 'Series Completed')}
                    value={title.completed ? 'Yes' : 'No'}
                  />
                </div>
              </div>
            </div>

            {/* Story Background */}
            {(title.inspiration || title.important_issues) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.storyBackground', 'Story Background')}</h3>
                <div className="space-y-4">
                  <FieldDisplay
                    label={t('survey:step2.inspiration', 'Inspiration')}
                    value={title.inspiration && (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {title.inspiration}
                      </p>
                    )}
                    fullWidth
                  />
                  <FieldDisplay
                    label={t('survey:step2.importantIssues', 'Important Issues')}
                    value={title.important_issues && (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {title.important_issues}
                      </p>
                    )}
                    fullWidth
                  />
                </div>
              </div>
            )}

            {/* Comparable Titles */}
            {title.comps && title.comps.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.comparableTitles', 'Comparable Titles')}</h3>
                <div className="flex flex-wrap gap-2">
                  {title.comps.map((comp: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-sm border-gray-300 text-gray-700 px-3 py-1">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* World Building */}
            {(title.setting_description || title.world_lore || title.supernatural_concepts) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.worldBuilding', 'World Building')}</h3>
                <div className="space-y-4">
                  <FieldDisplay
                    label={t('survey:step2.settingDescription', 'Setting Description')}
                    value={title.setting_description && (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {title.setting_description}
                      </p>
                    )}
                    fullWidth
                  />
                  <FieldDisplay
                    label={t('survey:step2.worldLore', 'World Lore')}
                    value={title.world_lore && (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {title.world_lore}
                      </p>
                    )}
                    fullWidth
                  />
                  <FieldDisplay
                    label={t('survey:step2.supernaturalConcepts', 'Supernatural Concepts')}
                    value={title.supernatural_concepts && (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {title.supernatural_concepts}
                      </p>
                    )}
                    fullWidth
                  />
                </div>
              </div>
            )}

            {/* Characters */}
            {title.character_details && title.character_details.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-bold-duotone" className="w-5 h-5 text-sunrise-coral" />
                  {t('titles:detail.mainCharacters', 'Main Characters')}
                </h3>
                <CharacterDetailsDisplay characters={title.character_details} />
              </div>
            )}
          </div>
        </TitleDetailSection>

        {/* Step 3: Narrative Structure */}
        <TitleDetailSection
          stepNumber={3}
          title={t('survey:step3.title', 'Narrative Structure')}
          icon={<Icon icon="solar:pen-new-round-bold-duotone" className="w-5 h-5" />}
          defaultExpanded={false}
          isEmpty={!hasStep3Data}
        >
          <div className="space-y-6">
            <FieldDisplay
              label={t('survey:step3.storyStructureLabel', 'Story Structure (Beginning/Middle/End)')}
              value={title.story_structure && (
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-mono">
                  {title.story_structure}
                </p>
              )}
              fullWidth
            />
            <FieldDisplay
              label={t('survey:step3.endingLabel', 'Planned Ending')}
              value={title.planned_ending && (
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {title.planned_ending}
                </p>
              )}
              fullWidth
            />
            <FieldDisplay
              label={t('survey:step3.narrativeArcLabel', 'Narrative Arc')}
              value={title.narrative_arc && (
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {title.narrative_arc}
                </p>
              )}
              fullWidth
            />
          </div>
        </TitleDetailSection>

        {/* Step 4: Materials & Platforms */}
        <TitleDetailSection
          stepNumber={4}
          title={t('survey:step4.title', 'Materials & Platforms')}
          icon={<Icon icon="solar:folder-with-files-bold-duotone" className="w-5 h-5" />}
          defaultExpanded={false}
          isEmpty={!hasStep4Data}
        >
          <div className="space-y-6">
            {/* Overall Metrics */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.overallMetrics', 'Overall Metrics')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FieldDisplay
                  label={t('titles:detail.totalViews', 'Total Views')}
                  value={title.views ? formatViews(title.views) : null}
                />
                <FieldDisplay
                  label={t('titles:detail.totalLikes', 'Total Likes')}
                  value={title.likes ? title.likes.toLocaleString() : null}
                />
                <FieldDisplay
                  label={t('titles:detail.rating', 'Rating')}
                  value={title.rating ? `${title.rating}/10` : null}
                />
                <FieldDisplay
                  label={t('titles:detail.ratingCount', 'Rating Count')}
                  value={title.rating_count ? title.rating_count.toLocaleString() : null}
                />
              </div>
            </div>

            {/* Platform Metrics */}
            {title.platforms && title.platforms.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:global-bold-duotone" className="w-5 h-5 text-sunrise-coral" />
                  {t('titles:detail.platformMetrics', 'Platform Metrics')}
                </h3>
                <PlatformMetricsDisplay platforms={title.platforms} />
              </div>
            )}

            {/* Documents */}
            {title.documents && title.documents.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:file-text-bold-duotone" className="w-5 h-5 text-sunrise-coral" />
                  {t('titles:detail.documents', 'Documents')}
                </h3>
                <DocumentsList documents={title.documents} />
              </div>
            )}
          </div>
        </TitleDetailSection>

        {/* Step 5: Achievements & Profile */}
        <TitleDetailSection
          stepNumber={5}
          title={t('survey:step5.title', 'Achievements & Profile')}
          icon={<Icon icon="solar:cup-star-bold-duotone" className="w-5 h-5" />}
          defaultExpanded={false}
          isEmpty={!hasStep5Data}
        >
          <div className="space-y-6">
            {/* Title Achievements */}
            {(title.awards?.length > 0 || title.sales_records || title.merchandise_deals || title.media_coverage) && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.titleAchievements', 'Title Achievements')}</h3>
                <div className="space-y-4">
                  {title.awards && title.awards.length > 0 && (
                    <FieldDisplay
                      label={t('titles:detail.awardsRecognition', 'Awards & Recognition')}
                      value={
                        <div className="space-y-2">
                          {title.awards.map((award: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Icon icon="solar:cup-star-bold" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{award}</span>
                            </div>
                          ))}
                        </div>
                      }
                      fullWidth
                    />
                  )}
                  <FieldDisplay
                    label={t('titles:detail.salesRecords', 'Sales Records')}
                    value={title.sales_records}
                    fullWidth
                  />
                  <FieldDisplay
                    label={t('titles:detail.merchandiseDeals', 'Merchandise Deals')}
                    value={title.merchandise_deals}
                    fullWidth
                  />
                  {title.print_editions && (
                    <>
                      <FieldDisplay
                        label={t('titles:detail.printEditions', 'Print Editions')}
                        value={t('titles:detail.yes', 'Yes')}
                      />
                      <FieldDisplay
                        label={t('titles:detail.printEditionDetails', 'Print Edition Details')}
                        value={title.print_edition_details}
                        fullWidth
                      />
                    </>
                  )}
                  <FieldDisplay
                    label={t('titles:detail.mediaCoverage', 'Media Coverage')}
                    value={title.media_coverage}
                    fullWidth
                  />
                  <FieldDisplay
                    label={t('titles:detail.celebrityEndorsements', 'Celebrity Endorsements')}
                    value={title.celebrity_endorsements}
                    fullWidth
                  />
                </div>
              </div>
            )}

            {/* Creator Profile */}
            {title.creator_achievements && (
              <div className={title.awards?.length > 0 ? 'border-t border-gray-200 pt-6' : ''}>
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t('titles:detail.creatorProfile', 'Creator Profile')}</h3>
                <CreatorAchievementsDisplay achievements={title.creator_achievements} />
              </div>
            )}
          </div>
        </TitleDetailSection>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && currentPdfUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative">
            <Button
              onClick={() => setIsPdfModalOpen(false)}
              variant="outline"
              className="absolute top-4 right-4 z-10 border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            </Button>
            <div className="h-[90vh] overflow-y-auto">
              <PitchDeckViewer
                pdfUrl={currentPdfUrl}
                title={title.title_name_en || title.title_name_kr}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Tools Modals */}
      <CompsGeneratorModal
        open={isCompsModalOpen}
        onOpenChange={setIsCompsModalOpen}
        titleId={title.title_id}
        titleName={title.title_name_en || title.title_name_kr}
        onSaved={handleCompsSaved}
      />

      <FormatFitAnalyzerModal
        open={isFormatFitModalOpen}
        onOpenChange={setIsFormatFitModalOpen}
        titleId={title.title_id}
        titleName={title.title_name_en || title.title_name_kr}
        onComplete={handleFormatFitComplete}
      />
    </MainLayout>
  )
}
