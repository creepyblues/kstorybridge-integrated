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
    "https://page.kakao.com/home?seriesId=54100540",
    "https://page.kakao.com/content/54100540?tab_type=about",
    "https://series.naver.com/comic/detail.series?productNo=11979674",
    "https://comic.naver.com/webtoon/list?titleId=814543", 
    "https://page.kakao.com/content/50744771?tab_type=about",
    "https://webtoon.kakao.com/content/RAINBOW/4122?tab=profile",
    "https://www.toons.kr/example-title",
    "https://www.webtoons.com/en/drama/example/list"
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
        title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjA1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE2Ij5Ub29ucy5rciBDb3ZlcjwvdGV4dD4KPHN2Zz4K",
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
        title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjA1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE2Ij5XZWJ0b29ucyBDb3ZlcjwvdGV4dD4KPHN2Zz4K"
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
          title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQ1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE0Ij7tmZTsi6Dqs7wg7LKc7J6s6rSA6riIPC90ZXh0Pgo8L3N2Zz4K",
          tags: ["rating:9.7", "views:1162000", "likes:126", "age_rating:15"]
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
          title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQ1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE0Ij7rp4jsnYzsnZjshozrpqw8L3RleHQ+Cjwvc3ZnPgo=",
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
          title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQ1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE0Ij5OYXZlciBDb250ZW50PC90ZXh0Pgo8L3N2Zz4K"
        };
        extractedFields = ['title_name_kr', 'genre', 'author', 'description', 'content_format', 'title_image'];
      }
    } else if (hostname.includes('page.kakao.com')) {
      // Determine if it's the specific series we're testing
      const isTargetSeries = testUrl.includes('54100540') || testUrl.includes('seriesId=54100540');
      
      if (isTargetSeries) {
        // Mock data for "사랑에 번역앱이 필요한가요?" based on your specifications
        mockData = {
          title_url: testUrl,
          title_name_kr: "사랑에 번역앱이 필요한가요?",
          genre: "romance",
          art_author: "휘요",
          author: "휘요", 
          writer: "휘요",
          illustrator: "휘요",
          description: "현대 로맨스 웹툰으로, 번역앱을 통해 시작된 특별한 사랑 이야기를 그립니다.",
          content_format: "webtoon",
          title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRkY4MDgwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTMwIiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjEyIj7sgKzrnZHsl5Ag67KI7Jet7JWx7J20PC90ZXh0Pgo8dGV4dCB4PSIxMDAiIHk9IjE1MCIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRlciIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0ZGRkZGRiIgZm9udC1zaXplPSIxMiI+7ZWE7JqU7ZWc6rCA7JqUPzwvdGV4dD4KPHN2Zz4K",
          tags: ["views:6206000", "likes:9.9", "#현대로맨스", "#캠퍼스물", "#동거물", "#우연한만남", "#외국인남/혼혈", "#능력녀", "#경쟁구도", "#달달물", "#드라마"]
        };
        extractedFields = ['title_name_kr', 'genre', 'art_author', 'author', 'writer', 'illustrator', 'description', 'content_format', 'title_image', 'tags'];
      } else {
        // KakaoPage mock data based on 제젓니, 짝사랑 example
        mockData = {
          title_url: testUrl,
          title_name_kr: "제젓니, 짝사랑",
          genre: "romance",
          author: "조민재", 
          writer: "조민재",
          description: "시원한 웹툰 속 남자친구를, 그의 사하룰 뿐인 여주를 흔들어 버리고 그냥 타는 마지막 사하룰...",
          content_format: "webtoon",
          title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRkY2QjZCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQ1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE0Ij7soJzsoJ3ri4wg7Kyc7IKs656RPC90ZXh0Pgo8L3N2Zz4K",
          tags: ["rating:10.0", "views:90124000"]
        };
        extractedFields = ['title_name_kr', 'genre', 'author', 'writer', 'description', 'content_format', 'title_image', 'tags'];
      }
    } else if (hostname.includes('webtoon.kakao.com')) {
      // Kakao Webtoon mock data based on RAINBOW example
      mockData = {
        title_url: testUrl,
        title_name_en: "RAINBOW",
        genre: "fantasy",
        author: "강어틀",
        writer: "강어틀",
        story_author: "강어틀", 
        art_author: "강어틀",
        illustrator: "강어틀",
        description: "지독하도 험상한 위쟁어도 이정산 있는 승거지 파라디이스 '무치사'살",
        content_format: "webtoon",
        title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjNEVDREMzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQ1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE2Ij5SQUlOQk9XPC90ZXh0Pgo8L3N2Zz4K",
        tags: ["rating:7.9", "views:3327000"]
      };
      extractedFields = ['title_name_en', 'genre', 'author', 'writer', 'story_author', 'art_author', 'illustrator', 'description', 'content_format', 'title_image', 'tags'];
    } else if (hostname.includes('kakao')) {
      mockData = {
        title_url: testUrl,
        title_name_kr: "카카오 테스트 작품",
        genre: "romance",
        author: "카카오작가",
        description: "카카오페이지의 인기 로맨스 소설입니다.",
        content_format: "web_novel",
        title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjA1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE2Ij5LYWthbyBQYWdlPC90ZXh0Pgo8L3N2Zz4K"
      };
      extractedFields = ['title_name_kr', 'genre', 'author', 'description', 'content_format', 'title_image'];
    } else {
      // Generic scraping result
      mockData = {
        title_url: testUrl,
        title_name_kr: "테스트 제목",
        description: "웹사이트에서 추출된 설명입니다.",
        title_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjA1IiBkb21pbmFudC1iYXNlbGluZT0iY2VudGVyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LXNpemU9IjE2Ij5HZW5lcmljIENvdmVyPC90ZXh0Pgo8L3N2Zz4K"
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

                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        scraperService.testKoreanNumbers();
                        console.log('Korean number test completed - check console for results');
                      }}
                      className="w-full text-sm text-purple-600 hover:underline p-2 rounded border border-purple-200 hover:bg-purple-50"
                    >
                      🧮 Test Korean Number Conversion (Check Console)
                    </button>
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
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgOTYgMTI4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iMTI4IiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjQ4IiB5PSI2OCIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRlciIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0ZGRkZGRiIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
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