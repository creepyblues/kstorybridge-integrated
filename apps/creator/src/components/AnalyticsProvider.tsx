import { useAnalytics } from "@/hooks/useAnalytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  // This component initializes analytics tracking
  useAnalytics();
  
  return <>{children}</>;
};