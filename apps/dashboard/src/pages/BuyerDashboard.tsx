
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Grid,
  Heart,
  Compass,
  TrendingUp
} from "lucide-react";
import { TitleCard } from "@/components/dashboard/TitleCard";
import { SearchAndFilter } from "@/components/dashboard/SearchAndFilter";
import { FeaturedSection } from "@/components/dashboard/FeaturedSection";
import { titlesService, type Title } from "@/services/titlesService";
import { useToast } from "@/components/ui/use-toast";

// Mock data for titles
const mockTitles = [
  {
    id: "1",
    title_name_en: "Mystic Academy Chronicles",
    title_name_kr: "신비한 아카데미 연대기",
    genre: "Fantasy",
    author: "Kim Min-jun",
    synopsis: "A young student discovers magical powers at a prestigious academy where ancient secrets lurk in every corner. Join the adventure as mysteries unfold and friendships are tested.",
    title_image: "/covers/mystic-academy.jpg",
    rating: 4.8,
    views: 25400,
    likes: 3200,
    content_format: "Webtoon",
    tags: ["Magic", "School Life", "Adventure", "Coming of Age"]
  },
  {
    id: "2",
    title_name_en: "Corporate Love Simulator",
    title_name_kr: "회사 연애 시뮬레이터",
    genre: "Romance",
    author: "Park So-young",
    synopsis: "Navigate office romance in this heartwarming story about finding love in the most unexpected places. Will career ambitions clash with matters of the heart?",
    title_image: "/covers/corporate-love.jpg",
    rating: 4.6,
    views: 18200,
    likes: 2100,
    content_format: "Webnovel",
    tags: ["Office Romance", "Comedy", "Modern Life"]
  },
  {
    id: "3",
    title_name_en: "Digital Phantom Detective",
    title_name_kr: "디지털 팬텀 탐정",
    genre: "Mystery",
    author: "Lee Chang-ho",
    synopsis: "In a world where crimes happen in virtual reality, one detective must navigate both digital and physical realms to solve the impossible.",
    title_image: "/covers/digital-phantom.jpg",
    rating: 4.9,
    views: 15800,
    likes: 1900,
    content_format: "Video",
    tags: ["Detective", "Technology", "Thriller"]
  },
  {
    id: "4",
    title_name_en: "Time Loop Café Stories",
    title_name_kr: "시간 루프 카페 이야기",
    genre: "Slice of Life",
    author: "Jung Hye-jin",
    synopsis: "Every day repeats at this mysterious café, but each loop brings new customers with unique stories and problems to solve.",
    title_image: "/covers/time-loop-cafe.jpg",
    rating: 4.7,
    views: 12300,
    likes: 1650,
    content_format: "Webtoon",
    tags: ["Time Loop", "Daily Life", "Heartwarming"]
  },
  {
    id: "5",
    title_name_en: "Neon Dynasty Rebels",
    title_name_kr: "네온 왕조 반란군",
    genre: "Sci-Fi",
    author: "Choi Jun-seok",
    synopsis: "In a cyberpunk future ruled by mega-corporations, a group of rebels fights for freedom using advanced technology and street smarts.",
    title_image: "/covers/neon-dynasty.jpg",
    rating: 4.5,
    views: 19600,
    likes: 2400,
    content_format: "Webnovel",
    tags: ["Cyberpunk", "Rebellion", "Action"]
  },
  {
    id: "6",
    title_name_en: "Moonlight Martial Arts",
    title_name_kr: "달빛 무예",
    genre: "Action",
    author: "Yoon Tae-hyung",
    synopsis: "A martial arts prodigy must master ancient techniques while competing in modern tournaments to protect his family's legacy.",
    title_image: "/covers/moonlight-martial.jpg",
    rating: 4.4,
    views: 8900,
    likes: 1200,
    content_format: "Webtoon",
    tags: ["Martial Arts", "Training", "Competition"]
  }
];

