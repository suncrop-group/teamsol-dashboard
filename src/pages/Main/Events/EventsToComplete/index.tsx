import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Badge,
  Card,
  Container,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core';
import { Sparkles } from 'lucide-react';
import dayjs from 'dayjs';

import { callApi } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import { EmptyState, PageHeader } from '@/components/app';

type Task = 'images' | 'attendees' | 'expense';

interface EventItem {
  _id: string;
  name: string;
  date_begin?: string;
  tasks?: Task[];
}

const TASK_LABELS: Record<Task, string> = {
  images: 'photos',
  attendees: 'attendees',
  expense: 'expense',
};

// The events still to complete are reviewed for a month; default to this one.
const PERIODS = {
  last: () => dayjs().subtract(1, 'month').format('YYYY-MM'),
  this: () => dayjs().format('YYYY-MM'),
};

const eventDay = (value?: string) => String(value || '').split(' ')[0];

/**
 * "Events to complete": the events the user organised that are still at New
 * and missing a task (photos, attendees or an expense), for the chosen month.
 * Opened from the home "to do" card; clicking a card opens the event itself.
 * The same data as the dashboard card, so the two always agree.
 */
export default function EventsToComplete() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isRegionManager = !!user?.is_region_manager;
  const [period, setPeriod] = useState<keyof typeof PERIODS>('this');
  const [items, setItems] = useState<EventItem[] | null>(null);

  const load = useCallback((key: keyof typeof PERIODS) => {
    setItems(null);
    callApi(
      'GET',
      `/v2/dashboard?month=${PERIODS[key]()}`,
      null,
      (response) => {
        const data = response?.data as { newEvents?: { items?: EventItem[] } } | undefined;
        const all: EventItem[] = data?.newEvents?.items || [];
        // Only the ones still missing something; the rest are ready to complete.
        setItems(all.filter((event) => (event.tasks || []).length > 0));
      },
      () => setItems([]),
    );
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  const detailPath = (id: string) =>
    isRegionManager ? `/event-details-rm/${id}` : `/event-details/${id}`;

  return (
    <Container size="sm" py="md">
      <PageHeader
        back
        title="Events to complete"
        description="Add what is missing, then mark each event Completed."
        actions={
          <SegmentedControl
            radius="xl"
            size="xs"
            value={period}
            onChange={(value) => setPeriod(value as keyof typeof PERIODS)}
            data={[
              { label: 'Last month', value: 'last' },
              { label: 'This month', value: 'this' },
            ]}
          />
        }
      />

      {items === null ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Nothing to complete this month"
          description="Every event you organised this month has what it needs."
        />
      ) : (
        <Stack gap="sm">
          {items.map((event) => (
            <Card
              key={event._id}
              withBorder
              radius="lg"
              padding="md"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(detailPath(event._id))}
            >
              <Stack gap={6}>
                <Text fw={700} truncate>
                  {event.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {eventDay(event.date_begin)}
                </Text>
                <Group gap={6}>
                  {(event.tasks || []).map((task) => (
                    <Badge key={task} variant="light" color="red" size="sm" tt="none">
                      Add {TASK_LABELS[task]}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
