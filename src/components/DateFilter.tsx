import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Popover,
  Text,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateFilterProps {
  selectedRange: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  triggerMode?: 'icon' | 'input';
}

const toPickerValue = (date?: Date) =>
  date ? dayjs(date).format('YYYY-MM-DD') : null;

export function DateFilter({
  selectedRange,
  onSelect,
  triggerMode = 'icon',
}: DateFilterProps) {
  const [opened, setOpened] = useState(false);
  const isRangeSelected = !!(selectedRange?.from && selectedRange?.to);

  const summary = selectedRange?.from
    ? selectedRange.to
      ? `${dayjs(selectedRange.from).format('DD MMM YYYY')} - ${dayjs(
          selectedRange.to,
        ).format('DD MMM YYYY')}`
      : 'Select end date'
    : 'Select start date';

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      shadow="md"
      withArrow
    >
      <Popover.Target>
        {triggerMode === 'input' ? (
          <Button
            variant="default"
            fullWidth
            justify="flex-start"
            fw={400}
            c={selectedRange?.from ? undefined : 'dimmed'}
            leftSection={<CalendarIcon size={16} />}
            onClick={() => setOpened((o) => !o)}
          >
            {selectedRange?.from
              ? selectedRange.to
                ? `${dayjs(selectedRange.from).format('MMM DD, YYYY')} - ${dayjs(
                    selectedRange.to,
                  ).format('MMM DD, YYYY')}`
                : dayjs(selectedRange.from).format('MMM DD, YYYY')
              : 'Pick a date range'}
          </Button>
        ) : (
          <ActionIcon
            variant={isRangeSelected ? 'filled' : 'default'}
            size="lg"
            aria-label="Filter by date range"
            onClick={() => setOpened((o) => !o)}
          >
            <Filter size={16} />
          </ActionIcon>
        )}
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Box p="md">
          <Text fw={500} size="sm">
            Filter by Date Range
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {summary}
          </Text>
        </Box>
        <Divider />
        <Box p="sm">
          <DatePicker
            type="range"
            numberOfColumns={2}
            maxDate={new Date()}
            value={[
              toPickerValue(selectedRange?.from),
              toPickerValue(selectedRange?.to),
            ]}
            onChange={([from, to]) =>
              onSelect(
                from
                  ? {
                      from: dayjs(from).toDate(),
                      to: to ? dayjs(to).toDate() : undefined,
                    }
                  : undefined,
              )
            }
          />
        </Box>
        <Divider />
        <Group justify="flex-end" p="xs">
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<X size={14} />}
            disabled={!selectedRange}
            onClick={() => onSelect(undefined)}
          >
            Clear Filter
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}
