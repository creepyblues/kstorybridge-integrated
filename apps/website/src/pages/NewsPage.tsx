import { useState, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import UniversalHeader from "../components/UniversalHeader";
import Footer from "../components/Footer";
import { useToast } from "../hooks/use-toast";
import { Button } from "@kstorybridge/ui";

interface NewsSection {
  title: string;
  content: string;
  contentHtml: string;
  takeaway?: string;
  takeawayHtml?: string;
  reference?: {
    titleFormat?: string;
    titleFormatHtml?: string;
    keyNumbers?: string;
    whyProducersCare?: string;
  };
  tags?: string[];
}

export default function NewsPage() {
  const { toast } = useToast();
  const [sections, setSections] = useState<NewsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const RSS_FEED_URL = "https://rss.beehiiv.com/feeds/oaQs6YbGE8.xml";
  const CORS_PROXY = "https://api.allorigins.win/raw?url=";

  useEffect(() => {
    fetchNewsArticles();
  }, []);

  const fetchNewsArticles = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_FEED_URL)}`);
      const text = await response.text();
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      
      const parserError = xml.querySelector("parsererror");
      if (parserError) {
        throw new Error("Failed to parse RSS feed");
      }

      const items = xml.querySelectorAll("item");
      const sectionsData: NewsSection[] = [];
      
      items.forEach((item) => {
        const rawContent = item.querySelector("content\\:encoded, encoded")?.textContent || 
                          item.querySelector("description")?.textContent || "";
        const sections = extractSectionsFromContent(rawContent);
        sectionsData.push(...sections);
      });

      setSections(sectionsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({ 
        title: "Error loading news", 
        description: "Failed to fetch newsletter articles. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const extractSectionsFromContent = (htmlContent: string): NewsSection[] => {
    const sections: NewsSection[] = [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const sectionDivs = doc.querySelectorAll('div.section');
    
    sectionDivs.forEach((sectionDiv, index) => {
      try {
        const hashtagHeading = sectionDiv.querySelector('h6.heading');
        const tags = hashtagHeading ? 
          (hashtagHeading.textContent?.match(/#\w+/g) || []).map(tag => tag.substring(1)) : [];
        
        const titleHeading = sectionDiv.querySelector('h1.heading');
        let title = '';
        if (titleHeading) {
          title = titleHeading.textContent?.trim() || '';
        }
        
        if (!title) {
          const firstParagraph = sectionDiv.querySelector('p.paragraph');
          if (firstParagraph) {
            const firstText = firstParagraph.textContent?.trim() || '';
            if (firstText.length < 100 && (firstText.includes('Editor') || firstText.includes('Opening') || firstText.includes('wrap'))) {
              title = firstText;
            }
          }
        }
        
        if (!title) {
          title = `Section ${index + 1}`;
        }
        
        const paragraphs = sectionDiv.querySelectorAll('p.paragraph');
        let mainContent = '';
        let mainContentHtml = '';
        let takeaway = '';
        let takeawayHtml = '';
        let isInReference = false;
        
        paragraphs.forEach(p => {
          const text = p.textContent?.trim() || '';
          const html = p.innerHTML?.trim() || '';
          
          if (!text) return;
          
          if (text === 'IP Reference') {
            isInReference = true;
            return;
          }
          
          if (isInReference) {
            return;
          }
          
          if (text.startsWith('Takeaway:')) {
            takeaway = text.replace(/^Takeaway:\s*/, '').trim();
            takeawayHtml = html.replace(/^<[^>]*>Takeaway:<\/[^>]*>\s*/, '').trim();
            return;
          }
          
          if (mainContent) {
            mainContent += '\n\n';
            mainContentHtml += '\n\n';
          }
          mainContent += text;
          mainContentHtml += html;
        });
        
        const reference: any = {};
        const listItems = sectionDiv.querySelectorAll('li p.paragraph');
        
        listItems.forEach(li => {
          const text = li.textContent?.trim() || '';
          const html = li.innerHTML?.trim() || '';
          
          if (text.startsWith('Title / Format:')) {
            reference.titleFormat = text.replace(/^Title \/ Format:\s*/, '').trim();
            reference.titleFormatHtml = html.replace(/^<[^>]*>Title \/ Format:<\/[^>]*>\s*/, '').trim();
          } else if (text.startsWith('Key Numbers:')) {
            reference.keyNumbers = text.replace(/^Key Numbers:\s*/, '').trim();
          } else if (text.startsWith('Why Producers Care:')) {
            reference.whyProducersCare = text.replace(/^Why Producers Care:\s*/, '').trim();
          }
        });
        
        const allSectionText = sectionDiv.textContent?.toLowerCase() || '';
        
        const editorialPhrases = [
          'editor\'s comment',
          'editor comment',
          'opening remark',
          'that\'s a wrap',
          'that\'s a wrap for this week',
          'closing remark',
          'thank you so much for reading',
          'thank you for reading',
          'the kstorybridge team',
          'enjoyed this week\'s newsletter',
          'share the good stuff with your friends',
          'hi everyone',
          'excited to share this week\'s roundup',
          'grab a coffee',
          'let\'s dive in together',
          'that\'s what friends are for',
          'the throughline this week is',
          'if you\'re scouting'
        ];
        
        const isEditorial = editorialPhrases.some(phrase => 
          allSectionText.includes(phrase.toLowerCase())
        );
        
        const titleLower = title.toLowerCase();
        const hasEditorialTitle = 
          titleLower.includes('editor') ||
          titleLower.includes('opening remark') ||
          titleLower.includes('wrap for this week') ||
          titleLower.includes('that\'s a wrap');
        
        if (title && (mainContent || takeaway) && !isEditorial && !hasEditorialTitle) {
          sections.push({
            title,
            content: mainContent,
            contentHtml: mainContentHtml,
            takeaway: takeaway || undefined,
            takeawayHtml: takeawayHtml || undefined,
            reference: Object.keys(reference).length > 0 ? reference : undefined,
            tags: tags.length > 0 ? tags : undefined
          });
        }
      } catch (error) {
        console.error('Error parsing section:', error);
      }
    });
    
    return sections;
  };

  const filteredSections = sections.filter(section => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const inTitle = section.title?.toLowerCase().includes(searchLower);
    const inContent = section.content?.toLowerCase().includes(searchLower);
    const inTakeaway = section.takeaway?.toLowerCase().includes(searchLower);
    const inTags = section.tags?.some(tag => tag.toLowerCase().includes(searchLower));
    const inReference = 
      section.reference?.titleFormat?.toLowerCase().includes(searchLower) ||
      section.reference?.keyNumbers?.toLowerCase().includes(searchLower) ||
      section.reference?.whyProducersCare?.toLowerCase().includes(searchLower);
    
    return inTitle || inContent || inTakeaway || inTags || inReference;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
  };

  return (
    <>
      <style>{`
        .newsletter-section a {
          color: #1e40af;
          text-decoration: underline;
        }
        .newsletter-section a:hover {
          color: #1d4ed8;
          text-decoration: none;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-porcelain-blue-50 via-white to-sunset-orange-50">
        <UniversalHeader />
        
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-midnight-ink mb-4">
              K-Content News
            </h1>
            <p className="text-lg md:text-xl text-midnight-ink-600 max-w-3xl mx-auto">
              The latest hot K-content news you don't want to miss
            </p>
          </div>


          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-4 text-lg bg-white border-0 rounded-2xl shadow-md outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
              <Button
                type="submit"
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Search
              </Button>
              {searchTerm && (
                <Button
                  type="button"
                  onClick={handleClearSearch}
                  variant="outline"
                  className="text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5 px-4 py-2 rounded-lg font-medium"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Results count */}
          {searchTerm && (
            <div className="mb-6 text-sm text-midnight-ink-600 text-center">
              Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}

          {/* News Sections */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal"></div>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <p className="text-gray-500">
                {searchTerm 
                  ? `No news sections found matching "${searchTerm}"`
                  : "No news sections available at the moment."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredSections.map((section, index) => (
                <div
                  key={`section-${index}`} 
                  className="rounded-[20px] p-8 newsletter-section"
                  style={{ backgroundColor: '#BCDFF4' }}
                >
                  {/* Tags */}
                  {section.tags && section.tags.length > 0 && (
                    <div className="text-left mb-4">
                      <h6 className="text-base font-normal text-gray-800">
                        {section.tags.map(tag => `#${tag}`).join(' ')}
                      </h6>
                    </div>
                  )}
                  
                  {/* Title */}
                  <h1 className="text-left text-2xl md:text-3xl font-bold italic text-gray-800 leading-tight mb-6">
                    {section.title}
                  </h1>
                  
                  {/* Main Content */}
                  {section.contentHtml && (
                    <div className="text-left text-base text-gray-800 leading-relaxed space-y-4 mb-6">
                      {section.contentHtml.split('\n\n').filter(p => p.trim()).map((paragraph, pIndex) => (
                        <p 
                          key={pIndex} 
                          className="text-gray-800"
                          dangerouslySetInnerHTML={{ __html: paragraph }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Takeaway */}
                  {section.takeaway && (
                    <p className="text-left text-base text-gray-800 leading-relaxed mb-6">
                      <span className="font-bold">Takeaway:</span>{' '}
                      {section.takeawayHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: section.takeawayHtml }} />
                      ) : (
                        section.takeaway
                      )}
                    </p>
                  )}
                  
                  {/* IP Reference Section */}
                  {section.reference && Object.keys(section.reference).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-left text-base font-bold text-gray-800">
                        IP Reference
                      </p>
                      <ul className="space-y-2 ml-4">
                        {section.reference.titleFormat && (
                          <li className="text-left text-base text-gray-800 leading-relaxed">
                            <span className="font-bold">Title / Format:</span>{' '}
                            {section.reference.titleFormatHtml ? (
                              <span dangerouslySetInnerHTML={{ __html: section.reference.titleFormatHtml }} />
                            ) : (
                              section.reference.titleFormat
                            )}
                          </li>
                        )}
                        {section.reference.keyNumbers && (
                          <li className="text-left text-base text-gray-800 leading-relaxed">
                            <span className="font-bold">Key Numbers:</span> {section.reference.keyNumbers}
                          </li>
                        )}
                        {section.reference.whyProducersCare && (
                          <li className="text-left text-base text-gray-800 leading-relaxed">
                            <span className="font-bold">Why Producers Care:</span> {section.reference.whyProducersCare}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}