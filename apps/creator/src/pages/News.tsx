import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function News() {
  const { t } = useTranslation(['navigation', 'common'])

  return (
    <MainLayout>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-black mb-8">{t('navigation:sidebar.news')}</h1>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>{t('navigation:pageHeaders.news')}</CardTitle>
            <CardDescription>
              Stay updated with Korean content industry news
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              {t('common:emptyStates.newsComingSoon')}
            </p>
            <p className="text-sm text-gray-500 text-center mt-4">
              {t('common:emptyStates.newsDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
