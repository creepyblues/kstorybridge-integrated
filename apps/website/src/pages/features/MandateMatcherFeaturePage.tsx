import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, Brain, Target, Sparkles, ArrowLeft } from 'lucide-react';
import {
  FeaturePageLayout,
  FeatureHero,
  HowItWorksSection,
  ValuePropsGrid,
  StatsSection,
  FinalCTASection
} from '../../components/features/shared';
import { MandateMiniDemo } from '../../components/features/mandates/MandateMiniDemo';

/**
 * MandateMatcherFeaturePage
 *
 * Promotional page for the Mandate Matcher feature.
 * Route: /features/mandate-matcher
 *
 * Sections:
 * 1. Hero with mandate search demo
 * 2. How It Works (3 steps)
 * 3. Value Props (3 cards)
 * 4. Stats section
 * 5. Final CTA
 *
 * Uses purple (#AF52DE) as accent color.
 */
const MandateMatcherFeaturePage = () => {
  const { t } = useTranslation('features');

  return (
    <FeaturePageLayout>
      {/* Back Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/producers"
          className="inline-flex items-center gap-2 text-sm text-midnight-ink-600 hover:text-[#AF52DE] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('shared.backToProducers')}
        </Link>
      </div>

      {/* Hero Section */}
      <FeatureHero
        headline={t('mandates.hero.headline')}
        subhead={t('mandates.hero.subhead')}
        primaryCtaText={t('mandates.hero.primaryCta')}
        secondaryCtaText={t('mandates.hero.secondaryCta')}
        storageKey="mandates-feature-hero"
        accentColor="purple"
      >
        <MandateMiniDemo />
      </FeatureHero>

      {/* How It Works */}
      <HowItWorksSection
        title={t('mandates.howItWorks.title')}
        steps={[
          {
            title: t('mandates.howItWorks.step1.title'),
            description: t('mandates.howItWorks.step1.description'),
            icon: <FileText className="h-8 w-8" />
          },
          {
            title: t('mandates.howItWorks.step2.title'),
            description: t('mandates.howItWorks.step2.description'),
            icon: <Brain className="h-8 w-8" />
          },
          {
            title: t('mandates.howItWorks.step3.title'),
            description: t('mandates.howItWorks.step3.description'),
            icon: <Sparkles className="h-8 w-8" />
          }
        ]}
        accentColor="purple"
      />

      {/* Value Props */}
      <ValuePropsGrid
        title={t('mandates.values.title')}
        values={[
          {
            title: t('mandates.values.natural.title'),
            description: t('mandates.values.natural.description'),
            icon: <FileText className="h-8 w-8" />
          },
          {
            title: t('mandates.values.semantic.title'),
            description: t('mandates.values.semantic.description'),
            icon: <Brain className="h-8 w-8" />
          },
          {
            title: t('mandates.values.production.title'),
            description: t('mandates.values.production.description'),
            icon: <Target className="h-8 w-8" />
          }
        ]}
        accentColor="purple"
      />

      {/* Stats */}
      <StatsSection
        stats={[
          { value: t('mandates.stats.titles'), label: t('mandates.stats.titlesLabel') },
          { value: t('mandates.stats.results'), label: t('mandates.stats.resultsLabel') },
          { value: t('mandates.stats.cost'), label: t('mandates.stats.costLabel') }
        ]}
        accentColor="purple"
      />

      {/* Final CTA */}
      <FinalCTASection accentColor="purple" />
    </FeaturePageLayout>
  );
};

export default MandateMatcherFeaturePage;
