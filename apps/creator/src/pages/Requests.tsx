import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Requests() {
  const { t } = useTranslation(['navigation', 'common'])

  return (
    <MainLayout>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-black mb-8">{t('navigation:pageHeaders.requests')}</h1>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>{t('navigation:sidebar.myRequests')}</CardTitle>
            <CardDescription>
              View and manage inquiries from media buyers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              {t('common:emptyStates.noRequests')}
            </p>
            <p className="text-sm text-gray-500 text-center mt-4">
              {t('common:emptyStates.noRequestsDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
