import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { titlesService, type CreateTitleInput } from '@/services/titlesService'

interface FormValues {
  title_name_en: string
  title_name_kr: string
  title_url: string
  title_image: string
  story_author: string
  genre: string | ''
  synopsis?: string
  tagline?: string
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

export default function AddTitle() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title_name_en: '',
      title_name_kr: '',
      title_url: '',
      title_image: '',
      story_author: '',
      genre: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      setError('Authentication required. Please sign in again.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const payload: CreateTitleInput = {
        title_name_en: values.title_name_en.trim(),
        title_name_kr: values.title_name_kr.trim(),
        title_url: values.title_url.trim(),
        title_image: values.title_image.trim(),
        story_author: values.story_author.trim(),
        synopsis: values.synopsis?.trim() || null,
        tagline: values.tagline?.trim() || null,
        genre: values.genre ? [values.genre] : null,
        creator_id: user.id
      }

      const newTitle = await titlesService.createTitle(payload)

      // Navigate to the newly created title
      navigate(`/titles/${newTitle.title_id}`)
    } catch (err) {
      console.error('Failed to create title:', err)
      setError('Failed to create title. Please verify the form details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 sm:gap-0">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Add New Title</h1>
            <p className="text-gray-600">
              Provide accurate information so buyers can discover your work quickly.
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
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
                  {isSubmitting ? 'Saving...' : 'Save Title'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
