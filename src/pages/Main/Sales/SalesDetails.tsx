import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { callApi } from '@/api';

const policyTypesName = {
  is_advance: 'Advance',
  cash: 'Advance',
  is_secure_credit: 'Secure Credit',
  is_credit: 'Credit',
};

const SalesDetails = () => {
  const { order } = useParams();

  const [loading, setLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const [salesOrder, setSalesOrder] = useState({
    lines: [],
    order_id: 0,
    order_sequence: '',
    createdAt: '',
    status: '',
    odooStatus: '',
    partner: { name: '' },
    territory: { name: '' },
    policy_type: 'is_advance',
  });

  const fetchSalesOrders = async () => {
    setLoading(true);
    const onSuccessfulFetch = (data: {
      data: {
        lines: {
          id: number;
          name: string;
          quantity: number;
          price: number;
        }[];
        order_id: number;
        order_sequence: string;
        createdAt: string;
        status: string;
        odooStatus: string;
        partner: { name: string };
        territory: { name: string };
        policy_type: string;
      };
    }) => {
      setSalesOrder(data.data);
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
