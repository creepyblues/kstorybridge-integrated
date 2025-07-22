
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  Plus,
  ExternalLink,
  Heart,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { styles } from "@/lib/styles";

const stats = [
  {
    title: "My Titles",
    value: "12",
    change: "+2 this month",
    icon: FileText,
    color: "text-blue-500"
  },
  {
    title: "Total Views",
    value: "45.2K",
    change: "+12.5%",
    icon: Eye,
    color: "text-green-500"
  },
  {
    title: "Total Likes",
    value: "3.8K",
    change: "+8.2%",
    icon: Heart,
    color: "text-red-500"
  },
  {
    title: "Active Deals",
    value: "3",
    change: "+1 pending",
    icon: DollarSign,
    color: "text-orange-500"
  },
];

const recentTitles = [
  {
    title: "The Last Kingdom Chronicles",
    status: "Published",
    genre: "Fantasy",
    views: "2.1K",
    likes: "156"
  },
  {
    title: "Urban Legends Collection",
    status: "Draft",
    genre: "Mystery",
    views: "0",
    likes: "0"
  },
  {
    title: "Digital Hearts",
    status: "Published",
    genre: "Romance",
    views: "1.8K",
    likes: "203"
  },
];

export default function CreatorDashboard() {
  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="Creator Dashboard"
        description="Manage your content and track performance."
        showCreateButton={true}
        createButtonText="Create New Title"
      />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`lg:col-span-2 ${styles.card.base}`}>
          <CardHeader>
            <CardTitle className={`${styles.text.primary} flex items-center gap-2`}>
              <FileText className="h-5 w-5" />
              Recent Titles
            </CardTitle>
            <CardDescription className={styles.text.secondary}>
              Your latest content and drafts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTitles.map((title, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${styles.card.interactive}`}>
                  <div className="flex-1">
                    <h3 className={`font-medium ${styles.text.primary} mb-1`}>{title.title}</h3>
                    <div className={`flex items-center gap-4 text-sm ${styles.text.secondary}`}>
                      <span>{title.genre}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {title.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {title.likes}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={title.status === "Published" ? "default" : "secondary"}
                      className={
                        title.status === "Published" 
                          ? styles.badge.published
                          : styles.badge.draft
                      }
                    >
                      {title.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className={`${styles.text.secondary} hover:${styles.text.primary}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={styles.card.base}>
          <CardHeader>
            <CardTitle className={styles.text.primary}>Quick Actions</CardTitle>
            <CardDescription className={styles.text.secondary}>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className={`w-full justify-start border-slate-600 ${styles.text.muted} hover:${styles.text.primary} hover:bg-slate-700`}>
              <Plus className="mr-2 h-4 w-4" />
              New Title
            </Button>
            <Button variant="outline" className={`w-full justify-start border-slate-600 ${styles.text.muted} hover:${styles.text.primary} hover:bg-slate-700`}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Titles
            </Button>
            <Button variant="outline" className={`w-full justify-start border-slate-600 ${styles.text.muted} hover:${styles.text.primary} hover:bg-slate-700`}>
              <DollarSign className="mr-2 h-4 w-4" />
              View Deals
            </Button>
            <Button variant="outline" className={`w-full justify-start border-slate-600 ${styles.text.muted} hover:${styles.text.primary} hover:bg-slate-700`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
