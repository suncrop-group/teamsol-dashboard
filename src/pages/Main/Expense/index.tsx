import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Image,
  Modal,
  Paper,
  Skeleton,
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
  FileText,
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

const RESOURCE = '/v2/expenses';

interface ExpenseItem {
  _id: string;
  id?: number | string;
  jobId?: string;
  name: string;
  description?: string;
  amount?: number;
  date: string;
  odooStatus?: string;
  status?: string;
  syncError?: string;
  urls?: string[];
}

interface ExpenseItemProps {
  item: ExpenseItem;
  cancelOrder: (item: ExpenseItem) => void;
  onEdit: (item: ExpenseItem) => void;
  onChanged: () => void;
  onViewImages: (urls: string[]) => void;
}

// The v2 backend stores an expense's day as `DD-MM-YYYY` text; older records
// hold an ISO date.
const expenseDate = (value?: string) => {
  const parts = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value || '');
  return parts
    ? dayjs(new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1])))
    : dayjs(value);
};

// An expense still waiting in the queue can be cancelled; once it is in Odoo,
// only while Odoo has it as a draft.
const canCancel = (item: ExpenseItem) =>
  isQueued(item) || (!isUnsynced(item) && item.odooStatus === 'draft');

// Our status always; Odoo's own state once the expense is there.
const Statuses = ({
  item,
  size,
  align,
}: {
  item: ExpenseItem;
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
  cancelOrder,
  onEdit,
  onChanged,
  onViewImages,
  card,
}: ExpenseItemProps & { card?: boolean }) => {
  const images = item.urls && item.urls.length > 0 && (
    <Button
      variant="default"
      size={card ? 'sm' : 'xs'}
      leftSection={<ImageIcon size={card ? 16 : 14} />}
      onClick={() => onViewImages(item.urls)}
    >
      {card ? `Images (${item.urls.length})` : item.urls.length}
    </Button>
  );

  if (isFailed(item)) {
    return (
      <Stack gap="xs" align={card ? 'stretch' : 'flex-start'}>
        {images}
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
      {images}
      <Button
        color="red"
        variant="light"
        size={card ? 'sm' : 'xs'}
        leftSection={card ? <X size={16} /> : undefined}
        onClick={() => cancelOrder(item)}
        disabled={!canCancel(item)}
      >
        Cancel
      </Button>
    </Group>
  );
};

const COLUMNS = ['ID', 'Name', 'Amount', 'Date', 'Status', 'Actions'];

const ExpenseTableHead = () => (
  <Table.Thead>
    <Table.Tr>
      {COLUMNS.map((column) => (
        <Table.Th key={column}>{column}</Table.Th>
      ))}
    </Table.Tr>
  </Table.Thead>
);

// Mobile Card Component
const ExpenseCard = (props: ExpenseItemProps) => {
  const { item } = props;
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box>
            <Text fw={600}>{item.name}</Text>
            <Group gap={6} mt={4}>
              <Text size="xs" fw={500} c="dimmed">
                PKR
              </Text>
              <Text fw={500} c="green">
                {priceFormatter(item.amount)}
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
            <Text size="sm">{expenseDate(item.date).format('DD/MM/YYYY')}</Text>
          </Group>
        </Stack>

        {item.description && (
          <Group gap="xs" align="flex-start" wrap="nowrap" c="dimmed">
            <FileText size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <Text size="sm" lineClamp={2}>
              {item.description}
            </Text>
          </Group>
        )}

        <Actions {...props} card />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const ExpenseRow = (props: ExpenseItemProps) => {
  const { item } = props;
  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{recordRef(item)}</Text>
      </Table.Td>
      <Table.Td>
        <Text fw={500}>{item.name}</Text>
        {item.description && (
          <Text size="xs" c="dimmed" lineClamp={1} mt={4}>
            {item.description}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={600} c="green">
            {priceFormatter(item.amount)}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {expenseDate(item.date).format('DD/MM/YYYY')}
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

const Expenses = () => {
  const [expensesOrders, setExpensesOrders] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ExpenseItem | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState<ExpenseItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // `quiet` reloads in place, without swapping the table for a skeleton.
  const fetchExpensesOrders = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?withoutEvent=true&limit=200`,
      null,
      (response: { data: ExpenseItem[] }) => {
        setLoading(false);
        setExpensesOrders(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) toast.error('Error fetching expenses orders');
      },
    );
  };

  useEffect(() => {
    fetchExpensesOrders();
  }, []);

  useQueuedRefresh(expensesOrders, () => fetchExpensesOrders(true));

  useEffect(() => {
    const filtered = expensesOrders.filter((item) => {
      const matchesSearch = (item.name || '')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDate =
        !(selectedDateRange?.from && selectedDateRange?.to) ||
        (expenseDate(item?.date).valueOf() >=
          dayjs(selectedDateRange.from).startOf('day').valueOf() &&
          expenseDate(item?.date).valueOf() <=
            dayjs(selectedDateRange.to).endOf('day').valueOf());

      return matchesSearch && matchesDate;
    });

    setFilteredData(filtered);
  }, [search, selectedDateRange, expensesOrders]);

  const onConfirmCancel = () => {
    if (!selected) return;

    setRemoveLoading(true);
    callApi(
      'POST',
      `${RESOURCE}/${selected._id}/cancel`,
      {},
      () => {
        setRemoveLoading(false);
        setSelected(null);
        fetchExpensesOrders(true);
        toast.success('Expense cancelled');
      },
      (error) => {
        setRemoveLoading(false);
        setSelected(null);
        toast.error(
          errorMessage(error, 'Something went wrong. Please try again.'),
        );
      },
    );
  };

  const handleViewImages = (urls: string[]) => {
    setSelectedImages(urls);
    setCurrentImageIndex(0);
  };

  const rowProps = {
    cancelOrder: setSelected,
    onEdit: (item: ExpenseItem) =>
      navigate('/expenses/add', { state: { record: item } }),
    onChanged: () => fetchExpensesOrders(true),
    onViewImages: handleViewImages,
  };

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title="Expenses"
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/expenses/add')}
          >
            Add Expense
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search expenses by name..."
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <DateFilter
            selectedRange={selectedDateRange}
            onSelect={setSelectedDateRange}
          />
        </Group>

        {loading ? (
          <Table.ScrollContainer minWidth={720}>
            <Table>
              <ExpenseTableHead />
              <Table.Tbody>
                {Array.from({ length: 20 }).map((_, row) => (
                  <Table.Tr key={row}>
                    {COLUMNS.map((column) => (
                      <Table.Td key={column}>
                        <Skeleton height={16} radius="sm" />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title={
              search
                ? 'No expenses found matching your search.'
                : 'No expenses found.'
            }
            description={!search && 'Create your first expense to get started.'}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={720} visibleFrom="md">
              <Table>
                <ExpenseTableHead />
                <Table.Tbody>
                  {filteredData.map((item) => (
                    <ExpenseRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredData.map((item) => (
                <ExpenseCard key={item._id} item={item} {...rowProps} />
              ))}
            </Stack>
          </>
        )}
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <ConfirmModal
        opened={!!selected}
        onClose={() => setSelected(null)}
        onConfirm={onConfirmCancel}
        title="Confirm Cancellation"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep It"
        loading={removeLoading}
      >
        Are you sure you want to cancel expense{' '}
        {selected ? recordRef(selected) : ''}? This action cannot be undone.
      </ConfirmModal>

      {/* Image Gallery Dialog */}
      {selectedImages.length > 0 && (
        <Modal
          opened={selectedImages.length > 0}
          onClose={() => setSelectedImages([])}
          size="xl"
          padding="xs"
          centered
        >
          <Box pos="relative">
            <Image
              src={selectedImages[currentImageIndex]}
              alt={`Expense image ${currentImageIndex + 1}`}
              fit="contain"
              mah="80vh"
              radius="md"
            />
            {selectedImages.length > 1 && (
              <Badge
                pos="absolute"
                bottom={16}
                left="50%"
                color="dark"
                size="lg"
                radius="xl"
                style={{ transform: 'translateX(-50%)' }}
              >
                {currentImageIndex + 1} / {selectedImages.length}
              </Badge>
            )}
          </Box>
          {selectedImages.length > 1 && (
            <Group justify="center" gap="xs" mt="md">
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev > 0 ? prev - 1 : selectedImages.length - 1,
                  )
                }
              >
                Previous
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev < selectedImages.length - 1 ? prev + 1 : 0,
                  )
                }
              >
                Next
              </Button>
            </Group>
          )}
        </Modal>
      )}
    </Container>
  );
};

export default Expenses;
