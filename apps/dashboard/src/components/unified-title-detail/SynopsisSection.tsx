import { BookOpen, Lightbulb } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface SynopsisSectionProps {
  synopsis: string | null;
  note: string | null;
}

export function SynopsisSection({ synopsis, note }: SynopsisSectionProps) {
  if (!synopsis && !note) return null;

  return (
    <SectionCard title="The Story" icon={<BookOpen className="h-5 w-5" />}>
      {synopsis && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Synopsis</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{synopsis}</p>
        </div>
      )}

      {note && (
        <div className="bg-[#4C9C9B]/5 border border-[#4C9C9B]/15 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-[#4C9C9B]" />
            <h4 className="text-sm font-semibold text-[#4C9C9B]">Editorial Take</h4>
          </div>
          <p className="text-gray-700 leading-relaxed italic">{note}</p>
        </div>
      )}
    </SectionCard>
  );
}
