/**
 * StringArrayInput Component
 * Handles input and management of string arrays with add/remove functionality
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StringArrayInputProps {
  label: string;
  placeholder?: string;
  value?: string[] | null;
  onChange: (value: string[] | null) => void;
  className?: string;
  id?: string;
}

export const StringArrayInput: React.FC<StringArrayInputProps> = ({
  label,
  placeholder = "Add item",
  value = [],
  onChange,
  className,
  id,
}) => {
  const [inputValue, setInputValue] = useState('');
  const currentValue = value || [];

  const addItem = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !currentValue.includes(trimmedValue)) {
      const newValue = [...currentValue, trimmedValue];
      onChange(newValue.length > 0 ? newValue : null);
      setInputValue('');
    }
  };

  const removeItem = (indexToRemove: number) => {
    const newValue = currentValue.filter((_, index) => index !== indexToRemove);
    onChange(newValue.length > 0 ? newValue : null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const handleInputFromString = (inputString: string) => {
    // Handle comma-separated input
    if (inputString.includes(',')) {
      const items = inputString
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .filter(item => !currentValue.includes(item));
      
      if (items.length > 0) {
        const newValue = [...currentValue, ...items];
        onChange(newValue.length > 0 ? newValue : null);
        setInputValue('');
      }
    } else {
      setInputValue(inputString);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      
      {/* Current items display */}
      {currentValue.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 min-h-[2.5rem] border rounded-md bg-gray-50">
          {currentValue.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-1"
            >
              <span className="text-sm">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={() => removeItem(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input for new items */}
      <div className="flex gap-2">
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => handleInputFromString(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addItem}
          disabled={!inputValue.trim()}
          size="sm"
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Type and press Enter to add, or separate multiple items with commas
      </p>
    </div>
  );
};