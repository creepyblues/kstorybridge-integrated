import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Title } from '@/services/titlesService';
import {
  Users,
  BookOpen,
  Award,
  Eye,
  Star,
  FileText,
} from 'lucide-react';

interface CreditsTabProps {
  title: Title;
}

export function CreditsTab({ title }: CreditsTabProps) {
  const hasCreativeTeam =
    title.story_author ||
    title.art_author ||
    title.original_author ||
    title.writer ||
    title.illustrator;

  const hasSourceMaterial =
    title.underlying_novel_en ||
    title.underlying_novel_kr ||
    title.script_title_en ||
    title.script_title_kr ||
    title.art_title_en ||
    title.art_title_kr;

  const hasCreatorAchievements =
    title.creator_achievements &&
    (title.creator_achievements.total_titles ||
      title.creator_achievements.total_views ||
      title.creator_achievements.notable_works?.length ||
      title.creator_achievements.awards_received?.length ||
      title.creator_achievements.industry_recognition);

  return (
    <div className="space-y-6">
      {/* Creative Team Card */}
      {hasCreativeTeam && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Creative Team</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Story Author */}
              {title.story_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Story Author</div>
                  <div className="font-semibold text-black">{title.story_author}</div>
                  {title.story_author_kr && title.story_author_kr !== title.story_author && (
                    <div className="text-sm text-gray-600">{title.story_author_kr}</div>
                  )}
                </div>
              )}

              {/* Art Author */}
              {title.art_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Art Author</div>
                  <div className="font-semibold text-black">{title.art_author}</div>
                  {title.art_author_kr && title.art_author_kr !== title.art_author && (
                    <div className="text-sm text-gray-600">{title.art_author_kr}</div>
                  )}
                </div>
              )}

              {/* Original Author */}
              {title.original_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Original Author</div>
                  <div className="font-semibold text-black">{title.original_author}</div>
                  {title.original_author_kr && title.original_author_kr !== title.original_author && (
                    <div className="text-sm text-gray-600">{title.original_author_kr}</div>
                  )}
                </div>
              )}

              {/* Writer (if different from story_author) */}
              {title.writer && title.writer !== title.story_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Writer</div>
                  <div className="font-semibold text-black">{title.writer}</div>
                </div>
              )}

              {/* Illustrator (if different from art_author) */}
              {title.illustrator && title.illustrator !== title.art_author && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Illustrator</div>
                  <div className="font-semibold text-black">{title.illustrator}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Material Card */}
      {hasSourceMaterial && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Source Material</h3>
            </div>

            <div className="space-y-4">
              {/* Content Format Info */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Based On:</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {title.content_format
                    ? title.content_format.charAt(0).toUpperCase() + title.content_format.slice(1)
                    : 'Original Work'}
                </Badge>
                {title.is_official_english_title !== undefined && (
                  <Badge
                    variant="outline"
                    className={
                      title.is_official_english_title
                        ? 'border-green-300 text-green-700'
                        : 'border-gray-300 text-gray-600'
                    }
                  >
                    {title.is_official_english_title ? 'Official English Title' : 'Translated Title'}
                  </Badge>
                )}
              </div>

              {/* Underlying Novel */}
              {(title.underlying_novel_en || title.underlying_novel_kr) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    Underlying Novel
                  </div>
                  {title.underlying_novel_en && (
                    <div className="font-semibold text-black">{title.underlying_novel_en}</div>
                  )}
                  {title.underlying_novel_kr && (
                    <div className="text-sm text-gray-600">{title.underlying_novel_kr}</div>
                  )}
                </div>
              )}

              {/* Script Title */}
              {(title.script_title_en || title.script_title_kr) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    Script Title
                  </div>
                  {title.script_title_en && (
                    <div className="font-semibold text-black">{title.script_title_en}</div>
                  )}
                  {title.script_title_kr && (
                    <div className="text-sm text-gray-600">{title.script_title_kr}</div>
                  )}
                </div>
              )}

              {/* Art Title */}
              {(title.art_title_en || title.art_title_kr) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    Art Title
                  </div>
                  {title.art_title_en && (
                    <div className="font-semibold text-black">{title.art_title_en}</div>
                  )}
                  {title.art_title_kr && (
                    <div className="text-sm text-gray-600">{title.art_title_kr}</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creator Achievements Card */}
      {hasCreatorAchievements && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#4C9C9B]" />
              <h3 className="text-lg font-semibold text-black">Creator Track Record</h3>
            </div>

            <div className="space-y-4">
              {/* Stats Row */}
              <div className="flex flex-wrap gap-4">
                {title.creator_achievements?.total_titles && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center min-w-[100px]">
                    <FileText className="w-5 h-5 text-[#4C9C9B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {title.creator_achievements.total_titles}
                    </div>
                    <div className="text-xs text-gray-500">Published Titles</div>
                  </div>
                )}

                {title.creator_achievements?.total_views && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center min-w-[100px]">
                    <Eye className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {title.creator_achievements.total_views}
                    </div>
                    <div className="text-xs text-gray-500">Total Views</div>
                  </div>
                )}
              </div>

              {/* Notable Works */}
              {title.creator_achievements?.notable_works &&
                title.creator_achievements.notable_works.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Notable Works</div>
                    <div className="flex flex-wrap gap-2">
                      {title.creator_achievements.notable_works.map((work, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                          {work}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Awards Received */}
              {title.creator_achievements?.awards_received &&
                title.creator_achievements.awards_received.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      Awards Received
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {title.creator_achievements.awards_received.map((award, idx) => (
                        <Badge key={idx} className="bg-amber-50 text-amber-700 border border-amber-200">
                          {award}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Industry Recognition */}
              {title.creator_achievements?.industry_recognition && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Industry Recognition</div>
                  <p className="text-gray-600">{title.creator_achievements.industry_recognition}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No credits message */}
      {!hasCreativeTeam && !hasSourceMaterial && !hasCreatorAchievements && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No detailed credits available for this title.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
