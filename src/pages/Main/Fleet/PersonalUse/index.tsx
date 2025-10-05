import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CircleX, Loader2 } from 'lucide-react';
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

const PersonalUseCard = ({
  item,
  onConfirmDelete,
}: {
  item: {
    id: number;
    personal_travel: number;
    personal_travel_amount: number;
    createdAt: string;
    name?: string;
    status?: string;
    odooStatus?: string;
    company_id?: number;
  };
  onConfirmDelete?: (id: number) => void;
}) => {
  const statusStyles = {
    sent: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    quotation: 'bg-teal-100 text-teal-700',
    approved: 'bg-green-100 text-green-700',
    draft: 'bg-red-100 text-red-700',
    confirmed: 'bg-green-100 text-green-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approval: 'bg-yellow-100 text-yellow-700',
    to_report: 'bg-yellow-100 text-yellow-700',
    'to report': 'bg-yellow-100 text-yellow-700',
    submit: 'bg-green-100 text-green-700',
    cancel: 'bg-red-100 text-red-700',
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-700">
            #{item.id} - {dayjs(item.createdAt).format('DD/MM/YYYY')} -{' '}
            {dayjs(item.createdAt).format('hh:mm A')} 🕒
          </p>
          <div className="text-right">
            <p className="text-base font-medium text-gray-900">
              {priceFormatter(item.personal_travel_amount)} PKR
            </p>
            <p className="text-sm text-gray-700">{item.personal_travel} KM</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-700 line-clamp-2">
              {item.name || 'No description'}
            </p>
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

const PersonalUse = () => {
  const navigate = useNavigate();
  const [personalUses, setPersonalUses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toDeleteFuelId, setToDeleteFuelId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const fetchPersonalUses = async () => {
    const onSuccess = (response) => {
      const sortedData = response.data.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      );
      setPersonalUses(sortedData);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch personal use records');
      setPersonalUses([]);
      setLoading(false);
    };

    setLoading(true);
    callApi('GET', '/fleet/personal-use', null, onSuccess, onError);
  };
  useEffect(() => {
    fetchPersonalUses();
  }, []);

  const filteredPersonalUses = personalUses.filter((item) =>
    `${item.id} ${item.personal_travel} ${item.personal_travel_amount} ${item.name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const onConfirmDelete = () => {
    if (toDeleteFuelId === null) return;
    const findFuel = personalUses.find((item) => item.id === toDeleteFuelId);

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
        '/fleet/personal-use/cancel',
        {
          id: toDeleteFuelId,
          company_id: findFuel.company_id,
        },
        () => {
          toast.success('Personal use record cancelled successfully');
          fetchPersonalUses();
          setDeleteDialogOpen(false);
          setToDeleteFuelId(null);
          setLoadingDelete(false);
        },
        () => {
          toast.error(
            'Failed to cancelled personal use record. Please try again.'
          );
          setLoadingDelete(false);
        }
      );
    };

    const onError = (error) => {
      setDeleteDialogOpen(false);
      setToDeleteFuelId(null);
      setLoadingDelete(false);
      toast.error(
        error?.message ||
          'Failed to cancelled personal use record. Please try again.'
      );
    };

    setLoadingDelete(true);
    callServerAPI('POST', '/delete/expenses', { data }, onSuccess, onError);
  };

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by ID, distance, amount, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Button
              onClick={() => navigate('/add-personal-use')}
              className="w-full sm:w-auto"
            >
              Add Personal Use
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPersonalUses.length > 0 ? (
              filteredPersonalUses.map((item, index) => (
                <PersonalUseCard
                  key={index}
                  item={item}
                  onConfirmDelete={(id) => {
                    setToDeleteFuelId(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No personal use records found
              </p>
            )}
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Personal Use Record!</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel #{toDeleteFuelId} of personal use
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

export default PersonalUse;
