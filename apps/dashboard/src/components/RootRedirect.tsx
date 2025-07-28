import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function RootRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Get account type from user metadata, default to buyer
      const accountType = user.user_metadata?.account_type || "buyer";
      
      if (accountType === "ip_owner") {
        // Redirect IP owners to Content page
        navigate("/content", { replace: true });
      } else {
        // Redirect buyers to Titles page
        navigate("/titles", { replace: true });
      }
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
}