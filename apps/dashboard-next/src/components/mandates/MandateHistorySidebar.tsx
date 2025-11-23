// Component: MandateHistorySidebar
// Created: 2025-11-21
// Description: Sidebar showing previous mandate searches with click to reload

import { Trash2, Clock } from 'lucide-react';
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
      <div className="w-80 border-l border-gray-300 bg-gray-50 p-6">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-64 border-l border-gray-300 bg-gray-50 p-6 space-y-6 overflow-y-auto">
      {/* Recent Searches */}
      {mandates.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Clock className="h-4 w-4 text-hanok-teal" />
            Recent Mandates
          </h3>
          <div className="space-y-3">
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
        </div>
      )}

      {mandates.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No saved mandates yet</p>
          <p className="text-xs text-gray-500 mt-1">Your mandates will appear here</p>
        </div>
      )}
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
      className={`p-4 bg-white border border-gray-300 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer ${
        isSelected ? 'ring-2 ring-hanok-teal' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3" onClick={onSelect}>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-3 group-hover:text-hanok-teal transition-colors">
            {mandate.mandate_text}
          </p>
          <p className="text-xs text-gray-500 mb-2">{timeAgo}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <span className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
            {mandate.result_count} matches
          </span>
          {mandate.avg_match_score > 0 && (
            <>
              <span>•</span>
              <span>{Math.round(mandate.avg_match_score)}%</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
