import React, { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUploadZone } from './FileUploadZone'
import { Link as LinkIcon, X, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExternalLink {
  id: string
  url: string
  type: 'interview' | 'review' | 'wiki' | 'press_release' | 'other'
  description: string
  shareable_with_nda: boolean
}


interface Step4MaterialsProps {
  form: UseFormReturn<any>
  onUpload?: (file: File, documentType: string) => Promise<{ file_url: string; id: string }>
}

/**
 * Step4Materials Component
 *
 * Fourth step of the 5-step survey: Existing materials
 * Handles file uploads and external link collection
 */
export const Step4Materials: React.FC<Step4MaterialsProps> = ({ form, onUpload }) => {
  const { t } = useTranslation(['survey', 'titles'])
  const { watch, setValue } = form

  const EXTERNAL_LINK_TYPES = [
    { value: 'interview', label: t('survey:step4.linkTypeInterview') },
    { value: 'review', label: t('survey:step4.linkTypeReview') },
    { value: 'wiki', label: t('survey:step4.linkTypeWiki') },
    { value: 'press_release', label: t('survey:step4.linkTypePressRelease') },
    { value: 'other', label: t('survey:step4.linkTypeOther') },
  ]

  const uploadedFiles = watch('uploaded_files') || []
  const externalLinks = watch('external_links') || []

  const [showAddLink, setShowAddLink] = useState(false)
  const [newLink, setNewLink] = useState<Partial<ExternalLink>>({
    url: '',
    type: 'interview',
    description: '',
    shareable_with_nda: false,
  })

  const addExternalLink = () => {
    if (!newLink.url || !newLink.type) return

    const link: ExternalLink = {
      id: `link-${Date.now()}`,
      url: newLink.url,
      type: newLink.type as ExternalLink['type'],
      description: newLink.description || '',
      shareable_with_nda: newLink.shareable_with_nda || false,
    }

    setValue('external_links', [...externalLinks, link])
    setNewLink({
      url: '',
      type: 'interview',
      description: '',
      shareable_with_nda: false,
    })
    setShowAddLink(false)
  }

  const removeExternalLink = (id: string) => {
    setValue(
      'external_links',
      externalLinks.filter((link: ExternalLink) => link.id !== id)
    )
  }

  const toggleLinkShareable = (id: string) => {
    setValue(
      'external_links',
      externalLinks.map((link: ExternalLink) =>
        link.id === id
          ? { ...link, shareable_with_nda: !link.shareable_with_nda }
          : link
      )
    )
  }

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('survey:step4.title')}</h2>
        <p className="text-gray-600 mt-2">
          {t('survey:step4.subtitle')}
        </p>
      </div>

      {/* Section: File Uploads */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('survey:step4.creativeDocumentsSection')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('survey:step4.creativeDocumentsSubtitle')}
          </p>
        </div>

        <FileUploadZone
          files={uploadedFiles}
          onChange={(files) => setValue('uploaded_files', files)}
          onUpload={onUpload}
        />
      </div>

      {/* Section: External Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('survey:step4.externalLinksSection')}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('survey:step4.externalLinksSubtitle')}
            </p>
          </div>
          {!showAddLink && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddLink(true)}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step4.addLink')}
            </Button>
          )}
        </div>

        {/* Add Link Form */}
        {showAddLink && (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">{t('survey:step4.addExternalLink')}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddLink(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t('survey:step4.linkType')}</Label>
              <Select
                value={newLink.type}
                onValueChange={(value) => setNewLink({ ...newLink, type: value as ExternalLink['type'] })}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXTERNAL_LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('survey:step4.url')}</Label>
              <Input
                type="url"
                placeholder={t('survey:step4.urlPlaceholder')}
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('survey:step4.description')}</Label>
              <Input
                placeholder={t('survey:step4.descriptionPlaceholder')}
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="link-shareable"
                checked={newLink.shareable_with_nda}
                onCheckedChange={(checked) =>
                  setNewLink({ ...newLink, shareable_with_nda: checked as boolean })
                }
              />
              <Label
                htmlFor="link-shareable"
                className="text-sm font-normal cursor-pointer"
              >
                {t('survey:step4.shareableWithNda')}
              </Label>
            </div>

            <Button
              type="button"
              onClick={addExternalLink}
              disabled={!newLink.url}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              {t('survey:step4.addLink')}
            </Button>
          </div>
        )}

        {/* External Links List */}
        {externalLinks.length > 0 && (
          <div className="space-y-2">
            {externalLinks.map((link: ExternalLink) => (
              <div
                key={link.id}
                className="flex items-start justify-between p-3 border border-gray-300 rounded-lg bg-white"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <LinkIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700 px-2 py-0.5 bg-gray-100 rounded">
                        {EXTERNAL_LINK_TYPES.find((t) => t.value === link.type)?.label}
                      </span>
                      {link.shareable_with_nda && (
                        <span className="text-xs font-medium text-green-600 px-2 py-0.5 bg-green-50 rounded">
                          {t('survey:step4.shareableWithNdaBadge')}
                        </span>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {link.url}
                    </a>
                    {link.description && (
                      <p className="text-xs text-gray-600 mt-1">{link.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLinkShareable(link.id)}
                    className="h-8 px-2 text-xs"
                  >
                    {link.shareable_with_nda ? t('survey:step4.unshare') : t('survey:step4.share')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExternalLink(link.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {externalLinks.length === 0 && !showAddLink && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <LinkIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              {t('survey:step4.noLinksYet')}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddLink(true)}
              className="border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('survey:step4.addExternalLink')}
            </Button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('survey:step4.tipsTitle')}</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>{t('survey:step4.tip1')}</li>
          <li>{t('survey:step4.tip2')}</li>
          <li>{t('survey:step4.tip3')}</li>
          <li>{t('survey:step4.tip4')}</li>
          <li>{t('survey:step4.tip5')}</li>
        </ul>
      </div>
    </div>
  )
}
