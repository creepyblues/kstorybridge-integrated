import { useEffect, useState, type ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast
} from "@kstorybridge/ui";
import { ExternalLink, Calendar, BookOpen, Users, Target, TrendingUp, Globe } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useSessionCache } from "@/hooks/useSessionCache";
import { useDataCache } from "@/contexts/DataCacheContext";
import { directApiService } from "@/services/directApiService";
import type { Title } from "@/services/titlesService";

export default function CreatorTitleDetailPage() {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { } = useSessionCache();
  const {
    getTitleDetail,
    setTitleDetail,
    isFresh,
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus
  } = useDataCache();

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (!titleId) return;

    const cached = getTitleDetail(titleId);
    if (cached && isSessionValid() && isFresh(`titleDetail:${titleId}`)) {
      setTitle(cached);
      setLoading(false);
      return;
    }

    fetchTitle(titleId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleId, isSessionValid]);

  const fetchTitle = async (id: string) => {
    try {
      setLoading(true);
      setDbError(null);

      const data = await directApiService.getTitleById(id);
      setTitle(data);
      setTitleDetail(id, data);
      setDbConnectivityStatus({ isConnected: true });
    } catch (error) {
      console.error("Failed to load title detail", error);
      const message = error instanceof Error ? error.message : "Unknown database error";
      setDbError(message);
      setDbConnectivityStatus({ isConnected: false, error: message });
      toast({
        title: "Unable to load title",
        description: "Please verify your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatList = (value?: string[] | null) => {
    if (!value || value.length === 0) return "—";
    return value.join(", ");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-hanok-teal"></div>
      </div>
    );
  }

  if (dbError && !getDbConnectivityStatus().isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-xl px-6">
          <Card className="border-red-200 shadow-lg">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                !
              </div>
              <h2 className="text-lg font-semibold text-red-600">Database Connection Error</h2>
              <p className="text-sm text-red-500">
                We couldn't load this title. Please check your network connection and try again.
              </p>
              <Button onClick={() => fetchTitle(titleId!)} className="bg-red-600 hover:bg-red-700">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 text-center text-gray-600">
        <p>Title not found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    );
  }

  const tags = Array.isArray(title.tags) ? title.tags : [];
  const comps = Array.isArray(title.comps) ? title.comps : [];
  const genre = Array.isArray(title.genre) ? title.genre : title.genre ? [title.genre] : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-midnight-ink md:text-4xl">
                {title.title_name_en || title.title_name_kr}
              </h2>
              {genre.length > 0 && (
                <Badge variant="outline" className="border-hanok-teal text-hanok-teal">
                  {formatList(genre)}
                </Badge>
              )}
            </div>
            {title.tagline && (
              <p className="mt-2 text-base text-midnight-ink-600 md:text-lg">{title.tagline}</p>
            )}
            <p className="mt-1 text-sm text-midnight-ink-400">
              Last updated {formatDate(title.updated_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back to titles
            </Button>
            {title.title_url && (
              <Button asChild className="bg-hanok-teal hover:bg-hanok-teal/90 text-white">
                <a href={title.title_url} target="_blank" rel="noreferrer">
                  View Live <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <Card className="border-gray-100 shadow-md">
          <CardContent className="grid gap-6 md:grid-cols-[320px,1fr] md:gap-8">
            <div className="overflow-hidden rounded-xl">
              {title.title_image ? (
                <img
                  src={title.title_image}
                  alt={title.title_name_en || title.title_name_kr}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl bg-porcelain-blue-100 text-porcelain-blue-600">
                  No cover image
                </div>
              )}
            </div>

            <div className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-midnight-ink">Synopsis</h2>
                <p className="text-sm text-midnight-ink-600">
                  {title.synopsis || "No synopsis provided yet."}
                </p>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <DetailItem icon={Users} label="Story Author" value={title.story_author} />
                <DetailItem icon={Users} label="Art Author" value={title.art_author} />
                <DetailItem icon={Globe} label="Content Format" value={title.content_format?.replace(/_/g, " ") || "—"} />
                <DetailItem icon={Target} label="Perfect For" value={title.perfect_for} />
                <DetailItem icon={TrendingUp} label="Tone" value={title.tone} />
                <DetailItem icon={Calendar} label="Created" value={formatDate(title.created_at)} />
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <DetailItem icon={BookOpen} label="Chapters" value={title.chapters?.toString()} />
                <DetailItem icon={BookOpen} label="Completed" value={title.completed ? "Yes" : "No"} />
                <DetailItem icon={BookOpen} label="Audience" value={title.audience} />
                <DetailItem icon={BookOpen} label="Rights" value={title.rights || title.rights_owner} />
              </section>

              <section>
                <h2 className="text-lg font-semibold text-midnight-ink">Keywords & Comps</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-porcelain-blue-100 text-midnight-ink">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                {comps.length > 0 && (
                  <p className="mt-3 text-sm text-midnight-ink-600">
                    Comparable to: {formatList(comps)}
                  </p>
                )}
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DetailItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-porcelain-blue-100 p-2 text-hanok-teal">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-midnight-ink-400">{label}</p>
        <p className="text-sm font-medium text-midnight-ink">{value && value !== "" ? value : "—"}</p>
      </div>
    </div>
  );
}
