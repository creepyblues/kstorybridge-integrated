import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, X, Loader2, Trash2, Eye } from 'lucide-react'
import { pitchDeckService } from '@/services/pitchDeckService'

interface PitchDeckUploadProps {
  titleId: string
  currentPitchUrl?: string | null
  onUploadSuccess?: (url: string) => void
  onDelete?: () => void
}

export function PitchDeckUpload({ titleId, currentPitchUrl, onUploadSuccess, onDelete }: PitchDeckUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = pitchDeckService.validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setSelectedFile(null)
      return
    }

    setError(null)
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      const result = await pitchDeckService.uploadPitchDeck({
        titleId,
        file: selectedFile,
        onProgress: setProgress
      })

      // Success
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUploadSuccess?.(result.url)
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!currentPitchUrl) return

    if (!confirm('Are you sure you want to delete the current pitch deck? This action cannot be undone.')) {
      return
    }

    try {
      setUploading(true)
      setError(null)

      await pitchDeckService.removePitchDeck(titleId)

      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onDelete?.()
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete pitch deck.')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelSelection = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleViewCurrent = () => {
    if (currentPitchUrl) {
      window.open(currentPitchUrl, '_blank')
    }
  }

  return (
    <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pitch Deck</h3>
          {currentPitchUrl && (
            <div className="flex gap-2">
              <Button
                onClick={handleViewCurrent}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                disabled={uploading}
                className="border-red-300 hover:bg-red-50 text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Current Pitch Deck Status */}
        {currentPitchUrl && !selectedFile && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">Pitch deck uploaded</p>
                <p className="text-xs text-green-700 mt-1 break-all">
                  {currentPitchUrl.split('/').pop()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Input */}
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`pitch-deck-input-${titleId}`}
            />
            <label
              htmlFor={`pitch-deck-input-${titleId}`}
              className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploading
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {currentPitchUrl ? 'Upload New Pitch Deck' : 'Upload Pitch Deck'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF only, max 50MB</p>
                </div>
              </div>
            </label>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleCancelSelection}
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2 text-center">{progress}%</p>
                </div>
              )}

              {/* Upload Button */}
              {!uploading && (
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleUpload}
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {currentPitchUrl ? 'Replace Pitch Deck' : 'Upload Pitch Deck'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-gray-500">
            Upload a PDF pitch deck for this title. The pitch deck will be visible to buyers with appropriate access levels.
            {currentPitchUrl && ' Uploading a new file will replace the existing pitch deck.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
