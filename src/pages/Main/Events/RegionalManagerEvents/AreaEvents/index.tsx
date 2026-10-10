import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { toast } from '@/lib/toast';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { isUnsynced, recordRef, useQueuedRefresh } from '@/api/v2';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
import {
  Filter,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Hash,
  Search,
} from 'lucide-react';
import { DateFilter, type DateRange } from '@/components/DateFilter';
import { EmptyState, StatusBadge } from '@/components/app';

interface EventItem {
  _id: string;
  // Odoo id; empty until the event has been sent.
  id?: number;
  jobId?: string;
  status?: string;
  name: string;
  region: { name: string };
  territory: { name: string };
  event_type: { name: string };
  event_stage: { name: string };
  crops: Array<{ name: string }>;
  demo_products: Array<{ name: string }>;
  date_begin: string;
  date_end: string;
  verified: boolean;
  rsmAttended?: boolean;
  images?: string[];
}

const EventBadges = ({
  item,
  size,
}: {
  item: EventItem;
  size?: 'xs' | 'sm';
}) => (
  <>
    {/* An event that is not in Odoo yet has no stage; show where it is. */}
    {isUnsynced(item) ? (
      <StatusBadge status={item.status} size={size} />
    ) : (
      <StatusBadge status={item?.event_stage?.name} size={size} />
    )}
    <StatusBadge
      status={item?.verified ? 'Verified' : 'Unverified'}
      size={size}
      leftSection={
        item?.verified ? <CheckCircle2 size={12} /> : <XCircle size={12} />
      }
    />
    {item?.rsmAttended && (
      <Badge
        color="green"
        variant="light"
        tt="capitalize"
        w="fit-content"
        size={size}
        leftSection={<Users size={12} />}
      >
        Attended
      </Badge>
    )}
  </>
);

