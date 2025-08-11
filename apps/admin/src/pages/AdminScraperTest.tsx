import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  CheckCircle, 
  Globe, 
  Image, 
  BookOpen, 
  User, 
  Tag,
  Copy,
  RefreshCw,
  TestTube,
  Heart
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import scraperApiClient, { type ScrapingResult, type ScrapedTitleData } from "@/services/scraperApiClient";
import { toast } from "sonner";

export default function AdminScraperTest() {
  // Pre-fill with the test URL
  const [url, setUrl] = useState("https://series.naver.com/comic/detail.series?productNo=3293134");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [editableData, setEditableData] = useState<Partial<ScrapedTitleData>>({});

  // Sample URLs for testing
  const sampleUrls = [
    "https://series.naver.com/comic/detail.series?productNo=8306797",
    "https://comic.naver.com/webtoon/list?titleId=841324",
    "https://page.kakao.com/content/61614855",
    "https://webtoon.kakao.com/content/%EC%83%A4%ED%81%AC-%EC%99%80%EC%9D%B4%EB%B2%88/3616",
    "https://series.naver.com/comic/detail.series?productNo=9935335",
  ];

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to scrape");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setEditableData({});

    try {
      console.log('🔍 Starting scrape for:', url);
      const scrapingResult = await scraperApiClient.scrapeTitle(url);
      console.log('📊 Scraping result:', scrapingResult);
      setResult(scrapingResult);
      
      if (scrapingResult.success && scrapingResult.data) {
        setEditableData(scrapingResult.data);
        toast.success(`Scraping completed! Extracted ${scrapingResult.extractedFields.length} fields with ${Math.round(scrapingResult.confidence * 100)}% confidence`);
      } else {
        toast.error(scrapingResult.error || "Scraping failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const failureResult: ScrapingResult = {
        success: false,
        error: errorMessage,
        confidence: 0,
        extractedFields: []
      };
      setResult(failureResult);
      toast.error("Scraping failed: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldEdit = (field: keyof ScrapedTitleData, value: any) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getFieldIcon = (field: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'title_name_kr': <BookOpen className="w-4 h-4" />,
      'title_name_en': <BookOpen className="w-4 h-4" />,
      'author': <User className="w-4 h-4" />,
      'writer': <User className="w-4 h-4" />,
      'illustrator': <User className="w-4 h-4" />,
      'genre': <Tag className="w-4 h-4" />,
      'title_image': <Image className="w-4 h-4" />,
      'title_url': <Globe className="w-4 h-4" />,
      'likes': <Heart className="w-4 h-4" />,
      'age_rating': <AlertCircle className="w-4 h-4" />
    };
    return iconMap[field] || <AlertCircle className="w-4 h-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    if (confidence >= 0.4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-sunrise-coral rounded-full flex items-center justify-center">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-midnight-ink">Scraper Test Lab</h1>
            <p className="text-midnight-ink-600 mt-2">
              Test and validate title data extraction from various platforms
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  URL Input & Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scrape-url">Target URL</Label>
                  <Input
                    id="scrape-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://series.naver.com/comic/detail.series?productNo=32931"
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={handleScrape}
                  disabled={isLoading}
                  className="w-full bg-sunrise-coral hover:bg-sunrise-coral/90 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scraping...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4" />
                      Start Scraping
                    </div>
                  )}
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sample URLs for Testing</Label>
                  <div className="space-y-2">
                    {sampleUrls.map((sampleUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setUrl(sampleUrl)}
                        className="w-full text-left text-sm text-hanok-teal hover:underline p-2 rounded border border-gray-200 hover:bg-gray-50"
                      >
                        {sampleUrl}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <button
                      onClick={() => {
                        scraperApiClient.testKoreanNumbers();
                        console.log('Korean number test completed - check console for results');
                      }}
                      className="w-full text-sm text-purple-600 hover:underline p-2 rounded border border-purple-200 hover:bg-purple-50"
                    >
                      🧮 Test Korean Number Conversion (Check Console)
                    </button>
                    
                    <button
                      onClick={async () => {
                        const health = await scraperApiClient.healthCheck();
                        if (health) {
                          toast.success(`Backend healthy: ${health.service}`);
                        } else {
                          toast.error('Backend unavailable - make sure server is running');
                        }
                      }}
                      className="w-full text-sm text-green-600 hover:underline p-2 rounded border border-green-200 hover:bg-green-50"
                    >
                      🏥 Check Backend Health
                    </button>

                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        const testResult = await scraperApiClient.runTest();
                        setResult(testResult);
                        if (testResult.success && testResult.data) {
                          setEditableData(testResult.data);
                        }
                        setIsLoading(false);
                      }}
                      disabled={isLoading}
                      className="w-full text-sm text-blue-600 hover:underline p-2 rounded border border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                    >
                      🧪 Run Backend Test
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verbose Logs */}
            {result && result.logs && result.logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Scraping Progress Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-3">
                    <div className="space-y-1">
                      {result.logs.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-gray-700">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Summary */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    Scraping Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <div className="font-medium">
                        {result.success ? (
                          <span className="text-green-600">Success</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Confidence</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getConfidenceColor(result.confidence)}`}
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">Extracted Fields</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.extractedFields.map((field, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {getFieldIcon(field)}
                          <span className="ml-1">{field}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {result.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Data Editor Section */}
          <div className="space-y-6">
            {result && result.success && result.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Extracted Data Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {/* Filtered fields display - excluding specified fields */}
                    {Object.entries(editableData).map(([field, value]) => {
                      if (!value && value !== false && value !== 0) return null;
                      
                      // Skip these fields as requested  
                      const excludedFields = [
                        'synopsis', 'logline', 'tagline', 'author', 'illustrator', 
                        'art_author', 'story_author', 'tone', 'pitch', 'perfect_for', 'comps',
                        'title_name_en', 'tags', 'audience'
                      ];
                      if (excludedFields.includes(field)) return null;
                      
                      const isTextArea = ['description'].includes(field);
                      const isBoolean = typeof value === 'boolean';
                      const isNumber = ['chapters', 'likes'].includes(field);
                      const isImage = field === 'title_image';
                      const isTags = field === 'tags' && Array.isArray(value);
                      
                      return (
                        <div key={field} className="space-y-1">
                          <Label className="text-sm flex items-center gap-2">
                            {getFieldIcon(field)}
                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {!isBoolean && !isImage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(String(value))}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </Label>
                          
                          {isTextArea ? (
                            <Textarea
                              value={String(value)}
                              onChange={(e) => handleFieldEdit(field as keyof ScrapedTitleData, e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                          ) : isBoolean ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(e) => handleFieldEdit(field as keyof ScrapedTitleData, e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm">{value ? 'Yes' : 'No'}</span>
                            </div>
                          ) : isNumber ? (
                            <Input
                              type="number"
                              value={String(value)}
                              onChange={(e) => handleFieldEdit(field as keyof ScrapedTitleData, parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          ) : isTags ? (
                            <div className="space-y-2">
                              <Input
                                value={Array.isArray(value) ? (value as string[]).join(', ') : ''}
                                onChange={(e) => {
                                  const tagsArray = e.target.value
                                    .split(',')
                                    .map(tag => tag.trim())
                                    .filter(tag => tag.length > 0);
                                  handleFieldEdit(field as keyof ScrapedTitleData, tagsArray);
                                }}
                                placeholder="Enter keywords separated by commas"
                                className="text-sm"
                              />
                              <div className="text-xs text-gray-500">
                                Separate keywords with commas (e.g., romance, drama, webtoon)
                              </div>
                              {Array.isArray(value) && value.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {(value as string[]).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : isImage ? (
                            <div className="space-y-2">
                              <Input
                                value={String(value)}
                                onChange={(e) => handleFieldEdit(field as keyof ScrapedTitleData, e.target.value)}
                                className="text-sm"
                              />
                              {value && (
                                <div className="mt-2">
                                  <img 
                                    src={String(value)} 
                                    alt="Title Preview" 
                                    className="w-24 h-32 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgOTYgMTI4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iMTI4IiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjQ4IiB5PSI2OCIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRlciIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0ZGRkZGRiIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <Input
                              value={String(value)}
                              onChange={(e) => handleFieldEdit(field as keyof ScrapedTitleData, e.target.value)}
                              className="text-sm"
                              disabled={field === 'title_url'}
                            />
                          )}
                        </div>
                      );
                    })}

                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      onClick={async () => {
                        try {
                          // Submit feedback if data was corrected
                          const response = await fetch('http://localhost:3001/api/testing/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              url,
                              originalData: result?.data || {},
                              correctedData: editableData,
                              userContext: {
                                timestamp: new Date().toISOString(),
                                sessionId: Date.now().toString()
                              }
                            })
                          });
                          
                          if (response.ok) {
                            toast.success("✅ Feedback submitted! This will improve scraper accuracy.");
                          } else {
                            throw new Error('Failed to submit feedback');
                          }
                        } catch (error) {
                          console.error('Feedback submission failed:', error);
                          toast.error("❌ Could not submit feedback. Data logged to console.");
                          console.log('Corrected data:', editableData);
                        }
                      }}
                      className="w-full bg-sunrise-coral hover:bg-sunrise-coral/90 text-white"
                      disabled={!result?.data || Object.keys(editableData).length === 0}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Submit Corrections & Improve AI
                    </Button>
                    
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:3001/api/testing/test-case', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              url,
                              expectedData: editableData,
                              metadata: {
                                source: 'admin_manual',
                                difficulty: 'medium',
                                dateAdded: new Date().toISOString()
                              }
                            })
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            toast.success(`🧪 Test case created: ${data.testId}`);
                          } else {
                            throw new Error('Failed to create test case');
                          }
                        } catch (error) {
                          console.error('Test case creation failed:', error);
                          toast.error("❌ Could not create test case");
                        }
                      }}
                      variant="outline"
                      className="w-full border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white"
                      disabled={Object.keys(editableData).length === 0}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Add as Test Case
                    </Button>
                    
                    <Button
                      onClick={() => {
                        console.log('Validated data:', editableData);
                        toast.success("Data validated! Check console for details.");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validate & Log Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}