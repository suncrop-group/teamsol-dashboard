import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
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
import { toast } from '@/lib/toast';
import { ConfirmModal, FailedActions, StatusBadge } from '@/components/app';

const RESOURCE = '/v2/sales';

// TypeScript interfaces
interface SalesOrderLine {
  product_template_id: number;
  policy_id: number;
  ref_policy_id: string | number;
  product_packaging_id: number;
  product_packaging_qty: number;
  qty: number;
  price_unit: number;
  discount: number;
  product_template?: {
    _id?: string;
    id: number;
    name: string;
  };
  packaging?: {
    _id?: string;
    id: number;
    name: string;
  };
  policy?: {
    _id?: string;
    id: number;
    name?: string;
    code: string;
  };
}

interface SalesOrder {
  _id: string;
  lines: SalesOrderLine[];
  // The Odoo id; empty until the order is there.
  order_id: string;
  order_sequence: string;
  jobId?: string;
  syncError?: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  odooStatus: string;
  partner: { name: string; delivery_address?: { id: number; name: string }[] };
  territory: { name: string };
  policy_type: string;
  createdByCustomer: boolean;
  warehouse_id: number | null;
  partner_id?: number;
  territory_id?: number;
  total?: number;
  delivery_id?: number;
}

const policyTypesName = {
  is_advance: 'Advance',
  cash: 'Advance',
  is_secure_credit: 'Secure Credit',
  is_credit: 'Credit',
};

const orderRef = (order: SalesOrder) =>
  recordRef(order, order.order_sequence || order.order_id);

