/**
 * Professional Footer Component
 * Clean, informative footer for all pages
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Container, Grid, Stack, Divider } from '../layout';
import { Text, Link as StyledLink, Heading } from '../typography';
import { Mail, Phone, MapPin, Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  variant = 'default',
  className 
}) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className={cn(
        'bg-midnight-ink-900 text-white py-6',
        className
      )}>
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-hanok-teal-500 rounded-md flex items-center justify-center">
                <Text color="inverse" weight="bold" size="sm">K</Text>
              </div>
              <Text color="inverse" weight="medium">KStoryBridge</Text>
            </div>
            <Text color="inverse" size="sm">
              © {currentYear} KStoryBridge. All rights reserved.
            </Text>
          </div>
        </Container>
      </footer>
    );
  }

  const footerLinks = {
    platform: [
      { name: 'For Creators', href: '/creators' },
      { name: 'For Buyers', href: '/buyers' },
      { name: 'Pricing', href: '/pricing' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'News', href: '/news' },
      { name: 'Contact', href: '/contact' },
    ],
    resources: [
      { name: 'Help Center', href: '/help' },
      { name: 'Content Guidelines', href: '/guidelines' },
      { name: 'API Documentation', href: '/docs' },
      { name: 'Status', href: '/status' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Data Protection', href: '/data-protection' },
    ],
  };

  const contactInfo = [
    { icon: Mail, text: 'hello@kstorybridge.com', href: 'mailto:hello@kstorybridge.com' },
    { icon: Phone, text: '+82-2-1234-5678', href: 'tel:+82-2-1234-5678' },
    { icon: MapPin, text: 'Seoul, South Korea', href: null },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/kstorybridge', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/kstorybridge', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com/kstorybridge', label: 'Instagram' },
  ];

  return (
    <footer className={cn(
      'bg-midnight-ink-900 text-white',
      className
    )}>
      <Container size="xl">
        <div className="py-12 lg:py-16">
          {/* Main Footer Content */}
          <Grid cols={6} gap="lg" responsive className="mb-12">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <Stack spacing="md">
                {/* Logo */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-hanok-teal-500 rounded-lg flex items-center justify-center">
                    <Text color="inverse" weight="bold" size="lg">K</Text>
                  </div>
                  <Heading level={3} size="xl" color="inverse" weight="bold">
                    KStoryBridge
                  </Heading>
                </div>

                <Text color="inverse" size="sm" className="max-w-sm">
                  Connecting Korean content creators with global media buyers. 
                  Bridge cultures, share stories, build the future of entertainment.
                </Text>

                {/* Contact Info */}
                <Stack spacing="sm">
                  {contactInfo.map((item, index) => {
                    const Icon = item.icon;
                    const content = (
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4 text-hanok-teal-400 flex-shrink-0" />
                        <Text color="inverse" size="sm">{item.text}</Text>
                      </div>
                    );

                    return item.href ? (
                      <StyledLink 
                        key={index}
                        href={item.href}
                        variant="subtle"
                        size="sm"
                        className="hover:text-hanok-teal-400"
                      >
                        {content}
                      </StyledLink>
                    ) : (
                      <div key={index}>{content}</div>
                    );
                  })}
                </Stack>

                {/* Social Links */}
                <div className="flex items-center space-x-4 pt-2">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-hanok-teal-400 hover:text-hanok-teal-300 hover:bg-hanok-teal-500/10 rounded-lg transition-colors"
                        aria-label={social.label}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              </Stack>
            </div>

            {/* Footer Links */}
            <div className="col-span-1 md:col-span-4">
              <Grid cols={4} gap="lg" responsive>
                <div>
                  <Heading level={4} size="sm" color="inverse" weight="semibold" className="mb-4">
                    Platform
                  </Heading>
                  <Stack spacing="sm">
                    {footerLinks.platform.map((link) => (
                      <StyledLink
                        key={link.name}
                        href={link.href}
                        variant="subtle"
                        size="sm"
                        className="hover:text-hanok-teal-400"
                      >
                        {link.name}
                      </StyledLink>
                    ))}
                  </Stack>
                </div>

                <div>
                  <Heading level={4} size="sm" color="inverse" weight="semibold" className="mb-4">
                    Company
                  </Heading>
                  <Stack spacing="sm">
                    {footerLinks.company.map((link) => (
                      <StyledLink
                        key={link.name}
                        href={link.href}
                        variant="subtle"
                        size="sm"
                        className="hover:text-hanok-teal-400"
                      >
                        {link.name}
                      </StyledLink>
                    ))}
                  </Stack>
                </div>

                <div>
                  <Heading level={4} size="sm" color="inverse" weight="semibold" className="mb-4">
                    Resources
                  </Heading>
                  <Stack spacing="sm">
                    {footerLinks.resources.map((link) => (
                      <StyledLink
                        key={link.name}
                        href={link.href}
                        variant="subtle"
                        size="sm"
                        className="hover:text-hanok-teal-400"
                      >
                        {link.name}
                      </StyledLink>
                    ))}
                  </Stack>
                </div>

                <div>
                  <Heading level={4} size="sm" color="inverse" weight="semibold" className="mb-4">
                    Legal
                  </Heading>
                  <Stack spacing="sm">
                    {footerLinks.legal.map((link) => (
                      <StyledLink
                        key={link.name}
                        href={link.href}
                        variant="subtle"
                        size="sm"
                        className="hover:text-hanok-teal-400"
                      >
                        {link.name}
                      </StyledLink>
                    ))}
                  </Stack>
                </div>
              </Grid>
            </div>
          </Grid>

          <Divider className="border-midnight-ink-700" />

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pt-8">
            <Text color="inverse" size="sm">
              © {currentYear} KStoryBridge. All rights reserved.
            </Text>
            
            <div className="flex items-center space-x-6">
              <Text color="inverse" size="sm">
                Made with ❤️ in Seoul
              </Text>
              <div className="flex items-center space-x-4">
                <StyledLink 
                  href="/sitemap" 
                  variant="subtle" 
                  size="sm"
                  className="hover:text-hanok-teal-400"
                >
                  Sitemap
                </StyledLink>
                <StyledLink 
                  href="/accessibility" 
                  variant="subtle" 
                  size="sm"
                  className="hover:text-hanok-teal-400"
                >
                  Accessibility
                </StyledLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};