// Frontend Types for Asset Generation System
// Matches backend edge function types

export type AssetCategory = 'social_media' | 'ad_creative' | 'pitch_material';

export type AssetStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface MarketingAsset {
  id: string;
  title_id: string;
  title_name: string;
  asset_category: AssetCategory;
  asset_type: string;
  asset_format: string;
  description: string;
  prompt_template: string;
  prompt_used: string | null;
  image_url: string | null;
  video_url: string | null;
  generation_api: string;
  generation_model: string;
  generation_cost: number;
  generation_attempts: number;
  error_message: string | null;
  status: AssetStatus;
  approved: boolean;
  approved_by_email: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TitleWithPitch {
  title_id: string;
  title_name_en: string;
  title_name_kr: string | null;
  views: number | null;
  pitch: string | null;
}

export interface AnalyzePitchRequest {
  title_id: string;
  title_name: string;
  pitch_deck_url: string;
  pitch_analysis?: unknown;
  admin_email: string;
}

export interface AnalyzePitchResponse {
  success: true;
  data: {
    title_id: string;
    title_name: string;
    assets_created: number;
    asset_ideas: unknown[];
    analysis_metadata: {
      gpt4_cost: number;
      total_cost: number;
      analysis_duration_ms: number;
      model_used: string;
      tokens_used: { prompt: number; completion: number; total: number };
      pitch_analysis_used: boolean;
      ideas_generated: number;
    };
  };
}

export interface GenerateAssetRequest {
  asset_id: string;
  custom_prompt?: string;
  use_hd?: boolean;
  admin_email: string;
}

export interface GenerateAssetResponse {
  success: true;
  data: {
    asset_id: string;
    image_url: string;
    signed_url: string;
    storage_path: string;
    generation_cost: number;
    generation_model: string;
    generation_duration_ms: number;
    generation_attempts: number;
  };
}

export interface AssetsByCategory {
  social_media: MarketingAsset[];
  ad_creative: MarketingAsset[];
  pitch_material: MarketingAsset[];
}

export interface GenerationStatsData {
  total_assets: number;
  pending_count: number;
  generating_count: number;
  completed_count: number;
  failed_count: number;
  total_cost: number;
  estimated_remaining_cost: number;
}
