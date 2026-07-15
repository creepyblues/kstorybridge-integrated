import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bot, Film, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { ScrollReveal } from '../features/shared/ScrollReveal';
import { trackFeaturePromoSelected, type WebsiteFeature } from '../../utils/analytics';

/**
 * DiscoveryToolsSection Component
 *
 * Displays 3 feature cards linking to individual feature promo pages:
 * - AI Chatbot (Jinu)
 * - Comps Navigator
 * - Mandate Matcher
 *
 * Each card shows:
 * - Icon
 * - Badge
 * - Title and description
 * - "Learn More" link
 * - Mini preview visual
 */
export function DiscoveryToolsSection() {
  const { t } = useTranslation('producers');

  const tools = [
    {
      icon: <Bot className="h-8 w-8" />,
      title: t('discoveryTools.chatbot.title'),
      description: t('discoveryTools.chatbot.description'),
      link: '/features/chatbot',
      featureName: 'chatbot' as WebsiteFeature,
      preview: <ChatbotPreview />
    },
    {
      icon: <Film className="h-8 w-8" />,
      title: t('discoveryTools.comps.title'),
      description: t('discoveryTools.comps.description'),
      link: '/features/comps-navigator',
      featureName: 'comps_navigator' as WebsiteFeature,
      preview: <CompsPreview />
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: t('discoveryTools.mandates.title'),
      description: t('discoveryTools.mandates.description'),
      link: '/features/mandate-matcher',
      featureName: 'mandate_matcher' as WebsiteFeature,
      preview: <MandatePreview />
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-porcelain-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
              {t('discoveryTools.title')}
            </h2>
            <p className="text-lg sm:text-xl text-midnight-ink-600 leading-relaxed max-w-3xl mx-auto">
              {t('discoveryTools.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {tools.map((tool, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Link
                to={tool.link}
                className="block h-full group"
                onClick={() => trackFeaturePromoSelected(tool.featureName)}
              >
                <Card className="bg-white border-gray-300 shadow-none rounded-2xl hover:shadow-lg transition-all duration-300 h-full overflow-hidden flex flex-col">
                  <CardContent className="p-0 flex flex-col flex-grow">
                    {/* Mini Preview */}
                    <div className="h-32 bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue-100 relative overflow-hidden flex-shrink-0">
                      {tool.preview}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Icon + Title */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-hanok-teal/10 text-hanok-teal">
                          {tool.icon}
                        </div>
                        <h3 className="text-xl font-bold text-midnight-ink pt-2">
                          {tool.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-midnight-ink-600 leading-relaxed flex-grow">
                        {tool.description}
                      </p>

                      {/* Learn More Link */}
                      <div className="inline-flex items-center gap-2 font-medium transition-all group-hover:gap-3 mt-4 text-hanok-teal">
                        {t('discoveryTools.chatbot.cta')}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Mini preview components for each tool
 */
function ChatbotPreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-[180px] bg-white rounded-lg shadow-sm p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-100 rounded-full"></div>
          <div className="h-3 bg-gray-100 rounded flex-1"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-hanok-teal rounded-full flex items-center justify-center">
            <Bot className="h-3 w-3 text-white" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="h-2 bg-hanok-teal/20 rounded w-full"></div>
            <div className="h-2 bg-hanok-teal/20 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompsPreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex items-center gap-2">
        <div className="w-12 h-16 bg-white rounded shadow-sm flex items-center justify-center">
          <Film className="h-5 w-5 text-hanok-teal/50" />
        </div>
        <span className="text-hanok-teal font-bold text-lg">+</span>
        <div className="w-12 h-16 bg-white rounded shadow-sm flex items-center justify-center">
          <Film className="h-5 w-5 text-hanok-teal/50" />
        </div>
        <span className="text-hanok-teal font-bold text-lg">=</span>
        <div className="w-12 h-16 bg-hanok-teal/20 rounded shadow-sm flex items-center justify-center border-2 border-dashed border-hanok-teal">
          <span className="text-hanok-teal font-bold">?</span>
        </div>
      </div>
    </div>
  );
}

function MandatePreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-[180px] space-y-2">
        <div className="bg-white rounded-lg shadow-sm p-2">
          <div className="h-2 bg-hanok-teal/20 rounded w-full mb-1"></div>
          <div className="h-2 bg-hanok-teal/20 rounded w-2/3"></div>
        </div>
        <div className="flex gap-1">
          <div className="flex-1 bg-white rounded-lg shadow-sm p-2 flex items-center justify-between">
            <div className="h-2 bg-gray-100 rounded w-1/2"></div>
            <span className="text-[8px] text-hanok-teal font-bold">92%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscoveryToolsSection;
