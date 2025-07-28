import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Sparkles, 
  Clock,
  ArrowRight,
  Heart,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface FeaturedSectionProps {
  userInterests?: string[];
  onTitleClick?: (titleId: string) => void;
}

// Mock data for featured content
const featuredCollections = [
  {
    id: "trending",
    title: "Trending This Week",
    subtitle: "What everyone's talking about",
    icon: TrendingUp,
    color: "bg-gradient-to-r from-sunrise-coral to-sunrise-coral-400",
    items: [
      {
        id: "1",
        title: "Mystic Academy Chronicles", 
        author: "Kim Min-jun",
        genre: "Fantasy",
        thumbnail: "/thumbnails/mystic-academy.jpg",
        views: 25400,
        rating: 4.8,
        tags: ["Magic", "School", "Adventure"]
      },
      {
        id: "2", 
        title: "Corporate Love Simulator",
        author: "Park So-young", 
        genre: "Romance",
        thumbnail: "/thumbnails/corporate-love.jpg",
        views: 18200,
        rating: 4.6,
        tags: ["Office", "Romance", "Comedy"]
      },
      {
        id: "3",
        title: "Digital Phantom Detective",
        author: "Lee Chang-ho",
        genre: "Mystery",
        thumbnail: "/thumbnails/digital-phantom.jpg", 
        views: 15800,
        rating: 4.9,
        tags: ["Detective", "Technology", "Thriller"]
      }
    ]
  },
  {
    id: "personalized",
    title: "Picked For You",
    subtitle: "Based on your interests",
    icon: Sparkles,
    color: "bg-gradient-to-r from-hanok-teal to-porcelain-blue-600",
    items: [
      {
        id: "4",
        title: "Time Loop Café Stories",
        author: "Jung Hye-jin",
        genre: "Slice of Life", 
        thumbnail: "/thumbnails/time-loop-cafe.jpg",
        views: 12300,
        rating: 4.7,
        tags: ["Time Loop", "Daily Life", "Heartwarming"]
      },
      {
        id: "5",
        title: "Neon Dynasty Rebels", 
        author: "Choi Jun-seok",
        genre: "Sci-Fi",
        thumbnail: "/thumbnails/neon-dynasty.jpg",
        views: 19600,
        rating: 4.5,
        tags: ["Cyberpunk", "Rebellion", "Future"]
      }
    ]
  },
  {
    id: "recent",
    title: "Fresh Releases",
    subtitle: "Brand new content",
    icon: Clock,
    color: "bg-gradient-to-r from-porcelain-blue-500 to-warm-sand-400",
    items: [
      {
        id: "6",
        title: "Moonlight Martial Arts",
        author: "Yoon Tae-hyung",
        genre: "Action",
        thumbnail: "/thumbnails/moonlight-martial.jpg",
        views: 8900,
        rating: 4.4,
        tags: ["Martial Arts", "Training", "Competition"]
      },
      {
        id: "7",
        title: "Ghost Kitchen Chronicles",
        author: "Han So-ra",
        genre: "Supernatural",
        thumbnail: "/thumbnails/ghost-kitchen.jpg",
        views: 6700,
        rating: 4.3,
        tags: ["Ghosts", "Cooking", "Comedy"]
      }
    ]
  }
];

export function FeaturedSection({ userInterests = [], onTitleClick }: FeaturedSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredCollections.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredCollections.length) % featuredCollections.length);
  };

  const currentCollection = featuredCollections[currentSlide];

  return (
    <div className="space-y-8">
      {/* Hero Feature Carousel */}
      <Card className="bg-gradient-to-br from-snow-white via-porcelain-blue-50 to-warm-sand-50 border-porcelain-blue-200 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentCollection.color}`}>
                <currentCollection.icon className="h-6 w-6 text-snow-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-midnight-ink">{currentCollection.title}</CardTitle>
                <p className="text-midnight-ink-600 text-sm">{currentCollection.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSlide}
                className="h-8 w-8 p-0 text-midnight-ink-600 hover:text-hanok-teal hover:bg-porcelain-blue-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextSlide}
                className="h-8 w-8 p-0 text-midnight-ink-600 hover:text-hanok-teal hover:bg-porcelain-blue-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCollection.items.map((item, index) => (
              <Card 
                key={item.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 bg-snow-white border-porcelain-blue-200 overflow-hidden"
                onClick={() => onTitleClick?.(item.id)}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-porcelain-blue-100 to-warm-sand-100 relative overflow-hidden">
                  <img 
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-thumbnail.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/60 via-transparent to-transparent" />
                  
                  {/* Stats Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-snow-white">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{(item.views / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-sunrise-coral" />
                          <span>{item.rating}</span>
                        </div>
                      </div>
                      <Badge className="bg-hanok-teal text-snow-white border-0 text-xs">
                        {item.genre}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-3">
                  <h4 className="font-semibold text-midnight-ink group-hover:text-hanok-teal transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-midnight-ink-600 mb-2">by {item.author}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs bg-warm-sand text-midnight-ink-700 border-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View All Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              className="group border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-snow-white"
            >
              View All {currentCollection.title}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="bg-gradient-to-br from-sunrise-coral-50 to-sunrise-coral-100 border-sunrise-coral-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-sunrise-coral rounded-lg">
              <Heart className="h-6 w-6 text-snow-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-midnight-ink">247</p>
              <p className="text-sm text-midnight-ink-600">Titles in your favorites</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-hanok-teal-50 to-hanok-teal-100 border-hanok-teal-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-hanok-teal rounded-lg">
              <Eye className="h-6 w-6 text-snow-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-midnight-ink">1,842</p>
              <p className="text-sm text-midnight-ink-600">Titles viewed this month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-porcelain-blue-50 to-porcelain-blue-100 border-porcelain-blue-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-porcelain-blue-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-snow-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-midnight-ink">12</p>
              <p className="text-sm text-midnight-ink-600">New recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2">
        {featuredCollections.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-hanok-teal w-6' 
                : 'bg-porcelain-blue-300 hover:bg-porcelain-blue-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}