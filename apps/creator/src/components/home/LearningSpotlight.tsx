import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { ContentPost } from '@/services/contentService'

interface LearningSpotlightProps {
  posts: ContentPost[]
  loading: boolean
}

export function LearningSpotlight({ posts, loading }: LearningSpotlightProps) {
  const { t } = useTranslation(['common', 'navigation'])
  const navigate = useNavigate()

  const featuredPost = posts[0]

  return (
    <div className="bg-purple-50/30 border border-gray-200 rounded-2xl p-5 sm:p-6">
      {/* Section Header - Option C style */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="border-l-4 border-purple-500 pl-3 text-xl font-semibold text-black">
          {t('navigation:pageHeaders.learningCenter')}
        </h2>
        {posts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learning-center')}
            className="text-sunrise-coral hover:text-sunrise-coral hover:bg-sunrise-coral/5"
          >
            {t('common:viewAll')}
            <Icon icon="solar:arrow-right-linear" className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon icon="solar:spinner-bold" className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : !featuredPost ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mb-3">
            <Icon icon="solar:book-2-bold-duotone" className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">{t('common:home.noLearningYet')}</p>
        </div>
      ) : (
        <div
          onClick={() => navigate(`/learning-center/${featuredPost.slug}`)}
          className="cursor-pointer group"
        >
          {/* Featured Post Card */}
          <div className="flex gap-4">
            {/* Image */}
            {featuredPost.featured_image_url && (
              <div className="flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden bg-white/60">
                <img
                  src={featuredPost.featured_image_url}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  <Icon icon="solar:play-circle-bold" className="h-3 w-3 mr-1" />
                  {t('common:home.featured')}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-sunrise-coral transition-colors line-clamp-2">
                {featuredPost.title}
              </h3>
              {featuredPost.excerpt && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
              )}
            </div>
          </div>

          {/* Additional Posts Grid */}
          {posts.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="grid grid-cols-2 gap-3">
                {posts.slice(1, 3).map((post) => (
                  <div
                    key={post.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/learning-center/${post.slug}`)
                    }}
                    className="p-3 rounded-xl bg-white/50 hover:bg-purple-100/40 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-purple-700 transition-colors">
                      {post.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
