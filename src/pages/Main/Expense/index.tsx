import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi, callServerAPI } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  Plus,
  Calendar,
  Hash,
  FileText,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { priceFormatter } from '@/utils';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const stylesByStatus = {
  sent: 'bg-green-100 text-green-800 hover:bg-green-200',
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  canceled: 'bg-red-100 text-red-800 hover:bg-red-200',
  quotation: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  draft: 'bg-red-100 text-red-800 hover:bg-red-200',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-200',
  approval: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  done: 'bg-green-100 text-green-800 hover:bg-green-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
};

// Mobile Card Component
const ExpenseCard = ({
  item,
  cancelOrder,
  onViewImages,
}: {
  item: {
    id: string;
    name: string;
    description?: string;
    amount?: number;
    createdAt?: string;
    odooStatus?: string;
    status?: string;
    urls?: string[];
  };
  cancelOrder: (id: string) => void;
  onViewImages: (urls: string[]) => void;
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header with Name and Statuses */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500">PKR</span>
              <span className="font-medium text-green-600">
                {priceFormatter(item.amount)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={`${stylesByStatus[item.status?.toLowerCase()]} border-0 text-xs capitalize`}>
              {item.status}
            </Badge>
            <Badge className={`${stylesByStatus[item.odooStatus?.toLowerCase()]} border-0 text-xs capitalize`}>
              {item.odooStatus}
            </Badge>
          </div>
        </div>

        {/* ID and Date */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>#{item.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
            </span>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 line-clamp-2">{item.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {item.urls && item.urls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewImages(item.urls)}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Images ({item.urls.length})
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => cancelOrder(item.id)}
            disabled={item.odooStatus !== 'draft'}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Desktop Table Row Component
const ExpenseRow = ({
  item,
  cancelOrder,
  onViewImages,
}: {
  item: {
    id: string;
    name: string;
    description?: string;
    amount?: number;
    createdAt?: string;
    odooStatus?: string;
    status?: string;
    urls?: string[];
  };
  cancelOrder: (id: string) => void;
  onViewImages: (urls: string[]) => void;
}) => {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <span className="font-medium">#{item.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{item.name}</div>
          {item.description && (
            <div className="text-xs text-gray-500 line-clamp-1 mt-1">
              {item.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">PKR</span>
          <span className="font-semibold text-green-600">
            {priceFormatter(item.amount)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <div>
            <div>{dayjs(item.createdAt).format('DD/MM/YYYY')}</div>
            <div className="text-xs text-gray-400">
              {dayjs(item.createdAt).format('HH:mm')}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge className={`${stylesByStatus[item.status?.toLowerCase()]} border-0 w-fit capitalize`}>
            {item.status}
          </Badge>
          <Badge className={`${stylesByStatus[item.odooStatus?.toLowerCase()]} border-0 w-fit capitalize`}>
            {item.odooStatus}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {item.urls && item.urls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewImages(item.urls)}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              {item.urls.length}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => cancelOrder(item.id)}
            disabled={item.odooStatus !== 'draft'}
          >
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
        expensesOrders.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
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
      toast.success('Expense cancelled successfully');
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

  const handleViewImages = (urls: string[]) => {
    setSelectedImages(urls);
    setCurrentImageIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold">Expenses</CardTitle>
              <Button
                onClick={() => navigate('/expenses/add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search expenses by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {search ? 'No expenses found matching your search.' : 'No expenses found.'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {!search && 'Create your first expense to get started.'}
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
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <ExpenseRow
                          key={item.id}
                          item={item}
                          cancelOrder={cancelOrder}
                          onViewImages={handleViewImages}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredData.map((item) => (
                    <ExpenseCard
                      key={item.id}
                      item={item}
                      cancelOrder={cancelOrder}
                      onViewImages={handleViewImages}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel expense #{selected}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              disabled={removeLoading}
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmCancel}
              disabled={removeLoading}
            >
              {removeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      {selectedImages.length > 0 && (
        <Dialog
          open={selectedImages.length > 0}
          onOpenChange={() => setSelectedImages([])}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <div className="relative">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Expense image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              {selectedImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {selectedImages.length}
                </div>
              )}
            </div>
            {selectedImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev > 0 ? prev - 1 : selectedImages.length - 1
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev < selectedImages.length - 1 ? prev + 1 : 0
                    )
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Expenses;
