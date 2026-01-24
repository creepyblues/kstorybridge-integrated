/**
 * Weekly Title Service
 *
 * Manages weekly title assignments and editorial content.
 * Handles CRUD operations for weekly_titles table and syncing to titles table.
 */

import { supabase } from '@/lib/supabase';
import { Title } from './titlesService';

// Types
export interface WeeklyTitle {
  id: string;
  week_of: string; // ISO date string (YYYY-MM-DD)
  title_id: string;
  input_logline: string | null;
  input_comparables: string | null;
  input_characters: string | null;
  input_synopsis: string | null;
  input_selling_points: string | null;
  submitted: boolean;
  submitted_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyTitleWithTitle extends WeeklyTitle {
  titles: Title | null;
}

export interface CreateWeeklyTitleInput {
  week_of: string;
  title_id: string;
  input_logline?: string;
  input_comparables?: string;
  input_characters?: string;
  input_synopsis?: string;
  input_selling_points?: string;
  created_by: string;
}

export interface UpdateWeeklyTitleInput {
  title_id?: string;
  input_logline?: string;
  input_comparables?: string;
  input_characters?: string;
  input_synopsis?: string;
  input_selling_points?: string;
}

export type MergeStrategy = 'use_existing' | 'use_new' | 'merge';

export interface FieldConflict {
  field: string;
  displayName: string;
  existingValue: string | string[] | object | null;
  newValue: string | string[] | object | null;
  strategy: MergeStrategy;
}

// Helper to get Monday of a given week
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Helper to format date as YYYY-MM-DD (using local timezone, not UTC)
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// =====================================================================
// CRUD OPERATIONS
// =====================================================================

/**
 * Get all weekly titles with optional date range filter
 */
export async function getWeeklyTitles(
  startDate?: string,
  endDate?: string
): Promise<WeeklyTitleWithTitle[]> {
  let query = supabase
    .from('weekly_titles')
    .select(`
      *,
      titles (
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        tagline,
        synopsis,
        comps,
        character_details,
        selling_points
      )
    `)
    .order('week_of', { ascending: false });

  if (startDate) {
    query = query.gte('week_of', startDate);
  }
  if (endDate) {
    query = query.lte('week_of', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching weekly titles:', error);
    throw new Error(error.message);
  }

  return (data || []) as unknown as WeeklyTitleWithTitle[];
}

/**
 * Get weekly title for a specific week
 */
export async function getWeeklyTitleByWeek(
  weekOf: string
): Promise<WeeklyTitleWithTitle | null> {
  const { data, error } = await supabase
    .from('weekly_titles')
    .select(`
      *,
      titles (
        title_id,
        title_name_en,
        title_name_kr,
        title_image,
        tagline,
        synopsis,
        description,
        comps,
        character_details,
        selling_points,
        content_format,
        genre,
        views,
        rating,
        chapters,
        story_author,
        art_author,
        title_url,
        title_url_en
      )
    `)
    .eq('week_of', weekOf)
    .maybeSingle();

  if (error) {
    console.error('Error fetching weekly title:', error);
    throw new Error(error.message);
  }

  return data as unknown as WeeklyTitleWithTitle | null;
}

/**
 * Create a new weekly title assignment
 */
export async function createWeeklyTitle(
  input: CreateWeeklyTitleInput
): Promise<WeeklyTitle> {
  const { data, error } = await supabase
    .from('weekly_titles')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating weekly title:', error);
    throw new Error(error.message);
  }

  return data as WeeklyTitle;
}

/**
 * Update an existing weekly title
 */
export async function updateWeeklyTitle(
  id: string,
  updates: UpdateWeeklyTitleInput
): Promise<WeeklyTitle> {
  const { data, error } = await supabase
    .from('weekly_titles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating weekly title:', error);
    throw new Error(error.message);
  }

  return data as WeeklyTitle;
}

/**
 * Delete a weekly title assignment
 */
export async function deleteWeeklyTitle(id: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_titles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting weekly title:', error);
    throw new Error(error.message);
  }
}

/**
 * Submit/finalize a weekly title
 */
