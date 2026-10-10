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
import {
  Search,
  Plus,
  Calendar,
  Hash,
  Navigation,
  X,
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

const RESOURCE = '/v2/fleet/personal-use';

interface PersonalUseItem {
  _id: string;
  id?: number;
  jobId?: string;
  personal_travel: string;
  personal_travel_amount: number;
  name?: string;
  status?: string;
  odooStatus?: string;
  syncError?: string;
  date: string;
}

interface PersonalUseItemProps {
  item: PersonalUseItem;
  onCancel: (item: PersonalUseItem) => void;
  onEdit: (item: PersonalUseItem) => void;
  onChanged: () => void;
}

// An entry still waiting in the queue can be cancelled; once it is in Odoo,
// only while Odoo has it as a draft.
const canCancel = (item: PersonalUseItem) =>
  isQueued(item) ||
  (!isUnsynced(item) && item.odooStatus?.toLowerCase() === 'draft');

// Our status always; Odoo's own state once the entry is there.
const Statuses = ({
  item,
  size,
  align,
}: {
  item: PersonalUseItem;
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
  card,
}: PersonalUseItemProps & { card?: boolean }) =>
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
      size={card ? 'sm' : 'xs'}
      fullWidth={card}
      leftSection={card ? <X size={16} /> : undefined}
      onClick={() => onCancel(item)}
      disabled={!canCancel(item)}
    >
      Cancel
    </Button>
  );

// Mobile Card Component
const PersonalUseCard = (props: PersonalUseItemProps) => {
  const { item } = props;
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Group gap="xs">
              <Navigation size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600}>{item.personal_travel} KM</Text>
            </Group>
            <Group gap={6} mt={4}>
              <Text size="xs" fw={500} c="dimmed">
                PKR
              </Text>
              <Text fw={500} c="green">
                {priceFormatter(item.personal_travel_amount)}
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
const PersonalUseRow = (props: PersonalUseItemProps) => {
  const { item } = props;
  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{recordRef(item)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Navigation size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>{item.personal_travel} KM</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={600} c="green">
            {priceFormatter(item.personal_travel_amount)}
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

const PersonalUse = () => {
  const navigate = useNavigate();
  const [personalUses, setPersonalUses] = useState<PersonalUseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toCancel, setToCancel] = useState<PersonalUseItem | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchPersonalUses = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?limit=200`,
      null,
      (response) => {
        setLoading(false);
        setPersonalUses(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) {
          toast.error('Failed to fetch personal use records');
          setPersonalUses([]);
        }
      },
    );
  };

  useEffect(() => {
    fetchPersonalUses();
  }, []);

  useQueuedRefresh(personalUses, () => fetchPersonalUses(true));

  const filteredPersonalUses = personalUses.filter((item) => {
    const matchesSearch =
      `${recordRef(item)} ${item.personal_travel} ${item.personal_travel_amount} ${item.name || ''}`
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
        toast.success('Personal use record cancelled');
        setLoadingCancel(false);
        setToCancel(null);
        fetchPersonalUses(true);
      },
      (error) => {
        setLoadingCancel(false);
        setToCancel(null);
        toast.error(
          errorMessage(
            error,
            'Failed to cancel personal use record. Please try again.',
          ),
        );
      },
    );
  };

  const rowProps = {
    onCancel: setToCancel,
    onEdit: (item: PersonalUseItem) =>
      navigate('/add-personal-use', { state: { record: item } }),
    onChanged: () => fetchPersonalUses(true),
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Personal Use Records"
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/add-personal-use')}
          >
            Add Personal Use
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by ID, distance, amount, or name..."
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
        ) : filteredPersonalUses.length === 0 ? (
          <EmptyState
            icon={<Navigation size={32} />}
            title={
              searchQuery
                ? 'No personal use records found matching your search.'
                : 'No personal use records found.'
            }
            description={
              !searchQuery &&
              'Add your first personal use record to get started.'
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={820} visibleFrom="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Distance</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredPersonalUses.map((item) => (
                    <PersonalUseRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredPersonalUses.map((item) => (
                <PersonalUseCard key={item._id} item={item} {...rowProps} />
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
        title="Cancel Personal Use Record"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep It"
        loading={loadingCancel}
      >
        Are you sure you want to cancel personal use record{' '}
        {toCancel ? recordRef(toCancel) : ''}? This action cannot be undone.
      </ConfirmModal>
    </Container>
  );
};

export default PersonalUse;
