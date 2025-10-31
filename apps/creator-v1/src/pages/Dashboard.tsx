
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import BuyerDashboard from "./BuyerDashboard";
import CreatorDashboard from "./CreatorDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { accountType, loading } = useAccountType({
    user
  });

  // Show loading while determining account type
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal"></div>
      </div>
    );
  }

  // Default to buyer account type if no account type detected
  const resolvedAccountType = accountType || "buyer";

  if (resolvedAccountType === "creator") {
    return <CreatorDashboard />;
  }

  return <BuyerDashboard />;
}
