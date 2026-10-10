import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
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
} from "@mantine/core";
import {
  Filter,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Calendar,
  Clock,
  Image as ImageIcon,
  Hash,
  Plus,
  Search,
} from "lucide-react";
import dayjs from "dayjs";
import { callApi } from "@/api";
import { isFailed, isUnsynced, recordRef, useQueuedRefresh } from "@/api/v2";
import { resetProducts } from "@/redux/slices/OrderCreationSlice";
import { toast } from "@/lib/toast";
import { DateFilter, type DateRange } from "@/components/DateFilter";
import {
  EmptyState,
  FailedActions,
  PageHeader,
  StatusBadge,
} from "@/components/app";

const RESOURCE = "/v2/events";

// Until the event is in Odoo it has no stage: show where it is in the queue.
const StageBadge = ({ item }) => (
  <StatusBadge
    status={isUnsynced(item) ? item.status : item?.event_stage?.name}
    size="sm"
  />
);

// Reason Odoo refused the event, with Edit & resend / Resend / Discard.
// Clicks (the discard dialog's too) must not open the event underneath.
const Failed = ({ item, onChanged }) => {
  const navigate = useNavigate();
  return (
    <Box onClick={(e) => e.stopPropagation()} maw={280}>
      <FailedActions
        item={item}
        resource={RESOURCE}
        onEdit={() => navigate("/add-event", { state: { record: item } })}
        onChanged={onChanged}
      />
    </Box>
  );
};

const ImagePreviewModal = ({
  image,
  onClose,
}: {
  image: string | null;
  onClose: () => void;
}) =>
  image ? (
    <Modal opened={!!image} onClose={onClose} size="xl" centered>
      <Image src={image} alt="Event Image" fit="contain" mah="75vh" />
    </Modal>
  ) : null;

