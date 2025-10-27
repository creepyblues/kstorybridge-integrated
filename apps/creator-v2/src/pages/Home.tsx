import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/signin')
    } catch (error) {
      console.error('Signout error:', error)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>
              You're successfully signed in to your creator account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-black font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="text-black font-mono text-xs">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="text-black font-medium">
                {user?.user_metadata?.account_type || 'Not set'}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-300">
              <p className="text-sm text-gray-600 mb-2">
                Creator V2 dashboard with sidebar navigation.
              </p>
              <p className="text-sm text-gray-600">
                Phase 4: Adding full creator features (titles, profile, requests, news)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