// A read that answers null instead of failing; the names below are optional.
const read = (endPoint: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new Promise<any>((resolve) =>
    callApi('GET', endPoint, null, resolve, () => resolve(null)),
  );

const unique = (values: number[]) => [...new Set(values.filter(Boolean))];

/**
 * The v2 record carries its lines as ids only. Product, packaging and policy
 * names come from the v1 read once the order has an Odoo id (that read is
 * keyed by it); before that they are looked up one by one.
 */
const readLineNames = async (order: SalesOrder): Promise<SalesOrderLine[]> => {
  if (order.order_id) {
    const v1 = await read(`/sales/${order.order_id}`);
    // The v1 read is by Odoo id alone, so make sure it is this very order.
    return v1?.data?._id === order._id ? v1.data.lines : null;
  }

  const lines = order.lines || [];
  const type = order.policy_type;
  const policyIds = unique(lines.map((line) => line.policy_id));
  const productIds = unique(lines.map((line) => line.product_template_id));

  const [productLists, packagingLists, policyList] = await Promise.all([
    Promise.all(
      policyIds.map((id) =>
        read(`/products/get?policy=${id}&policyType=${type}`),
      ),
    ),
    Promise.all(productIds.map((id) => read(`/products/packagings/${id}`))),
    type === 'is_secure_credit'
      ? read('/policy/reference/')
      : read(
          `/v2/lookups/policy-balance?partner_id=${order.partner_id}&policy_type=${type}`,
        ),
  ]);

  const products = productLists.flatMap((res) => res?.products || []);
  const packagings = packagingLists.flatMap((res) => res?.data || []);
  const policies =
    (type === 'is_secure_credit'
      ? policyList?.data
      : policyList?.data?.expense) || [];

  return lines.map((line) => {
    const policy = (Array.isArray(policies) ? policies : []).find(
      (item) => item.policy_id === line.policy_id,
    );
    return {
      ...line,
      product_template: products.find(
        (item) => item.id === line.product_template_id,
      ),
      packaging: packagings.find(
        (item) => item.id === line.product_packaging_id,
      ),
      policy: policy && { id: policy.policy_id, code: policy.code },
    };
  });
};

const SalesDetails = () => {
  // The route is `/sale/:order`; the value is the record's _id.
  const { order: orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>(
    [],
  );

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [deliveryName, setDeliveryName] = useState('');

  const [salesOrder, setSalesOrder] = useState<SalesOrder>({
    _id: '',
    lines: [],
    order_id: '',
    order_sequence: '',
    createdAt: '',
    status: '',
    odooStatus: '',
    partner: { name: '', delivery_address: [] },
    territory: { name: '' },
    policy_type: 'is_advance',
    createdByCustomer: false,
    warehouse_id: null,
    delivery_id: null,
  });
  // The lines with their product, packaging and policy names, and the
  // version of the order they were read for.
  const [namedLines, setNamedLines] = useState<SalesOrderLine[] | null>(null);
  const namesKey = useRef('');

  const fetchWarehouses = async () => {
    const onSuccessfulFetch = (data: { id: number; name: string }[]) => {
      setWarehouses(data);
    };

    const onError = () => {
      toast.error('Failed to fetch warehouses');
    };

    callApi('GET', '/warehouses/get', null, onSuccessfulFetch, onError);
  };

  // A customer's order gets its warehouse here; the server queues it for Odoo.
  const createSaleOrder = async () => {
    setSaveLoading(true);

    callApi(
      'POST',
      `${RESOURCE}/${salesOrder._id}/confirm`,
      { warehouse_id: Number(selectedWarehouse) },
      () => {
        toast.success('Warehouse added, order saved and queued');
        setSaveLoading(false);
        // Navigate back to the previous page
        navigate(-1);
      },
      (error) => {
        setSaveLoading(false);
        toast.error(errorMessage(error, 'Failed to create order'));
      },
    );
  };

  const loadLineNames = (data: SalesOrder) => {
    const key = `${data._id}|${data.order_id}|${data.updatedAt}`;
    if (namesKey.current === key) return;
    namesKey.current = key;

    readLineNames(data).then((lines) => {
      if (lines && namesKey.current === key) setNamedLines(lines);
    });
  };

  // `quiet` reloads in place, without swapping the page for a spinner.
  const fetchSalesOrders = (quiet = false, onMissing?: () => void) => {
    const onSuccessfulFetch = (data: { data: SalesOrder }) => {
      setSalesOrder(data?.data);
      setLoading(false);
      if (data?.data) loadLineNames(data.data);
    };

    const onError = () => {
      setLoading(false);
      if (onMissing) onMissing();
      else if (!quiet) toast.error('Failed to fetch sales order');
    };

    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `${RESOURCE}/${orderId}`,
      null,
      onSuccessfulFetch,
      onError,
    );
  };

  useEffect(() => {
    if (orderId) {
      fetchSalesOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useQueuedRefresh([salesOrder], () => fetchSalesOrders(true));

  useEffect(() => {
    if (!salesOrder?._id) return;

    if (salesOrder.order_id) {
      document.title = `#${salesOrder.order_id} - ${salesOrder.order_sequence}`;
    }

    // Fetch warehouses if createdByCustomer is true and no warehouse_id
    if (
      salesOrder.createdByCustomer &&
      !salesOrder.warehouse_id &&
      warehouses.length === 0
    ) {
      fetchWarehouses();
    }

    if (salesOrder.partner_id) {
      if (salesOrder.delivery_id === salesOrder.partner_id) {
        setDeliveryName(salesOrder.partner?.name);
      } else {
        const address = salesOrder.partner?.delivery_address?.find(
          (addr) => addr.id === salesOrder.delivery_id,
        );
        setDeliveryName(address ? address.name : 'N/A');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder]);

  const onConfirmCancel = async () => {
    const onSuccess = () => {
      toast.success('Order cancelled successfully');
      setOpenDialog(false);
      fetchSalesOrders(true);
      setRemoveLoading(false);
    };

    const onError = (error) => {
      setRemoveLoading(false);
      setOpenDialog(false);
      toast.error(errorMessage(error, 'Failed to cancel order'));
    };

    setRemoveLoading(true);
    callApi(
      'POST',
      `${RESOURCE}/${salesOrder._id}/cancel`,
      {},
      onSuccess,
      onError,
    );
  };

  const lines = namedLines || salesOrder?.lines || [];
  // An order still waiting in the queue can be cancelled; once it is in
  // Odoo, only while it is a quotation.
  const canCancel =
    isQueued(salesOrder) ||
    (!isUnsynced(salesOrder) && salesOrder?.odooStatus === 'Quotation');

  return (
    <Container size="lg" px={0}>
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <Stack gap="lg">
          <Paper withBorder shadow="sm" p="lg">
            <Group justify="space-between" align="flex-start" gap="md" mb="lg">
              <Box>
                <Text fw={600}>Created At</Text>
                <Text c="dimmed">
                  {salesOrder.createdAt
                    ? `${dayjs(salesOrder.createdAt).format(
                        'MM-DD-YYYY',
                      )} - ${dayjs(salesOrder.createdAt).format('hh:mm A')}`
                    : 'N/A'}
                </Text>
              </Box>
              <Group gap="sm">
                <StatusBadge status={salesOrder.status} />
                {!isUnsynced(salesOrder) && (
                  <StatusBadge status={salesOrder.odooStatus} />
                )}
              </Group>
            </Group>

            {isFailed(salesOrder) && (
              <Box mb="lg">
                <FailedActions
                  item={salesOrder}
                  resource={RESOURCE}
                  onEdit={() =>
                    navigate('/sales/add', { state: { record: salesOrder } })
                  }
                  // Resent: reload. Discarded: the order is gone.
                  onChanged={() =>
                    fetchSalesOrders(true, () => navigate('/sales'))
                  }
                />
              </Box>
            )}

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Box>
                <Text fw={600}>Order</Text>
                <Text c="dimmed">{orderRef(salesOrder)}</Text>
              </Box>
              <Box>
                <Text fw={600}>Customer</Text>
                <Text c="dimmed">
                  {salesOrder.partner?.name} - {salesOrder.territory?.name}
                </Text>
              </Box>
              <Box>
                <Text fw={600}>Delivery Address</Text>
                <Text c="dimmed">{deliveryName || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fw={600}>Policy Type</Text>
                <Text c="dimmed">
                  {salesOrder.policy_type
                    ? policyTypesName[salesOrder.policy_type]
                    : 'N/A'}
                </Text>
              </Box>
            </SimpleGrid>
          </Paper>

          {/* Warehouse Selection - Only show if createdByCustomer is true and no warehouse_id */}
          {salesOrder.createdByCustomer && !salesOrder.warehouse_id && (
            <Paper withBorder shadow="sm" p="lg">
              <Title order={4} mb="md">
                Select Warehouse
              </Title>
              <Select
                placeholder="Select a warehouse"
                data={(warehouses || []).map((warehouse) => ({
                  value: warehouse.id.toString(),
                  label: warehouse.name,
                }))}
                value={selectedWarehouse || null}
                onChange={(value) => setSelectedWarehouse(value || '')}
                allowDeselect={false}
              />
              {selectedWarehouse && (
                <Button
                  mt="md"
                  fullWidth
                  onClick={() => createSaleOrder()}
                  loading={saveLoading}
                >
                  Save
                </Button>
              )}
            </Paper>
          )}

          <Paper withBorder shadow="sm" p="lg">
            <Title order={4} mb="md">
              Products
            </Title>
            {lines.length > 0 ? (
              <Stack gap="md">
                {lines.map((item, index) => (
                  <Card key={index} withBorder padding="md">
                    <Text fw={600}>{item.product_template?.name || 'N/A'}</Text>
                    <Text c="dimmed">
                      Price per unit: {item.price_unit} PKR
                    </Text>
                    <Text c="dimmed">Discount: {item.discount}%</Text>
                    <Text c="dimmed">
                      QTY: {item.product_packaging_qty} x {item.qty}
                    </Text>
                    <Text c="dimmed">
                      Packaging: {item.packaging?.name || 'N/A'}
                    </Text>
                    <Text c="dimmed">
                      Policy: {item.policy?.code || 'N/A'}
                    </Text>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">No products available</Text>
            )}
          </Paper>

          {canCancel && (
            <Group justify="flex-end">
              <Button color="red" onClick={() => setOpenDialog(true)}>
                Cancel Order
              </Button>
              <ConfirmModal
                opened={openDialog}
                onClose={() => setOpenDialog(false)}
                onConfirm={onConfirmCancel}
                title="Confirm Cancellation"
                confirmLabel="Yes"
                cancelLabel="No"
                loading={removeLoading}
              >
                Are you sure you want to cancel this order (
                {orderRef(salesOrder)})?
              </ConfirmModal>
            </Group>
          )}
        </Stack>
      )}
    </Container>
  );
};

export default SalesDetails;
