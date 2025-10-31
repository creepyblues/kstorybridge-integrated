import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type Title } from '@/services/titlesService'

interface FormValues {
  // Required fields
  title_name_en: string
  title_name_kr: string
  title_url: string
  title_image: string
  story_author: string

  // Content classification
  genre: string | ''
  content_format?: string | ''
  keywords?: string

  // Content details
  synopsis?: string
  description?: string
  tagline?: string
  note?: string
  tone?: string
  chapters?: number | ''
  completed?: boolean

  // Credits (multiple author types)
  art_author?: string
  author?: string
  writer?: string
  illustrator?: string

  // Rights and business
  rights_owner?: string
  rights?: string
  perfect_for?: string
  audience?: string
  comps?: string
}

const GENRE_OPTIONS = [
  'romance',
  'fantasy',
  'action',
  'drama',
  'comedy',
  'thriller',
  'horror',
  'sci_fi',
  'slice_of_life',
  'historical',
  'mystery',
  'sports',
  'other'
]

const CONTENT_FORMAT_OPTIONS = [
  'webtoon',
  'web_novel',
  'book',
  'script',
  'game',
  'animation',
  'other'
]

export default function EditTitle() {
  const { titleId } = useParams<{ titleId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState<Title | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>()

  const completed = watch('completed')

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

      if (!data) {
        setError('Title not found')
        return
      }

      // Check if user owns this title
      if (data.creator_id !== user?.id) {
        setError('You do not have permission to edit this title')
        return
      }

      setTitle(data)

      // Pre-populate form with existing data
      reset({
        title_name_en: data.title_name_en || '',
        title_name_kr: data.title_name_kr || '',
        title_url: data.title_url || '',
        title_image: data.title_image || '',
        story_author: data.story_author || '',
        genre: Array.isArray(data.genre) ? data.genre[0] : (data.genre || ''),
        content_format: data.content_format || '',
        keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : '',
        synopsis: data.synopsis || '',
        description: data.description || '',
        tagline: data.tagline || '',
        note: data.note || '',
        tone: data.tone || '',
        chapters: data.chapters || '',
        completed: data.completed || false,
        art_author: data.art_author || '',
        author: data.author || '',
        writer: data.writer || '',
        illustrator: data.illustrator || '',
        rights_owner: data.rights_owner || '',
        rights: data.rights || '',
        perfect_for: data.perfect_for || '',
        audience: data.audience || '',
        comps: Array.isArray(data.comps) ? data.comps.join(', ') : '',
      })
    } catch (err) {
      console.error('Error loading title:', err)
      setError('Failed to load title. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!titleId || !user?.id) {
      setError('Missing required information')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const updateData = {
        // Required fields
        title_name_en: values.title_name_en.trim(),
        title_name_kr: values.title_name_kr.trim(),
        title_url: values.title_url.trim(),
        title_image: values.title_image.trim(),
        story_author: values.story_author.trim(),

        // Content classification
        genre: values.genre ? [values.genre] : null,
        content_format: values.content_format || null,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()).filter(Boolean) : null,

        // Content details
        synopsis: values.synopsis?.trim() || null,
        description: values.description?.trim() || null,
        tagline: values.tagline?.trim() || null,
        note: values.note?.trim() || null,
        tone: values.tone?.trim() || null,
        chapters: values.chapters ? Number(values.chapters) : null,
        completed: values.completed || null,

        // Credits
        art_author: values.art_author?.trim() || null,
        author: values.author?.trim() || null,
        writer: values.writer?.trim() || null,
        illustrator: values.illustrator?.trim() || null,

        // Rights and business
        rights_owner: values.rights_owner?.trim() || null,
        rights: values.rights?.trim() || null,
        perfect_for: values.perfect_for?.trim() || null,
        audience: values.audience?.trim() || null,
        comps: values.comps ? values.comps.split(',').map(c => c.trim()).filter(Boolean) : null,
      }

      await titlesService.updateTitle(titleId, updateData)

      // Navigate to the title detail page
      navigate(`/titles/${titleId}`)
    } catch (err) {
      console.error('Failed to update title:', err)
      setError('Failed to update title. Please verify the form details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error && !title) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="bg-transparent border-red-300 shadow-none rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <div className="flex gap-3 justify-center mt-4">
                <Button
                  onClick={() => navigate('/titles')}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Back to Titles
                </Button>
                {titleId && (
                  <Button
                    onClick={() => loadTitle(titleId)}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 sm:gap-0">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Edit Title</h1>
            <p className="text-gray-600">
              Update your title information
            </p>
          </div>
        </div>

        {error && (
          <Card className="bg-transparent border-red-300 shadow-none rounded-2xl mb-6">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                  Basic Information
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title_name_en">English Title *</Label>
                    <Input
                      id="title_name_en"
                      placeholder="I Became a Doting Father"
                      {...register('title_name_en', { required: true })}
                    />
                    {errors.title_name_en && (
                      <p className="text-sm text-red-500 mt-1">English title is required.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="title_name_kr">Korean Title *</Label>
                    <Input
                      id="title_name_kr"
                      placeholder="한국어 제목"
                      {...register('title_name_kr', { required: true })}
                    />
                    {errors.title_name_kr && (
                      <p className="text-sm text-red-500 mt-1">Korean title is required.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title_url">Title URL *</Label>
                    <Input
                      id="title_url"
                      type="url"
                      placeholder="https://example.com"
                      {...register('title_url', { required: true })}
                    />
                    {errors.title_url && (
                      <p className="text-sm text-red-500 mt-1">A valid URL is required.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="title_image">Cover Image URL *</Label>
                    <Input
                      id="title_image"
                      type="url"
                      placeholder="https://.../cover.jpg"
                      {...register('title_image', { required: true })}
                    />
                    {errors.title_image && (
                      <p className="text-sm text-red-500 mt-1">Cover image URL is required.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Classification */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                  Content Classification
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label>Genre *</Label>
                    <Controller
                      name="genre"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENRE_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.genre && (
                      <p className="text-sm text-red-500 mt-1">Genre is required.</p>
                    )}
                  </div>
                  <div>
                    <Label>Content Format</Label>
                    <Controller
                      name="content_format"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_FORMAT_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="magic, school, friendship (comma-separated)"
                      {...register('keywords')}
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple keywords with commas</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Input
                    id="tone"
                    placeholder="e.g., lighthearted, dark, inspirational"
                    {...register('tone')}
                  />
                </div>
              </div>

              {/* Credits */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                  Credits
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="story_author">Story Author *</Label>
                    <Input
                      id="story_author"
                      placeholder="Author name"
                      {...register('story_author', { required: true })}
                    />
                    {errors.story_author && (
                      <p className="text-sm text-red-500 mt-1">Story author is required.</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="art_author">Art Author</Label>
                    <Input
                      id="art_author"
                      placeholder="Artist name"
                      {...register('art_author')}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="author">Author (General)</Label>
                    <Input
                      id="author"
                      placeholder="Author name"
                      {...register('author')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="writer">Writer</Label>
                    <Input
                      id="writer"
                      placeholder="Writer name"
                      {...register('writer')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="illustrator">Illustrator</Label>
                  <Input
                    id="illustrator"
                    placeholder="Illustrator name"
                    {...register('illustrator')}
                  />
                </div>
              </div>

              {/* Content Details */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                  Content Details
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="chapters">Number of Chapters</Label>
                    <Input
                      id="chapters"
                      type="number"
                      placeholder="120"
                      {...register('chapters')}
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Series Completed
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="A compelling one-line description"
                    {...register('tagline')}
                  />
                </div>

                <div>
                  <Label htmlFor="synopsis">Synopsis</Label>
                  <Textarea
                    id="synopsis"
                    rows={4}
                    placeholder="Brief synopsis of the title"
                    {...register('synopsis')}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Detailed description of the title"
                    {...register('description')}
                  />
                </div>

                <div>
                  <Label htmlFor="note">Notes</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    placeholder="Additional notes or comments"
                    {...register('note')}
                  />
                </div>
              </div>

              {/* Rights and Business */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                  Rights & Business
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="rights_owner">Rights Owner</Label>
                    <Input
                      id="rights_owner"
                      placeholder="Company or individual name"
                      {...register('rights_owner')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rights">Rights Available</Label>
                    <Input
                      id="rights"
                      placeholder="e.g., Film, TV, Merchandise"
                      {...register('rights')}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="perfect_for">Perfect For</Label>
                    <Input
                      id="perfect_for"
                      placeholder="e.g., Streaming series, Feature film"
                      {...register('perfect_for')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., Young adults, Family"
                      {...register('audience')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comps">Comparable Titles (Comps)</Label>
                  <Input
                    id="comps"
                    placeholder="Similar Title 1, Similar Title 2 (comma-separated)"
                    {...register('comps')}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple titles with commas</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/titles/${titleId}`)}
                  disabled={isSubmitting}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
