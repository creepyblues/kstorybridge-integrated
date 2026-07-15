import { useTranslation } from 'react-i18next';
import { FileText, Brain, Target, Sparkles } from 'lucide-react';
import {
  FeaturePageLayout,
  FeatureHero,
  HowItWorksSection,
  ValuePropsGrid,
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
 * Uses teal (hanok-teal) as accent color to match other feature pages.
 */
const MandateMatcherFeaturePage = () => {
  const { t } = useTranslation('features');

  return (
    <FeaturePageLayout>
      {/* Hero Section */}
      <FeatureHero
        headline={t('mandates.hero.headline')}
        subhead={t('mandates.hero.subhead')}
        primaryCtaText={t('mandates.hero.primaryCta')}
        secondaryCtaText={t('mandates.hero.secondaryCta')}
        storageKey="mandates-feature-hero"
        accentColor="teal"
        featureName="mandate_matcher"
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
        accentColor="teal"
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
        accentColor="teal"
      />

      {/* Final CTA */}
      <FinalCTASection accentColor="teal" featureName="mandate_matcher" />
    </FeaturePageLayout>
  );
};

export default MandateMatcherFeaturePage;
