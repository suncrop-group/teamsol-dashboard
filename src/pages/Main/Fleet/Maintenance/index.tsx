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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const MaintenanceCard = ({
  item,
  onDeleteMaintenance,
}: {
  item: {
    id: number;
    vehicle: {
      name: string;
      license_plate: string;
    };
    cost: number;
    createdAt: string;
    status?: string;
    odooStatus?: string;
    name?: string;
    url?: string;
  };
  onDeleteMaintenance?: (id: number) => void;
}) => {
  const statusStyles = {
    sent: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    canceled: 'bg-red-100 text-red-700',
    quotation: 'bg-teal-100 text-teal-700',
    approved: 'bg-green-100 text-green-700',
    draft: 'bg-red-100 text-red-700',
    confirmed: 'bg-green-100 text-green-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approval: 'bg-yellow-100 text-yellow-700',
    submit: 'bg-yellow-100 text-yellow-700',
    'to report': 'bg-yellow-100 text-yellow-700',
    done: 'bg-teal-100 text-teal-700',
    success: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    default: 'bg-gray-100 text-gray-700',
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
            {item?.vehicle?.name} - {item?.vehicle?.license_plate}
          </h3>
          <p className="text-base font-medium text-gray-900">
            {priceFormatter(item?.cost)} PKR
          </p>
        </div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-700">
            #{item?.id} - {dayjs(item?.createdAt).format('DD/MM/YYYY')} -{' '}
            {dayjs(item?.createdAt).format('HH:mm')} 🕒
          </p>
          <div className="flex flex-col gap-2">
            <Badge
              className={cn(
                'capitalize',
                statusStyles[item?.status?.toLowerCase()]
              )}
            >
              {item?.status || 'N/A'}
            </Badge>
            <Badge
              className={cn(
                'capitalize',
                statusStyles[item?.odooStatus?.toLowerCase()]
              )}
            >
              {item?.odooStatus || 'N/A'}
            </Badge>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700 line-clamp-2">
            {item?.name || 'No description'}
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
              onClick={() => onDeleteMaintenance(item.id)}
              disabled={item.odooStatus?.toLowerCase() !== 'done'}
            >
              <CircleX className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Maintenance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toDeleteFuelId, setToDeleteFuelId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const fetchServiceData = async () => {
    const onSuccess = (response) => {
      const sortedData = response.data.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      );
      setServiceData(sortedData);
      setLoading(false);
    };
    const onError = () => {
      setLoading(false);
    };

    setLoading(true);
    callApi(
      'GET',
      '/fleet/services?category=service',
      null,
      onSuccess,
      onError
    );
  };
  useEffect(() => {
    fetchServiceData();
  }, []);

  const filteredServiceData = serviceData.filter((item) =>
    `${item?.id} ${item?.vehicle?.name} ${item?.vehicle?.license_plate} ${item?.cost} ${item?.name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const onConfirmDelete = () => {
    if (toDeleteFuelId === null) return;
    const findFuel = serviceData.find((item) => item.id === toDeleteFuelId);

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
          toast.success('Fuel record cancelled successfully');
          fetchServiceData();
          setDeleteDialogOpen(false);
          setToDeleteFuelId(null);
          setLoadingDelete(false);
        },
        () => {
          toast.error('Failed to cancelled fuel record. Please try again.');
          setLoadingDelete(false);
        }
      );
    };

    const onError = (error) => {
      setDeleteDialogOpen(false);
      setToDeleteFuelId(null);
      setLoadingDelete(false);
      toast.error(
        error?.message || 'Failed to cancelled fuel record. Please try again.'
      );
    };

    setLoadingDelete(true);
    callServerAPI('POST', '/delete/fleet', { data }, onSuccess, onError);
  };

  return (
    <div className="min-h-screen  p-4">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by ID, vehicle, or cost..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Button
              onClick={() => navigate('/add-maintenance')}
              className="w-full sm:w-auto"
            >
              Add Maintenance
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServiceData.length > 0 ? (
              filteredServiceData.map((item, index) => (
                <MaintenanceCard
                  key={index}
                  item={item}
                  onDeleteMaintenance={(id) => {
                    setToDeleteFuelId(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No maintenance records found
              </p>
            )}
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Maintenance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel #{toDeleteFuelId} of maintenance
              record?
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

export default Maintenance;
