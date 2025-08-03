
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye, Heart, Star, Edit, Trash2 } from "lucide-react";
import type { Title } from "@/services/titlesService";
import { useAuth } from "@/hooks/useAuth";

interface TitleCardProps {
  title: Title;
  onEdit?: (title: Title) => void;
  onDelete?: (titleId: string) => void;
  showActions?: boolean;
}

export function TitleCard({ title, onEdit, onDelete, showActions = false }: TitleCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === title.creator_id;

  const formatGenre = (genre: string) => {
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatContentFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link to={`/titles/${title.title_id}`}>
              <h3 className="text-lg font-semibold text-white mb-1 hover:text-blue-400 transition-colors cursor-pointer">
                {title.title_name_en || title.title_name_kr}
              </h3>
            </Link>
            {title.title_name_en && title.title_name_kr && (
              <p className="text-sm text-slate-400 mb-2">{title.title_name_kr}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {title.genre && (
                <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                  {formatGenre(title.genre)}
                </Badge>
              )}
              {title.content_format && (
                <Badge variant="outline" className="border-purple-600/30 text-purple-400">
                  {formatContentFormat(title.content_format)}
                </Badge>
              )}
            </div>
          </div>
          {title.title_image && (
            <div className="w-16 h-20 bg-slate-700 rounded border border-slate-600 flex-shrink-0 ml-4">
              <img 
                src={title.title_image} 
                alt={title.title_name_en || title.title_name_kr}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-slate-500">No Image</span>';
                }}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {title.synopsis && (
          <p className="text-slate-300 text-sm mb-4 line-clamp-3">
            {title.synopsis}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
          {title.author && (
            <span>Author: <span className="text-slate-300">{title.author}</span></span>
          )}
          {title.illustrator && (
            <span>Illustrator: <span className="text-slate-300">{title.illustrator}</span></span>
          )}
          {title.writer && (
            <span>Writer: <span className="text-slate-300">{title.writer}</span></span>
          )}
        </div>

        {title.tags && title.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {title.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{(title.views || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{(title.likes || 0).toLocaleString()}</span>
            </div>
            {title.rating_count && title.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{title.rating?.toFixed(1)} ({title.rating_count})</span>
              </div>
            )}
          </div>

          {showActions && isOwner && (
            <div className="flex gap-2">
              <Button 
                id="title-card-edit-btn"
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit?.(title)}
                className="text-slate-400 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                id="title-card-delete-btn"
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete?.(title.title_id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
