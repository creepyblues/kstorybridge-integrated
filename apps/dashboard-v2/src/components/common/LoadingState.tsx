import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message, className = 'py-12' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
