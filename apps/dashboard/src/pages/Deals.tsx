
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  DollarSign, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const deals = [
  {
    id: 1,
    title: "The Last Kingdom Chronicles",
    buyer: "Netflix Studios",
    creator: "Kim MinJun",
    amount: "$50,000",
    status: "negotiating",
    type: "adaptation_rights",
    deadline: "2024-02-15",
    messages: 12
  },
  {
    id: 2,
    title: "Digital Hearts",
    buyer: "Webtoon Entertainment",
    creator: "Park SeoYun", 
    amount: "$25,000",
    status: "pending",
    type: "licensing",
    deadline: "2024-01-30",
    messages: 3
  },
  {
    id: 3,
    title: "Urban Legends Collection",
    buyer: "JTBC Studios",
    creator: "Lee HyunWoo",
    amount: "$75,000", 
    status: "completed",
    type: "full_rights",
    deadline: "2024-01-10",
    messages: 28
  },
];

export default function Deals() {
  const { user } = useAuth();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "negotiating":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "pending":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "negotiating":
        return <MessageSquare className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">DEALS</h1>
              <p className="text-xl text-midnight-ink-600 leading-relaxed">
                Manage your content deals and negotiations.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-4 text-lg rounded-full font-medium">
                <DollarSign className="mr-2 h-4 w-4" />
                NEW DEAL
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 w-5 h-5" />
            <input
              placeholder="Search deals..."
              className="w-full pl-12 pr-4 py-4 text-lg bg-porcelain-blue-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-hanok-teal text-midnight-ink"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-12"></div>

          {/* Deals List */}
          <div className="grid grid-cols-1 gap-8 mb-8">
          {deals.map((deal) => (
            <Card key={deal.id} className="bg-white border-porcelain-blue-200 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-midnight-ink text-xl font-bold mb-2">{deal.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-midnight-ink-600">
                      <span>Buyer: {deal.buyer}</span>
                      <span>Creator: {deal.creator}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {deal.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800 mb-2">{deal.amount}</div>
                    <Badge className={getStatusColor(deal.status)}>
                      {getStatusIcon(deal.status)}
                      <span className="ml-1 capitalize">{deal.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-midnight-ink-600">
                    <span className="capitalize">{deal.type.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {deal.messages} messages
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
    </div>
  );
}
