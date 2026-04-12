import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { type Title } from '@/services/titlesService';
import { type SuggestedComp } from '@/services/compsGeneratorService';
import { KeyVisualsGallery } from '@/components/title-detail/KeyVisualsGallery';
import { type UnifiedTitleDetailProps, type SimilarTitle } from './types';
import { HeroSection } from './HeroSection';
import { SectionNav } from './SectionNav';
import { SynopsisSection } from './SynopsisSection';
import { DescriptionSection } from './DescriptionSection';
import { MetricsSection } from './MetricsSection';
import { AdaptationIntelligenceSection } from './AdaptationIntelligenceSection';
import { FormatFitSection } from './FormatFitSection';
import { RightsInfoSection } from './RightsInfoSection';
import { TargetMarketSection } from './TargetMarketSection';
import { PitchDeckSection } from './PitchDeckSection';
import { AchievementsSection } from './AchievementsSection';
import { SimilarTitlesSection } from './SimilarTitlesSection';
import { BottomCta } from './BottomCta';

const SECTIONS = [
  { id: 'story', label: 'Story' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'business', label: 'Business' },
];

export function UnifiedTitleDetail({
  title,
  authState,
  user,
  tier,
  isFavorited,
  favoriteLoading,
  onFavoriteToggle,
  onCtaClick,
}: UnifiedTitleDetailProps) {
  const isLoggedIn = authState === 'authenticated';
  const [similar, setSimilar] = useState<SimilarTitle[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

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

  const fullTitle = isLoggedIn ? (title as Title) : null;
  const compsAnalysis = (fullTitle as any)?.comps_analysis as SuggestedComp[] | undefined;
  const hasPitchDeck = fullTitle?.pitch && fullTitle.pitch.trim() !== '';
  const titleName = title.title_name_en || title.title_name_kr || 'Unknown';

  return (
    <>
      {/* Sticky section nav */}
      <SectionNav sections={SECTIONS} heroRef={heroRef} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <div ref={heroRef}>
          <HeroSection
            title={title}
            authState={authState}
            user={user}
            isFavorited={isFavorited}
            favoriteLoading={favoriteLoading}
            onFavoriteToggle={onFavoriteToggle}
            onCtaClick={onCtaClick}
          />
        </div>

        {/* ═══ ACT 1: THE STORY ═══ */}
        <section id="story" className="scroll-mt-20 mb-12">
          <SynopsisSection
            synopsis={title.synopsis ?? null}
            note={title.note ?? null}
          />

          {/* Description (auth only — field lives on titles table, not public_titles view) */}
          {fullTitle?.description && (
            <div className="mt-6">
              <DescriptionSection description={fullTitle.description} />
            </div>
          )}

          {/* Key Visuals (auth only, inside Story act) */}
          {isLoggedIn && (
            <div className="mt-6">
              <KeyVisualsGallery titleId={title.title_id} maxDisplay={10} />
            </div>
          )}
        </section>

        {/* ═══ ACT 2: ADAPTATION INTELLIGENCE ═══ */}
        <section id="intelligence" className="scroll-mt-20 mb-12">
          {isLoggedIn ? (
            <>
              {/* Auth: full-width stacked — comps are too data-rich to share space */}
              <div className="mb-6">
                <AdaptationIntelligenceSection
                  authState={authState}
                  compsAnalysis={compsAnalysis}
                  comps={title.comps}
                  onCtaClick={onCtaClick}
                />
              </div>
              <div className="mb-6">
                <FormatFitSection
                  authState={authState}
                  titleId={title.title_id}
                  onCtaClick={onCtaClick}
                />
              </div>
            </>
          ) : (
            /* Anon: side by side — teasers are compact enough */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AdaptationIntelligenceSection
                authState={authState}
                compsAnalysis={compsAnalysis}
                comps={title.comps}
                onCtaClick={onCtaClick}
              />
              <FormatFitSection
                authState={authState}
                titleId={title.title_id}
                onCtaClick={onCtaClick}
              />
            </div>
          )}

          {/* Target Market — compact row */}
          {isLoggedIn && fullTitle && (
            <TargetMarketSection title={fullTitle} />
          )}
        </section>

        {/* ═══ ACT 3: BUSINESS ═══ */}
        <section id="business" className="scroll-mt-20 mb-12">
          {/* Rights + Metrics side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RightsInfoSection
              authState={authState}
              title={title}
              onCtaClick={onCtaClick}
            />
            {isLoggedIn && fullTitle ? (
              <MetricsSection title={fullTitle} />
            ) : (
              <div /> /* Empty grid cell for anon */
            )}
          </div>

          {/* Pitch Deck */}
          {isLoggedIn && fullTitle && hasPitchDeck && tier && (
            <PitchDeckSection
              titleId={fullTitle.title_id}
              titleName={titleName}
              pitchUrl={fullTitle.pitch!}
              userTier={tier}
            />
          )}

          {/* Achievements */}
          {isLoggedIn && fullTitle && (
            <AchievementsSection title={fullTitle} />
          )}
        </section>

        {/* Bottom CTA (anon) */}
        {!isLoggedIn && (
          <BottomCta onCtaClick={onCtaClick} />
        )}

        {/* Similar Titles */}
        <SimilarTitlesSection similar={similar} />
      </main>
    </>
  );
}
