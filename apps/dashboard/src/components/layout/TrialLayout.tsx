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
              <h1 className="text-lg sm:text-xl font-bold">
                <span className="text-black">K</span>
                <span className="text-hanok-teal">Story</span>
                <span className="text-black">Bridge</span>
              </h1>
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
                <Button className="border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
                  SIGN UP
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
    </div>
  );
}
