import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="bg-white border-gray-200 shadow-none rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <Icon icon="solar:bell-bold-duotone" className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg">{t('navigation:sidebar.updates')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
      </CardContent>
    </Card>
  )
}