export default function BuyerDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [filteredTitles, setFilteredTitles] = useState<Title[]>([]);
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const data = await titlesService.getAllTitles();
      setTitles(data);
      setFilteredTitles(data);
    } catch (error) {
      console.error("Error loading titles:", error);
      toast({ title: "Error loading titles", variant: "destructive" });
      // Fallback to mock data if real data fails
      setTitles(mockTitles as any);
      setFilteredTitles(mockTitles as any);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = titles.filter(title => 
      title.title_name_en?.toLowerCase().includes(query.toLowerCase()) ||
      title.title_name_kr.toLowerCase().includes(query.toLowerCase()) ||
      title.genre?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTitles(filtered);
  };

  const handleFilters = (newFilters: any) => {
    setFilters(newFilters);
    // Filter logic implementation would go here
  };

  const handleFavorite = (titleId: string) => {
    setFavorites(prev => 
      prev.includes(titleId) 
        ? prev.filter(id => id !== titleId)
        : [...prev, titleId]
    );
  };

  const handleTitleClick = (titleId: string) => {
    // Navigate to title details
    console.log('Navigate to title:', titleId);
  };

  const favoritesTitles = titles.filter(title => favorites.includes(title.title_id));

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search titles"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-6 mb-16">
          {["All", "Webtoons", "Series", "Movies"].map((filter) => (
            <Button
              key={filter}
              id={`dashboard-filter-${filter.toLowerCase()}-btn`}
              onClick={() => setActiveTab(filter.toLowerCase())}
              className={`px-8 py-3 rounded-2xl text-base font-medium ${
                activeTab === filter.toLowerCase() || (filter === "All" && activeTab === "discover")
                  ? "bg-hanok-teal text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-12">
          {/* Recently Added */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Recently Added</h2>
            <div className="space-y-6">
              {loading ? (
                <div className="bg-white rounded-2xl shadow-lg h-64 flex items-center justify-center">
                  <span className="text-gray-500">Loading...</span>
                </div>
              ) : filteredTitles.length > 0 ? (
                filteredTitles.slice(0, 1).map((title) => (
                  <Link key={title.title_id} to={`/titles/${title.title_id}`} className="block">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="relative">
                        <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-6">
                          {title.title_image ? (
                            <img 
                              src={title.title_image} 
                              alt={title.title_name_en || title.title_name_kr}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                // Fallback to placeholder if image fails
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="flex items-center justify-center w-full h-full">
                                    <div class="flex space-x-4">
                                      <div class="w-16 h-20 bg-gray-300 rounded-lg"></div>
                                      <div class="w-20 h-24 bg-gray-200 rounded-lg"></div>
                                      <div class="w-16 h-20 bg-gray-300 rounded-lg"></div>
                                    </div>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <div className="flex space-x-4">
                                <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                                <div className="w-20 h-24 bg-gray-200 rounded-lg"></div>
                                <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-6 left-6">
                          <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            {title.title_name_en || title.title_name_kr}
                          </h3>
                          <Button className="bg-hanok-teal text-white px-6 py-2 rounded-full text-sm font-medium">
                            ONGOING
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-lg h-64 flex items-center justify-center">
                  <span className="text-gray-500">No titles found</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Rated */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Top Rated</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Title</span>
                  <span className="font-semibold text-gray-700">Likes</span>
                </div>
              </div>
              <div className="divide-y">
                {loading ? (
                  <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
                ) : filteredTitles.length > 0 ? (
                  filteredTitles
                    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                    .slice(0, 5)
                    .map((title) => (
                      <Link key={title.title_id} to={`/titles/${title.title_id}`} className="block">
                        <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            {title.title_image && (
                              <div className="w-10 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                <img 
                                  src={title.title_image} 
                                  alt={title.title_name_en || title.title_name_kr}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <span className="text-gray-800 font-medium">
                              {title.title_name_en || title.title_name_kr}
                            </span>
                          </div>
                          <span className="text-gray-600">{(title.likes || 0).toLocaleString()}</span>
                        </div>
                      </Link>
                    ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">No titles found</div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
