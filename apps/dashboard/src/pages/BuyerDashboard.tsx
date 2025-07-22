
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  Eye, 
  DollarSign,
  BookOpen
} from "lucide-react";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { styles } from "@/lib/styles";

const stats = [
  {
    title: "Favorites",
    value: "24",
    change: "+5 this week",
    icon: Heart,
    color: "text-red-500"
  },
  {
    title: "Viewed Titles",
    value: "156",
    change: "+12 today",
    icon: Eye,
    color: "text-blue-500"
  },
  {
    title: "Active Deals",
    value: "7",
    change: "+2 pending",
    icon: DollarSign,
    color: "text-green-500"
  },
  {
    title: "Watchlist",
    value: "43",
    change: "+8 this month",
    icon: BookOpen,
    color: "text-purple-500"
  },
];

const recentActivity = [
  {
    title: "The Last Kingdom Chronicles",
    action: "Added to favorites",
    genre: "Fantasy",
    time: "2 hours ago",
    type: "favorite"
  },
  {
    title: "Digital Hearts",
    action: "Started deal discussion",
    genre: "Romance",
    time: "1 day ago",
    type: "deal"
  },
  {
    title: "Urban Legends Collection",
    action: "Viewed details",
    genre: "Mystery",
    time: "2 days ago",
    type: "view"
  },
];

const trendingTitles = [
  {
    title: "Mystic Academy",
    genre: "Fantasy",
    views: "15.2K",
    rating: "4.8"
  },
  {
    title: "Corporate Secrets",
    genre: "Drama",
    views: "12.8K",
    rating: "4.6"
  },
  {
    title: "Time Loop Café",
    genre: "Sci-Fi",
    views: "9.3K",
    rating: "4.9"
  },
];

export default function BuyerDashboard() {
  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="Buyer Dashboard"
        description="Discover and acquire amazing content."
        showSearch={true}
      />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityCard 
          title="Recent Activity"
          description="Your latest interactions and updates"
          activities={recentActivity}
        />

        <Card className={styles.card.base}>
          <CardHeader>
            <CardTitle className={styles.text.primary}>Trending Now</CardTitle>
            <CardDescription className={styles.text.secondary}>
              Popular content this week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trendingTitles.map((title, index) => (
              <div key={index} className={`p-3 rounded-lg ${styles.card.interactive}`}>
                <h3 className={`font-medium ${styles.text.primary} mb-1`}>{title.title}</h3>
                <div className={`flex items-center justify-between text-sm ${styles.text.secondary}`}>
                  <span>{title.genre}</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {title.views}
                    </span>
                    <span>★ {title.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
