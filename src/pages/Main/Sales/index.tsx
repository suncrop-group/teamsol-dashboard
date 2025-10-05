import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addSales } from '@/redux/slices/SalesSlice';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
import { callApi } from '@/api';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { priceFormatter } from '@/utils';

const statusClasses = {
  sent: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-50 text-yellow-800',
  canceled: 'bg-red-100 text-red-700',
  quotation: 'bg-cyan-600 text-white',
  approved: 'bg-green-100 text-green-700',
  draft: 'bg-red-100 text-red-700',
  confirmed: 'bg-green-100 text-green-700',
  approval: 'bg-yellow-50 text-yellow-800',
  approve: 'bg-green-100 text-green-700',
  submit: 'bg-green-100 text-green-700',
  'to report': 'bg-yellow-50 text-yellow-800',
  submitted: 'bg-cyan-600 text-white',
  done: 'bg-green-100 text-green-700',
  'sale order': 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const SalesCard = ({ item, onClick }) => (
  <div
    onClick={() => onClick(item.order_id)}
    className="bg-white rounded-xl shadow-sm p-5 mb-4 transition hover:shadow-md cursor-pointer border border-gray-100 flex flex-col gap-3"
    role="button"
    tabIndex={0}
  >
    <div className="flex justify-between items-center flex-wrap">
      <span className="font-medium text-gray-900">
        {item?.partner?.name} - {item?.territory?.name}
      </span>
      <span className="font-semibold">{priceFormatter(item?.total)} PKR</span>
    </div>
    <div className="flex justify-between items-center flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-gray-500 text-sm font-medium">
          #{item?.order_id} - {item?.order_sequence}
        </span>
        <span className="text-xs text-gray-400">
          {dayjs(item?.createdAt).format('MM-DD-YYYY')} -{' '}
          {dayjs(item?.createdAt).format('hh:mm A')} 🕒
        </span>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <span
          className={`rounded px-2 py-1 text-xs font-semibold capitalize ${
            statusClasses[item.status?.toLowerCase()] ?? ''
          }`}
        >
          {item.status}
        </span>
        <span
          className={`rounded px-2 py-1 text-xs font-semibold capitalize ${
            statusClasses[item.odooStatus?.toLowerCase()] ?? ''
          }`}
        >
          {item.odooStatus}
        </span>
      </div>
    </div>
  </div>
);

const Sales = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-white">
      <Loader loading={loading} />

      <div className="max-w-2xl mx-auto px-2">
        {salesOrders.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <p className="text-gray-800 text-lg mb-4">No sales orders found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/sales/add')}
              className="mb-2"
            >
              Add Sales Order
            </Button>
          </div>
        )}
      </div>

      {salesOrders.length > 0 && (
        <>
          <div className="mb-4">
            <Button
              onClick={() => navigate('/sales/add')}
              className="w-full md:w-auto"
            >
              Add Order
            </Button>
          </div>
          <div className="px-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesOrders.map((item, idx) => (
              <SalesCard
                item={item}
                key={item.order_id ?? idx}
                onClick={(order_id) => navigate(`/sale/${order_id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;
