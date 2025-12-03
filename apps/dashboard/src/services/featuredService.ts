import { supabase } from "@/lib/supabase";
import type { Title } from "./titlesService";
import type { FeaturedSection, FeaturedSectionWithTitles, FeaturedGroupedBySections } from "@/types/featured";

export type Featured = {
  id: string;
  title_id: string;
  note: string | null;
  section_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type FeaturedWithTitle = Featured & {
  titles: Title;
};

export const featuredService = {
  async getAllFeatured(): Promise<FeaturedWithTitle[]> {
    const { data, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          *,
          title_content_analysis (
            pitch_analysis
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all featured titles: ${error.message}`);
    }

    return data || [];
  },

  async addFeaturedTitle(titleId: string, note?: string, sectionId?: string): Promise<void> {
    // Get max display_order for the section (or uncategorized)
    const { data: existing } = await supabase
      .from('featured')
      .select('display_order')
      .eq('section_id', sectionId || null)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { error } = await supabase
      .from('featured')
      .insert({
        title_id: titleId,
        note: note || null,
        section_id: sectionId || null,
        display_order: nextOrder
      });

    if (error) {
      throw new Error(`Failed to add featured title: ${error.message}`);
    }
  },

  async removeFeaturedTitle(featuredId: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .delete()
      .eq('id', featuredId);

    if (error) {
      throw new Error(`Failed to remove featured title: ${error.message}`);
    }
  },

  async updateFeaturedNote(featuredId: string, note: string): Promise<void> {
    const { error } = await supabase
      .from('featured')
      .update({
        note,
        updated_at: new Date().toISOString()
      })
      .eq('id', featuredId);

    if (error) {
      throw new Error(`Failed to update featured note: ${error.message}`);
    }
  },

  async isTitleFeatured(titleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('featured')
      .select('id')
      .eq('title_id', titleId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if title is featured:', error);
      return false;
    }

    return !!data;
  },

  // === SECTION METHODS ===

  async getAllSections(): Promise<FeaturedSection[]> {
    const { data, error } = await supabase
      .from('featured_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }
    return data || [];
  },

  async getActiveSections(): Promise<FeaturedSection[]> {
    const { data, error } = await supabase
      .from('featured_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active sections: ${error.message}`);
    }
    return data || [];
  },

  async createSection(name: string, description?: string): Promise<FeaturedSection> {
    // Get max display_order to add new section at the end
    const { data: existing } = await supabase
      .from('featured_sections')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('featured_sections')
      .insert({
        name,
        description: description || null,
        display_order: nextOrder
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create section: ${error.message}`);
    }
    return data;
  },

  async updateSection(
    sectionId: string,
    updates: { name?: string; description?: string | null; is_active?: boolean }
  ): Promise<void> {
    const { error } = await supabase
      .from('featured_sections')
      .update(updates)
      .eq('id', sectionId);

    if (error) {
      throw new Error(`Failed to update section: ${error.message}`);
    }
  },

  async deleteSection(sectionId: string): Promise<void> {
    // First, unassign all titles from this section (set section_id to null)
    await supabase
      .from('featured')
      .update({ section_id: null })
      .eq('section_id', sectionId);

    const { error } = await supabase
      .from('featured_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      throw new Error(`Failed to delete section: ${error.message}`);
    }
  },

  async reorderSections(sectionIds: string[]): Promise<void> {
    // Update each section's display_order based on array position
    for (let i = 0; i < sectionIds.length; i++) {
      const { error } = await supabase
        .from('featured_sections')
        .update({ display_order: i })
        .eq('id', sectionIds[i]);

      if (error) {
        throw new Error(`Failed to reorder sections: ${error.message}`);
      }
    }
  },

  async reorderTitlesInSection(featuredIds: string[]): Promise<void> {
    // Update each title's display_order based on array position
    for (let i = 0; i < featuredIds.length; i++) {
      const { error } = await supabase
        .from('featured')
        .update({ display_order: i })
        .eq('id', featuredIds[i]);

      if (error) {
        throw new Error(`Failed to reorder titles: ${error.message}`);
      }
    }
  },

  async assignTitleToSection(featuredId: string, sectionId: string | null): Promise<void> {
    // Get max display_order for the target section
    const { data: existing } = await supabase
      .from('featured')
      .select('display_order')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { error } = await supabase
      .from('featured')
      .update({ section_id: sectionId, display_order: nextOrder })
      .eq('id', featuredId);

    if (error) {
      throw new Error(`Failed to assign title to section: ${error.message}`);
    }
  },

  async getFeaturedGroupedBySections(): Promise<FeaturedGroupedBySections> {
    // Fetch all active sections
    const sections = await this.getActiveSections();

    // Fetch all featured titles with their section assignments
    const { data: featured, error } = await supabase
      .from('featured')
      .select(`
        *,
        titles (
          *,
          title_content_analysis (
            pitch_analysis
          )
        )
      `)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch featured titles: ${error.message}`);
    }

    // Group titles by section
    const sectionsWithTitles: FeaturedSectionWithTitles[] = sections.map(section => ({
      ...section,
      featured: (featured || [])
        .filter(f => f.section_id === section.id)
        .sort((a, b) => a.display_order - b.display_order)
    }));

    // Get uncategorized titles (section_id is null)
    const uncategorized = (featured || [])
      .filter(f => f.section_id === null)
      .sort((a, b) => a.display_order - b.display_order);

    return { sections: sectionsWithTitles, uncategorized };
  }
};
