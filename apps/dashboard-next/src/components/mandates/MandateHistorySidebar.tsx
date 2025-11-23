/**
 * MandateHistorySidebar Component
 *
 * Floating sidebar displaying mandate search history
 * Unified design pattern across Chat, Comps Navigator, and Mandates pages
 */

import { Trash2, Clock, Sparkles } from 'lucide-react';
import { MandateSearch } from '@/services/mandateService';
import { formatDistanceToNow } from 'date-fns';

interface MandateHistorySidebarProps {
  mandates: MandateSearch[];
  selectedMandateId?: string;
  onSelectMandate: (mandate: MandateSearch) => void;
  onDeleteMandate: (mandateId: string) => void;
  isLoading?: boolean;
}

export default function MandateHistorySidebar({
  mandates,
  selectedMandateId,
  onSelectMandate,
  onDeleteMandate,
  isLoading = false,
}: MandateHistorySidebarProps) {
  if (isLoading) {
    return (
      <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl flex items-center justify-center z-40">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-hanok-teal/5 to-hanok-teal/10 border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-hanok-teal/10 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-hanok-teal" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Mandate History</h2>
            <p className="text-xs text-gray-600">Recent searches</p>
          </div>
        </div>
      </div>

      {/* Mandates List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
        {mandates.length > 0 ? (
          <div className="space-y-2">
            {mandates.map((mandate) => (
              <MandateItem
                key={mandate.id}
                mandate={mandate}
                isSelected={mandate.id === selectedMandateId}
                onSelect={() => onSelectMandate(mandate)}
                onDelete={() => onDeleteMandate(mandate.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">No saved mandates</p>
            <p className="text-xs text-gray-500">Your mandates will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Mandate Item Component
interface MandateItemProps {
  mandate: MandateSearch;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function MandateItem({ mandate, isSelected, onSelect, onDelete }: MandateItemProps) {
  const timeAgo = formatDistanceToNow(new Date(mandate.created_at), { addSuffix: true });

  return (
    <div
      className={`relative group p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-hanok-teal/5 border-hanok-teal shadow-sm'
          : 'bg-white border-gray-200 hover:border-hanok-teal/50 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`h-3 w-3 flex-shrink-0 ${isSelected ? 'text-hanok-teal' : 'text-gray-400'}`} />
            <p className={`text-xs font-medium ${isSelected ? 'text-hanok-teal' : 'text-gray-500'}`}>
              {timeAgo}
            </p>
          </div>
          <p className={`text-sm font-medium line-clamp-2 ${
            isSelected ? 'text-hanok-teal' : 'text-gray-900'
          }`}>
            {mandate.mandate_text}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
          title="Delete mandate"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="font-medium">{mandate.result_count} matches</span>
        {mandate.avg_match_score > 0 && (
          <>
            <span className="text-gray-300">•</span>
            <span>{Math.round(mandate.avg_match_score)}%</span>
          </>
        )}
      </div>
    </div>
  );
}
