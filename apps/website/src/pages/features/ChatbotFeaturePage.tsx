import { useTranslation } from 'react-i18next';
import { MessageSquare, Zap, Brain } from 'lucide-react';
import {
  FeaturePageLayout,
  FeatureHero,
  HowItWorksSection,
  ValuePropsGrid,
  StatsSection,
  FinalCTASection
} from '../../components/features/shared';
import { ChatbotMiniDemo } from '../../components/features/chatbot/ChatbotMiniDemo';

/**
 * ChatbotFeaturePage
 *
 * Promotional page for the AI Chatbot (Jinu) feature.
 * Route: /features/chatbot
 *
 * Sections:
 * 1. Hero with interactive chat demo
 * 2. How It Works (3 steps)
 * 3. Value Props (3 cards)
 * 4. Stats section
 * 5. Final CTA
 */
const ChatbotFeaturePage = () => {
  const { t } = useTranslation('features');

  return (
    <FeaturePageLayout>
      {/* Hero Section */}
      <FeatureHero
        headline={t('chatbot.hero.headline')}
        subhead={t('chatbot.hero.subhead')}
        primaryCtaText={t('chatbot.hero.primaryCta')}
        secondaryCtaText={t('chatbot.hero.secondaryCta')}
        storageKey="chatbot-feature-hero"
        accentColor="teal"
      >
        <ChatbotMiniDemo />
      </FeatureHero>

      {/* How It Works */}
      <HowItWorksSection
        title={t('chatbot.howItWorks.title')}
        steps={[
          {
            title: t('chatbot.howItWorks.step1.title'),
            description: t('chatbot.howItWorks.step1.description'),
            icon: <MessageSquare className="h-8 w-8" />
          },
          {
            title: t('chatbot.howItWorks.step2.title'),
            description: t('chatbot.howItWorks.step2.description'),
            icon: <Brain className="h-8 w-8" />
          },
          {
            title: t('chatbot.howItWorks.step3.title'),
            description: t('chatbot.howItWorks.step3.description'),
            icon: <Zap className="h-8 w-8" />
          }
        ]}
        accentColor="teal"
      />

      {/* Value Props */}
      <ValuePropsGrid
        title={t('chatbot.values.title')}
        values={[
          {
            title: t('chatbot.values.instant.title'),
            description: t('chatbot.values.instant.description'),
            icon: <Zap className="h-8 w-8" />
          },
          {
            title: t('chatbot.values.expert.title'),
            description: t('chatbot.values.expert.description'),
            icon: <Brain className="h-8 w-8" />
          },
          {
            title: t('chatbot.values.simple.title'),
            description: t('chatbot.values.simple.description'),
            icon: <MessageSquare className="h-8 w-8" />
          }
        ]}
        accentColor="teal"
      />

      {/* Stats */}
      <StatsSection
        stats={[
          { value: t('chatbot.stats.titles'), label: t('chatbot.stats.titlesLabel') },
          { value: t('chatbot.stats.response'), label: t('chatbot.stats.responseLabel') },
          { value: t('chatbot.stats.cost'), label: t('chatbot.stats.costLabel') }
        ]}
        accentColor="teal"
      />

      {/* Final CTA */}
      <FinalCTASection accentColor="teal" />
    </FeaturePageLayout>
  );
};

export default ChatbotFeaturePage;
