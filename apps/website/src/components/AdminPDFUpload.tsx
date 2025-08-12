import { useState } from 'react';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Upload, FileText, X } from 'lucide-react';
import { pdfService } from '@/services/pdfService';

interface AdminPDFUploadProps {
  titleId: string;
  currentPdfUrl?: string;
  onUploadSuccess?: (pdfUrl: string) => void;
}

export default function AdminPDFUpload({ titleId, currentPdfUrl, onUploadSuccess }: AdminPDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload PDF to storage
      const pdfUrl = await pdfService.uploadPDF(file, titleId);
      
      // Update title's pitch field
      await pdfService.updateTitlePitch(titleId, pdfUrl);

      setSuccess('PDF uploaded successfully!');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Notify parent component
      onUploadSuccess?.(pdfUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      setError(null);

      // Remove PDF from storage
      await pdfService.deletePDF(titleId);
      
      // Clear title's pitch field
      await pdfService.updateTitlePitch(titleId, '');

      setSuccess('PDF removed successfully!');
      onUploadSuccess?.('');
    } catch (err) {
      console.error('Remove error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove PDF');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Pitch PDF Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current PDF Status */}
        {currentPdfUrl && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">PDF pitch document is uploaded</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-3">
          <Input
            id="pdf-file-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-hanok-teal file:text-white hover:file:bg-hanok-teal-600"
          />
          
          {file && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{file.name}</span>
                <span className="text-xs text-blue-600">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-hanok-teal hover:bg-hanok-teal-600 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
          
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              disabled={uploading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            📋 <strong>Instructions:</strong>
            <br />• Upload PDF files for pitch documents
            <br />• Maximum file size: 10MB
            <br />• Only PDF format is allowed
            <br />• Files are stored securely and require authentication to view
          </p>
        </div>
      </CardContent>
    </Card>
  );
}