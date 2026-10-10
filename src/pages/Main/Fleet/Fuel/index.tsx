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
  Fuel as FuelIcon,
  X,
  Image as ImageIcon,
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

interface FuelItem {
  _id: string;
  id?: number;
  jobId?: string;
  liters: number;
  cost: number;
  status?: string;
  odooStatus?: string;
  syncError?: string;
  url?: string;
  date: string;
}

interface FuelItemProps {
  item: FuelItem;
  onCancel: (item: FuelItem) => void;
  onEdit: (item: FuelItem) => void;
  onChanged: () => void;
  onViewImage: (url: string) => void;
}

// A record still waiting in the queue can be cancelled; once it is in Odoo,
// only while Odoo has it as `submit`.
const canCancel = (item: FuelItem) =>
  isQueued(item) ||
  (!isUnsynced(item) && item.odooStatus?.toLowerCase() === 'submit');

// Our status always; Odoo's own state once the record is there.
const Statuses = ({
  item,
  size,
  align,
}: {
  item: FuelItem;
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
}: FuelItemProps & { card?: boolean }) => {
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
const FuelCard = (props: FuelItemProps) => {
  const { item } = props;
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Group gap="xs">
              <FuelIcon size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600}>{item.liters} Liters</Text>
            </Group>
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

        <Actions {...props} card />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const FuelRow = (props: FuelItemProps) => {
  const { item } = props;
  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{recordRef(item)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <FuelIcon size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>{item.liters} L</Text>
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

const Fuel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fuelData, setFuelData] = useState<FuelItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toCancel, setToCancel] = useState<FuelItem | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchFuelData = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?category=fuel&limit=200`,
      null,
      (response) => {
        setLoading(false);
        setFuelData(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) toast.error('Failed to fetch fuel records');
      },
    );
  };

  useEffect(() => {
    fetchFuelData();
  }, []);

  useQueuedRefresh(fuelData, () => fetchFuelData(true));

  const filteredFuelData = fuelData.filter((item) => {
    const matchesSearch = `${recordRef(item)} ${item.liters} ${item.cost}`
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
        toast.success('Fuel record cancelled');
        setLoadingCancel(false);
        setToCancel(null);
        fetchFuelData(true);
      },
      (error) => {
        setLoadingCancel(false);
        setToCancel(null);
        toast.error(
          errorMessage(
            error,
            'Failed to cancel fuel record. Please try again.',
          ),
        );
      },
    );
  };

  const rowProps = {
    onCancel: setToCancel,
    onEdit: (item: FuelItem) =>
      navigate('/add-fuel', { state: { record: item } }),
    onChanged: () => fetchFuelData(true),
    onViewImage: setSelectedImage,
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Fuel Records"
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/add-fuel')}
          >
            Add Fuel
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by ID, liters, or cost..."
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
        ) : filteredFuelData.length === 0 ? (
          <EmptyState
            icon={<FuelIcon size={32} />}
            title={
              searchQuery
                ? 'No fuel records found matching your search.'
                : 'No fuel records found.'
            }
            description={
              !searchQuery && 'Add your first fuel record to get started.'
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={720} visibleFrom="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Liters</Table.Th>
                    <Table.Th>Cost</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredFuelData.map((item) => (
                    <FuelRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredFuelData.map((item) => (
                <FuelCard key={item._id} item={item} {...rowProps} />
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
        title="Cancel Fuel Record"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep It"
        loading={loadingCancel}
      >
        Are you sure you want to cancel fuel record{' '}
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
            alt="Fuel receipt"
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

export default Fuel;