const ImagePreviewModal = ({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) => (
  <Modal opened onClose={onClose} size="xl" padding="xs">
    <Image src={src} alt="Event Image" mah="85vh" fit="contain" radius="md" />
  </Modal>
);

const EventsCard = ({
  item,
  toggleEventImages,
  setToggleEventImages,
}: {
  item: EventItem;
  toggleEventImages: string[];
  setToggleEventImages: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleImages = () => {
    setToggleEventImages((prev) => {
      if (prev.includes(item._id)) {
        return prev.filter((id) => id !== item._id);
      } else {
        return [...prev, item._id];
      }
    });
  };

  return (
    <>
      <Card
        withBorder
        padding="md"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/event-details-area/${item._id}`)}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text fw={600} flex={1}>
              {recordRef(item)} - {item?.name}
            </Text>
            <Stack gap={4} align="flex-end">
              <EventBadges item={item} size="sm" />
            </Stack>
          </Group>

          <Stack gap={6}>
            <Group gap="xs" c="dimmed" wrap="nowrap">
              <MapPin size={16} style={{ flexShrink: 0 }} />
              <Text size="sm">
                {item?.region?.name} - {item?.territory?.name}
              </Text>
            </Group>
            <Text size="sm">
              <Text span fw={500}>
                Products:{' '}
              </Text>
              {item?.demo_products?.map((product) => product.name).join(', ')}
            </Text>
            <Text size="sm">
              <Text span fw={500}>
                Crop:{' '}
              </Text>
              {item?.crops?.map((crop) => crop.name).join(', ')}
            </Text>
            <Text size="sm">
              <Text span fw={500}>
                Event Type:{' '}
              </Text>
              {item?.event_type?.name}
            </Text>
            <Group gap="xs" c="dimmed" wrap="nowrap">
              <Calendar size={16} style={{ flexShrink: 0 }} />
              <Text size="sm">
                {item?.date_begin} - {item?.date_end} 🕒
              </Text>
            </Group>
          </Stack>

          {/* Image Toggle Button */}
          {item?.images && item.images.length > 0 && (
            <Box>
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<ImageIcon size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImages();
                }}
              >
                {toggleEventImages.includes(item._id)
                  ? `Hide Image${item.images.length > 1 ? 's' : ''}`
                  : `Show Image${item.images.length > 1 ? 's' : ''}`}{' '}
                ({item.images.length})
              </Button>
            </Box>
          )}

          {/* Image Gallery */}
          {item?.images &&
            item.images.length > 0 &&
            toggleEventImages.includes(item._id) && (
              <Group gap="xs">
                {item.images.map((imageUrl: string, index: number) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Event image ${index + 1}`}
                    w={96}
                    h={96}
                    fit="cover"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(imageUrl);
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </Group>
            )}
        </Stack>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <ImagePreviewModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

const EventsTableRow = ({
  item,
  toggleEventImages,
  setToggleEventImages,
  setSelectedImage,
}) => {
  const navigate = useNavigate();

  const toggleImages = (e) => {
    e.stopPropagation();
    setToggleEventImages((prev) => {
      if (prev.includes(item._id)) {
        return prev.filter((id) => id !== item._id);
      } else {
        return [...prev, item._id];
      }
    });
  };

  return (
    <>
      <Table.Tr
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/event-details-area/${item._id}`)}
      >
        <Table.Td>
          <Group gap="xs" wrap="nowrap">
            <Hash size={16} color="var(--mantine-color-gray-5)" />
            <Box>
              <Text fw={500}>{recordRef(item)}</Text>
              <Text size="xs" c="dimmed" maw={150} truncate title={item?.name}>
                {item?.name}
              </Text>
            </Box>
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <MapPin
              size={16}
              color="var(--mantine-color-blue-6)"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <Box>
              <Text fw={500}>{item?.region?.name}</Text>
              <Text size="xs" c="dimmed">
                {item?.territory?.name}
              </Text>
            </Box>
          </Group>
        </Table.Td>
        <Table.Td>
          <Stack gap={4}>
            {item?.demo_products?.length > 0 && (
              <Group gap={4} wrap="nowrap" align="flex-start">
                <Text size="xs" fw={500} c="dimmed">
                  Products:
                </Text>
                <Text
                  size="xs"
                  maw={150}
                  truncate
                  title={item?.demo_products?.map((p) => p.name).join(', ')}
                >
                  {item?.demo_products?.map((p) => p.name).join(', ')}
                </Text>
              </Group>
            )}
            {item?.crops?.length > 0 && (
              <Group gap={4} wrap="nowrap" align="flex-start">
                <Text size="xs" fw={500} c="dimmed">
                  Crop:
                </Text>
                <Text
                  size="xs"
                  maw={150}
                  truncate
                  title={item?.crops?.map((c) => c.name).join(', ')}
                >
                  {item?.crops?.map((c) => c.name).join(', ')}
                </Text>
              </Group>
            )}
            <Group gap={4} wrap="nowrap" align="flex-start">
              <Text size="xs" fw={500} c="dimmed">
                Type:
              </Text>
              <Text size="xs">{item?.event_type?.name}</Text>
            </Group>
          </Stack>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" wrap="nowrap" c="dimmed">
            <Calendar size={16} style={{ flexShrink: 0 }} />
            <Box>
              <Text size="sm">{item?.date_begin}</Text>
              <Text size="xs">to {item?.date_end}</Text>
            </Box>
          </Group>
        </Table.Td>
        <Table.Td>
          <Stack gap={4} align="flex-start">
            <EventBadges item={item} size="sm" />
          </Stack>
        </Table.Td>
        <Table.Td>
          {item?.images && item.images.length > 0 ? (
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<ImageIcon size={16} />}
              onClick={toggleImages}
            >
              {toggleEventImages.includes(item._id) ? 'Hide' : 'Show'} (
              {item.images.length})
            </Button>
          ) : (
            <Text size="xs" c="dimmed">
              No images
            </Text>
          )}
        </Table.Td>
      </Table.Tr>

      {/* Image Gallery Row (conditionally rendered) */}
      {item?.images &&
        item.images.length > 0 &&
        toggleEventImages.includes(item._id) && (
          <Table.Tr>
            <Table.Td colSpan={6} p="md">
              <Group gap="xs">
                {item.images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Event image ${index + 1}`}
                    w={80}
                    h={80}
                    fit="cover"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(imageUrl);
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </Group>
            </Table.Td>
          </Table.Tr>
        )}
    </>
  );
};

const AreaEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState({ territory: false, stages: false });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toggleEventImages, setToggleEventImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // `quiet` reloads in place, without swapping the list for a spinner.
  const fetchEvents = (page = 1, quiet = false) => {
    if (!quiet) dispatch(resetProducts());
    const onSuccess = (response) => {
      setLoading(false);
      setEvents(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    };
    const onError = () => {
      setLoading(false);
      if (!quiet) toast.error('Failed to fetch events', { description: 'Error' });
    };
    if (!quiet) setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '100',
    });

    if (searchQuery) params.append('search', searchQuery);
    if (selectedDateRange?.from && selectedDateRange?.to) {
      params.append('startDate', selectedDateRange.from.toISOString());
      params.append('endDate', selectedDateRange.to.toISOString());
    }

    callApi(
      'GET',
      `/v2/events/region?${params.toString()}`,
      null,
      onSuccess,
      onError,
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents(currentPage);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [currentPage, searchQuery, selectedDateRange]);

  useQueuedRefresh(events, () => fetchEvents(currentPage, true));

  // The Odoo id once the event has one, the job reference until then.
  const refMatches = (item) =>
    recordRef(item).toLowerCase().includes(searchQuery.toLowerCase());

  const groupByTerritory = () => {
    const grouped = events.reduce((acc, event) => {
      const territoryName = event.territory?.name || 'Unknown';
      if (!acc[territoryName]) acc[territoryName] = [];
      acc[territoryName].push(event);
      return acc;
    }, {});
    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));
  };

  const groupByStages = () => {
    const grouped = events.reduce((acc, event) => {
      const stageName = event.event_stage?.name || 'Unknown';
      if (!acc[stageName]) acc[stageName] = [];
      acc[stageName].push(event);
      return acc;
    }, {});
    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));
  };

  const groupByTerritoryAndStages = () => {
    const groupedByTerritory = events.reduce((acc, event) => {
      const territoryName = event.territory?.name || 'Unknown';
      if (!acc[territoryName]) acc[territoryName] = [];
      acc[territoryName].push(event);
      return acc;
    }, {});
    return Object.keys(groupedByTerritory).map((territory) => {
      const eventsInTerritory = groupedByTerritory[territory];
      const groupedByStage = eventsInTerritory.reduce((acc, event) => {
        const stageName = event.event_stage?.name || 'Unknown';
        if (!acc[stageName]) acc[stageName] = [];
        acc[stageName].push(event);
        return acc;
      }, {});
      const stageSections = Object.keys(groupedByStage).map((stage) => ({
        title: stage,
        data: groupedByStage[stage],
      }));
      return { title: territory, data: stageSections };
    });
  };

  const filteredEvents = events.filter((item) => {
    const matchesSearch =
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.region?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.territory?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.event_type?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      refMatches(item);

    const matchesDate =
      !(selectedDateRange?.from && selectedDateRange?.to) ||
      (dayjs(item?.date).valueOf() >=
        dayjs(selectedDateRange.from).startOf('day').valueOf() &&
        dayjs(item?.date).valueOf() <=
          dayjs(selectedDateRange.to).endOf('day').valueOf());
    return matchesSearch && matchesDate;
  });

  let groupedEvents = [];
  if (filterBy.territory && filterBy.stages) {
    groupedEvents = groupByTerritoryAndStages();
  } else if (filterBy.territory) {
    groupedEvents = groupByTerritory();
  } else if (filterBy.stages) {
    groupedEvents = groupByStages();
  } else {
    groupedEvents =
      filteredEvents.length > 0 ? [{ title: '', data: filteredEvents }] : [];
  }

  const flattenedSections =
    filterBy.territory && filterBy.stages
      ? groupedEvents.flatMap((territorySection) =>
          territorySection.data.map((stageSection) => ({
            title: `${territorySection.title} - ${stageSection.title}`,
            data: stageSection.data.filter(
              (item) =>
                item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.region?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.territory?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.event_type?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                refMatches(item),
            ),
          })),
        )
      : groupedEvents.map((section) => ({
          title: section.title,
          data: section.data.filter(
            (item) =>
              item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item?.region?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              item?.territory?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              item?.event_type?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              refMatches(item),
          ),
        }));

  return (
    <Container size="xl" px={0}>
      <Group justify="space-between" gap="sm" mb="lg" wrap="nowrap">
        <Group gap="sm" flex={1} wrap="nowrap">
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Go back"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={16} />
          </ActionIcon>
          <TextInput
            flex={1}
            maw={448}
            placeholder="Search by event name, region, territory, or ID..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </Group>
        {events.length > 0 && (
          <>
            <Button
              variant="default"
              leftSection={<Filter size={16} />}
              onClick={() => setFilterModalVisible(true)}
            >
              Filter
            </Button>
            <Modal
              opened={filterModalVisible}
              onClose={() => setFilterModalVisible(false)}
              title={<Text fw={600}>Filter Events</Text>}
            >
              <Stack gap="md">
                <DateFilter
                  selectedRange={selectedDateRange}
                  onSelect={setSelectedDateRange}
                  triggerMode="input"
                />
                <Stack gap="xs">
                  <Checkbox
                    label="Group by Territory"
                    checked={selectedFilters.includes('territory')}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      setSelectedFilters((prev) =>
                        checked
                          ? [...prev, 'territory']
                          : prev.filter((f) => f !== 'territory'),
                      );
                    }}
                  />
                  <Checkbox
                    label="Group by Event Stages"
                    checked={selectedFilters.includes('stages')}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      setSelectedFilters((prev) =>
                        checked
                          ? [...prev, 'stages']
                          : prev.filter((f) => f !== 'stages'),
                      );
                    }}
                  />
                </Stack>
                <Button
                  onClick={() => {
                    setFilterBy({
                      territory: selectedFilters.includes('territory'),
                      stages: selectedFilters.includes('stages'),
                    });
                    setFilterModalVisible(false);
                  }}
                >
                  Apply Filter
                </Button>
              </Stack>
            </Modal>
          </>
        )}
      </Group>

      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <Stack gap="lg">
          <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
            <Stack gap="lg">
              {flattenedSections.map((section, index) => (
                <Box key={index}>
                  {section.title && (
                    <Title order={4} mb="md">
                      {section.title}
                    </Title>
                  )}
                  {/* Desktop Table View */}
                  <Table.ScrollContainer minWidth={820} visibleFrom="md">
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>ID / Name</Table.Th>
                          <Table.Th>Location</Table.Th>
                          <Table.Th>Details</Table.Th>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Images</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {section.data.map((item, idx) => (
                          <EventsTableRow
                            key={`desktop-${item._id}-${idx}`}
                            item={item}
                            toggleEventImages={toggleEventImages}
                            setToggleEventImages={setToggleEventImages}
                            setSelectedImage={setSelectedImage}
                          />
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>

                  {/* Mobile Card View */}
                  <Stack gap="md" hiddenFrom="md">
                    {section.data.map((item, idx) => (
                      <EventsCard
                        key={`mobile-${item._id}-${idx}`}
                        item={item}
                        toggleEventImages={toggleEventImages}
                        setToggleEventImages={setToggleEventImages}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
              {flattenedSections.every(
                (section) => section.data.length === 0,
              ) && (
                <EmptyState
                  icon={<Calendar size={32} />}
                  title="No event found under your region."
                />
              )}
            </Stack>
          </Paper>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <Paper withBorder shadow="sm" p="md">
              <Group justify="space-between" gap="sm">
                <Text size="sm" c="dimmed" fw={500}>
                  Showing{' '}
                  <Text span fw={600} c="var(--mantine-color-text)">
                    {(currentPage - 1) * pagination.limit + 1}
                  </Text>{' '}
                  to{' '}
                  <Text span fw={600} c="var(--mantine-color-text)">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </Text>{' '}
                  of{' '}
                  <Text span fw={600} c="var(--mantine-color-text)">
                    {pagination.total}
                  </Text>{' '}
                  events
                </Text>
                <Group gap="xs">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Group gap={6} mx="xs">
                    <Text size="sm" fw={500}>
                      Page
                    </Text>
                    <Badge variant="light" size="lg" radius="md">
                      {currentPage}
                    </Badge>
                    <Text size="sm" fw={500}>
                      of {pagination.totalPages}
                    </Text>
                  </Group>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, pagination.totalPages),
                      )
                    }
                    disabled={currentPage === pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </Group>
              </Group>
            </Paper>
          )}
        </Stack>
      )}

      {/* Shared Image Modal for Desktop Table */}
      {selectedImage && (
        <ImagePreviewModal
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </Container>
  );
};

export default AreaEvents;
