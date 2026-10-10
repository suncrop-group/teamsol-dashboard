import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi } from '@/api';
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
  Grid3X3,
  Search,
  Calendar,
  MapPin,
  User,
  Hash,
  Gauge,
  Navigation,
  FileText,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { EmptyState, PageHeader, StatusBadge } from '@/components/app';

interface AreaActivity {
  id: number;
  date: string;
  area_visited: string;
  employee: {
    name: string;
  };
  region: {
    name: string;
  };
  territory: Array<{
    name: string;
  }>;
  closing_meter: number;
  km_traveled: number;
}

// Removed FilterOptions interface - only using grouping

interface GroupingOptions {
  territories: boolean;
  date: boolean;
  employees: boolean;
}

interface GroupedActivity {
  title: string;
  data: AreaActivity[];
}
const ActivityCard: React.FC<{ item: AreaActivity; onClick: () => void }> = ({
  item,
  onClick,
}) => {
  return (
    <Card
      withBorder
      padding="md"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Stack gap="sm">
        {/* Header with Employee Name and Status */}
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Group gap="xs" wrap="nowrap" flex={1} miw={0}>
            <User size={16} color="var(--mantine-color-blue-6)" />
            <Text fw={600}>{item?.employee?.name || 'Unknown Employee'}</Text>
          </Group>
          <StatusBadge status="Sent" />
        </Group>

        {/* ID and Date */}
        <Stack gap={4} c="dimmed">
          <Group gap="xs">
            <Hash size={16} />
            <Text size="sm">#{item.id}</Text>
          </Group>
          <Group gap="xs">
            <Calendar size={16} />
            <Text size="sm">{dayjs(item.date).format('DD/MM/YYYY')}</Text>
          </Group>
        </Stack>

        {/* Location */}
        <Group gap="xs" align="flex-start" wrap="nowrap" c="dimmed">
          <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <Text size="sm">
            {item?.region?.name || 'N/A'} •{' '}
            {item?.territory?.map((t) => t.name).join(', ') || 'N/A'}
          </Text>
        </Group>

        {/* Area */}
        <Group gap="xs" wrap="nowrap" c="dimmed">
          <FileText size={16} style={{ flexShrink: 0 }} />
          <Text size="sm">Area: {item.area_visited}</Text>
        </Group>

        {/* Meter and KM */}
        <Divider />
        <Group justify="space-between" c="dimmed">
          <Group gap="xs">
            <Gauge size={16} />
            <Text size="sm">Meter: {item.closing_meter}</Text>
          </Group>
          <Group gap="xs">
            <Navigation size={16} />
            <Text size="sm">KM: {item.km_traveled}</Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};

const ActivityRow: React.FC<{ item: AreaActivity; onClick: () => void }> = ({
  item,
  onClick,
}) => {
  return (
    <Table.Tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Hash size={16} color="var(--mantine-color-gray-5)" />
          <Text fw={500}>#{item.id}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <User size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={500}>{item?.employee?.name || 'Unknown'}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" c="dimmed">
          <Calendar size={16} />
          <Text size="sm">{dayjs(item.date).format('DD/MM/YYYY')}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" c="dimmed">
          <MapPin size={16} style={{ flexShrink: 0 }} />
          <Text size="sm">
            {item?.region?.name} -{' '}
            {item?.territory?.map((t) => t.name).join(', ')}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {item.area_visited}
        </Text>
      </Table.Td>
      <Table.Td>
        <Stack gap={4} c="dimmed">
          <Group gap="xs" wrap="nowrap">
            <Gauge size={12} />
            <Text size="sm">{item.closing_meter}</Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Navigation size={12} />
            <Text size="sm">{item.km_traveled} km</Text>
          </Group>
        </Stack>
      </Table.Td>
      <Table.Td>
        <StatusBadge status="Sent" />
      </Table.Td>
    </Table.Tr>
  );
};

const RMAreaActivities: React.FC = () => {
  const user = useSelector(selectUser);
  const [activities, setActivities] = useState<AreaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);

  const [search, setSearch] = useState('');
  const [filteredActivities, setFilteredActivities] = useState<AreaActivity[]>(
    [],
  );

  const [groupBy, setGroupBy] = useState<GroupingOptions>({
    territories: false,
    date: false,
    employees: false,
  });

  const [tempGroupBy, setTempGroupBy] = useState<GroupingOptions>({
    territories: false,
    date: false,
    employees: false,
  });

  // Fetch area activities for Regional Manager
  const fetchAreaActivities = () => {
    setLoading(true);
    const onSuccess = (response) => {
      setLoading(false);
      response.data.sort((a, b) => {
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      });
      setActivities(response.data);
    };
    callApi(
      'GET',
      `/daily-activities/region/${user?.region_id || 200}`,
      null,
      onSuccess,
      (error) => {
        console.error('Error fetching area activities:', error);
        toast.error('Failed to fetch area activities', {
          description: 'Please try again',
        });
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    fetchAreaActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter activities based on search
  useEffect(() => {
    if (search === '') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter(
          (item) =>
            item.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.region?.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.territory?.some((t) =>
              t.name.toLowerCase().includes(search.toLowerCase()),
            ),
        ),
      );
    }
  }, [search, activities]);

  // Sync temp grouping state when modal opens
  useEffect(() => {
    if (showGrouping) {
      setTempGroupBy(groupBy);
    }
  }, [showGrouping, groupBy]);

  // Create section title for multiple grouping criteria
  const createSectionTitle = (activity: AreaActivity) => {
    const parts = [];

    if (groupBy.employees) {
      parts.push(`${activity?.employee?.name || 'Unknown Employee'}`);
    }

    if (groupBy.territories) {
      const territoryNames =
        activity.territory?.map((t) => t.name).join(', ') ||
        'Unknown Territory';
      parts.push(`${territoryNames}`);
    }

    if (groupBy.date) {
      parts.push(`${dayjs(activity.date).format('DD-MM-YYYY')}`);
    }

    return parts.join(' - ');
  };

  // Create grouping based on selected filters
  const createGroupedActivities = (): GroupedActivity[] => {
    const activitiesToGroup = filteredActivities;

    // If multiple filters are selected, group by the combination
    if (Object.values(groupBy).some(Boolean)) {
      const grouped = activitiesToGroup.reduce(
        (acc: Record<string, AreaActivity[]>, activity: AreaActivity) => {
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

  // Handle grouping toggle for temporary state
  const toggleTempGrouping = (
    filterType: 'territories' | 'date' | 'employees',
  ) => {
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

  const handleActivityClick = (activity: AreaActivity) => {
    // Navigate to activity details
    console.log('Activity clicked:', activity);
  };

  const groupedActivities = createGroupedActivities();


  const isGrouped = Object.values(groupBy).some(Boolean);

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Area Activities"
        back
        actions={
          activities.length > 0 && (
            <ActionIcon
              variant={isGrouped ? 'filled' : 'default'}
              color={isGrouped ? 'blue' : undefined}
              size="lg"
              aria-label="Group Area Activities"
              onClick={() => setShowGrouping(true)}
            >
              <Grid3X3 size={16} />
            </ActionIcon>
          )
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        {/* Search Bar */}
        <TextInput
          mb="lg"
          placeholder="Search by employee, region, or territory..."
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        {/* Active Grouping Summary */}
        {isGrouped && (
          <Alert color="blue" variant="light" p="sm" mb="lg">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                Active:
              </Text>
              {groupBy.territories && (
                <Badge variant="light" color="gray">
                  Grouped by Territories
                </Badge>
              )}
              {groupBy.date && (
                <Badge variant="light" color="gray">
                  Grouped by Date
                </Badge>
              )}
              {groupBy.employees && (
                <Badge variant="light" color="gray">
                  Grouped by Employees
                </Badge>
              )}
            </Group>
          </Alert>
        )}

        {loading ? (
          <Group justify="center" h={256}>
            <Loader />
          </Group>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title={
              search
                ? 'No activities found matching your search.'
                : 'No activities found.'
            }
            description="Try adjusting your filters or grouping."
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
                <Table.ScrollContainer minWidth={860} visibleFrom="md">
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Employee</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Location</Table.Th>
                        <Table.Th>Area</Table.Th>
                        <Table.Th>Meter/KM</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {group.data.map((activity) => (
                        <ActivityRow
                          key={activity.id}
                          item={activity}
                          onClick={() => handleActivityClick(activity)}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>

                {/* Mobile Card View */}
                <SimpleGrid
                  cols={{ base: 1, sm: 2 }}
                  spacing="md"
                  hiddenFrom="md"
                >
                  {group.data.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      item={activity}
                      onClick={() => handleActivityClick(activity)}
                    />
                  ))}
                </SimpleGrid>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Modal
        opened={showGrouping}
        onClose={() => setShowGrouping(false)}
        title={<Text fw={600}>Group Area Activities</Text>}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed" ta="center">
            Select multiple grouping options
          </Text>
          <Checkbox
            label="Group by Territories"
            checked={tempGroupBy.territories}
            onChange={() => toggleTempGrouping('territories')}
          />
          <Checkbox
            label="Group by Date"
            checked={tempGroupBy.date}
            onChange={() => toggleTempGrouping('date')}
          />
          <Checkbox
            label="Group by Employees"
            checked={tempGroupBy.employees}
            onChange={() => toggleTempGrouping('employees')}
          />
          <Group grow gap="sm">
            <Button onClick={applyGrouping}>Apply Grouping</Button>
            <Button
              variant="default"
              onClick={() => {
                setTempGroupBy({
                  territories: false,
                  date: false,
                  employees: false,
                });
                setGroupBy({
                  territories: false,
                  date: false,
                  employees: false,
                });
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

export default RMAreaActivities;
