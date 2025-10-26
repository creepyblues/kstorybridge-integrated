import React from 'react'
import { X, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface CharacterDetail {
  id: string // Temporary ID for form management
  name: string
  age?: string
  gender?: string
  sexuality?: string
  ethnicity?: string
  background?: string
  traits?: string
  arc?: string
}

interface CharacterDetailsInputProps {
  characters: CharacterDetail[]
  onChange: (characters: CharacterDetail[]) => void
  error?: string
  required?: boolean
}

/**
 * CharacterDetailsInput Component
 *
 * Dynamic form for managing character details
 * Structured input for main characters with demographics and story arc
 *
 * @param characters - Current list of characters
 * @param onChange - Callback when characters list changes
 * @param error - Validation error message
 * @param required - Whether at least one character is required
 */
export const CharacterDetailsInput: React.FC<CharacterDetailsInputProps> = ({
  characters,
  onChange,
  error,
  required = false,
}) => {
  const addCharacter = () => {
    const newCharacter: CharacterDetail = {
      id: `temp-${Date.now()}`,
      name: '',
      age: '',
      gender: '',
      sexuality: '',
      ethnicity: '',
      background: '',
      traits: '',
      arc: '',
    }
    onChange([...characters, newCharacter])
  }

  const removeCharacter = (id: string) => {
    onChange(characters.filter((c) => c.id !== id))
  }

  const updateCharacter = (id: string, field: keyof CharacterDetail, value: string) => {
    onChange(
      characters.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Main Characters {required && <span className="text-red-500">*</span>}
          {characters.length > 0 && ` (${characters.length})`}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCharacter}
          className="border-gray-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 mb-4">
            No characters added yet. Add your main characters to help buyers understand your
            story.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={addCharacter}
            className="border-gray-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Character
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {characters.map((character, index) => (
            <div
              key={character.id}
              className="border border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Character {index + 1}
                    {character.name && `: ${character.name}`}
                  </span>
                </div>
                {characters.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharacter(character.id)}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove character</span>
                  </Button>
                )}
              </div>

              {/* Character Name */}
              <div className="space-y-2">
                <Label htmlFor={`char-name-${character.id}`}>
                  Character Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`char-name-${character.id}`}
                  placeholder="Enter character name"
                  value={character.name}
                  onChange={(e) =>
                    updateCharacter(character.id, 'name', e.target.value)
                  }
                  className="bg-white border-gray-300"
                />
              </div>

              {/* Demographics Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`char-age-${character.id}`}>Age</Label>
                  <Input
                    id={`char-age-${character.id}`}
                    placeholder="e.g., 25 or mid-20s"
                    value={character.age || ''}
                    onChange={(e) =>
                      updateCharacter(character.id, 'age', e.target.value)
                    }
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`char-gender-${character.id}`}>Gender</Label>
                  <Input
                    id={`char-gender-${character.id}`}
                    placeholder="e.g., Female"
                    value={character.gender || ''}
                    onChange={(e) =>
                      updateCharacter(character.id, 'gender', e.target.value)
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              {/* Demographics Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`char-sexuality-${character.id}`}>
                    Sexuality
                  </Label>
                  <Input
                    id={`char-sexuality-${character.id}`}
                    placeholder="e.g., Heterosexual"
                    value={character.sexuality || ''}
                    onChange={(e) =>
                      updateCharacter(character.id, 'sexuality', e.target.value)
                    }
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`char-ethnicity-${character.id}`}>
                    Ethnicity/Nationality
                  </Label>
                  <Input
                    id={`char-ethnicity-${character.id}`}
                    placeholder="e.g., Korean"
                    value={character.ethnicity || ''}
                    onChange={(e) =>
                      updateCharacter(character.id, 'ethnicity', e.target.value)
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              {/* Background */}
              <div className="space-y-2">
                <Label htmlFor={`char-background-${character.id}`}>
                  Background/Backstory
                </Label>
                <Textarea
                  id={`char-background-${character.id}`}
                  placeholder="Brief background or origin story..."
                  value={character.background || ''}
                  onChange={(e) =>
                    updateCharacter(character.id, 'background', e.target.value)
                  }
                  rows={2}
                  className="bg-white border-gray-300 resize-none"
                />
              </div>

              {/* Personality Traits */}
              <div className="space-y-2">
                <Label htmlFor={`char-traits-${character.id}`}>
                  Personality Traits
                </Label>
                <Textarea
                  id={`char-traits-${character.id}`}
                  placeholder="Key personality traits, strengths, weaknesses..."
                  value={character.traits || ''}
                  onChange={(e) =>
                    updateCharacter(character.id, 'traits', e.target.value)
                  }
                  rows={2}
                  className="bg-white border-gray-300 resize-none"
                />
              </div>

              {/* Character Arc */}
              <div className="space-y-2">
                <Label htmlFor={`char-arc-${character.id}`}>
                  Character Arc
                </Label>
                <Textarea
                  id={`char-arc-${character.id}`}
                  placeholder="How does this character change or grow throughout the story?"
                  value={character.arc || ''}
                  onChange={(e) =>
                    updateCharacter(character.id, 'arc', e.target.value)
                  }
                  rows={2}
                  className="bg-white border-gray-300 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-500">
        Add your main characters (protagonist, antagonist, key supporting characters). Include
        as much demographic and personality detail as possible to help buyers understand your
        cast.
      </p>
    </div>
  )
}
