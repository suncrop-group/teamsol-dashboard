import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
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
} from '@mantine/core';
import {
  Search,
  Plus,
  Calendar,
  Hash,
  Wrench,
  X,
  Image as ImageIcon,
  Car,
  FileText,
} from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import {
  errorMessage,
  isFailed,
  isQueued,
  isUnsynced,
  recordRef,
  useQueuedRefresh,
} from '@/api/v2';
import { priceFormatter } from '@/utils';
import { toast } from '@/lib/toast';
import { DateFilter, type DateRange } from '@/components/DateFilter';
import {
  ConfirmModal,
  EmptyState,
  FailedActions,
  PageHeader,
  StatusBadge,
} from '@/components/app';

const RESOURCE = '/v2/fleet/services';

interface MaintenanceItem {
  _id: string;
  id?: number;
  jobId?: string;
  vehicle?: {
    name: string;
    license_plate: string;
  };
  name?: string;
  cost: number;
  status?: string;
  odooStatus?: string;
  syncError?: string;
  url?: string;
  date: string;
}

interface MaintenanceItemProps {
  item: MaintenanceItem;
  onCancel: (item: MaintenanceItem) => void;
  onEdit: (item: MaintenanceItem) => void;
  onChanged: () => void;
  onViewImage: (url: string) => void;
}

// A record still waiting in the queue can be cancelled; once it is in Odoo,
// only while Odoo has it as `done`.
const canCancel = (item: MaintenanceItem) =>
  isQueued(item) ||
  (!isUnsynced(item) && item.odooStatus?.toLowerCase() === 'done');

// Our status always; Odoo's own state once the record is there.
const Statuses = ({
  item,
  size,
  align,
}: {
  item: MaintenanceItem;
  size?: string;
  align?: string;
}) => (
  <Stack gap={4} align={align}>
    <StatusBadge status={item.status} size={size} />
    {!isUnsynced(item) && <StatusBadge status={item.odooStatus} size={size} />}
  </Stack>
);

