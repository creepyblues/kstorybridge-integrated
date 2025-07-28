import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

// Mock data matching the design
const mockTitles = [
  {
    id: "1",
    title: "True Beauty",
    status: "ONGOING",
    image: "/api/placeholder/300/400",
    likes: 0
  }
];

const topRatedTitles = [
  { title: "My Roommate...", likes: "54,312" },
  { title: "The King's Aff.", likes: "46,967" },
  { title: "Dream High", likes: "41,115" },
  { title: "Extraordinary...", likes: "39,814" },
  { title: "Taxi Driver", likes: "35,620" }
];

export default function TitlesList() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["All", "Webtoons", "Series", "Movies"];

  return (
    <div className="min-h-screen bg-white">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Title List</h1>
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search titles"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 text-lg bg-gray-50 border-0 rounded-2xl"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-12">
          {filters.map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-8 py-3 rounded-2xl text-base font-medium ${
                activeFilter === filter
                  ? "bg-hanok-teal text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Recently Added */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Recently Added</h2>
            <div className="space-y-6">
              {mockTitles.map((title) => (
                <Card key={title.id} className="overflow-hidden rounded-2xl shadow-lg border-0">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-40 bg-white rounded-xl mx-auto mb-4 shadow-md flex items-center justify-center">
                            <div className="text-gray-400">Image</div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title.title}</h3>
                        <Button className="bg-hanok-teal text-white px-6 py-2 rounded-full text-sm font-medium">
                          {title.status}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Top Rated */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Top Rated</h2>
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-0">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Title</span>
                    <span className="font-semibold text-gray-700">Likes</span>
                  </div>
                </div>
                <div className="divide-y">
                  {topRatedTitles.map((title, index) => (
                    <div key={index} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                      <span className="text-gray-800 font-medium">{title.title}</span>
                      <span className="text-gray-600">{title.likes}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}