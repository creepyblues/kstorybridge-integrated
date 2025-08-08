import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Calendar,
  FileText,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { requestsService, type RequestWithTitle } from "@/services/requestsService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useDataCache } from "@/contexts/DataCacheContext";

export default function MyRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getMyRequests, setMyRequests, isFresh, refreshData } = useDataCache();
  const [requests, setRequests] = useState<RequestWithTitle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if we have cached data first
      const cachedRequests = getMyRequests();
      if (cachedRequests.length > 0 && isFresh('myRequests')) {
        setRequests(cachedRequests);
      } else {
        loadRequests();
      }
    }
  }, [user, getMyRequests, isFresh]);

  const loadRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await requestsService.getUserRequests(user.id);
      setRequests(data);
      // Cache the requests data
      setMyRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({ title: "Error loading requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    refreshData('myRequests');
    loadRequests();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRequestTypeDisplay = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pitch':
        return { label: 'Pitch Document', color: 'bg-blue-100 text-blue-800' };
      case 'contact':
        return { label: 'Contact Info', color: 'bg-green-100 text-green-800' };
      case 'details':
        return { label: 'More Details', color: 'bg-purple-100 text-purple-800' };
      case 'licensing':
        return { label: 'Licensing Info', color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-midnight-ink-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-midnight-ink mb-2">Please log in</h3>
              <p className="text-midnight-ink-600">
                You need to be logged in to view your requests.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">MY REQUESTS</h1>
            <p className="text-xl text-midnight-ink-600 leading-relaxed">
              Track your content requests and their status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="text-midnight-ink-600 text-lg font-medium">
              {requests.length} requests
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-midnight-ink-600 py-16">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            Loading your requests...
          </div>
        ) : requests.length === 0 ? (
          <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
            <CardContent className="p-16 text-center">
              <MessageSquare className="h-16 w-16 text-midnight-ink-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-midnight-ink mb-4">No Requests Yet</h3>
              <p className="text-midnight-ink-600 text-lg mb-8 max-w-md mx-auto">
                You haven't made any content requests yet. Browse titles and request pitch documents or contact information.
              </p>
              <Link to="/buyers/titles">
                <Button className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-3 rounded-lg font-medium">
                  Browse Titles
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => {
              const typeDisplay = getRequestTypeDisplay(request.type);
              return (
                <Card key={request.id} className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Left side - Title info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Title Image */}
                        <div className="w-16 h-20 bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 rounded-lg overflow-hidden flex-shrink-0">
                          {request.titles?.title_image ? (
                            <img 
                              src={request.titles.title_image}
                              alt={request.titles.title_name_en || request.titles.title_name_kr || 'Title'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-6 h-6 text-hanok-teal" />
                            </div>
                          )}
                        </div>

                        {/* Title Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-midnight-ink">
                              {request.titles?.title_name_en || request.titles?.title_name_kr || 'Title Information Unavailable'}
                            </h3>
                            <Badge className={`${typeDisplay.color} font-medium`}>
                              {typeDisplay.label}
                            </Badge>
                          </div>

                          {request.titles?.title_name_en && request.titles?.title_name_kr && (
                            <p className="text-midnight-ink-500 mb-2">{request.titles.title_name_kr}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-midnight-ink-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(request.created_at)}
                            </div>
                            {request.titles?.genre && (
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {Array.isArray(request.titles.genre) 
                                    ? request.titles.genre.slice(0, 2).map(formatGenre).join(', ')
                                    : formatGenre(request.titles.genre)
                                  }
                                  {Array.isArray(request.titles.genre) && request.titles.genre.length > 2 && 
                                    ` +${request.titles.genre.length - 2}`
                                  }
                                </Badge>
                              </div>
                            )}
                            {request.titles?.content_format && (
                              <Badge variant="outline" className="text-xs border-blue-500 text-blue-500 bg-blue-50">
                                {request.titles.content_format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm text-midnight-ink-600 bg-yellow-50 px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Pending
                        </div>
                        {request.titles && (
                          <Link to={`/titles/${request.title_id}`}>
                            <Button variant="outline" size="sm" className="text-hanok-teal border-hanok-teal hover:bg-hanok-teal hover:text-white">
                              View Title
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}