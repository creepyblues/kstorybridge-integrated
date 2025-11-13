import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface RightsOption {
  value: string;
  label: string;
}

export const RIGHTS_OPTIONS: RightsOption[] = [
  { value: 'film_tv', label: 'Film & TV' },
  { value: 'animation', label: 'Animation' },
  { value: 'publication', label: 'Publication' },
  { value: 'merchandising', label: 'Merchandising' },
  { value: 'game', label: 'Game' },
  { value: 'other', label: 'Other' },
];

interface RightsCheckboxGroupProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function RightsCheckboxGroup({
  value = [],
  onChange,
  disabled = false,
}: RightsCheckboxGroupProps) {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      // Add to array if not already present
      if (!value.includes(optionValue)) {
        onChange([...value, optionValue]);
      }
    } else {
      // Remove from array
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {RIGHTS_OPTIONS.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={`rights-${option.value}`}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.value, checked === true)
            }
            disabled={disabled}
            className="border-gray-300"
          />
          <Label
            htmlFor={`rights-${option.value}`}
            className="text-sm font-normal text-gray-900 cursor-pointer select-none"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
