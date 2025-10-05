import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi, callServerAPI } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { priceFormatter } from '@/utils';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';

const stylesByStatus = {
  sent: 'bg-green-100 text-green-500',
  pending: 'bg-yellow-100 text-yellow-500',
  canceled: 'bg-red-100 text-red-500',
  quotation: 'bg-blue-100 text-blue-500',
  approved: 'bg-green-100 text-green-500',
  draft: 'bg-red-100 text-red-500',
  confirmed: 'bg-green-100 text-green-500',
  approval: 'bg-yellow-100 text-yellow-500',
  done: 'bg-green-100 text-green-500',
  rejected: 'bg-red-100 text-red-500',
  cancelled: 'bg-red-100 text-red-500',
};

const ExpensesCard = ({
  item,
  cancelOrder,
  toggleEventImages,
  setToggleEventImages,
}: {
  item: {
    id: string;
    name: string;
    description?: string;
    amount?: number;
    createdAt?: string;
    odooStatus?: string;
    status?: string;
    url?: string;
    urls?: string[];
  };
  cancelOrder: (id: string) => void;
  toggleEventImages: string[];
  setToggleEventImages: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleImages = () => {
    setToggleEventImages((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      } else {
        return [...prev, item.id];
      }
    });
  };

  return (
    <>
      <Card className="my-4 p-4 bg-white shadow-md rounded-md">
        <CardContent className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{item?.name}</h3>
            <p>{priceFormatter(item?.amount)} PKR</p>
            <p>#{item?.id}</p>
          </div>
          <div className="gap-2 flex items-center flex-col">
            <p
              className={`rounded px-2 py-1 text-xs font-semibold capitalize ${
                stylesByStatus[
                  item.status?.toLowerCase() as keyof typeof stylesByStatus
                ]
              }`}
            >
              {item.status}
            </p>
            <p
              className={`rounded px-2 py-1 text-xs font-semibold capitalize ${
                stylesByStatus[
                  item.odooStatus?.toLowerCase() as keyof typeof stylesByStatus
                ]
              }`}
            >
              {item.odooStatus}
            </p>
          </div>
        </CardContent>

        <CardContent className="flex justify-between items-center mt-2">
          <div className="text-sm flex-1">
            <p className="text-gray-500 text-sm font-medium">
              {new Date(item?.createdAt || '').toLocaleDateString()} -{' '}
              {new Date(item?.createdAt || '').toLocaleTimeString()}
            </p>
            {item?.description && (
              <p className="text-gray-600 text-sm mt-1">{item?.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {item?.url && (
                <a
                  href={item?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Eye size={20} />
                </a>
              )}
              {item?.urls && item.urls.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleImages}
                  className="text-blue-500 hover:text-blue-700 p-0 h-auto"
                >
                  {toggleEventImages.includes(item.id)
                    ? `Hide Image${item.urls.length > 1 ? 's' : ''}`
                    : `Show Image${item.urls.length > 1 ? 's' : ''}`}{' '}
                  ({item.urls.length})
                </Button>
              )}
            </div>
          </div>
          <Button
            onClick={() => cancelOrder(item.id)}
            disabled={item.odooStatus !== 'draft'}
            variant="secondary"
          >
            Cancel
          </Button>
        </CardContent>

        {/* Image Gallery */}
        {item?.urls &&
          item.urls.length > 0 &&
          toggleEventImages.includes(item.id) && (
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                {item.urls.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Expense image ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(imageUrl)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center"
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <Eye
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        size={16}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Expense Image"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const Expenses = () => {
  const [expensesOrders, setExpensesOrders] = useState<
    {
      id: string;
      name: string;
      description?: string;
      amount?: number;
      createdAt?: string;
      odooStatus?: string;
      status?: string;
      urls?: string[];
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('');
  const [removeLoading, setRemoveLoading] = useState(false);
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState<
    {
      id: string;
      name: string;
      description?: string;
      amount?: number;
      createdAt?: string;
      odooStatus?: string;
      status?: string;
      urls?: string[];
    }[]
  >([]);
  const [search, setSearch] = useState('');
  const [toggleEventImages, setToggleEventImages] = useState<string[]>([]);
  const user = useSelector(selectUser);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchExpensesOrders = () => {
    setLoading(true);
    callApi(
      'GET',
      '/expense?withoutEvent=true',
      null,
      (response: {
        data: {
          id: string;
          name: string;
          description?: string;
          amount?: number;
          createdAt?: string;
          odooStatus?: string;
          status?: string;
          urls?: string[];
        }[];
      }) => {
        setLoading(false);
        response.data.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setExpensesOrders(response.data);
      },
      () => {
        setLoading(false);
        toast.error('Error fetching expenses orders');
      }
    );
  };

  useEffect(() => {
    fetchExpensesOrders();
  }, []);

  useEffect(() => {
    if (search === '') {
      setFilteredData(expensesOrders);
    } else {
      setFilteredData(
        expensesOrders.filter(
          (item: {
            name: string;
            description?: string;
            amount?: number;
            id?: string;
            createdAt?: string;
            odooStatus?: string;
            status?: string;
            urls?: string[];
          }) => item.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, expensesOrders]);

  const onConfirmCancel = () => {
    const onDBSuccess = () => {
      setRemoveLoading(false);
      setSelected('');
      setOpenDialog(false);
      fetchExpensesOrders();
    };

    const onDBError = (error: { message?: string; error?: string }) => {
      setRemoveLoading(false);
      setSelected('');
      setOpenDialog(false);
      toast.error(error?.message || 'Something went wrong. Please try again.');
    };

    const onSuccess = (response: {
      status: string;
      error?: string;
      data?: {
        id: string;
        name: string;
        description?: string;
        amount?: number;
        createdAt?: string;
        odooStatus?: string;
        status?: string;
      };
    }) => {
      if (response.status === 'success') {
        callApi(
          'PATCH',
          '/expense/status',
          {
            id: selected,
            status: 'cancelled',
            company_id: user.company.id,
          },
          onDBSuccess,
          onDBError
        );
      } else {
        setRemoveLoading(false);
        toast.error(
          response?.error || 'Something went wrong. Please try again.'
        );
      }
    };
    const onError = (error: { message?: string; error?: string }) => {
      setRemoveLoading(false);
      setSelected('');
      setOpenDialog(false);
      toast.error(error?.message || 'Something went wrong. Please try again.');
    };
    setRemoveLoading(true);

    const data = {
      expense_id: selected,
      company_id: user.company.id,
    };
    callServerAPI('POST', `/delete/expenses`, { data }, onSuccess, onError);
  };
  const cancelOrder = (id: string) => {
    setSelected(id);
    setOpenDialog(true);
  };

  return (
    <div className="p-6">
      <Loader loading={loading} />
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search Expenses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
        <Button onClick={() => navigate('/expenses/add')}>Add Expense</Button>
      </div>

      {filteredData.length > 0 ? (
        <div className="px-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredData.map(
            (item: {
              id: string;
              name: string;
              description?: string;
              amount?: number;
              createdAt?: string;
              odooStatus?: string;
              status?: string;
            }) => (
              <ExpensesCard
                key={item.id}
                item={item}
                cancelOrder={cancelOrder}
                toggleEventImages={toggleEventImages}
                setToggleEventImages={setToggleEventImages}
              />
            )
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">No expenses found</p>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the expense #{selected}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpenDialog(false)}
              disabled={removeLoading}
            >
              No
            </Button>
            <Button onClick={onConfirmCancel} disabled={removeLoading}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
