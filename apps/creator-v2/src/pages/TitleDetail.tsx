import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'
import { Eye, ExternalLink, BookOpen, Edit, Calendar } from 'lucide-react'

export default function TitleDetail() {
  const { titleId } = useParams<{ titleId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [title, setTitle] = useState<Title | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      console.error('Error loading title:', err)
      setError('Failed to load title details. Please try again.')
    } finally {
      setLoading(false)
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !title) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <Card className="bg-transparent border-red-300 shadow-none rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error || 'Title not found'}</p>
              <Button
                onClick={() => navigate('/titles')}
                variant="outline"
                className="mt-4 border-gray-300 hover:bg-gray-100"
              >
                Back to Titles
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Section */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Mobile: Full width image first */}
              <div className="sm:hidden mb-4">
                <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                  {title.title_image ? (
                    <img
                      src={title.title_image}
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop: Side-by-side layout */}
              <div className="hidden sm:flex sm:items-start gap-6 mb-4">
                <div className="w-32 h-44 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                  {title.title_image ? (
                    <img
                      src={title.title_image}
                      alt={title.title_name_en || title.title_name_kr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-bold text-black mb-3 leading-tight">
                    {title.title_name_en || title.title_name_kr}
                  </h2>
                  {title.title_name_kr && title.title_name_en && (
                    <p className="text-xl text-gray-600 font-medium mb-4">
                      {title.title_name_kr}
                    </p>
                  )}

                  {/* Author info */}
                  <div className="flex flex-row flex-wrap gap-6 text-base text-gray-600 mb-4">
                    {title.story_author && (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-black">Story:</span>
                        <span className="font-medium">{title.story_author}</span>
                      </span>
                    )}
                    {title.art_author && (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-black">Art:</span>
                        <span className="font-medium">{title.art_author}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="flex flex-row items-center gap-6 text-sm text-gray-500 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{formatViews(title.views)} views</span>
                    </div>
                    {title.chapters && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: Content section */}
              <div className="sm:hidden">
                <h2 className="text-2xl font-bold text-black mb-2 leading-tight text-center">
                  {title.title_name_en || title.title_name_kr}
                </h2>
                {title.title_name_kr && title.title_name_en && (
                  <p className="text-lg text-gray-600 font-medium mb-3 text-center">
                    {title.title_name_kr}
                  </p>
                )}

                {/* Author info - Story and Art on same line */}
                <div className="flex flex-row flex-wrap gap-4 text-sm text-gray-600 justify-center">
                  {title.story_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-black">Story:</span>
                      <span className="font-medium">{title.story_author}</span>
                    </span>
                  )}
                  {title.art_author && (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-black">Art:</span>
                      <span className="font-medium">{title.art_author}</span>
                    </span>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex flex-row items-center gap-3 mt-3 text-xs text-gray-500 justify-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span className="font-medium">{formatViews(title.views)} views</span>
                  </div>
                  {title.chapters && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3" />
                      <span className="font-medium">{title.chapters.toLocaleString()} chapters</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">{title.completed ? 'Completed' : 'Ongoing'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-3 w-full lg:w-auto justify-center lg:justify-end">
              {/* Edit Button */}
              <Button
                onClick={() => navigate(`/titles/${title.title_id}/edit`)}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-100"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              {/* View Original Button */}
              {title.title_url && (
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                >
                  <a href={title.title_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Business Critical Info (2/5) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Key Business Info Panel */}
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-black">
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rights Holder */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Rights Holder</h5>
                      <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                        {title.rights_owner || title.rights || "Not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Target Market Info */}
                  {title.perfect_for && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Perfect For</h5>
                      <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                        {title.perfect_for}
                      </span>
                    </div>
                  )}

                  {title.audience && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Audience</h5>
                      <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                        {title.audience}
                      </span>
                    </div>
                  )}

                  {title.comps && title.comps.length > 0 && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Comps</h5>
                      <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                        {title.comps.slice(0, 2).join(', ')}
                        {title.comps.length > 2 && ` +${title.comps.length - 2}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Format & Genre */}
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-black">Content Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {title.content_format && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Format</h5>
                      <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                        {formatContentFormat(title.content_format)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-700">Series Status</h5>
                    <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                      {title.completed ? 'Completed' : 'Ongoing'}
                    </span>
                  </div>

                  {title.genre && (
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-700">Genre</h5>
                      <span className="font-bold text-black text-xs truncate max-w-[60%] text-right">
                        {Array.isArray(title.genre)
                          ? title.genre.slice(0, 2).map(g => g.replace('_', ' ')).join(', ')
                          : title.genre.replace('_', ' ')
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Content Overview (3/5) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Synopsis */}
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-black">Synopsis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {title.synopsis ? (
                    <p className="text-gray-700 leading-relaxed">
                      {title.synopsis}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">No synopsis available for this title.</p>
                  )}

                  {/* Tagline */}
                  {title.tagline && (
                    <div className="mt-4 p-4 bg-gray-50 border-l-4 border-black rounded-r-lg">
                      <p className="text-gray-700 font-medium italic">
                        "{title.tagline}"
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  {title.keywords && title.keywords.length > 0 && (
                    <div className="pt-4">
                      <h5 className="font-bold text-gray-700 mb-3">Keywords</h5>
                      <div className="flex flex-wrap gap-2">
                        {title.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            {title.note && (
              <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-black">
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {title.note}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </MainLayout>
  )
}
