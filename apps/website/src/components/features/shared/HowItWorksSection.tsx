import { ReactNode } from 'react';
import { Card, CardContent } from '../../ui/card';
import { ScrollReveal } from './ScrollReveal';

interface Step {
  title: string;
  description: string;
  icon: ReactNode;
}

interface HowItWorksSectionProps {
  title: string;
  steps: [Step, Step, Step];
  accentColor?: 'teal' | 'purple';
}

/**
 * HowItWorksSection Component
 *
 * 3-step visual breakdown with:
 * - Numbered steps (1, 2, 3)
 * - Icon, title, and description for each
 * - Arrow connectors between steps
 * - Scroll-triggered animations
 */
export function HowItWorksSection({
  title,
  steps,
  accentColor = 'teal'
}: HowItWorksSectionProps) {
  const colorClasses = {
    teal: {
      badge: 'bg-hanok-teal text-white',
      iconBg: 'bg-hanok-teal/10',
      iconText: 'text-hanok-teal'
    },
    purple: {
      badge: 'bg-[#AF52DE] text-white',
      iconBg: 'bg-[#AF52DE]/10',
      iconText: 'text-[#AF52DE]'
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink text-center mb-12">
            {title}
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow relative">
                <CardContent className="p-6 sm:p-8 text-center">
                  {/* Step Number Badge */}
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 ${colors.badge} rounded-full flex items-center justify-center text-sm font-bold shadow-lg`}>
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2`}>
                    <div className={colors.iconText}>
                      {step.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-midnight-ink mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-midnight-ink-600 text-sm sm:text-base leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>

                {/* Arrow (only for first two cards on desktop) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 transform -translate-y-1/2 z-10">
                    <div className={`${colors.iconText} text-2xl`}>→</div>
                  </div>
                )}
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
