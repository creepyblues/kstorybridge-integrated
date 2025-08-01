import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { testSupabaseConnection } from '@/utils/testSupabase';

interface ConnectionStatusProps {
  showRetryButton?: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function ConnectionStatus({ 
  showRetryButton = false, 
  onConnectionChange 
}: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setIsConnected(result.success);
      setLastChecked(new Date());
      onConnectionChange?.(result.success);
    } catch (error) {
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Periodic connection check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (isConnected === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (isConnected === false) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Wifi className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking connection...';
    if (isConnected === true) return 'Connected';
    if (isConnected === false) return 'Connection failed';
    return 'Unknown status';
  };

  const getStatusColor = () => {
    if (isConnected === true) return 'text-green-600';
    if (isConnected === false) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {lastChecked && (
        <span className="text-gray-400 text-xs">
          {lastChecked.toLocaleTimeString()}
        </span>
      )}
      {showRetryButton && !isLoading && isConnected === false && (
        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}