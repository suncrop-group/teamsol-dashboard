import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { callApi, callServerAPI } from '@/api';

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
    _id: string;
    id: number;
    name: string;
  };
  packaging?: {
    _id: string;
    id: number;
    name: string;
  };
  policy?: {
    _id: string;
    id: number;
    name: string;
    code: string;
  };
}

interface SalesOrderData {
  partner_id: number;
  territory_id: number;
  policy_type: string;
  employee_id: number;
  company_id: number;
  warehouse_id: number;
  lines: SalesOrderLine[];
  total: number;
  order_id: number;
}

interface SalesOrder {
  lines: SalesOrderLine[];
  order_id: number;
  order_sequence: string;
  createdAt: string;
  status: string;
  odooStatus: string;
  partner: { name: string };
  territory: { name: string };
  policy_type: string;
  createdByCustomer: boolean;
  warehouse_id: number | null;
  partner_id?: number;
  territory_id?: number;
  employee_id?: number;
  company_id?: number;
  total?: number;
}

const policyTypesName = {
  is_advance: 'Advance',
  cash: 'Advance',
  is_secure_credit: 'Secure Credit',
  is_credit: 'Credit',
};

const SalesDetails = () => {
  const { order } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>(
    []
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const [salesOrder, setSalesOrder] = useState<SalesOrder>({
    lines: [],
    order_id: 0,
    order_sequence: '',
    createdAt: '',
    status: '',
    odooStatus: '',
    partner: { name: '' },
    territory: { name: '' },
    policy_type: 'is_advance',
    createdByCustomer: false,
    warehouse_id: null,
  });

  const fetchWarehouses = async () => {
    const onSuccessfulFetch = (data: { id: number; name: string }[]) => {
      setWarehouses(data);
    };

    const onError = () => {
      toast.error('Failed to fetch warehouses');
    };

    callApi('GET', '/warehouses/get', null, onSuccessfulFetch, onError);
  };

  const createSaleOrder = async () => {
    setSaveLoading(true);

    const onOrderOdooSuccess = (response: {
      data: {
        message: {
          order_id: number;
          order_sequence: string;
        };
      };
    }) => {
      const { order_id, order_sequence } = response.data.message;
      if (!order_id || !order_sequence) {
        toast.error('Error adding order');
        setSaveLoading(false);
        return;
      }

      const onSuccessDBOrder = () => {
        toast.success('Warehouse Added Successfully');
        setSaveLoading(false);
        // Navigate back to the previous page
        navigate(-1);
      };

      const onErrorOrder = () => {
        setSaveLoading(false);
        toast.error('Error adding order to the database');
      };

      callApi(
        'PUT',
        `/sales/warehouse/${salesOrder.order_id}`,
        {
          ...data,
          order_id: order_id,
          status: 'sent',
          order_sequence: order_sequence,
        },
        onSuccessDBOrder,
        onErrorOrder
      );
    };

    const onError = () => {
      setSaveLoading(false);
      toast.error('Failed to create order');
    };

    const data: SalesOrderData = {
      partner_id: Number(salesOrder.partner_id),
      territory_id: Number(salesOrder.territory_id),
      policy_type: salesOrder.policy_type,
      employee_id: Number(salesOrder.employee_id),
      company_id: Number(salesOrder.company_id),
      warehouse_id: Number(selectedWarehouse),
      order_id: 0,
      lines: salesOrder.lines.map((line: SalesOrderLine) => ({
        product_template_id: Number(line.product_template_id),
        policy_id: Number(line.policy_id),
        ref_policy_id:
          Number(line.ref_policy_id) === -1
            ? ''
            : Number(line.ref_policy_id) || '',
        product_packaging_id: Number(line.product_packaging_id),
        product_packaging_qty: Number(line.product_packaging_qty),
        qty: Number(line.qty),
        price_unit: Number(line.price_unit),
        discount: Number(line.discount),
      })),
      total: Number(salesOrder.total),
    };

    console.log({ data });

    console.log({ data: JSON.stringify(data) });

    callServerAPI(
      'POST',
      '/post/order',
      {
        data,
      },
      onOrderOdooSuccess,
      onError
    );
  };

  const fetchSalesOrders = async () => {
    setLoading(true);
    const onSuccessfulFetch = (data: { data: SalesOrder }) => {
      setSalesOrder(data?.data);
      setLoading(false);
    };

    const onError = () => {
      toast.error('Failed to fetch sales order');
      setLoading(false);
    };

    setLoading(true);
    callApi('GET', `/sales/${order}`, null, onSuccessfulFetch, onError);
  };

  useEffect(() => {
    if (order) {
      fetchSalesOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  useEffect(() => {
    if (salesOrder?.order_id) {
      document.title = `#${salesOrder.order_id} - ${salesOrder.order_sequence}`;

      // Fetch warehouses if createdByCustomer is true and no warehouse_id
      if (salesOrder.createdByCustomer && !salesOrder.warehouse_id) {
        fetchWarehouses();
      }
    }
  }, [salesOrder]);

  const onConfirmCancel = async () => {
    const onSuccess = () => {
      toast.success('Order cancelled successfully');
      fetchSalesOrders();
      setRemoveLoading(false);
    };

    const onError = () => {
      setRemoveLoading(false);
      toast.error('Failed to cancel order');
    };

    setRemoveLoading(true);
    callApi(
      'DELETE',
      `/sales/cancel?orderId=${salesOrder.order_id}`,
      {},
      onSuccess,
      onError
    );
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'sent':
      case 'Sent':
      case 'Sale Order':
        return 'bg-green-100 text-green-700';
      case 'draft':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Quotation':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold">Created At</h3>
              <p className="text-base text-gray-700">
                {salesOrder.createdAt
                  ? `${format(
                      new Date(salesOrder.createdAt),
                      'MM-dd-yyyy'
                    )} - ${format(new Date(salesOrder.createdAt), 'hh:mm a')}`
                  : 'N/A'}
              </p>
            </div>
            <div className="flex gap-4">
              <Badge
                className={cn('capitalize', getStatusStyles(salesOrder.status))}
              >
                {salesOrder.status || 'N/A'}
              </Badge>
              <Badge
                className={cn(
                  'capitalize',
                  getStatusStyles(salesOrder.odooStatus)
                )}
              >
                {salesOrder.odooStatus || 'N/A'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold">Customer</h3>
              <p className="text-base text-gray-700">
                {salesOrder.partner?.name} - {salesOrder.territory?.name}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Policy Type</h3>
              <p className="text-base text-gray-700">
                {salesOrder.policy_type
                  ? policyTypesName[salesOrder.policy_type]
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Warehouse Selection - Only show if createdByCustomer is true and no warehouse_id */}
          {salesOrder.createdByCustomer && !salesOrder.warehouse_id && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Warehouse</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedWarehouse}
                    onValueChange={setSelectedWarehouse}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem
                          key={warehouse.id}
                          value={warehouse.id.toString()}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedWarehouse && (
                    <div className="mt-4">
                      <Button
                        onClick={() => createSaleOrder()}
                        className="w-full"
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              {salesOrder.lines && salesOrder.lines.length > 0 ? (
                <div className="space-y-4">
                  {salesOrder.lines.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-gray-900">
                        {item.product_template?.name || 'N/A'}
                      </h4>
                      <p className="text-base text-gray-700">
                        Price per unit: {item.price_unit} PKR
                      </p>
                      <p className="text-base text-gray-700">
                        Discount: {item.discount}%
                      </p>
                      <p className="text-base text-gray-700">
                        QTY: {item.product_packaging_qty} x {item.qty}
                      </p>
                      <p className="text-base text-gray-700">
                        Packaging: {item.packaging?.name || 'N/A'}
                      </p>
                      <p className="text-base text-gray-700">
                        Policy: {item.policy?.code || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-500">No products available</p>
              )}
            </CardContent>
          </Card>

          {salesOrder.odooStatus === 'Quotation' && (
            <div className="flex justify-end">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Cancel Order</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Cancellation</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this order (#
                      {salesOrder.order_id})?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenDialog(false)}
                      disabled={removeLoading}
                    >
                      No
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={onConfirmCancel}
                      disabled={removeLoading}
                    >
                      {removeLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Yes'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesDetails;
