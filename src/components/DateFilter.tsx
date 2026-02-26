import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateFilterProps {
  selectedRange: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
  triggerMode?: 'icon' | 'input';
}

export function DateFilter({
  selectedRange,
  onSelect,
  className,
  triggerMode = 'icon',
}: DateFilterProps) {
  const isRangeSelected = !!(selectedRange?.from && selectedRange?.to);

  const content = (
    <div className="w-auto">
      <div className="p-4 border-b">
        <h4 className="font-medium text-sm">Filter by Date Range</h4>
        <div className="text-xs text-muted-foreground mt-1">
          {selectedRange?.from ? (
            selectedRange.to ? (
              <>
                {dayjs(selectedRange.from).format('DD MMM YYYY')} -{' '}
                {dayjs(selectedRange.to).format('DD MMM YYYY')}
              </>
            ) : (
              'Select end date'
            )
          ) : (
            'Select start date'
          )}
        </div>
      </div>
      <div className="flex justify-center">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={selectedRange?.from}
          selected={selectedRange}
          onSelect={onSelect}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
        />
      </div>
      <div className="p-2 border-t flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(undefined)}
          disabled={!selectedRange}
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filter
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn('flex items-center', className)}>
      <Popover>
        <PopoverTrigger asChild>
          {triggerMode === 'input' ? (
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedRange && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedRange?.from ? (
                selectedRange.to ? (
                  <>
                    {dayjs(selectedRange.from).format('MMM DD, YYYY')} -{' '}
                    {dayjs(selectedRange.to).format('MMM DD, YYYY')}
                  </>
                ) : (
                  dayjs(selectedRange.from).format('MMM DD, YYYY')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          ) : (
            <Button
              variant={isRangeSelected ? 'default' : 'outline'}
              size="icon"
              className={cn(
                'shrink-0',
                isRangeSelected && 'bg-blue-600 hover:bg-blue-700',
              )}
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100]" align="end">
          {content}
        </PopoverContent>
      </Popover>
    </div>
  );
}
