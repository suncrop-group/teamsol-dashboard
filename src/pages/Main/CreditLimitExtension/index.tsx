import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  User,
  CreditCard,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { priceFormatter } from '@/utils';

const statusStyles = {
  sent: 'bg-green-100 text-green-800 hover:bg-green-200',
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  canceled: 'bg-red-100 text-red-800 hover:bg-red-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
  quotation: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  draft: 'bg-red-100 text-red-800 hover:bg-red-200',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-200',
  submitted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  approval: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  updated: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
};

// Mobile Card Component
const CreditLimitExtensionCard = ({ item }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header with Company and Customer */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-base">{item?.company?.name}</h3>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{item?.customer?.name}</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <CreditCard className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{item?.policy?.code}</span>
            </div>
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
            <span>#{item?.id} - {item?.sequence}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{dayjs(item?.createdAt).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">PKR</span>
            <span className="font-medium text-green-600">
              {priceFormatter(item?.amount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Desktop Table Row Component
const CreditLimitExtensionRow = ({ item }) => {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">#{item?.id}</div>
            <div className="text-xs text-gray-500">{item?.sequence}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium">{item?.company?.name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" />
              {item?.customer?.name}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{item?.policy?.code}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">PKR</span>
          <span className="font-semibold text-green-600">
            {priceFormatter(item?.amount)}
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

const CreditLimitExtension = () => {
  const [creditLimitsExtension, setCreditLimitsExtension] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCreditLimitsExtension = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        response.data.sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        );
        setCreditLimitsExtension(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch credit limit extensions');
      };
      setLoading(true);
      callApi('GET', '/credit-limit/extension', null, onSuccess, onError);
    };

    fetchCreditLimitsExtension();
  }, []);

  const filteredCreditLimits = creditLimitsExtension.filter(
    (item) =>
      item?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.policy?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.id.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-600" />
                Credit Limit Extensions
              </CardTitle>
              <Button
                onClick={() => navigate('/add-credit-limit-extension')}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extension
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer, policy code, or ID..."
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
            ) : filteredCreditLimits.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? 'No credit limit extensions found matching your search.'
                    : 'No credit limit extensions found.'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {!searchQuery &&
                    'Add your first credit limit extension to get started.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Company & Customer</TableHead>
                        <TableHead className="font-semibold">Policy</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCreditLimits.map((item) => (
                        <CreditLimitExtensionRow key={item.id} item={item} />
                      ))}
                    </TableBody>
                  </Table>
              </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredCreditLimits.map((item) => (
                    <CreditLimitExtensionCard key={item.id} item={item} />
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

export default CreditLimitExtension;
