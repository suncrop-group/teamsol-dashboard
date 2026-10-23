import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { ChevronRight, ClipboardCheck, ShieldCheck, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';

type Task = 'images' | 'attendees' | 'expense';

interface ReportItem {
  _id: string;
  sender_name: string;
  month: string;
  year: string;
}

interface EventItem {
  _id: string;
  name: string;
  date_begin?: string;
  organizer_name?: string;
  tasks?: Task[];
}

interface Dashboard {
  expenseReports?: { count: number; items: ReportItem[] };
  eventsToVerify?: { count: number; items: EventItem[] };
  newEvents?: { count: number; totals: Record<Task, number>; items: EventItem[] };
}

const TASK_LABELS: Record<Task, string> = {
  images: 'photos',
  attendees: 'attendees',
  expense: 'expense',
};

// Expense reports and events are reviewed once their month is over.
const PERIODS = {
  last: () => dayjs().subtract(1, 'month').format('YYYY-MM'),
  this: () => dayjs().format('YYYY-MM'),
};

const SHOWN = 3;

// Same surface as the rest of the home page.
const surface = {
  background: 'var(--app-surface)',
  boxShadow: '0 16px 32px -14px var(--app-shadow-md)',
  borderRadius: 24,
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const eventDay = (value?: string) => String(value || '').split(' ')[0];

function Section({
  icon: Icon,
  color,
  title,
  subtitle,
  onOpen,
  children,
}: {
  icon: typeof ShieldCheck;
  color: string;
  title: string;
  subtitle: string;
  onOpen: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Stack gap="sm" p="lg" style={surface}>
      <UnstyledButton onClick={onOpen}>
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={44} radius="md" variant="light" color={color}>
            <Icon size={22} />
          </ThemeIcon>
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={800}>{title}</Text>
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          </Stack>
          <ChevronRight size={18} />
        </Group>
      </UnstyledButton>
      {children}
    </Stack>
  );
}

function Item({
  title,
  detail,
  onOpen,
  children,
}: {
  title: string;
  detail?: string;
  onOpen: () => void;
  children?: React.ReactNode;
}) {
  return (
    <UnstyledButton
      onClick={onOpen}
      p="sm"
      style={{ borderRadius: 14, background: 'var(--mantine-color-default-hover)' }}
    >
      <Text size="sm" fw={700} truncate>
        {title}
      </Text>
      {detail ? (
        <Text size="xs" c="dimmed" truncate>
          {detail}
        </Text>
      ) : null}
      {children}
    </UnstyledButton>
  );
}

/**
 * The home page's to-do cards: expense reports to approve and events to
 * verify for a regional manager, and new events still to complete for anyone
 * with the Events module. The server decides which cards apply.
 */
export default function HomeTodo({ isRegionManager }: { isRegionManager: boolean }) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<keyof typeof PERIODS>('last');
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    callApi(
      'GET',
      `/v2/dashboard?month=${PERIODS[period]()}`,
      null,
      (response) => setData((response?.data as Dashboard) || null),
      () => {},
    );
  }, [period]);

  if (!data || (!data.expenseReports && !data.eventsToVerify && !data.newEvents)) return null;
  const { expenseReports, eventsToVerify, newEvents } = data;
  const eventPath = (id: string) =>
    isRegionManager ? `/event-details-rm/${id}` : `/event-details/${id}`;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={3} fw={800} lts={-0.3}>
          To do
        </Title>
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
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
        {expenseReports ? (
          <Section
            icon={ClipboardCheck}
            color={expenseReports.count ? 'yellow' : 'green'}
            title={`${plural(expenseReports.count, 'expense report')} to approve`}
            subtitle={
              expenseReports.count ? 'Sent to you and waiting for your decision' : 'Nothing waiting for you'
            }
            onOpen={() => navigate('/manage-expense-reports')}
          >
            {expenseReports.items.slice(0, SHOWN).map((report) => (
              <Item
                key={report._id}
                title={report.sender_name || 'Expense report'}
                detail={`${report.month}-${report.year}`}
                onOpen={() => navigate('/manage-expense-reports')}
              />
            ))}
          </Section>
        ) : null}

        {eventsToVerify ? (
          <Section
            icon={ShieldCheck}
            color={eventsToVerify.count ? 'blue' : 'green'}
            title={`${plural(eventsToVerify.count, 'event')} to verify`}
            subtitle={
              eventsToVerify.count ? 'Completed in your region, not verified yet' : 'All events are verified'
            }
            onOpen={() => navigate('/area-events')}
          >
            {eventsToVerify.items.slice(0, SHOWN).map((event) => (
              <Item
                key={event._id}
                title={event.name}
                detail={[event.organizer_name, eventDay(event.date_begin)].filter(Boolean).join(' · ')}
                onOpen={() => navigate(`/event-details-area/${event._id}`)}
              />
            ))}
          </Section>
        ) : null}

        {newEvents ? (
          <Section
            icon={Sparkles}
            color={newEvents.count ? 'red' : 'green'}
            title={`${plural(newEvents.count, 'new event')} to complete`}
            subtitle={
              newEvents.count
                ? 'Add what is missing, then mark the event Completed'
                : 'No event is waiting to be completed'
            }
            onOpen={() => navigate(isRegionManager ? '/regional-events' : '/events')}
          >
            {newEvents.count ? (
              <Group gap={6}>
                {(Object.keys(TASK_LABELS) as Task[])
                  .filter((task) => newEvents.totals[task] > 0)
                  .map((task) => (
                    <Badge key={task} variant="light" color="gray" tt="none">
                      {newEvents.totals[task]} without {TASK_LABELS[task]}
                    </Badge>
                  ))}
              </Group>
            ) : null}
            {newEvents.items.slice(0, SHOWN).map((event) => (
              <Item
                key={event._id}
                title={event.name}
                detail={eventDay(event.date_begin)}
                onOpen={() => navigate(eventPath(event._id))}
              >
                <Group gap={6} pt={4}>
                  {event.tasks?.length ? (
                    event.tasks.map((task) => (
                      <Badge key={task} variant="light" color="red" size="sm" tt="none">
                        Add {TASK_LABELS[task]}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="light" color="green" size="sm" tt="none">
                      Ready: mark Completed
                    </Badge>
                  )}
                </Group>
              </Item>
            ))}
          </Section>
        ) : null}
      </SimpleGrid>
    </Stack>
  );
}
