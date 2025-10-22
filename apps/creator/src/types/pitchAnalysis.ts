// TypeScript interfaces for pitch deck analysis data
// Based on the structure in extract-pitch-test edge function

export interface Character {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  archetype: string;
  description: string;
  key_traits: string[];
  relationships: string[];
}

export interface StoryWorld {
  setting: string;
  time_period: string;
  world_building: string[];
}

export interface ThemesAndTone {
  primary_themes: string[];
  emotional_tone: string;
  visual_style: string;
  mood_keywords: string[];
}

export interface StoryElements {
  logline: string;
  plot_summary: string;
  key_plot_points: string[];
  genre_blend: string[];
  narrative_structure: string;
}

export interface TargetAudience {
  age_range: string;
  gender_skew: string;
  psychographics: string;
}

export interface ComparableTitle {
  title: string;
  platform: string;
  similarity: string;
}

export interface MarketPositioning {
  target_audience: TargetAudience;
  comparable_titles: ComparableTitle[];
  platform_fit: string[];
  territory_potential: string[];
}

export interface ProductionDetails {
  format: string;
  estimated_episodes: string | null;
  budget_range: string | null;
  timeline: string | null;
  adaptation_type: string;
}

export interface SourceMaterialMetrics {
  views: string | null;
  likes: string | null;
  chapters: string | null;
  rating: string | null;
}

export interface SourceMaterial {
  original_platform: string | null;
  metrics: SourceMaterialMetrics;
  serialization_status: 'completed' | 'ongoing' | null;
  awards_recognition: string[];
}

export interface IPValue {
  franchise_potential: 'high' | 'medium' | 'low';
  merchandising_opportunities: string[];
  cross_media_potential: string[];
  unique_selling_points: string[];
}

export interface CreativeTeam {
  author_writer: string | null;
  illustrator_artist: string | null;
  credentials: string[];
  studio_publisher: string | null;
}

export interface RightsAvailability {
  available_rights: string[];
  territories_available: string[];
  exclusivity_notes: string;
}

export interface ContentClassification {
  maturity_rating: 'all ages' | 'teen (13+)' | 'mature (18+)';
  content_warnings: string[];
  complexity_score: number;
  accessibility_notes: string;
}

export interface PitchAnalysis {
  story_world: StoryWorld;
  characters: Character[];
  themes_and_tone: ThemesAndTone;
  story_elements: StoryElements;
  market_positioning: MarketPositioning;
  production_details: ProductionDetails;
  source_material: SourceMaterial;
  korean_cultural_elements: string[];
  ip_value: IPValue;
  creative_team: CreativeTeam;
  rights_availability: RightsAvailability;
  content_classification: ContentClassification;
  additional_highlights: string[];
}

// Extended Title type with pitch_analysis
export interface TitleWithPitchAnalysis {
  pitch_analysis?: PitchAnalysis;
  processing_confidence?: number;
}
