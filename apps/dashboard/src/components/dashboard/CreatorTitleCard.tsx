import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Heart,
  MessageSquare,
  TrendingUp,
  Edit,
  MoreHorizontal,
  DollarSign,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreatorTitleCardProps {
  title: {
    id: string;
    title_name_en?: string;
    title_name_kr: string;
    genre?: string;
    author?: string;
    status?: string;
    title_image?: string;
    views?: number;
    likes?: number;
    inquiries?: number;
    content_format?: string;
    created_at?: string;
    updated_at?: string;
  };
  onEdit?: (titleId: string) => void;
  onViewAnalytics?: (titleId: string) => void;
  onViewInquiries?: (titleId: string) => void;
}

export function CreatorTitleCard({ 
  title, 
  onEdit, 
  onViewAnalytics, 
  onViewInquiries 
}: CreatorTitleCardProps) {
  const displayTitle = title.title_name_en || title.title_name_kr;
  const imageUrl = title.title_image || "/placeholder-cover.jpg";

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-hanok-teal text-snow-white';
      case 'draft':
        return 'bg-warm-sand text-midnight-ink';
      case 'under_review':
        return 'bg-sunrise-coral text-snow-white';
      default:
        return 'bg-porcelain-blue-200 text-midnight-ink';
    }
  };

  return (
    <Card className="group hover:shadow-xl transition-shadow duration-200 bg-snow-white border-porcelain-blue-200 overflow-hidden">
      <div className="relative">
        {/* Image Header */}
        <div className="aspect-[16/9] bg-gradient-to-br from-porcelain-blue-100 to-warm-sand-100 relative overflow-hidden">
          <img 
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-cover.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/60 via-transparent to-transparent" />
          
          {/* Status Badge */}
          {title.status && (
            <Badge className={`absolute top-3 left-3 ${getStatusColor(title.status)} border-0 shadow-lg`}>
              {title.status.replace('_', ' ').toUpperCase()}
            </Badge>
          )}

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full bg-snow-white/80 text-midnight-ink hover:bg-snow-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-snow-white border-porcelain-blue-300">
              <DropdownMenuItem onClick={() => onEdit?.(title.id)} className="hover:bg-porcelain-blue-50">
                <Edit className="h-4 w-4 mr-2" />
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewAnalytics?.(title.id)} className="hover:bg-porcelain-blue-50">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewInquiries?.(title.id)} className="hover:bg-porcelain-blue-50">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Inquiries
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Title and Genre */}
        <div>
          <h3 className="font-bold text-midnight-ink line-clamp-2 mb-2 group-hover:text-hanok-teal transition-colors duration-200 will-change-auto">
            {displayTitle}
          </h3>
          <div className="flex items-center justify-between">
            {title.genre && (
              <Badge variant="outline" className="text-xs border-porcelain-blue-300 text-hanok-teal">
                {title.genre}
              </Badge>
            )}
            {title.content_format && (
              <Badge variant="secondary" className="text-xs bg-warm-sand text-midnight-ink border-0">
                {title.content_format}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-porcelain-blue-50">
            <Eye className="h-4 w-4 text-hanok-teal" />
            <div>
              <p className="text-sm font-semibold text-midnight-ink">{title.views?.toLocaleString() || '0'}</p>
              <p className="text-xs text-midnight-ink-600">Views</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-sunrise-coral-50">
            <Heart className="h-4 w-4 text-sunrise-coral" />
            <div>
              <p className="text-sm font-semibold text-midnight-ink">{title.likes?.toLocaleString() || '0'}</p>
              <p className="text-xs text-midnight-ink-600">Likes</p>
            </div>
          </div>
        </div>

        {/* Inquiries Section */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-warm-sand-100 to-porcelain-blue-100 border border-porcelain-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-hanok-teal rounded-lg">
              <Users className="h-4 w-4 text-snow-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-midnight-ink">
                {title.inquiries || 0} Buyer {title.inquiries === 1 ? 'Inquiry' : 'Inquiries'}
              </p>
              <p className="text-xs text-midnight-ink-600">This month</p>
            </div>
          </div>
          {(title.inquiries || 0) > 0 && (
            <Button
              size="sm"
              onClick={() => onViewInquiries?.(title.id)}
              className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-snow-white h-8 text-xs"
            >
              View Details
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(title.id)}
            className="flex-1 border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-snow-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewAnalytics?.(title.id)}
            className="flex-1 border-porcelain-blue-400 text-midnight-ink-700 hover:bg-porcelain-blue-100"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}