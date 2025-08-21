import { useState, useEffect } from "react";
import { Button, Card, CardContent, Input } from "@kstorybridge/ui";

import { Search } from "lucide-react";
import { titlesService, type Title } from "@/services/titlesService";
import FeaturedTitlesCarousel from "@/components/FeaturedTitlesCarousel";

export default function TitlesList() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Romance", "Drama", "Supernatural", "Period"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all titles - featured titles are now loaded by the carousel component
      const allTitles = await titlesService.getAllTitles();
      setTitles(allTitles || []);
      
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">TITLES</h1>
          <p className="text-xl text-midnight-ink-600 leading-relaxed">
            Manage and browse all Korean content titles.
          </p>
        </div>
        <div className="text-midnight-ink-600 text-lg font-medium">
          {titles.length} titles
        </div>
      </div>

      {/* Featured Titles Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Titles</h2>
        
        <FeaturedTitlesCarousel className="" />
      </div>
    </div>
  );
}