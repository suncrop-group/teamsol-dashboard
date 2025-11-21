import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addSales } from '@/redux/slices/SalesSlice';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
import { callApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  Plus,
  Calendar,
  Hash,
  User,
  MapPin,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { priceFormatter } from '@/utils';

const statusStyles = {
  sent: 'bg-green-100 text-green-800 hover:bg-green-200',
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  canceled: 'bg-red-100 text-red-800 hover:bg-red-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
  quotation: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  draft: 'bg-red-100 text-red-800 hover:bg-red-200',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-200',
  approval: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  approve: 'bg-green-100 text-green-800 hover:bg-green-200',
  submit: 'bg-green-100 text-green-800 hover:bg-green-200',
  'to report': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  submitted: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
  done: 'bg-green-100 text-green-800 hover:bg-green-200',
  'sale order': 'bg-green-100 text-green-800 hover:bg-green-200',
};

// Mobile Card Component
const SalesCard = ({ item, onClick }) => {
  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onClick(item.order_id)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with Partner and Territory */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-base">{item?.partner?.name}</h3>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{item?.territory?.name}</span>
            </div>
            {item?.createdByCustomer && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs ml-6">
                Created by Customer
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge
              className={`${
                statusStyles[item?.status?.toLowerCase()]
              } border-0 text-xs capitalize`}
            >
              {item?.status}
            </Badge>
            <Badge
              className={`${
                statusStyles[item?.odooStatus?.toLowerCase()]
              } border-0 text-xs capitalize`}
            >
              {item?.odooStatus}
            </Badge>
          </div>
        </div>

        {/* ID and Sequence */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>#{item?.order_id} - {item?.order_sequence}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{dayjs(item?.createdAt).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        </div>

        {/* Total */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">PKR</span>
            <span className="font-medium text-green-600">
              {priceFormatter(item?.total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Desktop Table Row Component
const SalesRow = ({ item, onClick }) => {
  return (
    <TableRow
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onClick(item.order_id)}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">#{item?.order_id}</div>
            <div className="text-xs text-gray-500">{item?.order_sequence}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium">{item?.partner?.name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {item?.territory?.name}
            </div>
            {item?.createdByCustomer && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs mt-1">
                Created by Customer
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">PKR</span>
          <span className="font-semibold text-green-600">
            {priceFormatter(item?.total)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <div>
            <div>{dayjs(item?.createdAt).format('DD/MM/YYYY')}</div>
            <div className="text-xs text-gray-400">
              {dayjs(item?.createdAt).format('HH:mm')}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge
            className={`${
              statusStyles[item?.status?.toLowerCase()]
            } border-0 w-fit capitalize`}
          >
            {item?.status}
          </Badge>
          <Badge
            className={`${
              statusStyles[item?.odooStatus?.toLowerCase()]
            } border-0 w-fit capitalize`}
          >
            {item?.odooStatus}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
};

const Sales = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchSalesOrders = () => {
    dispatch(resetProducts());
    setLoading(true);

    callApi(
      'GET',
      '/sales',
      null,
      (response) => {
        setLoading(false);
        const sorted = response.data.sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        );
        setSalesOrders(sorted);
        dispatch(addSales(sorted));
      },
      () => {
        setLoading(false);
        toast.error('Failed to fetch sales orders');
      }
    );
  };

  useEffect(() => {
    fetchSalesOrders();
    // eslint-disable-next-line
  }, []);

  const filteredSalesOrders = salesOrders.filter(
    (item) =>
      item?.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.territory?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.order_id?.toString().includes(searchQuery) ||
      item?.order_sequence?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                Sales Orders
              </CardTitle>
              <Button onClick={() => navigate('/sales/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Order
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by partner, territory, order ID, or sequence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredSalesOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? 'No sales orders found matching your search.'
                    : 'No sales orders found.'}
                </p>
                <p className="text-gray-400 text-sm mt-2 mb-4">
                  {!searchQuery && 'Create your first sales order to get started.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/sales/add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sales Order
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold">Order ID</TableHead>
                        <TableHead className="font-semibold">Partner & Territory</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalesOrders.map((item) => (
                        <SalesRow
                          key={item.order_id}
                          item={item}
                          onClick={(order_id) => navigate(`/sale/${order_id}`)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredSalesOrders.map((item) => (
                    <SalesCard
                      key={item.order_id}
                      item={item}
                      onClick={(order_id) => navigate(`/sale/${order_id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sales;
