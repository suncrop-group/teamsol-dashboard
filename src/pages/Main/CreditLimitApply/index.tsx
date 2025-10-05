import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { priceFormatter } from '@/utils';
import { Loader2 } from 'lucide-react';

const statusStyles = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  quotation: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  draft: 'bg-red-100 text-red-800',
  confirmed: 'bg-green-100 text-green-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  approval: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  refused: 'bg-red-100 text-red-800',
  refused_by_customer: 'bg-red-100 text-red-800',
  refuse: 'bg-red-100 text-red-800',
  submit: 'bg-yellow-100 text-yellow-800',
  'to report': 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
  'to approve': 'bg-yellow-100 text-yellow-800',
  'to confirm': 'bg-yellow-100 text-yellow-800',
};

const CreditLimitApplyCard = ({ item }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">
        {item?.company?.name} - {item?.customer?.name} - {item?.policy?.code}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">
            #{item?.id} - {item?.sequence}
          </span>
          <span className="text-sm text-gray-600">
            {dayjs(item?.createdAt).format('DD-MM-YYYY')} -{' '}
            {dayjs(item?.createdAt).format('hh:mm A')} 🕒
          </span>
        </div>
        <span className="text-sm font-medium">
          {priceFormatter(item?.amount)} PKR
        </span>
      </div>
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              statusStyles[item?.status.toLowerCase()]
            }`}
          >
            {item?.status}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              statusStyles[item?.odooStatus.toLowerCase()]
            }`}
          >
            {item?.odooStatus}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CreditLimitApply = () => {
  const [creditLimitsApply, setCreditLimitsApply] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCreditLimitsApply = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        response.data.sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        );
        setCreditLimitsApply(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch credit limits apply', {
          description: 'Error',
        });
      };
      setLoading(true);
      callApi('GET', '/credit-limit/apply', null, onSuccess, onError);
    };

    fetchCreditLimitsApply();
  }, []);

  const filteredCreditLimits = creditLimitsApply.filter(
    (item) =>
      item?.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.policy?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.id.toString().includes(searchQuery)
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6 gap-2">
        <Input
          placeholder="Search by company, customer, policy code, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={() => navigate('/add-credit-limit-apply')}
          disabled={loading}
        >
          Add Credit Limit Apply
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCreditLimits.map((item, index) => (
            <CreditLimitApplyCard key={index} item={item} />
          ))}
        </div>
      )}

      {filteredCreditLimits.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No credit limits apply found.
        </div>
      )}
    </div>
  );
};

export default CreditLimitApply;
