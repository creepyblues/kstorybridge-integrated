import React from 'react'
import { useTranslation } from 'react-i18next'
import { User, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface CharacterDetail {
  name: string
  name_kr?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  age?: number | string
  gender?: string
  ethnicity?: string
  occupation?: string
  background?: string
  personality?: string
  arc?: string
  relationships?: string
}

interface CharacterDetailsDisplayProps {
  characters: CharacterDetail[]
}

/**
 * CharacterDetailsDisplay Component
 *
 * Displays character details from JSONB array field
 * Structured character information with demographics and story details
 */
export const CharacterDetailsDisplay: React.FC<CharacterDetailsDisplayProps> = ({ characters }) => {
  const { t } = useTranslation(['titles'])

  if (!characters || characters.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('titles:detail.noCharacters', 'No character details available')}
      </div>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    const colorMap: Record<string, string> = {
      protagonist: 'bg-blue-100 text-blue-700 border-blue-300',
      antagonist: 'bg-red-100 text-red-700 border-red-300',
      supporting: 'bg-green-100 text-green-700 border-green-300',
      minor: 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colorMap[role] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      protagonist: 'Protagonist',
      antagonist: 'Antagonist',
      supporting: 'Supporting',
      minor: 'Minor'
    }
    return roleMap[role] || role
  }

  return (
    <div className="space-y-6">
      {characters.map((character, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded-lg p-5 hover:border-gray-400 transition-colors"
        >
          {/* Character Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {character.name}
                  {character.name_kr && (
                    <span className="ml-2 text-gray-600 font-normal">
                      ({character.name_kr})
                    </span>
                  )}
                </h4>
                <Badge className={`text-xs ${getRoleBadgeColor(character.role)}`}>
                  {getRoleLabel(character.role)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Demographics */}
          {(character.age || character.gender || character.ethnicity || character.occupation) && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {character.age && (
                  <div>
                    <span className="text-gray-500">Age:</span>{' '}
                    <span className="text-gray-900 font-medium">{character.age}</span>
                  </div>
                )}
                {character.gender && (
                  <div>
                    <span className="text-gray-500">Gender:</span>{' '}
                    <span className="text-gray-900 font-medium">{character.gender}</span>
                  </div>
                )}
                {character.ethnicity && (
                  <div>
                    <span className="text-gray-500">Ethnicity:</span>{' '}
                    <span className="text-gray-900 font-medium">{character.ethnicity}</span>
                  </div>
                )}
                {character.occupation && (
                  <div>
                    <span className="text-gray-500">Occupation:</span>{' '}
                    <span className="text-gray-900 font-medium">{character.occupation}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Story Details */}
          <div className="space-y-3 text-sm">
            {character.background && (
              <div>
                <dt className="font-medium text-gray-700 mb-1">Background</dt>
                <dd className="text-gray-900 leading-relaxed">{character.background}</dd>
              </div>
            )}
            {character.personality && (
              <div>
                <dt className="font-medium text-gray-700 mb-1">Personality</dt>
                <dd className="text-gray-900 leading-relaxed">{character.personality}</dd>
              </div>
            )}
            {character.arc && (
              <div>
                <dt className="font-medium text-gray-700 mb-1">Character Arc</dt>
                <dd className="text-gray-900 leading-relaxed">{character.arc}</dd>
              </div>
            )}
            {character.relationships && (
              <div>
                <dt className="font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Relationships
                </dt>
                <dd className="text-gray-900 leading-relaxed">{character.relationships}</dd>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
