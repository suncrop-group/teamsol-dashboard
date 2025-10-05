import { useState, useCallback } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const SelectBox = ({
  data,
  selectedValue,
  onValueChange,
  placeholder = 'Select',
  label,
  disabled = false,
  required = false,
  isMultiple = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = searchQuery
    ? data.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  const handleSelect = useCallback(
    (value) => {
      if (isMultiple) {
        if (selectedValue?.find((item) => item.value === value)) {
          onValueChange(selectedValue.filter((item) => item.value !== value));
        } else {
          onValueChange([
            ...(selectedValue || []),
            data.find((item) => item.value === value),
          ]);
        }
      } else {
        onValueChange(value);
        setOpen(false);
        setSearchQuery('');
      }
    },
    [isMultiple, selectedValue, onValueChange, data]
  );

  const displayValue = isMultiple
    ? selectedValue?.length > 0
      ? selectedValue.map((item) => item.label).join(', ')
      : placeholder
    : selectedValue
    ? data.find((d) => d.value === selectedValue)?.label || placeholder
    : placeholder;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label className="text-base font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-base',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              selectedValue ? 'text-gray-900' : 'text-gray-400'
            )}
            disabled={disabled}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-10"
            />
            <CommandList>
              <CommandEmpty>No items to display</CommandEmpty>
              <CommandGroup>
                {filteredData?.length > 0 &&
                  filteredData.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className={cn(
                        'cursor-pointer',
                        isMultiple &&
                          selectedValue?.find((i) => i.value === item.value)
                          ? 'bg-blue-50'
                          : ''
                      )}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isMultiple &&
                            selectedValue?.find((i) => i.value === item.value)
                            ? 'opacity-100 text-blue-500'
                            : 'opacity-0'
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SelectBox;
