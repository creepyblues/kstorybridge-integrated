/**
 * Billing Page
 * Displays subscriptions, payment method, and transaction history
 * Redesigned with modern card-based layout and sunrise-coral accents
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { trackBillingView } from '@/utils/analytics'

interface Subscription {
  id: string
  creator_email: string
  title_id: string
  plan_type: string
  billing_period: string
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
  titles: {
    title_id: string
    title_name_kr: string
    title_name_en: string
    title_image: string | null
  }
}

interface Transaction {
  id: string
  date: string
  amount: number
  currency: string
  status: string
  invoiceUrl: string | null
  receiptUrl: string | null
  description: string
  paid: boolean
}

interface PaymentMethod {
  id: string
  type: string
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  } | null
}

interface BillingData {
  subscriptions: Subscription[]
  transactions: Transaction[]
  paymentMethod: PaymentMethod | null
}

export default function Billing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['billing', 'common'])
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackBillingView()
    if (user) {
      loadBillingData()
    }
  }, [user])

  const loadBillingData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-creator-billing-history`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load billing data')
      }

      const data = await response.json()
      setBillingData(data)
    } catch (err: any) {
      console.error('Error loading billing data:', err)
      setError(err.message || 'Failed to load billing data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCardBrandIcon = (brand: string) => {
    const brands: Record<string, string> = {
      visa: 'logos:visa',
      mastercard: 'logos:mastercard',
      amex: 'logos:amex',
      discover: 'logos:discover',
    }
    return brands[brand.toLowerCase()] || 'solar:card-bold'
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      active: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: 'solar:check-circle-bold',
      },
      canceled: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: 'solar:close-circle-bold',
      },
      past_due: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        icon: 'solar:danger-triangle-bold',
      },
      unpaid: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: 'solar:close-circle-bold',
      },
      trialing: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: 'solar:clock-circle-bold',
      },
    }
    return (
      configs[status] || {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        icon: 'solar:question-circle-bold',
      }
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24">
            <Icon
              icon="solar:spinner-bold"
              className="h-10 w-10 animate-spin text-sunrise-coral mb-4"
            />
            <p className="text-gray-500">{t('billing:loading.message')}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                className="h-8 w-8 text-red-500"
              />
            </div>
            <h2 className="text-xl font-semibold text-black mb-2">
              {t('billing:error.title')}
            </h2>
            <p className="text-gray-500 mb-6 text-center max-w-md">{error}</p>
            <Button
              onClick={loadBillingData}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:refresh-bold" className="h-4 w-4 mr-2" />
              {t('billing:error.retryButton')}
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const hasSubscriptions =
    billingData?.subscriptions && billingData.subscriptions.length > 0
  const hasTransactions =
    billingData?.transactions && billingData.transactions.length > 0

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              {t('billing:pageHeader.title')}
            </h1>
            <p className="text-gray-500">{t('billing:pageHeader.subtitle')}</p>
          </div>
          <Button
            onClick={() => navigate('/plan')}
            className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90 shadow-none"
          >
            <Icon icon="solar:add-circle-bold" className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-sunrise-coral/5 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-sunrise-coral/10">
                <Icon
                  icon="solar:document-bold"
                  className="h-5 w-5 text-sunrise-coral"
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Active Subscriptions
              </span>
            </div>
            <p className="text-3xl font-bold text-black">
              {billingData?.subscriptions?.filter((s) => s.status === 'active')
                .length || 0}
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Icon
                  icon="solar:check-circle-bold"
                  className="h-5 w-5 text-emerald-600"
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Successful Payments
              </span>
            </div>
            <p className="text-3xl font-bold text-black">
              {billingData?.transactions?.filter((t) => t.paid).length || 0}
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Icon
                  icon="solar:card-bold"
                  className="h-5 w-5 text-blue-600"
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Payment Method
              </span>
            </div>
            <p className="text-3xl font-bold text-black">
              {billingData?.paymentMethod ? '1' : '0'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Subscriptions */}
            <section>
              <h2 className="border-l-4 border-sunrise-coral pl-3 text-xl font-semibold text-black mb-5">
                {t('billing:subscriptions.title')}
              </h2>

              {!hasSubscriptions ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Icon
                      icon="solar:document-add-bold-duotone"
                      className="h-7 w-7 text-gray-400"
                    />
                  </div>
                  <p className="text-gray-600 mb-4">
                    {t('billing:subscriptions.emptyState')}
                  </p>
                  <Button
                    onClick={() => navigate('/plan')}
                    className="bg-sunrise-coral text-white hover:bg-sunrise-coral/90"
                  >
                    {t('billing:subscriptions.viewPlansButton')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingData.subscriptions.map((subscription) => {
                    const statusConfig = getStatusConfig(subscription.status)
                    return (
                      <div
                        key={subscription.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-sunrise-coral/30 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Title Image */}
                          <div className="flex-shrink-0">
                            {subscription.titles.title_image ? (
                              <img
                                src={subscription.titles.title_image}
                                alt={
                                  subscription.titles.title_name_kr ||
                                  subscription.titles.title_name_en
                                }
                                className="w-16 h-16 object-cover rounded-xl"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sunrise-coral/20 to-orange-200 flex items-center justify-center">
                                <Icon
                                  icon="solar:book-bold"
                                  className="h-7 w-7 text-sunrise-coral/70"
                                />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-black truncate">
                                  {subscription.titles.title_name_kr ||
                                    subscription.titles.title_name_en}
                                </h3>
                                {subscription.titles.title_name_en &&
                                  subscription.titles.title_name_kr && (
                                    <p className="text-sm text-gray-500 truncate">
                                      {subscription.titles.title_name_en}
                                    </p>
                                  )}
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                              >
                                <Icon
                                  icon={statusConfig.icon}
                                  className="h-3 w-3"
                                />
                                {subscription.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
                              <span className="inline-flex items-center gap-1.5 text-gray-600">
                                <Icon
                                  icon="solar:tag-bold"
                                  className="h-3.5 w-3.5 text-sunrise-coral"
                                />
                                <span className="capitalize font-medium">
                                  {subscription.plan_type}
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-gray-600">
                                <Icon
                                  icon="solar:calendar-bold"
                                  className="h-3.5 w-3.5 text-sunrise-coral"
                                />
                                <span className="capitalize">
                                  {subscription.billing_period}
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-gray-600">
                                <Icon
                                  icon="solar:clock-circle-bold"
                                  className="h-3.5 w-3.5 text-sunrise-coral"
                                />
                                Renews {formatDate(subscription.current_period_end)}
                              </span>
                            </div>

                            {subscription.cancel_at_period_end && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                <Icon
                                  icon="solar:danger-triangle-bold"
                                  className="h-4 w-4"
                                />
                                <span>{t('billing:subscriptions.cancelNotice')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Transaction History */}
            <section>
              <h2 className="border-l-4 border-blue-500 pl-3 text-xl font-semibold text-black mb-5">
                {t('billing:transactions.title')}
              </h2>

              {!hasTransactions ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Icon
                      icon="solar:receipt-bold-duotone"
                      className="h-7 w-7 text-gray-400"
                    />
                  </div>
                  <p className="text-gray-600">
                    {t('billing:transactions.emptyState')}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('billing:transactions.tableHeaders.date')}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('billing:transactions.tableHeaders.description')}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('billing:transactions.tableHeaders.amount')}
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('billing:transactions.tableHeaders.status')}
                          </th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('billing:transactions.tableHeaders.invoice')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {billingData.transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                              {transaction.description}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-black">
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  transaction.paid
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                <Icon
                                  icon={
                                    transaction.paid
                                      ? 'solar:check-circle-bold'
                                      : 'solar:close-circle-bold'
                                  }
                                  className="h-3 w-3"
                                />
                                {transaction.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {transaction.invoiceUrl && (
                                <a
                                  href={transaction.invoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm text-sunrise-coral hover:text-sunrise-coral/80 font-medium"
                                >
                                  <Icon
                                    icon="solar:file-download-bold"
                                    className="h-4 w-4"
                                  />
                                  View
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Payment Method Card */}
            <section>
              <h2 className="border-l-4 border-gray-500 pl-3 text-xl font-semibold text-black mb-5">
                {t('billing:paymentMethod.title')}
              </h2>

              {billingData?.paymentMethod?.card ? (
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-5 text-white">
                  <div className="flex items-start justify-between mb-8">
                    <Icon
                      icon={getCardBrandIcon(billingData.paymentMethod.card.brand)}
                      className="h-10 w-10"
                    />
                    <Icon icon="solar:wifi-bold" className="h-6 w-6 opacity-50" />
                  </div>
                  <div className="mb-4">
                    <p className="text-lg font-mono tracking-widest">
                      •••• •••• •••• {billingData.paymentMethod.card.last4}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-400 text-xs uppercase mb-0.5">
                        Card Holder
                      </p>
                      <p className="font-medium">{user?.email?.split('@')[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs uppercase mb-0.5">
                        Expires
                      </p>
                      <p className="font-medium">
                        {String(billingData.paymentMethod.card.expMonth).padStart(
                          2,
                          '0'
                        )}
                        /{String(billingData.paymentMethod.card.expYear).slice(-2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Icon
                      icon="solar:card-bold-duotone"
                      className="h-6 w-6 text-gray-400"
                    />
                  </div>
                  <p className="text-sm text-gray-500">No payment method on file</p>
                </div>
              )}
            </section>

            {/* Quick Links */}
            <section>
              <h2 className="border-l-4 border-emerald-500 pl-3 text-xl font-semibold text-black mb-5">
                Quick Links
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/plan')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-sunrise-coral/30 hover:bg-sunrise-coral/5 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-sunrise-coral/10">
                    <Icon
                      icon="solar:crown-bold"
                      className="h-4 w-4 text-sunrise-coral"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">View Plans</p>
                    <p className="text-xs text-gray-500">
                      Upgrade or add subscriptions
                    </p>
                  </div>
                  <Icon
                    icon="solar:arrow-right-linear"
                    className="h-4 w-4 text-gray-400 ml-auto"
                  />
                </button>

                <button
                  onClick={() => navigate('/titles')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-sunrise-coral/30 hover:bg-sunrise-coral/5 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Icon icon="solar:book-bold" className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">My Titles</p>
                    <p className="text-xs text-gray-500">Manage your content</p>
                  </div>
                  <Icon
                    icon="solar:arrow-right-linear"
                    className="h-4 w-4 text-gray-400 ml-auto"
                  />
                </button>

                <a
                  href="mailto:support@kstorybridge.com"
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-sunrise-coral/30 hover:bg-sunrise-coral/5 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Icon
                      icon="solar:chat-round-bold"
                      className="h-4 w-4 text-emerald-600"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Get Help</p>
                    <p className="text-xs text-gray-500">Contact support team</p>
                  </div>
                  <Icon
                    icon="solar:arrow-right-linear"
                    className="h-4 w-4 text-gray-400 ml-auto"
                  />
                </a>
              </div>
            </section>

            {/* Need Help Card */}
            <div className="rounded-2xl bg-gradient-to-br from-sunrise-coral to-orange-500 p-5 text-white">
              <Icon
                icon="solar:question-circle-bold-duotone"
                className="h-8 w-8 mb-3 opacity-90"
              />
              <h3 className="font-semibold mb-1">Need billing help?</h3>
              <p className="text-sm text-orange-100 mb-4">
                Our support team is here to help with any billing questions.
              </p>
              <a
                href="mailto:billing@kstorybridge.com"
                className="inline-flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors"
              >
                <Icon icon="solar:letter-bold" className="h-4 w-4" />
                Contact Billing
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
