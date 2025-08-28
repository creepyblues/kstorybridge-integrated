/**
 * Professional HomePage Implementation
 * Demonstrates the new design system in action
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Star } from 'lucide-react';

// New Design System Imports
import { 
  LandingLayout,
  Container,
  Section,
  Grid,
  Stack,
  Card,
  Button,
  CTAButton,
  Display,
  Title,
  SectionHeading,
  CardTitle,
  BodyText,
  LeadText,
  Caption
} from '@/design-system';

// Existing Services
import FeaturedTitlesCarouselNew from '../components/FeaturedTitlesCarouselNew';
import { useLanguage } from '../contexts/LanguageContext';

const HomePageNew = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // No local authentication - redirect to dashboard
  const user = null;
  const userProfile = null;
  const isLoading = false;
  const isRedirecting = false;

  const handleTitleClick = (titleId: string) => {
    navigate(`/title/${titleId}`);
  };

  return (
    <LandingLayout 
      title="KStoryBridge - Where Korean Stories Meet Global Screens"
      description="KStoryBridge gives studios first-look access to Korea's next breakout hit, while creators keep control and capture more upside."
    >
      {/* Hero Section */}
      <Section spacing="xl" background="transparent">
        <Container>
          <Grid cols={2} gap="xl" className="items-center min-h-[80vh]">
            <Stack spacing="xl">
              <Stack spacing="lg">
                <Display 
                  color="primary"
                  className="leading-tight"
                >
                  Where Korean Stories Meet Global Screens
                </Display>
                
                <LeadText className="max-w-lg">
                  KStoryBridge gives studios first-look access to Korea's next breakout hit, 
                  while creators keep control and capture more upside.
                </LeadText>
              </Stack>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <CTAButton 
                  size="xl"
                  leftIcon={<Star className="h-5 w-5" />}
                  onClick={() => navigate('/creators')}
                  className="flex-1 sm:flex-none"
                >
                  I'M A CREATOR
                </CTAButton>
                <Button 
                  variant="primary"
                  size="xl"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  onClick={() => navigate('/buyers')}
                  className="flex-1 sm:flex-none"
                >
                  I'M A BUYER
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-8 pt-4 opacity-70">
                <div className="text-center">
                  <BodyText weight="bold" size="lg" color="primary">1000+</BodyText>
                  <Caption>Creators</Caption>
                </div>
                <div className="text-center">
                  <BodyText weight="bold" size="lg" color="primary">500+</BodyText>
                  <Caption>Titles</Caption>
                </div>
                <div className="text-center">
                  <BodyText weight="bold" size="lg" color="primary">50+</BodyText>
                  <Caption>Studios</Caption>
                </div>
              </div>
            </Stack>
            
            {/* Hero Visual */}
            <div className="relative">
              <div className="relative z-10">
                <Card variant="elevated" className="p-8 bg-gradient-to-br from-hanok-teal-50 to-sunrise-coral-50">
                  <Stack spacing="md" align="center">
                    <div className="w-24 h-24 bg-hanok-teal-500 rounded-2xl flex items-center justify-center">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <CardTitle align="center" color="primary">
                      Premium Korean Content
                    </CardTitle>
                    <BodyText align="center" color="secondary" className="max-w-sm">
                      Discover exclusive stories from Korea's most talented creators
                    </BodyText>
                  </Stack>
                </Card>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-sunrise-coral-200 rounded-full opacity-30"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-hanok-teal-200 rounded-full opacity-20"></div>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* Featured Titles Section */}
      <Section spacing="xl" background="muted">
        <Container>
          <Stack spacing="xl">
            <div className="text-center">
              <SectionHeading color="primary" className="mb-4">
                FEATURED TITLES
              </SectionHeading>
              <LeadText align="center" className="max-w-2xl mx-auto">
                Discover the next generation of Korean storytelling
              </LeadText>
            </div>
            
            <FeaturedTitlesCarouselNew 
              onTitleClick={handleTitleClick}
              className=""
            />
          </Stack>
        </Container>
      </Section>

      {/* Value Proposition Section */}
      <Section spacing="xl" background="white">
        <Container>
          <Grid cols={3} gap="xl">
            <Card variant="ghost" className="text-center p-8">
              <Stack spacing="md" align="center">
                <div className="w-16 h-16 bg-hanok-teal-100 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-hanok-teal-500" />
                </div>
                <CardTitle color="primary">For Creators</CardTitle>
                <BodyText color="secondary" align="center">
                  Keep creative control while reaching global audiences. 
                  Fair deals, transparent processes.
                </BodyText>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </Stack>
            </Card>

            <Card variant="ghost" className="text-center p-8">
              <Stack spacing="md" align="center">
                <div className="w-16 h-16 bg-sunrise-coral-100 rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-sunrise-coral-500" />
                </div>
                <CardTitle color="primary">For Buyers</CardTitle>
                <BodyText color="secondary" align="center">
                  First-look access to Korea's next breakout hits. 
                  Curated, premium content pipeline.
                </BodyText>
                <Button variant="outline" size="sm">
                  Explore Content
                </Button>
              </Stack>
            </Card>

            <Card variant="ghost" className="text-center p-8">
              <Stack spacing="md" align="center">
                <div className="w-16 h-16 bg-porcelain-blue-200 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-midnight-ink-600" />
                </div>
                <CardTitle color="primary">Global Reach</CardTitle>
                <BodyText color="secondary" align="center">
                  Bridge Korean creativity with international markets. 
                  Cultural storytelling meets global distribution.
                </BodyText>
                <Button variant="outline" size="sm">
                  Get Started
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section spacing="xl" background="accent">
        <Container>
          <div className="text-center">
            <Stack spacing="lg" align="center">
              <Title color="primary">
                Ready to Bridge Your Story?
              </Title>
              <LeadText align="center" className="max-w-2xl">
                Join thousands of creators and buyers connecting Korean stories with global audiences
              </LeadText>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTAButton 
                  size="xl"
                  onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup`}
                >
                  Get Started Today
                </CTAButton>
                <Button 
                  variant="outline"
                  size="xl"
                  onClick={() => navigate('/about')}
                >
                  Learn More
                </Button>
              </div>
            </Stack>
          </div>
        </Container>
      </Section>
    </LandingLayout>
  );
};

export default HomePageNew;