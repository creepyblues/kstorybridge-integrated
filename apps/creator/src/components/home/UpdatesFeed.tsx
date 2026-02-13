import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { ContentPost } from '@/services/contentService'

interface UpdatesFeedProps {
  posts: ContentPost[]
  loading: boolean
}

export function UpdatesFeed({ posts, loading }: UpdatesFeedProps) {
  const { t } = useTranslation(['common', 'navigation'])
  const navigate = useNavigate()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
      {/* Section Header - Option C style */}
      <h2 className="border-l-4 border-blue-500 pl-3 text-xl font-semibold text-black mb-5">
        {t('navigation:sidebar.updates')}
      </h2>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon icon="solar:spinner-bold" className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">{t('common:home.noNewsYet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.slice(0, 3).map((post, index) => (
            <div
              key={post.id}
              onClick={() => navigate(`/updates/${post.slug}`)}
              className={`flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== posts.slice(0, 3).length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Icon icon="solar:document-text-bold" className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-sunrise-coral transition-colors">
                  {post.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(post.published_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
