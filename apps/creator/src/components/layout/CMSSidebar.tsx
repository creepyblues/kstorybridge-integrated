import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Icon } from '@iconify/react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface MenuItem {
  title: string
  href: string
  badge?: string
  icon: string
}

export function CMSSidebar() {
  const { t } = useTranslation(['navigation', 'common'])
  const { user } = useAuth()
  const { isAdmin } = useAdminAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Creator-only menu items (no /creators prefix)
  const baseMenuItems: MenuItem[] = [
    { title: t('navigation:sidebar.home'), href: '/home', icon: 'solar:home-2-bold-duotone' },
    { title: t('navigation:sidebar.myTitles'), href: '/titles', icon: 'solar:book-bold-duotone' },
    { title: t('navigation:sidebar.plan'), href: '/plan', icon: 'solar:card-bold-duotone' },
    { title: 'Billing', href: '/billing', icon: 'solar:wallet-bold-duotone' },
    { title: t('navigation:sidebar.learningCenter'), href: '/learning-center', icon: 'solar:square-academic-cap-bold-duotone' },
  ]

  // Add admin-only menu items
  const menuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(isAdmin ? [{ title: 'Tools', href: '/tools', icon: 'solar:hammer-bold-duotone' }] : [])
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
      {/* Mobile menu button */}
      <button
        onClick={handleMobileMenuToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm shadow-md"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <Icon icon="solar:close-circle-bold-duotone" className="h-5 w-5 text-gray-700" />
        ) : (
          <Icon icon="solar:hamburger-menu-bold-duotone" className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/home" className="block">
              <h1 className="text-2xl font-bold">
                <span className="text-black">K</span>
                <span className="text-sunrise-coral">Story</span>
                <span className="text-black">Bridge</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1">Dashboard for Creators</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {/* Language Switcher */}
            <div className="mb-6 px-3 flex justify-end">
              <LanguageSwitcher size="xs" />
            </div>

            {/* Menu Items */}
            <div className="mb-8">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.href

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sunrise-coral/10 text-sunrise-coral shadow-sm border border-sunrise-coral/20'
                            : 'text-gray-700 hover:bg-sunrise-coral/5'
                        )}
                      >
                        <Icon
                          icon={item.icon}
                          className={cn("h-5 w-5", isActive ? "" : "text-gray-400")}
                        />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* User info - clickable profile link */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/profile"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-sunrise-coral/5 transition-colors"
            >
              <Icon icon="solar:user-bold-duotone" className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'Creator'}
                </p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
