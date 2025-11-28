import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";

import { styles } from "@/lib/styles";

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className={styles.card.base}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${styles.text.muted}`}>
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${styles.text.primary}`}>{stat.value}</div>
            <p className={`text-xs ${styles.text.success} flex items-center mt-1`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}