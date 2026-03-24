import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface BottomCtaProps {
  onCtaClick?: (position: string) => void;
}

export function BottomCta({ onCtaClick }: BottomCtaProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10 text-center mb-12">
      <h3 className="text-xl font-semibold text-black mb-3">
        You are seconds away from the full picture on this title.
      </h3>
      <p className="text-gray-600 mb-6 max-w-lg mx-auto">
        <CheckCircle className="h-4 w-4 inline mr-1" />
        Free for producers &middot; Always
      </p>
      <Link to="/signup" onClick={() => onCtaClick?.('bottom')}>
        <Button className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium">
          Unlock Full Analysis — Free
        </Button>
      </Link>
    </div>
  );
}
