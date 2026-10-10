import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
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
  Building2,
  User,
  CreditCard,
  Timer,
} from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { isFailed, isUnsynced, recordRef, useQueuedRefresh } from '@/api/v2';
import { priceFormatter } from '@/utils';
import { toast } from '@/lib/toast';
import { DateFilter, type DateRange } from '@/components/DateFilter';
import {
  EmptyState,
  FailedActions,
  PageHeader,
  StatusBadge,
} from '@/components/app';

const RESOURCE = '/v2/credit-limit/temporary';

// Our status always; Odoo's own state once the request is there.
const Statuses = ({ item, size }: { item; size?: string }) => (
  <>
    <StatusBadge status={item?.status} size={size} />
    {!isUnsynced(item) && <StatusBadge status={item?.odooStatus} size={size} />}
  </>
);

// A request Odoo refused: the reason, and edit / resend / discard.
const Failed = ({ item, onEdit, onChanged }) =>
  isFailed(item) ? (
    <FailedActions
      item={item}
      resource={RESOURCE}
      onEdit={() => onEdit(item)}
      onChanged={onChanged}
    />
  ) : null;

// Mobile Card Component
const TemporaryCreditCard = ({ item, onEdit, onChanged }) => {
  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        {/* Header with Company and Customer */}
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Stack gap={4} flex={1} miw={0}>
            <Group gap="xs" wrap="nowrap">
              <Building2 size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600}>{item?.company?.name}</Text>
            </Group>
            <Group gap="xs" wrap="nowrap" ml={24} c="dimmed">
              <User size={12} />
              <Text size="sm">{item?.customer?.name}</Text>
            </Group>
            <Group gap="xs" wrap="nowrap" ml={24} c="dimmed">
              <CreditCard size={12} />
              <Text size="sm">{item?.policy?.code}</Text>
            </Group>
          </Stack>
          <Stack gap={4} align="flex-end">
            <Statuses item={item} size="sm" />
          </Stack>
        </Group>

        {/* ID and Sequence */}
        <Stack gap={4}>
          <Group gap="xs" c="dimmed">
            <Hash size={16} />
            <Text size="sm">
              {recordRef(item)}
              {item?.sequence ? ` - ${item.sequence}` : ''}
            </Text>
          </Group>
          <Group gap="xs" c="dimmed">
            <Calendar size={16} />
            <Text size="sm">
              {dayjs(item?.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </Group>
        </Stack>

        {/* Allowed Limit */}
        <Divider />
        <Group gap={6}>
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={500} c="green">
            {priceFormatter(Number(item?.allowed_limit) || 0)}
          </Text>
        </Group>

        <Failed item={item} onEdit={onEdit} onChanged={onChanged} />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const TemporaryCreditRow = ({ item, onEdit, onChanged }) => {
  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Hash size={16} color="var(--mantine-color-gray-5)" />
          <Box>
            <Text fw={500}>{recordRef(item)}</Text>
            <Text size="xs" c="dimmed">
              {item?.sequence}
            </Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <Building2
            size={16}
            color="var(--mantine-color-blue-6)"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <Box>
            <Text fw={500}>{item?.company?.name}</Text>
            <Group gap={4} wrap="nowrap" c="dimmed" mt={2}>
              <User size={12} />
              <Text size="xs">{item?.customer?.name}</Text>
            </Group>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <CreditCard size={16} color="var(--mantine-color-gray-5)" />
          <Text size="sm">{item?.policy?.code}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={600} c="green">
            {priceFormatter(Number(item?.allowed_limit) || 0)}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" c="dimmed">
          <Calendar size={16} />
          <Box>
            <Text size="sm">{dayjs(item?.createdAt).format('DD/MM/YYYY')}</Text>
            <Text size="xs">{dayjs(item?.createdAt).format('HH:mm')}</Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td maw={280}>
        <Stack gap={4}>
          <Statuses item={item} />
          <Failed item={item} onEdit={onEdit} onChanged={onChanged} />
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
};

const TemporaryCredit = () => {
  const [temporaryCredits, setTemporaryCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const navigate = useNavigate();

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchTemporaryCredits = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}?limit=200`,
      null,
      (response) => {
        setLoading(false);
        setTemporaryCredits(response.data || []);
      },
      () => {
        setLoading(false);
        if (!quiet) toast.error('Failed to fetch temporary credits');
      },
    );
  };

  useEffect(() => {
    fetchTemporaryCredits();
  }, []);

  useQueuedRefresh(temporaryCredits, () => fetchTemporaryCredits(true));

  const rowProps = {
    onEdit: (item) => navigate('/add-temporary-credit', { state: { record: item } }),
    onChanged: () => fetchTemporaryCredits(true),
  };

  const filteredCreditLimits = temporaryCredits.filter((item) => {
    const matchesSearch =
      item?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.policy?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recordRef(item).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate =
      !(selectedDateRange?.from && selectedDateRange?.to) ||
      (dayjs(item?.date).valueOf() >=
        dayjs(selectedDateRange.from).startOf('day').valueOf() &&
        dayjs(item?.date).valueOf() <=
          dayjs(selectedDateRange.to).endOf('day').valueOf());
    return matchesSearch && matchesDate;
  });

  return (
    <Container size="xl" px={0}>
      <PageHeader
        title={
          <Group gap="xs" wrap="nowrap">
            <Timer size={24} color="var(--mantine-color-blue-6)" />
            Temporary Credits
          </Group>
        }
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/add-temporary-credit')}
            disabled={loading}
          >
            Add Temporary Credit
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        {/* Search Bar */}
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by customer, policy code, or ID..."
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
        ) : filteredCreditLimits.length === 0 ? (
          <EmptyState
            icon={<Timer size={32} />}
            title={
              searchQuery
                ? 'No temporary credits found matching your search.'
                : 'No temporary credits found.'
            }
            description={
              !searchQuery &&
              'Add your first temporary credit to get started.'
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
                    <Table.Th>Company & Customer</Table.Th>
                    <Table.Th>Policy</Table.Th>
                    <Table.Th>Allowed Limit</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredCreditLimits.map((item) => (
                    <TemporaryCreditRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredCreditLimits.map((item) => (
                <TemporaryCreditCard key={item._id} item={item} {...rowProps} />
              ))}
            </Stack>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default TemporaryCredit;
