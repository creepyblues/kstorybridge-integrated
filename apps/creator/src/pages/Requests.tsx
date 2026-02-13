import { useTranslation } from 'react-i18next'
import { MainLayout } from '@/components/layout/MainLayout'

export default function Requests() {
  const { t } = useTranslation(['navigation', 'common'])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-8">{t('navigation:pageHeaders.requests')}</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="border-l-4 border-blue-500 pl-3 text-xl font-semibold text-black">{t('navigation:sidebar.myRequests')}</h2>
            <p className="text-sm text-gray-500 mt-1 pl-7">
              View and manage inquiries from media buyers
            </p>
          </div>
          <p className="text-gray-600 text-center py-8">
            {t('common:emptyStates.noRequests')}
          </p>
          <p className="text-sm text-gray-500 text-center mt-4">
            {t('common:emptyStates.noRequestsDescription')}
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
