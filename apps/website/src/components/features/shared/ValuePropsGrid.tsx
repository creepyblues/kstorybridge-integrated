import { ReactNode } from 'react';
import { Card, CardContent } from '../../ui/card';
import { ScrollReveal } from './ScrollReveal';

interface ValueProp {
  title: string;
  description: string;
  icon: ReactNode;
}

interface ValuePropsGridProps {
  title: string;
  values: [ValueProp, ValueProp, ValueProp];
  accentColor?: 'teal' | 'purple';
}

/**
 * ValuePropsGrid Component
 *
 * 3-column grid showcasing value propositions with:
 * - Icon, title, and description
 * - Hover effects on cards
 * - Scroll-triggered staggered animations
 */
export function ValuePropsGrid({
  title,
  values,
  accentColor = 'teal'
}: ValuePropsGridProps) {
  const colorClasses = {
    teal: {
      iconBg: 'bg-hanok-teal/10',
      iconText: 'text-hanok-teal'
    },
    purple: {
      iconBg: 'bg-[#AF52DE]/10',
      iconText: 'text-[#AF52DE]'
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-porcelain-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink text-center mb-12">
            {title}
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {values.map((value, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 sm:p-8 text-center">
                  {/* Icon */}
                  <div className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <div className={colors.iconText}>
                      {value.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-midnight-ink mb-4">
                    {value.title}
                  </h3>

                  {/* Description */}
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValuePropsGrid;
