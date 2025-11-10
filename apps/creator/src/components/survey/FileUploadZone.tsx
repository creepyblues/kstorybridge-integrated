import React, { useCallback, useState } from 'react'
import { Upload, File, X, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface UploadedFile {
  id: string // Temporary ID or document ID after upload
  file?: File // File object (before upload)
  file_name: string
  file_size: number
  file_url?: string // URL after upload
  document_type: string
  shareable_with_nda: boolean
  uploading?: boolean
  error?: string
}

interface FileUploadZoneProps {
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  onUpload?: (file: File, documentType: string) => Promise<{ file_url: string; id: string }>
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'source_pdf', label: 'Source Material PDF' },
  { value: 'story_bible', label: 'Story Bible' },
  { value: 'outline', label: 'Story Outline' },
  { value: 'script', label: 'Script/Screenplay' },
  { value: 'press_release', label: 'Press Release' },
  { value: 'other', label: 'Other Document' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

/**
 * FileUploadZone Component
 *
 * Drag-and-drop file upload zone with file type selection
 * Supports multiple files with 10MB size limit
 *
 * @param files - Current list of uploaded files
 * @param onChange - Callback when files list changes
 * @param onUpload - Optional async upload handler (returns URL and ID)
 * @param maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param acceptedTypes - Accepted MIME types
 */
export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  onChange,
  onUpload,
  maxFileSize = MAX_FILE_SIZE,
  acceptedTypes = ACCEPTED_TYPES,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<string>('source_pdf')

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)}MB limit`
    }
    if (!acceptedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, Word, or TXT files.'
    }
    return null
  }

  const handleFile = useCallback(
    async (file: File, documentType: string) => {
      const error = validateFile(file)
      if (error) {
        const errorFile: UploadedFile = {
          id: `temp-${Date.now()}`,
          file,
          file_name: file.name,
          file_size: file.size,
          document_type: documentType,
          shareable_with_nda: false,
          error,
        }
        onChange([...files, errorFile])
        return
      }

      const tempFile: UploadedFile = {
        id: `temp-${Date.now()}`,
        file,
        file_name: file.name,
        file_size: file.size,
        document_type: documentType,
        shareable_with_nda: false,
        uploading: true,
      }

      onChange([...files, tempFile])

      if (onUpload) {
        try {
          const { file_url, id } = await onUpload(file, documentType)
          onChange(
            files.map((f) =>
              f.id === tempFile.id
                ? { ...f, id, file_url, uploading: false }
                : f
            )
          )
        } catch (err) {
          onChange(
            files.map((f) =>
              f.id === tempFile.id
                ? { ...f, uploading: false, error: 'Upload failed' }
                : f
            )
          )
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, onChange, onUpload, maxFileSize, acceptedTypes]
  )

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPendingFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setPendingFile(e.target.files[0])
    }
  }

  const confirmUpload = () => {
    if (pendingFile) {
      handleFile(pendingFile, selectedType)
      setPendingFile(null)
      setSelectedType('source_pdf')
    }
  }

  const cancelUpload = () => {
    setPendingFile(null)
    setSelectedType('source_pdf')
  }

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id))
  }

  // Toggle shareable status for a file (reserved for future use)
  // const toggleShareable = (id: string) => {
  //   onChange(
  //     files.map((f) =>
  //       f.id === id ? { ...f, shareable_with_nda: !f.shareable_with_nda } : f
  //     )
  //   )
  // }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {!pendingFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-black bg-gray-50' : 'border-gray-300'}
            hover:border-gray-400
          `}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-2">
            <label htmlFor="file-upload" className="cursor-pointer text-black font-medium hover:underline">
              Click to upload
            </label>
            {' '}or drag and drop
          </p>
          <p className="text-xs text-gray-500 mb-4">
            PDF, Word, or TXT (max {(maxFileSize / 1024 / 1024).toFixed(0)}MB)
          </p>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={acceptedTypes.join(',')}
          />
        </div>
      )}

      {/* Pending File Selection */}
      {pendingFile && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm font-medium">{pendingFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(pendingFile.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelUpload}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={confirmUpload}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Upload File
          </Button>
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Files ({files.length})</Label>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {file.uploading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                ) : file.error ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span className="capitalize">
                      {file.document_type.replace('_', ' ')}
                    </span>
                    {file.shareable_with_nda && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Shareable with NDA</span>
                      </>
                    )}
                  </div>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="h-6 w-6 p-0 flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Upload story bibles, outlines, scripts, or other creative documents. Mark files as
        shareable with NDA to allow buyers to access them.
      </p>
    </div>
  )
}
