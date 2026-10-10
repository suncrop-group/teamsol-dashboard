import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
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
  User,
  MapPin,
  ShoppingCart,
  Warehouse,
} from 'lucide-react';
import dayjs from 'dayjs';
import { addSales } from '@/redux/slices/SalesSlice';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
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

const RESOURCE = '/v2/sales';

// The Odoo sequence (or id) once the order is there, the job id until then.
const orderRef = (item) =>
  recordRef(item, item?.order_sequence || item?.order_id);

// A customer-created order without a warehouse shows a prompt instead of
// its statuses, unless it has been cancelled. Otherwise: our status always,
// Odoo's own state once the order is there.
const SalesStatus = ({ item, size }: { item; size?: string }) =>
  !item?.warehouse_id &&
  item?.createdByCustomer &&
  item.odooStatus?.toLowerCase() !== 'cancelled' ? (
    <Badge
      color="orange"
      variant="light"
      size={size}
      w="fit-content"
      leftSection={<Warehouse size={12} />}
    >
      Add warehouse
    </Badge>
  ) : (
    <>
      <StatusBadge status={item?.status} size={size} />
      {!isUnsynced(item) && (
        <StatusBadge status={item?.odooStatus} size={size} />
      )}
    </>
  );

// Why Odoo refused the order, and the ways out. Clicks stay here instead of
// opening the order.
const Failed = ({ item, onEdit, onChanged }) =>
  isFailed(item) ? (
    <Box onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
      <FailedActions
        item={item}
        resource={RESOURCE}
        onEdit={() => onEdit(item)}
        onChanged={onChanged}
      />
    </Box>
  ) : null;

// Mobile Card Component
const SalesCard = ({ item, onClick, onEdit, onChanged }) => {
  return (
    <Card
      withBorder
      padding="md"
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(item._id)}
    >
      <Stack gap="sm">
        {/* Header with Partner and Territory */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4} flex={1} miw={0}>
            <Group gap="xs" wrap="nowrap">
              <User size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600}>{item?.partner?.name}</Text>
            </Group>
            <Group gap="xs" wrap="nowrap" c="dimmed" ml={24}>
              <MapPin size={12} />
              <Text size="sm">{item?.territory?.name}</Text>
            </Group>
            {item?.createdByCustomer && (
              <Badge color="blue" variant="light" size="sm" ml={24}>
                Created by Customer
              </Badge>
            )}
          </Stack>
          <Stack gap={4} align="flex-end">
            <SalesStatus item={item} size="sm" />
          </Stack>
        </Group>

        {/* ID and Sequence */}
        <Stack gap={4}>
          <Group gap="xs" c="dimmed" wrap="nowrap">
            <Hash size={16} />
            <Text size="sm">
              {orderRef(item)}
              {item?.order_id && item?.order_sequence
                ? ` - #${item.order_id}`
                : ''}
            </Text>
          </Group>
          <Group gap="xs" c="dimmed" wrap="nowrap">
            <Calendar size={16} />
            <Text size="sm">
              {dayjs(item?.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </Group>
        </Stack>

        {/* Total */}
        <Divider />
        <Group gap={6}>
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={500} c="green">
            {priceFormatter(item?.total)}
          </Text>
        </Group>

        <Failed item={item} onEdit={onEdit} onChanged={onChanged} />
      </Stack>
    </Card>
  );
};

// Desktop Table Row Component
const SalesRow = ({ item, onClick, onEdit, onChanged }) => {
  return (
    <Table.Tr
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(item._id)}
    >
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Hash size={16} color="var(--mantine-color-gray-5)" />
          <Box>
            <Text fw={500}>{orderRef(item)}</Text>
            {item?.order_id && item?.order_sequence && (
              <Text size="xs" c="dimmed">
                #{item.order_id}
              </Text>
            )}
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" align="flex-start" wrap="nowrap">
          <User
            size={16}
            color="var(--mantine-color-blue-6)"
            style={{ flexShrink: 0, marginTop: 4 }}
          />
          <Box>
            <Text fw={500}>{item?.partner?.name}</Text>
            <Group gap={4} c="dimmed" wrap="nowrap" mt={2}>
              <MapPin size={12} />
              <Text size="xs">{item?.territory?.name}</Text>
            </Group>
            {item?.createdByCustomer && (
              <Badge color="blue" variant="light" size="sm" mt={4}>
                Created by Customer
              </Badge>
            )}
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            PKR
          </Text>
          <Text fw={600} c="green">
            {priceFormatter(item?.total)}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" c="dimmed" wrap="nowrap">
          <Calendar size={16} />
          <Box>
            <Text size="sm">{dayjs(item?.createdAt).format('DD/MM/YYYY')}</Text>
            <Text size="xs">{dayjs(item?.createdAt).format('HH:mm')}</Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td maw={300}>
        <Stack gap={4}>
          <SalesStatus item={item} />
          <Failed item={item} onEdit={onEdit} onChanged={onChanged} />
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
};

const Sales = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // `quiet` reloads in place, without swapping the table for a spinner.
  const fetchSalesOrders = (quiet = false) => {
    if (!quiet) {
      dispatch(resetProducts());
      setLoading(true);
    }

    callApi(
      'GET',
      `${RESOURCE}?limit=200`,
      null,
      (response) => {
        setLoading(false);
        const sorted = (response.data || []).sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
        );
        setSalesOrders(sorted);
        dispatch(addSales(sorted));
      },
      () => {
        setLoading(false);
        if (!quiet) toast.error('Failed to fetch sales orders');
      },
    );
  };

  useEffect(() => {
    fetchSalesOrders();
    // eslint-disable-next-line
  }, []);

  useQueuedRefresh(salesOrders, () => fetchSalesOrders(true));

  const rowProps = {
    // The detail page is addressed by the record's _id.
    onClick: (_id) => navigate(`/sale/${_id}`),
    onEdit: (item) => navigate('/sales/add', { state: { record: item } }),
    onChanged: () => fetchSalesOrders(true),
  };

  const filteredSalesOrders = salesOrders.filter((item) => {
    const matchesSearch =
      item?.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.territory?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.order_id?.toString().includes(searchQuery) ||
      orderRef(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.order_sequence?.toLowerCase().includes(searchQuery.toLowerCase());

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
        title="Sales Orders"
        actions={
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate('/sales/add')}
          >
            Add Order
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        {/* Search Bar */}
        <Group gap="sm" mb="lg" wrap="nowrap">
          <TextInput
            flex={1}
            placeholder="Search by partner, territory, order ID, or sequence..."
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
        ) : filteredSalesOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={32} />}
            title={
              searchQuery
                ? 'No sales orders found matching your search.'
                : 'No sales orders found.'
            }
            description={
              !searchQuery && 'Create your first sales order to get started.'
            }
            action={
              !searchQuery && (
                <Button
                  mt="sm"
                  leftSection={<Plus size={16} />}
                  onClick={() => navigate('/sales/add')}
                >
                  Add Sales Order
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={720} visibleFrom="md">
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Order ID</Table.Th>
                    <Table.Th>Partner & Territory</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredSalesOrders.map((item) => (
                    <SalesRow key={item._id} item={item} {...rowProps} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack gap="md" hiddenFrom="md">
              {filteredSalesOrders.map((item) => (
                <SalesCard key={item._id} item={item} {...rowProps} />
              ))}
            </Stack>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Sales;
