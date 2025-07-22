
import { useEffect } from "react";
import { getWebsiteUrl } from "@/config/urls";

export default function Auth() {
  useEffect(() => {
    // TEMPORARY: Commenting out redirect for debugging purposes
    // TODO: Uncomment this line when debugging is complete
    // Redirect to the external sign-in page
    // window.location.href = getWebsiteUrl();
  }, []);

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
