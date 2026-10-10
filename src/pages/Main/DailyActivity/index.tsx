import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { callApi } from '@/api';
import { isFailed, recordRef, useQueuedRefresh } from '@/api/v2';
import dayjs from 'dayjs';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  Search,
  Plus,
  Calendar,
  Hash,
  MapPin,
  Gauge,
  Route,
  Grid3X3,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { DateFilter, type DateRange } from '@/components/DateFilter';
import {
  EmptyState,
  FailedActions,
  PageHeader,
  StatusBadge,
} from '@/components/app';

const RESOURCE = '/v2/daily-activities';

interface Activity {
  _id: string;
  // Odoo id; empty until the activity has been sent.
  id?: number;
  jobId?: string;
  syncError?: string;
  date: string;
  area_visited: string;
  closing_meter: number;
  km_traveled: number;
  status?: string;
  region_details?: {
    name: string;
  };
}

interface ActivityItemProps {
  item: Activity;
  onEdit: (item: Activity) => void;
  onChanged: () => void;
}

// An activity Odoo refused: the reason, and edit / resend / discard.
const Failed = ({ item, onEdit, onChanged }: ActivityItemProps) =>
  isFailed(item) ? (
    <FailedActions
      item={item}
      resource={RESOURCE}
      onEdit={() => onEdit(item)}
      onChanged={onChanged}
    />
  ) : null;

interface GroupingOptions {
  regions: boolean;
  date: boolean;
}

interface GroupedActivity {
  title: string;
  data: Activity[];
}

