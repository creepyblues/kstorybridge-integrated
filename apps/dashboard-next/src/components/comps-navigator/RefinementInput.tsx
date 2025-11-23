/**
 * RefinementInput Component
 *
 * Textarea for users to add optional refinement text
 * (e.g., "more comedic tone", "female lead", "lower budget")
 */

import { Textarea } from '@/components/ui/textarea';

interface RefinementInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export default function RefinementInput({ value, onChange, maxLength = 500 }: RefinementInputProps) {
  const remaining = maxLength - value.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Refinement <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <span className={`text-xs font-medium ${remaining < 50 ? 'text-red-500' : 'text-gray-500'}`}>
          {remaining} / {maxLength}
        </span>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add any refinements to narrow your search (e.g., 'more comedic tone', 'female lead', 'lower production budget')..."
        className="min-h-[100px] resize-none border-gray-300 focus:border-hanok-teal focus:ring-hanok-teal"
        maxLength={maxLength}
      />
    </div>
  );
}
