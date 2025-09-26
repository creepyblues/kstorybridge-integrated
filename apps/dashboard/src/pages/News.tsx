import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge
} from "@kstorybridge/ui";
import { RefreshCw, Search } from "lucide-react";
import { useToast } from "@kstorybridge/ui";

interface NewsSection {
  title: string;
  content: string;
  contentHtml: string; // Preserve HTML for links
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

export default function News() {
  const { toast } = useToast();
  const [sections, setSections] = useState<NewsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What's actually searched/filtered

  const RSS_FEED_URL = "https://rss.beehiiv.com/feeds/oaQs6YbGE8.xml";
  const CORS_PROXY = "https://corsproxy.io/?url=";

  useEffect(() => {
    fetchNewsArticles();
  }, []);

  const fetchNewsArticles = async () => {
    try {
      setLoading(true);
      
      // Fetch RSS feed through CORS proxy
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_FEED_URL)}`);
      const text = await response.text();
      
      // Parse XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      
      // Check for parsing errors
      const parserError = xml.querySelector("parsererror");
      if (parserError) {
        throw new Error("Failed to parse RSS feed");
      }

      // Extract sections from ALL items in the RSS feed
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

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const extractSectionsFromContent = (htmlContent: string): NewsSection[] => {
    const sections: NewsSection[] = [];
    
    // Parse HTML content and find section divs
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const sectionDivs = doc.querySelectorAll('div.section');
    
    sectionDivs.forEach((sectionDiv, index) => {
      try {
        // Extract hashtags from the first h6.heading
        const hashtagHeading = sectionDiv.querySelector('h6.heading');
        const tags = hashtagHeading ? 
          (hashtagHeading.textContent?.match(/#\w+/g) || []).map(tag => tag.substring(1)) : [];
        
        // Extract main title from h1.heading
        const titleHeading = sectionDiv.querySelector('h1.heading');
        let title = '';
        if (titleHeading) {
          // Remove HTML tags and get clean text
          title = titleHeading.textContent?.trim() || '';
        }
        
        // If no h1 title found, check for any prominent text that could be a title
        if (!title) {
          const firstParagraph = sectionDiv.querySelector('p.paragraph');
          if (firstParagraph) {
            const firstText = firstParagraph.textContent?.trim() || '';
            // Check if this looks like a title (short, possibly with emoji)
            if (firstText.length < 100 && (firstText.includes('Editor') || firstText.includes('Opening') || firstText.includes('wrap'))) {
              title = firstText;
            }
          }
        }
        
        if (!title) {
          title = `Section ${index + 1}`;
        }
        
        // Extract main content paragraphs (excluding takeaway and IP reference)
        const paragraphs = sectionDiv.querySelectorAll('p.paragraph');
        let mainContent = '';
        let mainContentHtml = '';
        let takeaway = '';
        let takeawayHtml = '';
        let isInReference = false;
        
        paragraphs.forEach(p => {
          const text = p.textContent?.trim() || '';
          const html = p.innerHTML?.trim() || '';
          
          // Skip empty paragraphs
          if (!text) return;
          
          // Check if this is the IP Reference header
          if (text === 'IP Reference') {
            isInReference = true;
            return;
          }
          
          // Skip paragraphs that are part of the reference section (after "IP Reference")
          if (isInReference) {
            return;
          }
          
          // Extract takeaway
          if (text.startsWith('Takeaway:')) {
            takeaway = text.replace(/^Takeaway:\s*/, '').trim();
            takeawayHtml = html.replace(/^<[^>]*>Takeaway:<\/[^>]*>\s*/, '').trim();
            return;
          }
          
          // Add to main content
          if (mainContent) {
            mainContent += '\n\n';
            mainContentHtml += '\n\n';
          }
          mainContent += text;
          mainContentHtml += html;
        });
        
        // Extract reference information from list items
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
        
        // Skip editorial sections - check all text in the section
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
        
        // Check if this section contains editorial content
        const isEditorial = editorialPhrases.some(phrase => 
          allSectionText.includes(phrase.toLowerCase())
        );
        
        // Also check specific title patterns
        const titleLower = title.toLowerCase();
        const hasEditorialTitle = 
          titleLower.includes('editor') ||
          titleLower.includes('opening remark') ||
          titleLower.includes('wrap for this week') ||
          titleLower.includes('that\'s a wrap');
        
        // Only add section if we have meaningful content and it's not an editorial section
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

  // Filter sections based on search term
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-2 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">K-CONTENT NEWS</h2>
              <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
                The latest hot K-content news you don't want to miss
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mb-6 sm:mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 text-sm sm:text-base lg:text-lg bg-transparent border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-gray-400 text-midnight-ink"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
              <Button
                type="submit"
                className="border-gray-300 hover:bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors"
              >
                Search
              </Button>
              {searchTerm && (
                <Button
                  type="button"
                  onClick={handleClearSearch}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Results count when searching */}
          {searchTerm && (
            <div className="mb-6 text-sm text-midnight-ink-600">
              Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}

          {/* Newsletter Sections */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
            </div>
          ) : filteredSections.length === 0 ? (
            <Card className="bg-transparent border-gray-300 shadow-none">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No news sections found matching "${searchTerm}"`
                    : "No news sections available at the moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
          
          <div className="space-y-8">
            {filteredSections.map((section, index) => {
              return (
                <div
                  key={`section-${index}`}
                  className="bg-transparent border-gray-300 border shadow-none rounded-2xl p-3 sm:p-5 mx-1 sm:mx-8 my-4 sm:my-8 newsletter-section"
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
                  <h2 className="text-left text-2xl md:text-3xl font-bold italic text-gray-800 leading-tight mb-6">
                    {section.title}
                  </h2>
                  
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
              );
            })}
          </div>
          )}
        </div>
      </div>
    </>
  );
}