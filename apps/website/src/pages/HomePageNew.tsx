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
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const HomePageNew = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user, userProfile, isLoading, isRedirecting } = useAuth();

  useEffect(() => {
    const loadFeaturedTitles = async () => {
      try {
        setLoading(true);
        const titles = await featuredService.getFeaturedTitles();
        setFeaturedTitles(titles);
      } catch (error) {
        console.error('Error loading featured titles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTitles();
  }, []);

  const formatGenre = (genre: string | string[] | null) => {
    if (!genre) return '';
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
            
            {loading ? (
              <div className="text-center py-12">
                <BodyText color="secondary">Loading featured titles...</BodyText>
              </div>
            ) : featuredTitles.length > 0 ? (
              <Grid cols={6} gap="lg" responsive>
                {featuredTitles.map((featured) => {
                  const title = featured.titles;
                  return (
                    <Card 
                      key={featured.id} 
                      variant="elevated"
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Title Image */}
                      <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                        {title.title_image ? (
                          <img 
                            src={title.title_image} 
                            alt={title.title_name_en || title.title_name_kr}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-hanok-teal-500 rounded-xl flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-lg opacity-80"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <Stack spacing="sm">
                          <CardTitle className="line-clamp-2">
                            {title.title_name_en || title.title_name_kr}
                          </CardTitle>
                          
                          {title.title_name_en && title.title_name_kr && (
                            <Caption className="line-clamp-1">
                              {title.title_name_kr}
                            </Caption>
                          )}
                          
                          <BodyText size="sm" color="secondary" className="line-clamp-2">
                            {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                          </BodyText>
                          
                          {title.genre && (
                            <div className="inline-flex">
                              <span className="bg-hanok-teal-100 text-hanok-teal-700 px-2 py-1 rounded-full text-xs font-medium">
                                {formatGenre(title.genre)}
                              </span>
                            </div>
                          )}
                        </Stack>
                      </div>
                    </Card>
                  );
                })}
              </Grid>
            ) : (
              <div className="text-center py-12">
                <BodyText color="secondary">No featured titles available.</BodyText>
              </div>
            )}
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
                  onClick={() => navigate('/signup')}
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