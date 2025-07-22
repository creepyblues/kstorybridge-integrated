
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
        return "bg-green-600/20 text-green-400 border-green-600/30";
      case "negotiating":
        return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
      case "pending":
        return "bg-blue-600/20 text-blue-400 border-blue-600/30";
      case "cancelled":
        return "bg-red-600/20 text-red-400 border-red-600/30";
      default:
        return "bg-slate-600/20 text-slate-400 border-slate-600/30";
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Deals</h1>
          <p className="text-slate-400">
            Manage your content deals and negotiations.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <DollarSign className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search deals..."
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      <div className="grid grid-cols-1 gap-6">
        {deals.map((deal) => (
          <Card key={deal.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg mb-2">{deal.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Buyer: {deal.buyer}</span>
                    <span>Creator: {deal.creator}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {deal.deadline}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white mb-2">{deal.amount}</div>
                  <Badge className={getStatusColor(deal.status)}>
                    {getStatusIcon(deal.status)}
                    <span className="ml-1 capitalize">{deal.status}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="capitalize">{deal.type.replace('_', ' ')}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {deal.messages} messages
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
