import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Title } from '@/services/titlesService';
import { type SuggestedComp } from '@/services/compsGeneratorService';
import { KeyVisualsGallery } from '@/components/title-detail/KeyVisualsGallery';
import { type UnifiedTitleDetailProps, type SimilarTitle } from './types';
import { HeroSection } from './HeroSection';
import { SynopsisSection } from './SynopsisSection';
import { MetricsSection } from './MetricsSection';
import { AdaptationIntelligenceSection } from './AdaptationIntelligenceSection';
import { FormatFitSection } from './FormatFitSection';
import { RightsInfoSection } from './RightsInfoSection';
import { TargetMarketSection } from './TargetMarketSection';
import { PitchDeckSection } from './PitchDeckSection';
import { AchievementsSection } from './AchievementsSection';
import { SimilarTitlesSection } from './SimilarTitlesSection';
import { BottomCta } from './BottomCta';

export function UnifiedTitleDetail({
  title,
  authState,
  user,
  tier,
  // pitchAnalysis reserved for future AI insight cards
  isFavorited,
  favoriteLoading,
  onFavoriteToggle,
  onCtaClick,
}: UnifiedTitleDetailProps) {
  const isLoggedIn = authState === 'authenticated';
  const [similar, setSimilar] = useState<SimilarTitle[]>([]);

  // Fetch similar titles by genre overlap
  useEffect(() => {
    if (!title.genre) return;
    const genres = Array.isArray(title.genre) ? title.genre : [title.genre];

    (supabase
      .from('public_titles' as any)
      .select('title_id, title_name_en, title_name_kr, slug, title_image, genre, content_format')
      .neq('title_id', title.title_id)
      .overlaps('genre', genres)
      .order('views', { ascending: false, nullsFirst: false })
      .limit(3) as any)
      .then(({ data }: { data: SimilarTitle[] | null }) => {
        if (data) setSimilar(data);
      });
  }, [title.title_id, title.genre]);

  // Auth-only fields
  const fullTitle = isLoggedIn ? (title as Title) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compsAnalysis = (fullTitle as any)?.comps_analysis as SuggestedComp[] | undefined;
  const hasPitchDeck = fullTitle?.pitch && fullTitle.pitch.trim() !== '';
  const titleName = title.title_name_en || title.title_name_kr || 'Unknown';

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* 1. Hero */}
      <HeroSection
        title={title}
        authState={authState}
        user={user}
        isFavorited={isFavorited}
        favoriteLoading={favoriteLoading}
        onFavoriteToggle={onFavoriteToggle}
        onCtaClick={onCtaClick}
      />

      {/* 2. Synopsis + Editorial Take */}
      <SynopsisSection synopsis={title.synopsis ?? null} note={title.note ?? null} />

      {/* 3. Metrics (auth only — rich data card) */}
      {isLoggedIn && fullTitle && (
        <MetricsSection title={fullTitle} />
      )}

      {/* 4. Adaptation Intelligence (comps) */}
      <AdaptationIntelligenceSection
        authState={authState}
        compsAnalysis={compsAnalysis}
        comps={title.comps}
        onCtaClick={onCtaClick}
      />

      {/* 5. Format Fit */}
      <FormatFitSection
        authState={authState}
        titleId={title.title_id}
        onCtaClick={onCtaClick}
      />

      {/* 6. Rights Info */}
      <RightsInfoSection
        authState={authState}
        title={title}
        onCtaClick={onCtaClick}
      />

      {/* 7. Target Market (auth only) */}
      {isLoggedIn && fullTitle && (
        <TargetMarketSection title={fullTitle} />
      )}

      {/* 8. Pitch Deck (auth only, if available) */}
      {isLoggedIn && fullTitle && hasPitchDeck && tier && (
        <PitchDeckSection
          titleId={fullTitle.title_id}
          titleName={titleName}
          pitchUrl={fullTitle.pitch!}
          userTier={tier}
        />
      )}

      {/* 9. Key Visuals (auth only) */}
      {isLoggedIn && (
        <div className="mb-8">
          <KeyVisualsGallery titleId={title.title_id} maxDisplay={10} />
        </div>
      )}

      {/* 10. Achievements (auth only) */}
      {isLoggedIn && fullTitle && (
        <AchievementsSection title={fullTitle} />
      )}

      {/* 11. Bottom CTA (anon only) */}
      {!isLoggedIn && (
        <BottomCta onCtaClick={onCtaClick} />
      )}

      {/* 12. Similar Titles */}
      <SimilarTitlesSection similar={similar} />
    </main>
  );
}
