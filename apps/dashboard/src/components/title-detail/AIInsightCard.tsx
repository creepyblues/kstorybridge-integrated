import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface AIInsightCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AIInsightCard({ title, icon, children, className = '' }: AIInsightCardProps) {
  return (
    <div className={`relative rounded-2xl p-[2px] bg-gradient-to-r from-[#4C9C9B] to-[#AF52DE] ${className}`}>
      <div className="bg-white rounded-2xl p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          {icon || <Bot className="w-5 h-5 text-[#4C9C9B]" />}
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          <Badge className="ml-auto bg-gradient-to-r from-[#4C9C9B]/10 to-[#AF52DE]/10 text-[#4C9C9B] border-0 text-xs font-medium">
            AI Insight
          </Badge>
        </div>
        {children}
      </div>
    </div>
  );
}
