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
  TestTube
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { scraperService, type ScrapingResult, type ScrapedTitleData } from "@/services/scraperService";
import { toast } from "sonner";

export default function AdminScraperTest() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [editableData, setEditableData] = useState<Partial<ScrapedTitleData>>({});

  // Sample URLs for testing (including real examples from images)
  const sampleUrls = [
    "https://series.naver.com/comic/detail.series?productNo=11979674",
    "https://comic.naver.com/webtoon/list?titleId=814543", 
    "https://www.toons.kr/example-title",
    "https://www.webtoons.com/en/drama/example/list",
    "https://page.kakao.com/content/example"
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
      // Use the actual scraper service for testing
      const scrapingResult = await scraperService.scrapeTitle(url);
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

  const simulateScraping = async (testUrl: string): Promise<ScrapingResult> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Detect platform for mock data
    const hostname = testUrl.toLowerCase();
    let mockData: Partial<ScrapedTitleData> = {
      title_url: testUrl
    };
    
    let extractedFields: string[] = [];
    
    if (hostname.includes('toons.kr')) {
      mockData = {
        title_url: testUrl,
        title_name_kr: "시간을 되돌리는 용사",
        genre: "fantasy",
        writer: "김작가",
        illustrator: "박화가",
        synopsis: "용사가 시간을 되돌려 세계를 구원하는 판타지 웹툰입니다. 마왕을 쓰러뜨리기 위해 과거로 돌아간 용사의 모험을 그린 작품으로, 흥미진진한 전개와 매력적인 캐릭터들이 특징입니다.",
        content_format: "webtoon",
        chapters: 45,
        title_image: "https://via.placeholder.com/300x400?text=Toons.kr+Cover",
        completed: false
      };
      extractedFields = ['title_name_kr', 'genre', 'writer', 'illustrator', 'synopsis', 'content_format', 'chapters', 'title_image'];
    } else if (hostname.includes('webtoons.com')) {
      mockData = {
        title_url: testUrl,
        title_name_en: "Time Rewind Hero",
        title_name_kr: "시간을 되돌리는 용사",
        genre: "fantasy",
        author: "Kim Writer",
        description: "A fantasy webtoon about a hero who goes back in time to save the world. Follow the adventures of the hero who returned to the past to defeat the demon king.",
        content_format: "webtoon",
        title_image: "https://via.placeholder.com/300x400?text=Webtoons+Cover"
      };
      extractedFields = ['title_name_en', 'title_name_kr', 'genre', 'author', 'description', 'content_format', 'title_image'];
    } else if (hostname.includes('naver.com') || hostname.includes('series.naver.com')) {
      // Naver specific mock data based on the example images
      const isSeriesNaver = hostname.includes('series.naver.com');
      const isWebtoonNaver = hostname.includes('comic.naver.com');
      
      if (isSeriesNaver) {
        // Mock data based on 화신과 천재검귀 example
        mockData = {
          title_url: testUrl,
          title_name_kr: "화신과 천재검귀",
          genre: "action", // 무협 maps to action
          story_author: "황제덕",
          writer: "황제덕", 
          art_author: "김시준",
          illustrator: "김시준",
          author: "황제덕",
          description: "네이버 시리즈에서 추출된 작품 설명입니다. 화신과 천재검귀의 모험을 그린 무협 소설입니다.",
          content_format: "web_novel",
          completed: true,
          title_image: "https://via.placeholder.com/200x280?text=화신과+천재검귀",
          tags: ["rating:9.7", "views:116.2만", "likes:126", "age_rating:15"]
        };
        extractedFields = ['title_name_kr', 'genre', 'story_author', 'writer', 'art_author', 'illustrator', 'author', 'description', 'content_format', 'completed', 'title_image', 'tags'];
      } else if (isWebtoonNaver) {
        // Mock data based on 마음의소리 example  
        mockData = {
          title_url: testUrl,
          title_name_kr: "마음의소리",
          genre: "comedy", 
          author: "조석",
          writer: "조석",
          art_author: "조석", 
          description: "네이버 웹툰에서 추출된 작품 설명입니다. 일상의 재미있는 순간들을 그린 개그 웹툰입니다.",
          content_format: "webtoon",
          completed: false,
          title_image: "https://via.placeholder.com/200x280?text=마음의소리",
          tags: ["likes:233686"]
        };
        extractedFields = ['title_name_kr', 'genre', 'author', 'writer', 'art_author', 'description', 'content_format', 'completed', 'title_image', 'tags'];
      } else {
        // Generic Naver fallback
        mockData = {
          title_url: testUrl,
          title_name_kr: "네이버 테스트 작품",
          genre: "drama",
          author: "네이버작가",
          description: "네이버에서 추출된 작품 설명입니다.",
          content_format: "webtoon",
          title_image: "https://via.placeholder.com/200x280?text=Naver+Content"
        };
        extractedFields = ['title_name_kr', 'genre', 'author', 'description', 'content_format', 'title_image'];
      }
    } else if (hostname.includes('kakao')) {
      mockData = {
        title_url: testUrl,
        title_name_kr: "카카오 테스트 작품",
        genre: "romance",
        author: "카카오작가",
        description: "카카오페이지의 인기 로맨스 소설입니다.",
        content_format: "web_novel",
        title_image: "https://via.placeholder.com/300x400?text=Kakao+Page"
      };
      extractedFields = ['title_name_kr', 'genre', 'author', 'description', 'content_format', 'title_image'];
    } else {
      // Generic scraping result
      mockData = {
        title_url: testUrl,
        title_name_kr: "테스트 제목",
        description: "웹사이트에서 추출된 설명입니다.",
        title_image: "https://via.placeholder.com/300x400?text=Generic+Cover"
      };
      extractedFields = ['title_name_kr', 'description', 'title_image'];
    }

    const result = {
      success: extractedFields.length > 0,
      data: mockData as ScrapedTitleData,
      confidence: Math.min(extractedFields.length * 0.1 + 0.2, 0.95), // Better confidence calculation
      extractedFields
    };

    console.log('🎯 Mock scraping result:', {
      url: testUrl,
      platform: hostname.includes('naver') ? 'Naver' : hostname.includes('toons.kr') ? 'Toons.kr' : hostname.includes('webtoons') ? 'Webtoons' : hostname.includes('kakao') ? 'Kakao' : 'Generic',
      fieldsCount: extractedFields.length,
      confidence: result.confidence,
      extractedFields
    });

    return result;
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
      'title_url': <Globe className="w-4 h-4" />
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
                </div>
              </CardContent>
            </Card>

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
                  <div className="max-h-[600px] overflow-y-auto space-y-4">
                    {/* Title Fields */}
                    {(editableData.title_name_kr || editableData.title_name_en) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-midnight-ink border-b pb-1">Title Information</h4>
                        
                        {editableData.title_name_kr && (
                          <div className="space-y-1">
                            <Label className="text-sm flex items-center gap-2">
                              <BookOpen className="w-3 h-3" />
                              Korean Title
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(editableData.title_name_kr || '')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </Label>
                            <Input
                              value={editableData.title_name_kr || ''}
                              onChange={(e) => handleFieldEdit('title_name_kr', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                        
                        {editableData.title_name_en && (
                          <div className="space-y-1">
                            <Label className="text-sm flex items-center gap-2">
                              <BookOpen className="w-3 h-3" />
                              English Title
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(editableData.title_name_en || '')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </Label>
                            <Input
                              value={editableData.title_name_en || ''}
                              onChange={(e) => handleFieldEdit('title_name_en', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Fields */}
                    {(editableData.description || editableData.synopsis) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-midnight-ink border-b pb-1">Content Details</h4>
                        
                        {editableData.description && (
                          <div className="space-y-1">
                            <Label className="text-sm">Description</Label>
                            <Textarea
                              value={editableData.description || ''}
                              onChange={(e) => handleFieldEdit('description', e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                        )}
                        
                        {editableData.synopsis && (
                          <div className="space-y-1">
                            <Label className="text-sm">Synopsis</Label>
                            <Textarea
                              value={editableData.synopsis || ''}
                              onChange={(e) => handleFieldEdit('synopsis', e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Creator Fields */}
                    {(editableData.author || editableData.writer || editableData.illustrator || editableData.art_author || editableData.story_author) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-midnight-ink border-b pb-1">Creator Information</h4>
                        
                        {editableData.author && (
                          <div className="space-y-1">
                            <Label className="text-sm">Author</Label>
                            <Input
                              value={editableData.author || ''}
                              onChange={(e) => handleFieldEdit('author', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                        
                        {editableData.writer && (
                          <div className="space-y-1">
                            <Label className="text-sm">Writer</Label>
                            <Input
                              value={editableData.writer || ''}
                              onChange={(e) => handleFieldEdit('writer', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                        
                        {editableData.illustrator && (
                          <div className="space-y-1">
                            <Label className="text-sm">Illustrator</Label>
                            <Input
                              value={editableData.illustrator || ''}
                              onChange={(e) => handleFieldEdit('illustrator', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata Fields */}
                    {(editableData.genre || editableData.content_format || editableData.chapters !== undefined || editableData.completed !== undefined) && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-midnight-ink border-b pb-1">Metadata</h4>
                        
                        {editableData.genre && (
                          <div className="space-y-1">
                            <Label className="text-sm">Genre</Label>
                            <Input
                              value={editableData.genre || ''}
                              onChange={(e) => handleFieldEdit('genre', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                        
                        {editableData.content_format && (
                          <div className="space-y-1">
                            <Label className="text-sm">Content Format</Label>
                            <Input
                              value={editableData.content_format || ''}
                              onChange={(e) => handleFieldEdit('content_format', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        )}
                        
                        {editableData.chapters !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-sm">Chapters</Label>
                            <Input
                              type="number"
                              value={editableData.chapters || ''}
                              onChange={(e) => handleFieldEdit('chapters', parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                        )}

                        {editableData.completed !== undefined && (
                          <div className="space-y-1">
                            <Label className="text-sm">Completed Status</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editableData.completed || false}
                                onChange={(e) => handleFieldEdit('completed', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm">{editableData.completed ? 'Completed' : 'Ongoing'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* URLs */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-midnight-ink border-b pb-1">URLs</h4>
                      
                      {editableData.title_image && (
                        <div className="space-y-1">
                          <Label className="text-sm flex items-center gap-2">
                            <Image className="w-3 h-3" />
                            Title Image URL
                          </Label>
                          <Input
                            value={editableData.title_image || ''}
                            onChange={(e) => handleFieldEdit('title_image', e.target.value)}
                            className="text-sm"
                          />
                          {editableData.title_image && (
                            <div className="mt-2">
                              <img 
                                src={editableData.title_image} 
                                alt="Title Preview" 
                                className="w-24 h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/96x128?text=No+Image';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <Label className="text-sm flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          Source URL
                        </Label>
                        <Input
                          value={editableData.title_url || ''}
                          onChange={(e) => handleFieldEdit('title_url', e.target.value)}
                          className="text-sm"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        console.log('Validated data:', editableData);
                        toast.success("Data validated! Check console for details.");
                      }}
                      className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validate & Use Data
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