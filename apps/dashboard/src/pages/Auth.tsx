
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the dashboard's sign-in page
    console.log("Redirecting to dashboard signin");
    navigate('/signin', { replace: true });
  }, [navigate]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
