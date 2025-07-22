import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { styles } from "@/lib/styles";

interface ActivityItem {
  title: string;
  action: string;
  genre: string;
  time: string;
  type: string;
}

interface ActivityCardProps {
  title: string;
  description: string;
  activities: ActivityItem[];
  icon?: React.ComponentType<{ className?: string }>;
}

export function ActivityCard({ title, description, activities, icon: Icon = Calendar }: ActivityCardProps) {
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'favorite':
        return styles.badge.favorite;
      case 'deal':
        return styles.badge.deal;
      case 'view':
        return styles.badge.view;
      default:
        return styles.badge.view;
    }
  };

  return (
    <Card className={`lg:col-span-2 ${styles.card.base}`}>
      <CardHeader>
        <CardTitle className={`${styles.text.primary} flex items-center gap-2`}>
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className={styles.text.secondary}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${styles.activityItem}`}>
              <div className="flex-1">
                <h3 className={`font-medium ${styles.text.primary} mb-1`}>{activity.title}</h3>
                <div className={`flex items-center gap-4 text-sm ${styles.text.secondary}`}>
                  <span>{activity.action}</span>
                  <span>{activity.genre}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {activity.time}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline"
                  className={getBadgeStyle(activity.type)}
                >
                  {activity.type}
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
  );
}