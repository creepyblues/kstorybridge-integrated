
import { useAuth } from "@/hooks/useAuth";
import BuyerDashboard from "./BuyerDashboard";
import CreatorDashboard from "./CreatorDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Default to buyer account type if no user or account_type
  const accountType = user?.user_metadata?.account_type || "buyer";
  
  if (accountType === "ip_owner") {
    return <CreatorDashboard />;
  }
  
  return <BuyerDashboard />;
}
