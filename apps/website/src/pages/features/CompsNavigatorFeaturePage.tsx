import { useTranslation } from 'react-i18next';
import { Film, Target, Brain, FileCheck } from 'lucide-react';
import {
  FeaturePageLayout,
  FeatureHero,
  HowItWorksSection,
  ValuePropsGrid,
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

      {/* Final CTA */}
      <FinalCTASection accentColor="teal" />
    </FeaturePageLayout>
  );
};

export default CompsNavigatorFeaturePage;
