import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { User, Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface MenuItem {
  title: string
  href: string
  badge?: string
  icon?: string
}

export function CMSSidebar() {
  const { t } = useTranslation(['navigation', 'common'])
  const { user } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Creator-only menu items (no /creators prefix)
  const discoverItems: MenuItem[] = [
    { title: t('navigation:sidebar.home'), href: '/home' },
    { title: t('navigation:sidebar.myTitles'), href: '/titles' },
    { title: t('navigation:sidebar.myRequests'), href: '/requests' },
    { title: t('navigation:sidebar.news'), href: '/news' },
    { title: t('navigation:sidebar.learningCenter'), href: '/learning-center' },
  ]

  const userEmail = user?.email

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Header with Logo and Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-100 shadow-sm border-b border-gray-300 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo on the left */}
          <Link
            to="/home"
            className="flex items-center"
          >
            <h2 className="text-xl font-bold text-gray-900">KStoryBridge</h2>
          </Link>

          {/* Menu button on the right */}
          <button
            onClick={handleMobileMenuToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed left-4 right-4 top-[60px] bg-white rounded-2xl shadow-sm border border-gray-300 z-50 overflow-hidden">
          <div className="py-2">
            {/* Discover items */}
            {discoverItems.map((item) => {
              const isActive = location.pathname === item.href

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 text-base font-normal transition-colors border-b border-gray-100',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full bg-red-500 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            {/* Language Switcher */}
            <div className="px-4 py-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <aside
        className="hidden md:block fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link
              to="/home"
              className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              KStoryBridge
            </Link>
            <p className="text-sm text-gray-500 mt-1">{t('navigation:pageHeaders.dashboard')}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {/* Discover section */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Discover
              </h3>
              <ul className="space-y-1">
                {discoverItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === item.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* User info and language switcher */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-600">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'Creator'}
                </p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </Link>
            <div className="px-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
