import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, CircleX } from 'lucide-react';
import { callApi, callServerAPI } from '@/api';
import { priceFormatter } from '@/utils';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
const FuelCard = ({
  item,
  onDeleteFuel,
}: {
  item: {
    id: number;
    liters: number;
    cost: number;
    createdAt: string;
    status?: string;
    odooStatus?: string;
    url?: string;
  };
  onDeleteFuel: (id: number) => void;
}) => {
  const statusStyles = {
    sent: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    canceled: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700',
    quotation: 'bg-teal-100 text-teal-700',
    approved: 'bg-green-100 text-green-700',
    draft: 'bg-red-100 text-red-700',
    confirmed: 'bg-green-100 text-green-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approval: 'bg-yellow-100 text-yellow-700',
    'to report': 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
    success: 'bg-green-100 text-green-700',
  };

  const handleViewUrl = () => {
    if (item?.url && typeof item.url === 'string') {
      window.open(item.url, '_blank');
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold text-gray-900">
            Refueling, {item.liters} Liters
          </h3>
          <p className="text-base font-medium text-gray-900">
            {priceFormatter(item.cost)} PKR
          </p>
        </div>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              #{item.id} - {dayjs(item.createdAt).format('DD/MM/YYYY')} -{' '}
              {dayjs(item.createdAt).format('HH:mm')} 🕒
            </p>
            <div className="flex items-center gap-2">
              {item.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewUrl}
                  className="p-1"
                >
                  <Eye className="h-5 w-5 text-blue-500" />
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteFuel(item.id)}
                disabled={item.odooStatus?.toLowerCase() !== 'submit'}
              >
                <CircleX className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge
              className={cn(
                'capitalize',
                statusStyles[item.status?.toLowerCase()]
              )}
            >
              {item.status || 'N/A'}
            </Badge>
            <Badge
              className={cn(
                'capitalize',
                statusStyles[item.odooStatus?.toLowerCase()]
              )}
            >
              {item.odooStatus || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Fuel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fuelData, setFuelData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toDeleteFuelId, setToDeleteFuelId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const fetchFuelData = async () => {
    const onSuccess = (response) => {
      const sortedData = response.data.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      );
      setFuelData(sortedData);
      setLoading(false);
    };
    const onError = () => {
      setLoading(false);
    };

    setLoading(true);
    callApi('GET', '/fleet/services?category=fuel', null, onSuccess, onError);
  };
  useEffect(() => {
    fetchFuelData();
  }, []);

  const filteredFuelData = fuelData.filter((item) =>
    `${item.id} ${item.liters} ${item.cost}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const onDeleteFuel = (id) => {
    setToDeleteFuelId(id);
    setDeleteDialogOpen(true);
  };

  const onConfirmDelete = () => {
    if (toDeleteFuelId === null) return;
    const findFuel = fuelData.find((item) => item.id === toDeleteFuelId);

    if (!findFuel) {
      toast.error('Fuel record not found', {
        description: 'Error',
      });
      return;
    }

    const data: {
      fleet_id: number;
      company_id: number;
      service_type_id: number;
    } = {
      fleet_id: toDeleteFuelId,
      company_id: findFuel.company_id,
      service_type_id: findFuel.service_type_id,
    };

    const onSuccess = () => {
      callApi(
        'PATCH',
        '/fleet/service/cancel',
        {
          id: toDeleteFuelId,
          service_type_id: findFuel.service_type_id,
        },
        () => {
          toast.success('Fuel record deleted successfully');
          fetchFuelData();
          setDeleteDialogOpen(false);
          setToDeleteFuelId(null);
          setLoadingDelete(false);
        },
        () => {
          toast.error('Failed to delete fuel record. Please try again.');
          setLoadingDelete(false);
        }
      );
    };

    const onError = (error) => {
      setDeleteDialogOpen(false);
      setToDeleteFuelId(null);
      setLoadingDelete(false);
      toast.error(
        error?.message || 'Failed to delete fuel record. Please try again.'
      );
    };

    setLoadingDelete(true);
    callServerAPI('POST', '/delete/fleet', { data }, onSuccess, onError);
  };

  return (
    <div className="min-h-screen p-4">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by ID, liters, or cost..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Button
              onClick={() => navigate('/add-fuel')}
              className="w-full sm:w-auto"
            >
              Add Fuel
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFuelData.length > 0 ? (
              filteredFuelData.map((item, index) => (
                <FuelCard key={index} item={item} onDeleteFuel={onDeleteFuel} />
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No fuel records found
              </p>
            )}
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Fuel Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel #{toDeleteFuelId} of fuel record?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setToDeleteFuelId(null);
              }}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={loadingDelete}
            >
              {loadingDelete ? 'Cancelling...' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fuel;