const Actions = ({
  item,
  onCancel,
  onEdit,
  onChanged,
  onViewImage,
  card,
}: MaintenanceItemProps & { card?: boolean }) => {
  const view = item.url && (
    <Button
      variant="default"
      size={card ? 'sm' : 'xs'}
      leftSection={<ImageIcon size={card ? 16 : 14} />}
      onClick={() => onViewImage(item.url)}
    >
      View
    </Button>
  );

  if (isFailed(item)) {
    return (
      <Stack gap="xs" align={card ? 'stretch' : 'flex-start'}>
        {view}
        <FailedActions
          item={item}
          resource={RESOURCE}
          onEdit={() => onEdit(item)}
          onChanged={onChanged}
        />
      </Stack>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap" grow={card}>
      {view}
      <Button
        color="red"
        variant="light"
        size={card ? 'sm' : 'xs'}
        leftSection={card ? <X size={16} /> : undefined}
        onClick={() => onCancel(item)}
        disabled={!canCancel(item)}
      >
        Cancel
      </Button>
    </Group>
  );
};

// Mobile Card Component
const MaintenanceCard = (props: MaintenanceItemProps) => {
  const { item } = props;
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Group gap="xs" wrap="nowrap">
              <Car size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600}>{item.vehicle?.name}</Text>
            </Group>
            <Text size="xs" c="dimmed" ml={24}>
              {item.vehicle?.license_plate}
            </Text>
            <Group gap={6} mt={4}>
              <Text size="xs" fw={500} c="dimmed">
                PKR
              </Text>
              <Text fw={500} c="green">
                {priceFormatter(item.cost)}
              </Text>
            </Group>
          </Box>
          <Statuses item={item} size="sm" align="flex-end" />
        </Group>

        <Stack gap={4}>
          <Group gap="xs" c="dimmed">
            <Hash size={16} />
            <Text size="sm">{recordRef(item)}</Text>
          </Group>
          <Group gap="xs" c="dimmed">
            <Calendar size={16} />
            <Text size="sm">{dayjs(item.date).format('DD/MM/YYYY')}</Text>
          </Group>
        </Stack>

        {item.name && (
          <Group gap="xs" align="flex-start" wrap="nowrap" c="dimmed">
            <FileText size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <Text size="sm" lineClamp={2}>
              {item.name}
            </Text>
          </Group>
        )}

        <Actions {...props} card />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const MaintenanceRow = (props: MaintenanceItemProps) => {
  const { item } = props;
  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{recordRef(item)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Car size={16} color="var(--mantine-color-blue-6)" />
          <Box>
            <Text size="sm" fw={500}>
              {item.vehicle?.name}
            </Text>
            <Text size="xs" c="dimmed">
              {item.vehicle?.license_plate}
            </Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={600} c="green">
            {priceFormatter(item.cost)}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" lineClamp={2}>
          {item.name || 'No description'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {dayjs(item.date).format('DD/MM/YYYY')}
        </Text>
      </Table.Td>
      <Table.Td>
        <Statuses item={item} />
      </Table.Td>
      <Table.Td maw={320}>
        <Actions {...props} />
      </Table.Td>
    </Table.Tr>
  );
};

const Maintenance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState<MaintenanceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toCancel, setToCancel] = useState<MaintenanceItem | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchServiceData = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?category=service&limit=200`,
      null,
      (response) => {
        setLoading(false);
        setServiceData(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) toast.error('Failed to fetch maintenance records');
      },
    );
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  useQueuedRefresh(serviceData, () => fetchServiceData(true));

  const filteredServiceData = serviceData.filter((item) => {
    const matchesSearch =
      `${recordRef(item)} ${item?.vehicle?.name} ${item?.vehicle?.license_plate} ${item?.cost} ${item?.name}`
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

  const onConfirmCancel = () => {
    if (!toCancel) return;

    setLoadingCancel(true);
    callApi(
      'POST',
      `${RESOURCE}/${toCancel._id}/cancel`,
      {},
      () => {
        toast.success('Maintenance record cancelled');
        setLoadingCancel(false);
        setToCancel(null);
        fetchServiceData(true);
      },
      (error) => {
        setLoadingCancel(false);
        setToCancel(null);
        toast.error(
          errorMessage(
            error,
            'Failed to cancel maintenance record. Please try again.',
          ),
        );
      },
    );
  };

  const rowProps = {
    onCancel: setToCancel,
    onEdit: (item: MaintenanceItem) =>
      navigate('/add-maintenance', { state: { record: item } }),
    onChanged: () => fetchServiceData(true),
    onViewImage: setSelectedImage,
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Maintenance Records"
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/add-maintenance')}
          >
            Add Maintenance
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by ID, vehicle, or cost..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <DateFilter
            selectedRange={selectedDateRange}
            onSelect={setSelectedDateRange}
          />
        </Group>

        {loading ? (
          <Group justify="center" h={256}>
            <Loader />
          </Group>
        ) : filteredServiceData.length === 0 ? (
          <EmptyState
            icon={<Wrench size={32} />}
            title={
              searchQuery
                ? 'No maintenance records found matching your search.'
                : 'No maintenance records found.'
            }
            description={
              !searchQuery &&
              'Add your first maintenance record to get started.'
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={900} visibleFrom="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Vehicle</Table.Th>
                    <Table.Th>Cost</Table.Th>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredServiceData.map((item) => (
                    <MaintenanceRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredServiceData.map((item) => (
                <MaintenanceCard key={item._id} item={item} {...rowProps} />
              ))}
            </Stack>
          </>
        )}
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <ConfirmModal
        opened={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={onConfirmCancel}
        title="Cancel Maintenance Record"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep It"
        loading={loadingCancel}
      >
        Are you sure you want to cancel maintenance record{' '}
        {toCancel ? recordRef(toCancel) : ''}? This action cannot be undone.
      </ConfirmModal>

      {/* Image View Dialog */}
      {selectedImage && (
        <Modal
          opened={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          size="xl"
          padding="xs"
          centered
        >
          <Image
            src={selectedImage}
            alt="Maintenance receipt"
            fit="contain"
            mah="80vh"
            radius="md"
            onError={() => {
              toast.error('Failed to load image');
              setSelectedImage(null);
            }}
          />
        </Modal>
      )}
    </Container>
  );
};

export default Maintenance;
