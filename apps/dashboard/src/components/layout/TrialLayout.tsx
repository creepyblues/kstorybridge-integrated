import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrialCounterBadge } from '@/components/trial/TrialCounterBadge';

interface TrialLayoutProps {
  children: React.ReactNode;
}

export function TrialLayout({ children }: TrialLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="https://kstorybridge.com" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-hanok-teal">KStoryBridge</h1>
              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-hanok-teal/10 text-hanok-teal">
                Trial
              </span>
            </Link>

            {/* Center - Search Counter */}
            <div className="flex-1 flex justify-center px-2">
              <TrialCounterBadge />
            </div>

            {/* Right side - Sign Up only */}
            <div className="flex-shrink-0">
              <Link to="/signup">
                <Button size="sm" className="bg-hanok-teal hover:bg-hanok-teal/90 text-white text-xs sm:text-sm px-3 sm:px-4">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer CTA */}
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
            Ready to unlock unlimited searches and save your discoveries?
          </p>
          <Link to="/signup">
            <Button className="bg-hanok-teal hover:bg-hanok-teal/90 text-white px-6 sm:px-8 text-sm sm:text-base">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
