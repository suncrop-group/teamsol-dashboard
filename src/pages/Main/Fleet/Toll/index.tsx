import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { priceFormatter } from '@/utils';
import { CircleX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  cancel: 'bg-red-100 text-red-800',
  sale: 'bg-green-100 text-green-800',
  purchase: 'bg-yellow-100 text-yellow-800',
  invoice: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  open: 'bg-yellow-100 text-yellow-800',
  to_report: 'bg-yellow-100 text-yellow-800',
  'to report': 'bg-yellow-100 text-yellow-800',
  submit: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const TollCard = ({
  item,
  onConfirmDelete,
}: {
  item: {
    id: number;
    createdAt: string;
    toll_amount: number;
    name?: string;
    status?: string;
    odooStatus?: string;
  };
  onConfirmDelete: (id: number) => void;
}) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">#{item.id}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">
          {dayjs(item.createdAt).format('DD/MM/YYYY - hh:mm A')}
        </span>
        <span className="text-sm font-medium">
          {priceFormatter(item.toll_amount)} PKR
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{item?.name}</span>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              statusStyles[item.status.toLowerCase()]
            }`}
          >
            {item.status}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              statusStyles[item.odooStatus.toLowerCase()]
            }`}
          >
            {item.odooStatus}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onConfirmDelete(item.id)}
            className="mt-2 cursor-pointer"
            disabled={item.odooStatus?.toLowerCase() !== 'draft'}
          >
            <CircleX className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Toll = () => {
  const [tolls, setTolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toDeleteFuelId, setToDeleteFuelId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const navigate = useNavigate();

  const fetchTolls = async () => {
    const onSuccess = (response) => {
      setLoading(false);
      response.data.sort((a, b) => b.id - a.id);
      setTolls(response.data);
    };
    const onError = () => {
      setLoading(false);
      toast.error('Failed to fetch tolls');
      setTolls([]);
    };

    setLoading(true);
    callApi('GET', '/fleet/toll', null, onSuccess, onError);
  };

  useEffect(() => {
    fetchTolls();
  }, []);

  const filteredTolls = tolls.filter(
    (toll) =>
      toll.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toll.id.toString().includes(searchQuery)
  );

  const onConfirmDelete = () => {
    if (toDeleteFuelId === null) return;
    const findFuel = tolls.find((item) => item.id === toDeleteFuelId);

    if (!findFuel) {
      toast.error('Fuel record not found', {
        description: 'Error',
      });
      return;
    }

    const data: {
      expense_id: number;
      company_id: number;
    } = {
      expense_id: toDeleteFuelId,
      company_id: findFuel.company_id,
    };

    const onSuccess = () => {
      callApi(
        'PATCH',
        '/fleet/toll',
        {
          id: findFuel._id,
        },
        () => {
          toast.success('Toll record cancelled successfully');
          fetchTolls();
          setDeleteDialogOpen(false);
          setToDeleteFuelId(null);
          setLoadingDelete(false);
        },
        () => {
          toast.error('Failed to cancelled toll record. Please try again.');
          setLoadingDelete(false);
        }
      );
    };

    const onError = (error) => {
      setDeleteDialogOpen(false);
      setToDeleteFuelId(null);
      setLoadingDelete(false);
      toast.error(
        error?.message || 'Failed to cancelled toll record. Please try again.'
      );
    };

    setLoadingDelete(true);
    callServerAPI('POST', '/delete/expenses', { data }, onSuccess, onError);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6 gap-4">
        <Input
          placeholder="Search tolls by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button onClick={() => navigate('/add-toll')} disabled={loading}>
          Add Toll
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTolls.map((toll) => (
            <TollCard
              key={toll.id}
              item={toll}
              onConfirmDelete={(id) => {
                setToDeleteFuelId(id);
                setDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {filteredTolls.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">No tolls found.</div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Toll Record!</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel #{toDeleteFuelId} of toll record?
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

export default Toll;
