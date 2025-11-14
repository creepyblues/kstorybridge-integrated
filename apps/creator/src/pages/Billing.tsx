import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, FileText, AlertCircle } from 'lucide-react'

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
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadBillingData()
    }
  }, [user])

  const loadBillingData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call get-creator-billing-history edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-creator-billing-history`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      canceled: 'bg-red-100 text-red-700',
      past_due: 'bg-amber-100 text-amber-700',
      unpaid: 'bg-red-100 text-red-700',
      trialing: 'bg-blue-100 text-blue-700',
    }

    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading billing information...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">Failed to Load Billing Data</h2>
            <p className="text-red-500 mb-6">{error}</p>
            <Button
              onClick={loadBillingData}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              Retry
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Billing & Subscriptions</h1>
          <p className="text-gray-600 mt-2">Manage your subscriptions and view payment history</p>
        </div>

        {/* Active Subscriptions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Active Subscriptions</h2>

          {(!billingData?.subscriptions || billingData.subscriptions.length === 0) ? (
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">You don't have any active subscriptions yet.</p>
                <Button
                  onClick={() => window.location.href = '/plan'}
                  className="bg-sunrise-coral-500 text-white hover:bg-sunrise-coral-600"
                >
                  View Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {billingData.subscriptions.map((subscription) => (
                <Card key={subscription.id} className="bg-transparent border-gray-300 shadow-none rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {subscription.titles.title_image && (
                          <img
                            src={subscription.titles.title_image}
                            alt={subscription.titles.title_name_kr || subscription.titles.title_name_en}
                            className="w-20 h-20 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black mb-1">
                            {subscription.titles.title_name_kr || subscription.titles.title_name_en}
                          </h3>
                          {subscription.titles.title_name_en && subscription.titles.title_name_kr && (
                            <p className="text-sm text-gray-600 mb-2">{subscription.titles.title_name_en}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-gray-700 font-medium capitalize">{subscription.plan_type} Plan</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-700 capitalize">{subscription.billing_period}</span>
                            <span className="text-gray-500">•</span>
                            {getStatusBadge(subscription.status)}
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            <p>Next billing: {formatDate(subscription.current_period_end)}</p>
                            {subscription.cancel_at_period_end && (
                              <p className="text-amber-600 font-medium mt-1">
                                Subscription will cancel at period end
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Payment Method */}
        {billingData?.paymentMethod && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">Payment Method</h2>
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  </div>
                  {billingData.paymentMethod.card && (
                    <div>
                      <p className="font-semibold text-black capitalize">
                        {billingData.paymentMethod.card.brand} •••• {billingData.paymentMethod.card.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {billingData.paymentMethod.card.expMonth}/{billingData.paymentMethod.card.expYear}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Transaction History */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Transaction History</h2>

          {(!billingData?.transactions || billingData.transactions.length === 0) ? (
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Description</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingData.transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100 last:border-0">
                          <td className="p-4 text-sm text-gray-700">{formatDate(transaction.date)}</td>
                          <td className="p-4 text-sm text-gray-700">{transaction.description}</td>
                          <td className="p-4 text-sm font-semibold text-black">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              transaction.paid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transaction.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            {transaction.invoiceUrl && (
                              <a
                                href={transaction.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sunrise-coral-500 hover:text-sunrise-coral-600 text-sm flex items-center gap-1"
                              >
                                <FileText className="w-4 h-4" />
                                View
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </MainLayout>
  )
}
