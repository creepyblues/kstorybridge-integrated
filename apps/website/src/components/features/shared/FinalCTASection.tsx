import { Button } from '@kstorybridge/ui';
import { useTranslation } from 'react-i18next';
import { getDashboardUrl } from '../../../config/urls';
import { trackButtonClick } from '../../../utils/analytics';
import { ScrollReveal } from './ScrollReveal';

interface FinalCTASectionProps {
  accentColor?: 'teal' | 'purple';
}

/**
 * FinalCTASection Component
 *
 * Bottom CTA section for feature pages with:
 * - Compelling headline
 * - Primary and secondary CTAs
 * - Trust signals
 */
export function FinalCTASection({ accentColor = 'teal' }: FinalCTASectionProps) {
  const { t } = useTranslation('features');

  const colorClasses = {
    teal: {
      gradient: 'from-hanok-teal/10 to-porcelain-blue-600/10',
      primaryBtn: 'bg-hanok-teal hover:bg-hanok-teal-600 text-white hover:text-white',
      secondaryBtn: 'bg-sunrise-coral hover:bg-sunrise-coral-600 text-white hover:text-white border-sunrise-coral'
    },
    purple: {
      gradient: 'from-[#AF52DE]/10 to-porcelain-blue-600/10',
      primaryBtn: 'bg-[#AF52DE] hover:bg-[#9B47C4] text-white hover:text-white',
      secondaryBtn: 'bg-sunrise-coral hover:bg-sunrise-coral-600 text-white hover:text-white border-sunrise-coral'
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className={`text-center bg-gradient-to-br ${colors.gradient} rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto`}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink mb-4">
              {t('shared.cta.title')}
            </h2>
            <p className="text-lg text-midnight-ink-600 mb-8 max-w-2xl mx-auto">
              {t('shared.cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className={`${colors.primaryBtn} text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300`}
                onClick={() => {
                  trackButtonClick('feature-final-trial', 'final_cta_section');
                  window.location.href = `${getDashboardUrl()}/trial`;
                }}
              >
                {t('shared.cta.primaryCta')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`${colors.secondaryBtn} px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium transition-all duration-300`}
                onClick={() => {
                  trackButtonClick('feature-final-signup', 'final_cta_section');
                  window.location.href = `${getDashboardUrl()}/signup`;
                }}
              >
                {t('shared.cta.secondaryCta')}
              </Button>
            </div>

            <p className="mt-6 text-sm text-midnight-ink-600">
              {t('shared.cta.trust')}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default FinalCTASection;
