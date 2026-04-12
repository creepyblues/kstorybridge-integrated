import { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface DescriptionSectionProps {
  description: string | null;
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight);
    }
  }, [description]);

  if (!description || description.trim() === '') return null;

  return (
    <SectionCard title="Description" icon={<FileText className="h-5 w-5" />}>
      <p
        ref={textRef}
        className={`text-gray-700 leading-relaxed whitespace-pre-line ${
          !expanded ? 'line-clamp-[10]' : ''
        }`}
      >
        {description}
      </p>
      {clamped && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-[#4C9C9B] hover:text-[#3a7b7a] transition-colors"
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show more <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </SectionCard>
  );
}