// Mobile Card Component
const ActivityCard = (props: ActivityItemProps) => {
  const { item } = props;
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        {/* Header with ID and Status */}
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Box flex={1} miw={0}>
            <Text fw={600}>Activity {recordRef(item)}</Text>
            <Group gap="xs" mt={4} c="dimmed" wrap="nowrap">
              <Calendar size={16} />
              <Text size="sm">
                {dayjs(item.date).format('DD/MM/YYYY')} -{' '}
                {dayjs(item.date).format('dddd')}
              </Text>
            </Group>
          </Box>
          <StatusBadge status={item.status} />
        </Group>

        {/* Area Visited */}
        <Group gap="xs" align="flex-start" wrap="nowrap">
          <MapPin
            size={16}
            color="var(--mantine-color-gray-6)"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <Box>
            <Text size="sm" fw={500}>
              Area:
            </Text>
            <Text size="sm" c="dimmed">
              {item.area_visited}
            </Text>
          </Box>
        </Group>

        {/* Meter and KM */}
        <Divider />
        <SimpleGrid cols={2} spacing="sm">
          <Group gap="xs" wrap="nowrap">
            <Gauge size={16} color="var(--mantine-color-blue-6)" />
            <Box>
              <Text size="xs" c="dimmed">
                Meter
              </Text>
              <Text fw={600}>{item.closing_meter}</Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Route size={16} color="var(--mantine-color-green-7)" />
            <Box>
              <Text size="xs" c="dimmed">
                KM Traveled
              </Text>
              <Text fw={600}>{item.km_traveled}</Text>
            </Box>
          </Group>
        </SimpleGrid>

        <Failed {...props} />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const ActivityRow = (props: ActivityItemProps) => {
  const { item } = props;
  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Hash size={16} color="var(--mantine-color-gray-5)" />
          <Text fw={500}>{recordRef(item)}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" c="dimmed">
          <Calendar size={16} />
          <Box>
            <Text size="sm">{dayjs(item.date).format('DD/MM/YYYY')}</Text>
            <Text size="xs">{dayjs(item.date).format('dddd')}</Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <MapPin
            size={16}
            color="var(--mantine-color-gray-5)"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <Text size="sm">{item.area_visited}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Gauge size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={500}>{item.closing_meter}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Route size={16} color="var(--mantine-color-green-7)" />
          <Text fw={500}>{item.km_traveled}</Text>
        </Group>
      </Table.Td>
      <Table.Td maw={280}>
        <Stack gap={4}>
          <StatusBadge status={item.status} />
          <Failed {...props} />
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
};

const DailyActivity: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [showGrouping, setShowGrouping] = useState(false);

  const [groupBy, setGroupBy] = useState<GroupingOptions>({
    regions: false,
    date: false,
  });

  const [tempGroupBy, setTempGroupBy] = useState<GroupingOptions>({
    regions: false,
    date: false,
  });

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchDailyActivities = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?limit=200`,
      null,
      (response) => {
        setLoading(false);
        setActivities(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) toast.error('Failed to fetch daily activities');
      },
    );
  };

  useEffect(() => {
    fetchDailyActivities();
  }, []);

  useQueuedRefresh(activities, () => fetchDailyActivities(true));

  // Initialize filtered activities when activities change
  useEffect(() => {
    setFilteredActivities(activities);
  }, [activities]);

  // Days that already have an activity, so the form can block them.
  const takenDates = () =>
    activities.map((activity) => ({
      date: dayjs(activity.date).format('YYYY-MM-DD'),
      id: activity._id,
    }));

  const handleAddActivity = () => {
    navigate('/add-daily-activity', {
      state: { dates: takenDates() },
      replace: true,
    });
  };

  const rowProps = {
    onEdit: (item: Activity) =>
      navigate('/add-daily-activity', {
        state: { record: item, dates: takenDates() },
      }),
    onChanged: () => fetchDailyActivities(true),
  };

  // Filter activities based on search and date
  const searchFilteredActivities = filteredActivities.filter((item) => {
    const matchesSearch =
      `${recordRef(item)} ${item?.area_visited} ${item?.closing_meter} ${item?.km_traveled}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesDate =
      !(selectedDateRange?.from && selectedDateRange?.to) ||
      (dayjs(item?.date).valueOf() >=
        dayjs(selectedDateRange.from).startOf('day').valueOf() &&
        dayjs(item?.date).valueOf() <=
          dayjs(selectedDateRange.to).endOf('day').valueOf());
    return matchesSearch && matchesDate;
  });

  // Create section title for multiple grouping criteria
  const createSectionTitle = (activity: Activity) => {
    const parts = [];

    if (groupBy.regions) {
      parts.push(`${activity.region_details?.name || 'Unknown Region'}`);
    }

    if (groupBy.date) {
      parts.push(`${dayjs(activity.date).format('DD-MM-YYYY')}`);
    }

    return parts.join(' - ');
  };

  // Create grouping based on selected filters
  const createGroupedActivities = (): GroupedActivity[] => {
    const activitiesToGroup = searchFilteredActivities;

    // If multiple filters are selected, group by the combination
    if (Object.values(groupBy).some(Boolean)) {
      const grouped = activitiesToGroup.reduce(
        (acc: Record<string, Activity[]>, activity: Activity) => {
          const sectionTitle = createSectionTitle(activity);
          if (!acc[sectionTitle]) {
            acc[sectionTitle] = [];
          }
          acc[sectionTitle].push(activity);
          return acc;
        },
        {},
      );

      return Object.keys(grouped).map((key) => ({
        title: key,
        data: grouped[key],
      }));
    } else {
      return activitiesToGroup?.length > 0
        ? [{ title: '', data: activitiesToGroup }]
        : [];
    }
  };

  // Sync temp grouping state when modal opens
  useEffect(() => {
    if (showGrouping) {
      setTempGroupBy(groupBy);
    }
  }, [showGrouping, groupBy]);

  // Handle grouping toggle for temporary state
  const toggleTempGrouping = (filterType: 'regions' | 'date') => {
    setTempGroupBy((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  // Apply grouping when button is pressed
  const applyGrouping = () => {
    setGroupBy(tempGroupBy);
    setShowGrouping(false);
  };

  const groupedActivities = createGroupedActivities();


  const isGrouped = Object.values(groupBy).some(Boolean);

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Daily Activities"
        actions={
          <>
            {activities.length > 0 && (
              <ActionIcon
                variant={isGrouped ? 'filled' : 'default'}
                color={isGrouped ? 'blue' : undefined}
                size="lg"
                aria-label="Group Daily Activities"
                onClick={() => setShowGrouping(true)}
              >
                <Grid3X3 size={16} />
              </ActionIcon>
            )}
            <Button
              leftSection={<Plus size={16} />}
              onClick={handleAddActivity}
            >
              Add Activity
            </Button>
          </>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        {/* Search Bar */}
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by ID, area, meter, or km..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <DateFilter
            selectedRange={selectedDateRange}
            onSelect={setSelectedDateRange}
          />
        </Group>

        {/* Active Filters & Grouping Summary */}
        {isGrouped && (
          <Alert color="blue" variant="light" p="sm" mb="md">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                Active:
              </Text>
              {groupBy.date && (
                <Badge variant="light" color="gray">
                  Grouped by Date
                </Badge>
              )}
            </Group>
          </Alert>
        )}

        {loading ? (
          <Group justify="center" h={256}>
            <Loader />
          </Group>
        ) : groupedActivities.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title={
              searchQuery
                ? 'No activities found matching your search.'
                : 'No activities found.'
            }
            description={
              !searchQuery && 'Add your first activity to get started.'
            }
          />
        ) : (
          <Stack gap="xl">
            {groupedActivities.map((group) => (
              <Stack key={group.title || 'all-activities'} gap="md">
                {group.title && (
                  <Box>
                    <Title order={4} mb="xs">
                      {group.title}
                    </Title>
                    <Divider />
                  </Box>
                )}

                {/* Desktop Table View */}
                <Table.ScrollContainer minWidth={720} visibleFrom="md">
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Area Visited</Table.Th>
                        <Table.Th>Closing Meter</Table.Th>
                        <Table.Th>KM Traveled</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {group.data.map((item) => (
                        <ActivityRow key={item._id} item={item} {...rowProps} />
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>

                {/* Mobile Card View */}
                <Stack gap="md" hiddenFrom="md">
                  {group.data.map((item) => (
                    <ActivityCard key={item._id} item={item} {...rowProps} />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Modal
        opened={showGrouping}
        onClose={() => setShowGrouping(false)}
        title={<Text fw={600}>Group Daily Activities</Text>}
      >
        <Stack gap="md">
          <Checkbox
            label="Group by Date"
            checked={tempGroupBy.date}
            onChange={() => toggleTempGrouping('date')}
          />
          <Group grow gap="sm">
            <Button onClick={applyGrouping}>Apply Grouping</Button>
            <Button
              variant="default"
              onClick={() => {
                setTempGroupBy({ regions: false, date: false });
                setGroupBy({ regions: false, date: false });
                setShowGrouping(false);
              }}
            >
              Clear
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default DailyActivity;
