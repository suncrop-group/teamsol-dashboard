import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { Search, Plus, Calendar, Coins, X, FileText } from 'lucide-react';
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

const RESOURCE = '/v2/fleet/tolls';

interface TollItem {
  _id: string;
  id?: number;
  jobId?: string;
  toll_amount: number;
  name?: string;
  status?: string;
  odooStatus?: string;
  syncError?: string;
  date: string;
}

interface TollItemProps {
  item: TollItem;
  onCancel: (item: TollItem) => void;
  onEdit: (item: TollItem) => void;
  onChanged: () => void;
}

// A toll still waiting in the queue can be cancelled; once it is in Odoo,
// only while Odoo has it as a draft.
const canCancel = (item: TollItem) =>
  isQueued(item) ||
  (!isUnsynced(item) && item.odooStatus?.toLowerCase() === 'draft');

// Our status always; Odoo's own state once the toll is there.
const Statuses = ({ item, size }: { item: TollItem; size?: string }) => (
  <Stack gap={4} align="flex-start">
    <StatusBadge status={item.status} size={size} />
    {!isUnsynced(item) && <StatusBadge status={item.odooStatus} size={size} />}
  </Stack>
);

const Actions = ({ item, onCancel, onEdit, onChanged }: TollItemProps) =>
  isFailed(item) ? (
    <FailedActions
      item={item}
      resource={RESOURCE}
      onEdit={() => onEdit(item)}
      onChanged={onChanged}
    />
  ) : (
    <Button
      color="red"
      variant="light"
      size="xs"
      leftSection={<X size={14} />}
      onClick={() => onCancel(item)}
      disabled={!canCancel(item)}
    >
      Cancel
    </Button>
  );

// Mobile Card Component
const TollCard = (props: TollItemProps) => {
  const { item } = props;
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Group gap="xs">
              <Coins size={16} color="var(--mantine-color-yellow-7)" />
              <Text fw={600}>Toll Payment</Text>
            </Group>
            <Group gap={6} mt={4}>
              <Text size="xs" fw={500} c="dimmed">
                PKR
              </Text>
              <Text fw={500} c="green">
                {priceFormatter(item.toll_amount)}
              </Text>
            </Group>
          </Box>
          <Statuses item={item} size="sm" />
        </Group>

        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {recordRef(item)}
          </Text>
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

        <Actions {...props} />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const TollRow = (props: TollItemProps) => {
  const { item } = props;
  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{recordRef(item)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={600} c="green">
            {priceFormatter(item.toll_amount)}
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
      <Table.Td maw={280}>
        <Actions {...props} />
      </Table.Td>
    </Table.Tr>
  );
};

const Toll = () => {
  const [tolls, setTolls] = useState<TollItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toCancel, setToCancel] = useState<TollItem | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const navigate = useNavigate();

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchTolls = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?limit=200`,
      null,
      (response) => {
        setLoading(false);
        setTolls(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) {
          toast.error('Failed to fetch toll records');
          setTolls([]);
        }
      },
    );
  };

  useEffect(() => {
    fetchTolls();
  }, []);

  useQueuedRefresh(tolls, () => fetchTolls(true));

  const filteredTolls = tolls.filter((toll) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      toll.name?.toLowerCase().includes(query) ||
      recordRef(toll).toLowerCase().includes(query);

    const matchesDate =
      !(selectedDateRange?.from && selectedDateRange?.to) ||
      (dayjs(toll?.date).valueOf() >=
        dayjs(selectedDateRange.from).startOf('day').valueOf() &&
        dayjs(toll?.date).valueOf() <=
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
        toast.success('Toll record cancelled');
        setLoadingCancel(false);
        setToCancel(null);
        fetchTolls(true);
      },
      (error) => {
        setLoadingCancel(false);
        setToCancel(null);
        toast.error(
          errorMessage(
            error,
            'Failed to cancel toll record. Please try again.',
          ),
        );
      },
    );
  };

  const rowProps = {
    onCancel: setToCancel,
    onEdit: (item: TollItem) =>
      navigate('/add-toll', { state: { record: item } }),
    onChanged: () => fetchTolls(true),
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Toll Records"
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/add-toll')}
            disabled={loading}
          >
            Add Toll
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by name or ID..."
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
        ) : filteredTolls.length === 0 ? (
          <EmptyState
            icon={<Coins size={32} />}
            title={
              searchQuery
                ? 'No toll records found matching your search.'
                : 'No toll records found.'
            }
            description={
              !searchQuery && 'Add your first toll record to get started.'
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={760} visibleFrom="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTolls.map((item) => (
                    <TollRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredTolls.map((item) => (
                <TollCard key={item._id} item={item} {...rowProps} />
              ))}
            </Stack>
          </>
        )}
      </Paper>

      <ConfirmModal
        opened={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={onConfirmCancel}
        title="Cancel Toll Record"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep It"
        loading={loadingCancel}
      >
        Are you sure you want to cancel toll record{' '}
        {toCancel ? recordRef(toCancel) : ''}? This action cannot be undone.
      </ConfirmModal>
    </Container>
  );
};

export default Toll;
