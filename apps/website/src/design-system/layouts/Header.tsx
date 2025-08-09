/**
 * Professional Header Component
 * Clean, consistent navigation for all pages
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '../buttons';
import { Container, Flex } from '../layout';
import { Text } from '../typography';
import { Menu, X, ChevronDown } from 'lucide-react';

interface HeaderProps {
  variant?: 'default' | 'transparent' | 'minimal';
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  variant = 'default',
  className 
}) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const variantClasses = {
    default: 'bg-white border-b border-porcelain-blue-200 shadow-sm',
    transparent: 'bg-transparent',
    minimal: 'bg-white border-b border-porcelain-blue-100',
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'For Creators', href: '/creators' },
    { name: 'For Buyers', href: '/buyers' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-colors duration-200',
      variantClasses[variant],
      className
    )}>
      <Container size="xl">
        <Flex justify="between" align="center" className="h-16 lg:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-hanok-teal-500 hover:text-hanok-teal-600 transition-colors"
          >
            <div className="w-8 h-8 bg-hanok-teal-500 rounded-lg flex items-center justify-center">
              <Text color="inverse" weight="bold" className="text-lg">K</Text>
            </div>
            <Text weight="bold" size="lg" color="primary">KStoryBridge</Text>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isActive(item.href)
                    ? 'text-hanok-teal-500'
                    : 'text-midnight-ink-600 hover:text-midnight-ink-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </Flex>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-porcelain-blue-200 py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'text-base font-medium transition-colors duration-200',
                    isActive(item.href)
                      ? 'text-hanok-teal-500'
                      : 'text-midnight-ink-600 hover:text-midnight-ink-900'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-porcelain-blue-200 flex flex-col space-y-3">
                <Button variant="ghost" fullWidth asChild>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button fullWidth asChild>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};