import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Film, Target, Brain, FileCheck, ArrowLeft } from 'lucide-react';
import {
  FeaturePageLayout,
  FeatureHero,
  HowItWorksSection,
  ValuePropsGrid,
  StatsSection,
  FinalCTASection
} from '../../components/features/shared';
import { CompsMiniDemo } from '../../components/features/comps/CompsMiniDemo';

/**
 * CompsNavigatorFeaturePage
 *
 * Promotional page for the Comps Navigator feature.
 * Route: /features/comps-navigator
 *
 * Sections:
 * 1. Hero with comp selection demo
 * 2. How It Works (3 steps)
 * 3. Value Props (3 cards)
 * 4. Stats section
 * 5. Final CTA
 */
const CompsNavigatorFeaturePage = () => {
  const { t } = useTranslation('features');

  return (
    <FeaturePageLayout>
      {/* Back Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/producers"
          className="inline-flex items-center gap-2 text-sm text-midnight-ink-600 hover:text-hanok-teal transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('shared.backToProducers')}
        </Link>
      </div>

      {/* Hero Section */}
      <FeatureHero
        headline={t('comps.hero.headline')}
        subhead={t('comps.hero.subhead')}
        primaryCtaText={t('comps.hero.primaryCta')}
        secondaryCtaText={t('comps.hero.secondaryCta')}
        storageKey="comps-feature-hero"
        accentColor="teal"
      >
        <CompsMiniDemo />
      </FeatureHero>

      {/* How It Works */}
      <HowItWorksSection
        title={t('comps.howItWorks.title')}
        steps={[
          {
            title: t('comps.howItWorks.step1.title'),
            description: t('comps.howItWorks.step1.description'),
            icon: <Film className="h-8 w-8" />
          },
          {
            title: t('comps.howItWorks.step2.title'),
            description: t('comps.howItWorks.step2.description'),
            icon: <Brain className="h-8 w-8" />
          },
          {
            title: t('comps.howItWorks.step3.title'),
            description: t('comps.howItWorks.step3.description'),
            icon: <Target className="h-8 w-8" />
          }
        ]}
        accentColor="teal"
      />

      {/* Value Props */}
      <ValuePropsGrid
        title={t('comps.values.title')}
        values={[
          {
            title: t('comps.values.precision.title'),
            description: t('comps.values.precision.description'),
            icon: <Target className="h-8 w-8" />
          },
          {
            title: t('comps.values.validation.title'),
            description: t('comps.values.validation.description'),
            icon: <FileCheck className="h-8 w-8" />
          },
          {
            title: t('comps.values.explanations.title'),
            description: t('comps.values.explanations.description'),
            icon: <Brain className="h-8 w-8" />
          }
        ]}
        accentColor="teal"
      />

      {/* Stats */}
      <StatsSection
        stats={[
          { value: t('comps.stats.titles'), label: t('comps.stats.titlesLabel') },
          { value: t('comps.stats.comps'), label: t('comps.stats.compsLabel') },
          { value: t('comps.stats.results'), label: t('comps.stats.resultsLabel') }
        ]}
        accentColor="teal"
      />

      {/* Final CTA */}
      <FinalCTASection accentColor="teal" />
    </FeaturePageLayout>
  );
};

export default CompsNavigatorFeaturePage;