const EventsCard = ({
  item,
  toggleEventImages,
  setToggleEventImages,
  onChanged,
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
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`/event-details/${item._id}`)}
      >
        <Stack gap="sm">
          <Text fw={600} size="lg">
            {recordRef(item)} - {item?.name}
          </Text>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text size="sm" c="dimmed">
              {item?.region?.name} - {item?.territory?.name}
            </Text>
            <Stack gap={4} align="flex-end">
              <StageBadge item={item} />
              <StatusBadge
                status={item?.verified ? "Verified" : "Unverified"}
                size="sm"
              />
            </Stack>
          </Group>
          <Stack gap={4}>
            <Text size="sm">
              <Text span fw={500}>
                Products:{" "}
              </Text>
              {item?.demo_products?.map((product) => product.name).join(", ")}
            </Text>
            <Text size="sm">
              <Text span fw={500}>
                Crop:{" "}
              </Text>
              {item?.crops?.map((crop) => crop.name).join(", ")}
            </Text>
            <Text size="sm">
              <Text span fw={500}>
                Event Type:{" "}
              </Text>
              {item?.event_type?.name}
            </Text>
            <Group gap="xs" c="dimmed" wrap="nowrap">
              <Clock size={16} style={{ flexShrink: 0 }} />
              <Text size="sm">
                {item?.date_begin} - {item?.date_end}
              </Text>
            </Group>
          </Stack>

          {isFailed(item) && <Failed item={item} onChanged={onChanged} />}

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
                  ? `Hide Image${item.images.length > 1 ? "s" : ""}`
                  : `Show Image${item.images.length > 1 ? "s" : ""}`}{" "}
                ({item.images.length})
              </Button>
            </Box>
          )}

          {/* Image Gallery */}
          {item?.images &&
            item.images.length > 0 &&
            toggleEventImages.includes(item._id) && (
              <Group gap="xs">
                {item.images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Event image ${index + 1}`}
                    w={96}
                    h={96}
                    fit="cover"
                    radius="md"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(imageUrl);
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </Group>
            )}
        </Stack>
      </Card>

      {/* Image Modal */}
      <ImagePreviewModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

const EventsTableRow = ({
  item,
  toggleEventImages,
  setToggleEventImages,
  setSelectedImage,
  onChanged,
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
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`/event-details/${item._id}`)}
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
                  title={item?.demo_products?.map((p) => p.name).join(", ")}
                >
                  {item?.demo_products?.map((p) => p.name).join(", ")}
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
                  title={item?.crops?.map((c) => c.name).join(", ")}
                >
                  {item?.crops?.map((c) => c.name).join(", ")}
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
            <StageBadge item={item} />
            <StatusBadge
              status={item?.verified ? "Verified" : "Unverified"}
              size="sm"
              leftSection={
                item?.verified ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <XCircle size={12} />
                )
              }
            />
            {item?.rsmAttended && (
              <Badge
                color="green"
                variant="light"
                size="sm"
                leftSection={<Users size={12} />}
              >
                Attended
              </Badge>
            )}
            {isFailed(item) && <Failed item={item} onChanged={onChanged} />}
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
              {toggleEventImages.includes(item._id) ? "Hide" : "Show"} (
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
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(imageUrl);
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
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

const TerritoryManagerEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState({ stages: false });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toggleEventImages, setToggleEventImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // `quiet` reloads in place, without swapping the list for a spinner.
  // The server returns at most 200 events a page, so every page is read.
  const fetchSalesOrders = (quiet = false) => {
    if (!quiet) {
      dispatch(resetProducts());
      setLoading(true);
    }
    const onError = () => {
      setLoading(false);
      if (!quiet) {
        toast.error("Failed to fetch events", {
          description: "Error",
        });
      }
    };
    const fetchPage = (page, previous) => {
      callApi(
        "GET",
        `${RESOURCE}?limit=200&page=${page}`,
        null,
        (response) => {
          const all = [...previous, ...(response.data || [])];
          if (response.pagination?.hasMore) {
            fetchPage(page + 1, all);
            return;
          }
          setLoading(false);
          all.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
          );
          setEvents(all);
        },
        onError,
      );
    };
    fetchPage(1, []);
  };

  useEffect(() => {
    fetchSalesOrders();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useQueuedRefresh(events, () => fetchSalesOrders(true));

  const groupByStages = () => {
    const grouped = events.reduce((acc, event) => {
      const stageName =
        (isUnsynced(event) ? "" : event.event_stage?.name) || "Unknown";
      if (!acc[stageName]) {
        acc[stageName] = [];
      }
      acc[stageName].push(event);
      return acc;
    }, {});

    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));
  };

  const isFilterMatch = (item) => {
    const matchesSearch =
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.region?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.territory?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.event_type?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      recordRef(item).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate =
      !(selectedDateRange?.from && selectedDateRange?.to) ||
      (dayjs(item?.date).valueOf() >=
        dayjs(selectedDateRange.from).startOf("day").valueOf() &&
        dayjs(item?.date).valueOf() <=
          dayjs(selectedDateRange.to).endOf("day").valueOf());
    return matchesSearch && matchesDate;
  };

  const filteredEvents = events.filter(isFilterMatch);

  const groupedEvents = filterBy.stages
    ? groupByStages()
        .map((section) => ({
          ...section,
          data: section.data.filter(isFilterMatch),
        }))
        .filter((section) => section.data.length > 0)
    : filteredEvents.length > 0
      ? [{ title: "", data: filteredEvents }]
      : [];

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Events"
        back={() => navigate("/")}
        actions={
          <>
            {events.length > 0 && (
              <Button
                variant="default"
                leftSection={<Filter size={16} />}
                onClick={() => setFilterModalVisible(true)}
              >
                Filter
              </Button>
            )}
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => navigate("/add-event")}
              disabled={loading}
            >
              Add Event
            </Button>
          </>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: "md", sm: "lg" }}>
        <TextInput
          mb="lg"
          placeholder="Search by event name, region, territory, or ID..."
          leftSection={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />

        {loading ? (
          <Group justify="center" h={256}>
            <Loader />
          </Group>
        ) : (
          <Stack gap="xl">
            {groupedEvents.map((section, index) => (
              <Box key={index}>
                {section.title && (
                  <Title order={4} mb="md">
                    {section.title}
                  </Title>
                )}
                {/* Desktop Table View */}
                <Table.ScrollContainer minWidth={820} visibleFrom="md">
                  <Table highlightOnHover>
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
                      {section.data.map((item) => (
                        <EventsTableRow
                          key={`desktop-${item._id}`}
                          item={item}
                          onChanged={() => fetchSalesOrders(true)}
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
                  {section.data.map((item) => (
                    <EventsCard
                      key={`mobile-${item._id}`}
                      item={item}
                      onChanged={() => fetchSalesOrders(true)}
                      toggleEventImages={toggleEventImages}
                      setToggleEventImages={setToggleEventImages}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
            {groupedEvents.length === 0 && (
              <EmptyState
                icon={<Calendar size={32} />}
                title="No events found."
                action={
                  <Button mt="sm" onClick={() => navigate("/add-event")}>
                    Add Event
                  </Button>
                }
              />
            )}
          </Stack>
        )}
      </Paper>

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
          <Checkbox
            label="Group by Event Stages"
            checked={selectedFilter === "stages"}
            onChange={(e) =>
              setSelectedFilter(e.currentTarget.checked ? "stages" : "")
            }
          />
          <Button
            onClick={() => {
              setFilterBy({ stages: selectedFilter === "stages" });
              setFilterModalVisible(false);
            }}
          >
            Apply Filter
          </Button>
        </Stack>
      </Modal>

      {/* Image Modal for Desktop Table */}
      <ImagePreviewModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </Container>
  );
};

export default TerritoryManagerEvents;
