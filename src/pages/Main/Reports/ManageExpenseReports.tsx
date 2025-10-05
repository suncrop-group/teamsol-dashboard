import { useEffect, useState } from 'react';
import { callApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { months } from '@/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const stylesByStatus = {
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

const ManageExpenseReportCard = ({ item, onPress }) => {
  return (
    <Card
      className={`flex flex-col p-4 bg-white shadow-md hover:shadow-lg transition-shadow ${
        item.status === 'pending'
          ? 'cursor-pointer'
          : 'cursor-not-allowed opacity-70'
      }`}
      onClick={() => item.status === 'pending' && onPress(item)}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-800">
            <p className="font-semibold">
              Submitted By: {item?.sender_details.name}
            </p>
            <p>({item?.sender_details.work_email})</p>
          </div>
          <p className="text-sm text-gray-800">
            {item.territory_details.map((t) => t.name).join(', ')}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-800">
              #{item?._id} - {dayjs(item?.createdAt).format('DD/MM/YYYY HH:mm')}{' '}
              🕒
            </p>
            <p className="text-sm text-gray-800">
              Report of{' '}
              {months.find((m) => m.value === item?.selectedMonth)?.label}{' '}
              {item?.selectedYear}
            </p>
            {item?.reportURL && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.reportURL, '_blank');
                  }}
                  className="p-0 cursor-pointer flex justify-start"
                  aria-label="View report"
                >
                  <Eye className="h-5 w-5 items-start justify-center flex " />
                </Button>
              </div>
            )}
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              stylesByStatus[item?.status?.toLowerCase()] ||
              stylesByStatus.pending
            }`}
          >
            {item?.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const ManageExpenseReports = () => {
  const [loading, setLoading] = useState(true);
  const [fuelData, setFuelData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [note, setNote] = useState('');
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchFuelData = async () => {
      callApi(
        'GET',
        `/expense/receiver-reports`,
        null,
        (response) => {
          response.data.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          );
          setFuelData(response.data);
          setLoading(false);
        },
        () => {
          setLoading(false);
          toast.error('Failed to fetch expense reports', {
            description: 'Error',
          });
        }
      );
    };
    fetchFuelData();
  }, []);

  const handleCardPress = (item) => {
    setActiveItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setActiveItem(null);
    setNote('');
  };

  const handleReject = () => {
    if (!activeItem) return;

    if (!note) {
      toast.error('Please mention the reason for rejection', {
        description: 'Error',
      });
      return;
    }

    setRejectConfirmOpen(true);
  };

  const confirmReject = () => {
    setLoading(true);
    callApi(
      'PATCH',
      `/expense/cancel-or-accept-report`,
      {
        id: activeItem?._id,
        status: 'cancelled',
        remarks: note,
      },
      () => {
        toast.success('Report rejected successfully', {
          description: 'Success',
        });
        handleCloseModal();
        setRejectConfirmOpen(false);
        const fetchFuelData = async () => {
          callApi(
            'GET',
            `/expense/receiver-reports`,
            null,
            (response) => {
              response.data.sort(
                (a, b) =>
                  dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
              );
              setFuelData(response.data);
              setLoading(false);
            },
            () => {
              setLoading(false);
              toast.error('Failed to fetch expense reports', {
                description: 'Error',
              });
            }
          );
        };
        fetchFuelData();
      },
      () => {
        setLoading(false);
        setRejectConfirmOpen(false);
        toast.error('Failed to reject the report', { description: 'Error' });
        handleCloseModal();
      }
    );
  };

  const handleApprove = () => {
    if (!activeItem) return;

    setLoading(true);
    callApi(
      'PATCH',
      `/expense/cancel-or-accept-report`,
      {
        id: activeItem?._id,
        status: 'approved',
        remarks: note,
      },
      () => {
        toast.success('Report approved successfully', {
          description: 'Success',
        });
        handleCloseModal();
        const fetchFuelData = async () => {
          callApi(
            'GET',
            `/expense/receiver-reports`,
            null,
            (response) => {
              response.data.sort(
                (a, b) =>
                  dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
              );
              setFuelData(response.data);
              setLoading(false);
            },
            () => {
              setLoading(false);
              toast.error('Failed to fetch expense reports', {
                description: 'Error',
              });
            }
          );
        };
        fetchFuelData();
      },
      () => {
        setLoading(false);
        toast.error('Failed to approve the report', { description: 'Error' });
        handleCloseModal();
      }
    );
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Manage Expense Reports
        </h1>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : fuelData.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No expense reports found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fuelData.map((item) => (
              <ManageExpenseReportCard
                key={item._id}
                item={item}
                onPress={handleCardPress}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Expense Report</DialogTitle>
          </DialogHeader>
          {activeItem && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">ID: {activeItem._id}</p>
              <p className="text-sm text-gray-700">
                Name: {activeItem.sender_details.name}
              </p>
              <p className="text-sm text-gray-700">
                Email: {activeItem.sender_details.work_email}
              </p>
              <Textarea
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full"
                rows={3}
              />
              <DialogFooter className="flex gap-2">
                <Button onClick={handleApprove}>Approve</Button>
                <Button variant="destructive" onClick={handleReject}>
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to reject this report?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageExpenseReports;
