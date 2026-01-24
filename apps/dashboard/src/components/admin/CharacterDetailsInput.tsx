import React from 'react';
import { X, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CharacterDetail } from '@/services/titlesService';

// Extended type with temp ID for form management
export interface CharacterFormDetail extends Omit<CharacterDetail, 'role'> {
  id: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'romantic_foil' | 'romantic_false_foil' | '';
}

interface CharacterDetailsInputProps {
  characters: CharacterFormDetail[];
  onChange: (characters: CharacterFormDetail[]) => void;
  error?: string;
}

const ROLE_OPTIONS = [
  { value: 'protagonist', label: 'Protagonist' },
  { value: 'antagonist', label: 'Antagonist' },
  { value: 'supporting', label: 'Supporting' },
  { value: 'minor', label: 'Minor' },
  { value: 'romantic_foil', label: 'Romantic Foil' },
  { value: 'romantic_false_foil', label: 'Romantic False Foil' },
] as const;

/**
 * CharacterDetailsInput Component (Admin Version)
 *
 * Simplified character input for admin WeeklyTitle page
 * Produces structured JSONB data for titles.character_details
 */
export const CharacterDetailsInput: React.FC<CharacterDetailsInputProps> = ({
  characters,
  onChange,
  error,
}) => {
  const addCharacter = () => {
    const newCharacter: CharacterFormDetail = {
      id: `temp-${Date.now()}`,
      name: '',
      name_kr: '',
      role: '',
      background: '',
      personality: '',
      arc: '',
    };
    onChange([...characters, newCharacter]);
  };

  const removeCharacter = (id: string) => {
    onChange(characters.filter((c) => c.id !== id));
  };

  const updateCharacter = (id: string, field: keyof CharacterFormDetail, value: string) => {
    onChange(
      characters.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Characters {characters.length > 0 && `(${characters.length})`}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCharacter}
          className="border-gray-300 h-8"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <User className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-xs text-gray-500 mb-3">
            No characters added. Add key characters for the title.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCharacter}
            className="border-gray-300"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {characters.map((character, index) => (
            <div
              key={character.id}
              className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 truncate">
                  {index + 1}. {character.name || 'New'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharacter(character.id)}
                  className="h-5 w-5 p-0 hover:bg-gray-200 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Name */}
              <div className="space-y-0.5">
                <Label className="text-[10px] text-gray-500">Name *</Label>
                <Input
                  placeholder="Name"
                  value={character.name}
                  onChange={(e) => updateCharacter(character.id, 'name', e.target.value)}
                  className="bg-white border-gray-300 h-7 text-xs"
                />
              </div>

              {/* Role */}
              <div className="space-y-0.5">
                <Label className="text-[10px] text-gray-500">Role *</Label>
                <Select
                  value={character.role}
                  onValueChange={(value) => updateCharacter(character.id, 'role', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 h-7 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Korean Name */}
              <div className="space-y-0.5">
                <Label className="text-[10px] text-gray-500">Korean</Label>
                <Input
                  placeholder="이름"
                  value={character.name_kr || ''}
                  onChange={(e) => updateCharacter(character.id, 'name_kr', e.target.value)}
                  className="bg-white border-gray-300 h-7 text-xs"
                />
              </div>

              {/* Background */}
              <div className="space-y-0.5">
                <Label className="text-[10px] text-gray-500">Background</Label>
                <Textarea
                  placeholder="Background..."
                  value={character.background || ''}
                  onChange={(e) => updateCharacter(character.id, 'background', e.target.value)}
                  rows={2}
                  className="bg-white border-gray-300 text-xs resize-none min-h-[48px]"
                />
              </div>

              {/* Personality */}
              <div className="space-y-0.5">
                <Label className="text-[10px] text-gray-500">Personality</Label>
                <Input
                  placeholder="Traits..."
                  value={character.personality || ''}
                  onChange={(e) => updateCharacter(character.id, 'personality', e.target.value)}
                  className="bg-white border-gray-300 h-7 text-xs"
                />
              </div>

              {/* Arc */}
              <div className="space-y-0.5">
                <Label className="text-[10px] text-gray-500">Arc</Label>
                <Input
                  placeholder="Growth..."
                  value={character.arc || ''}
                  onChange={(e) => updateCharacter(character.id, 'arc', e.target.value)}
                  className="bg-white border-gray-300 h-7 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-xs text-gray-500">
        Maps to: character_details (JSONB array)
      </p>
    </div>
  );
};

// Helper to convert form data to database format (strips temp IDs)
export function serializeCharacters(characters: CharacterFormDetail[]): CharacterDetail[] {
  return characters
    .filter((c) => c.name && c.role) // Only include characters with name and role
    .map(({ id, ...rest }) => ({
      ...rest,
      role: rest.role as CharacterDetail['role'],
    }));
}

// Helper to convert database format to form data (adds temp IDs)
export function deserializeCharacters(characters: CharacterDetail[] | string | null): CharacterFormDetail[] {
  if (!characters) return [];

  // Handle string (legacy data)
  if (typeof characters === 'string') {
    try {
      const parsed = JSON.parse(characters);
      if (Array.isArray(parsed)) {
        return parsed.map((c, i) => ({
          id: `db-${i}-${Date.now()}`,
          name: c.name || '',
          name_kr: c.name_kr || '',
          role: c.role || '',
          background: c.background || '',
          personality: c.personality || '',
          arc: c.arc || '',
        }));
      }
    } catch {
      // Not valid JSON, return empty
      return [];
    }
    return [];
  }

  // Handle array
  if (Array.isArray(characters)) {
    return characters.map((c, i) => ({
      id: `db-${i}-${Date.now()}`,
      name: c.name || '',
      name_kr: c.name_kr || '',
      role: c.role || '',
      background: c.background || '',
      personality: c.personality || '',
      arc: c.arc || '',
    }));
  }

  return [];
}