export async function submitWeeklyTitle(id: string): Promise<WeeklyTitle> {
  const { data, error } = await supabase
    .from('weekly_titles')
    .update({
      submitted: true,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error submitting weekly title:', error);
    throw new Error(error.message);
  }

  return data as WeeklyTitle;
}

// =====================================================================
// CONFLICT DETECTION & RESOLUTION
// =====================================================================

/**
 * Field mapping from weekly_titles input to titles table columns
 */
const FIELD_MAPPING: Record<string, { titleField: string; displayName: string; type: 'text' | 'array' | 'jsonb' }> = {
  input_logline: { titleField: 'tagline', displayName: 'Logline / Tagline', type: 'text' },
  input_comparables: { titleField: 'comps', displayName: 'Comparables', type: 'array' },
  input_characters: { titleField: 'character_details', displayName: 'Characters', type: 'jsonb' },
  input_synopsis: { titleField: 'synopsis', displayName: 'Synopsis', type: 'text' },
  input_selling_points: { titleField: 'selling_points', displayName: 'Selling Points', type: 'text' },
};

/**
 * Detect conflicts between input data and existing title data
 */
export async function detectConflicts(
  titleId: string,
  inputData: Partial<WeeklyTitle>
): Promise<FieldConflict[]> {
  // Fetch current title data
  const { data: title, error } = await supabase
    .from('titles')
    .select('tagline, comps, character_details, synopsis, selling_points')
    .eq('title_id', titleId)
    .single();

  if (error) {
    console.error('Error fetching title for conflict detection:', error);
    throw new Error(error.message);
  }

  const conflicts: FieldConflict[] = [];

  for (const [inputField, mapping] of Object.entries(FIELD_MAPPING)) {
    const inputValue = inputData[inputField as keyof WeeklyTitle] as string | string[] | object | null;
    const existingValue = title[mapping.titleField as keyof typeof title];

    // Only flag as conflict if both have values
    if (inputValue && existingValue) {
      // For arrays, check if not empty
      if (mapping.type === 'array' && Array.isArray(existingValue) && existingValue.length === 0) {
        continue;
      }
      // For jsonb, check if not empty object/array
      if (mapping.type === 'jsonb') {
        if (Array.isArray(existingValue) && existingValue.length === 0) continue;
        if (typeof existingValue === 'object' && Object.keys(existingValue).length === 0) continue;
      }
      // For text, check if not empty string
      if (mapping.type === 'text' && existingValue === '') continue;

      conflicts.push({
        field: inputField,
        displayName: mapping.displayName,
        existingValue,
        newValue: inputValue,
        strategy: 'merge', // Default to merge
      });
    }
  }

  return conflicts;
}

/**
 * Merge values based on strategy
 */
function mergeValues(
  existing: string | string[] | object | null,
  newVal: string | string[] | object | null,
  strategy: MergeStrategy,
  type: 'text' | 'array' | 'jsonb'
): string | string[] | object | null {
  if (strategy === 'use_existing') {
    return existing;
  }
  if (strategy === 'use_new') {
    return newVal;
  }

  // Merge strategy
  if (type === 'text') {
    const existingStr = existing as string || '';
    const newStr = newVal as string || '';
    return existingStr && newStr ? `${existingStr}\n\n${newStr}` : existingStr || newStr;
  }

  if (type === 'array') {
    const existingArr = Array.isArray(existing) ? existing : [];
    const newArr = Array.isArray(newVal) ? newVal :
      (typeof newVal === 'string' ? newVal.split(',').map(s => s.trim()).filter(Boolean) : []);
    // Combine unique items
    return [...new Set([...existingArr, ...newArr])];
  }

  if (type === 'jsonb') {
    const existingData = Array.isArray(existing) ? existing : [];
    const newData = Array.isArray(newVal) ? newVal : [];
    return [...existingData, ...newData];
  }

  return newVal;
}

/**
 * Sync editorial content to titles table with conflict resolution
 */
export async function syncToTitlesTable(
  titleId: string,
  inputData: Partial<WeeklyTitle>,
  conflictResolutions?: FieldConflict[]
): Promise<void> {
  // Build update object for titles table
  const updates: Record<string, unknown> = {};

  // Fetch current title data for merging
  const { data: currentTitle, error: fetchError } = await supabase
    .from('titles')
    .select('tagline, comps, character_details, synopsis, selling_points')
    .eq('title_id', titleId)
    .single();

  if (fetchError) {
    console.error('Error fetching title for sync:', fetchError);
    throw new Error(fetchError.message);
  }

  for (const [inputField, mapping] of Object.entries(FIELD_MAPPING)) {
    const inputValue = inputData[inputField as keyof WeeklyTitle] as string | string[] | object | null;

    // Skip if no input value
    if (!inputValue) continue;

    const existingValue = currentTitle[mapping.titleField as keyof typeof currentTitle];

    // Check if there's a conflict resolution for this field
    const resolution = conflictResolutions?.find(c => c.field === inputField);

    if (resolution) {
      // Apply the specified merge strategy
      updates[mapping.titleField] = mergeValues(
        existingValue,
        inputValue,
        resolution.strategy,
        mapping.type
      );
    } else if (!existingValue ||
               (Array.isArray(existingValue) && existingValue.length === 0) ||
               (typeof existingValue === 'object' && Object.keys(existingValue).length === 0)) {
      // No conflict - just use new value
      if (mapping.type === 'array') {
        // Parse comma-separated string to array
        updates[mapping.titleField] = typeof inputValue === 'string'
          ? inputValue.split(',').map(s => s.trim()).filter(Boolean)
          : inputValue;
      } else {
        updates[mapping.titleField] = inputValue;
      }
    }
  }

  // Only update if there are changes
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('titles')
      .update(updates)
      .eq('title_id', titleId);

    if (updateError) {
      console.error('Error syncing to titles table:', updateError);
      throw new Error(updateError.message);
    }
  }
}

// =====================================================================
// EXPORT SERVICE OBJECT
// =====================================================================

export const weeklyTitleService = {
  // CRUD
  getWeeklyTitles,
  getWeeklyTitleByWeek,
  createWeeklyTitle,
  updateWeeklyTitle,
  deleteWeeklyTitle,
  submitWeeklyTitle,
  // Conflict resolution
  detectConflicts,
  syncToTitlesTable,
  // Helpers
  getMondayOfWeek,
  formatDateToISO,
  // Constants
  FIELD_MAPPING,
};

export default weeklyTitleService;
