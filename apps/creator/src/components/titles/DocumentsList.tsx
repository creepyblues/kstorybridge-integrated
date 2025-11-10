import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Download, ExternalLink, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface TitleDocument {
  id: string
  title_id: string
  document_type: 'source_pdf' | 'story_bible' | 'outline' | 'script' | 'press_release' | 'interview' | 'review' | 'wiki' | 'other'
  file_url?: string
  file_name?: string
  file_size?: number
  shareable_with_nda: boolean
  external_url?: string
  created_at: string
  updated_at: string
}

interface DocumentsListProps {
  documents: TitleDocument[]
}

/**
 * DocumentsList Component
 *
 * Displays documents from title_documents table
 * (pitch decks, scripts, press releases, etc.)
 */
export const DocumentsList: React.FC<DocumentsListProps> = ({ documents }) => {
  const { t } = useTranslation(['titles'])

  if (!documents || documents.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('titles:detail.noDocuments', 'No documents uploaded')}
      </div>
    )
  }

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      source_pdf: 'Source PDF',
      story_bible: 'Story Bible',
      outline: 'Outline',
      script: 'Script',
      press_release: 'Press Release',
      interview: 'Interview',
      review: 'Review',
      wiki: 'Wiki',
      other: 'Other'
    }
    return typeMap[type] || type
  }

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDocumentIcon = (_type: string) => {
    return <FileText className="w-5 h-5 text-blue-600" />
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Document Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                {getDocumentIcon(doc.document_type)}
              </div>
              <div className="flex-1 min-w-0">
                {/* Type Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                    {getDocumentTypeLabel(doc.document_type)}
                  </Badge>
                  {doc.shareable_with_nda && (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                      <Unlock className="w-3 h-3 mr-1" />
                      Shareable with NDA
                    </Badge>
                  )}
                  {!doc.shareable_with_nda && (
                    <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>

                {/* File Name */}
                {doc.file_name && (
                  <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                    {doc.file_name}
                  </p>
                )}

                {/* File Size */}
                {doc.file_size && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.file_size)}
                  </p>
                )}

                {/* External URL */}
                {doc.external_url && !doc.file_url && (
                  <a
                    href={doc.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {doc.external_url}
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              {doc.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-100"
                  onClick={() => window.open(doc.file_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              {doc.external_url && doc.file_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => window.open(doc.external_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
