import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/utils/accountTypeDetection";

export function DebugAccountType() {
  const { user } = useAuth();
  const { accountType, source, confidence, profileExists, loading, result } = useAccountType({ 
    includeDatabaseLookup: true, 
    debug: true 
  });

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50 max-w-xs text-xs">
      <h3 className="font-bold mb-2">Debug: Account Type Detection</h3>
      <div className="space-y-1">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Account Type:</strong> {accountType || 'null'}</p>
        <p><strong>Source:</strong> {source}</p>
        <p><strong>Confidence:</strong> {confidence}</p>
        <p><strong>Profile Exists:</strong> {profileExists ? 'Yes' : 'No'}</p>
        <p><strong>Metadata:</strong> {JSON.stringify(user.user_metadata || {})}</p>
        <p><strong>Full Result:</strong> {JSON.stringify(result, null, 1)}</p>
      </div>
    </div>
  );
}