import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Wrench,
  X,
  Image as ImageIcon,
  Car,
  FileText,
} from 'lucide-react';
import { callApi, callServerAPI } from '@/api';
import { priceFormatter } from '@/utils';
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

const statusStyles = {
  sent: 'bg-green-100 text-green-800 hover:bg-green-200',
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  canceled: 'bg-red-100 text-red-800 hover:bg-red-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
  quotation: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  draft: 'bg-red-100 text-red-800 hover:bg-red-200',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-200',
  submitted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  approval: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  submit: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'to report': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  done: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
  success: 'bg-green-100 text-green-800 hover:bg-green-200',
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

// Mobile Card Component
const MaintenanceCard = ({
  item,
  onDeleteMaintenance,
  onViewImage,
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
  onDeleteMaintenance: (id: number) => void;
  onViewImage: (url: string) => void;
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header with Vehicle and Cost */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-base">
                {item.vehicle.name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {item.vehicle.license_plate}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500">PKR</span>
              <span className="font-medium text-green-600">
                {priceFormatter(item.cost)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge
              className={`${
                statusStyles[item.status?.toLowerCase()]
              } border-0 text-xs capitalize`}
            >
              {item.status || 'N/A'}
            </Badge>
            <Badge
              className={`${
                statusStyles[item.odooStatus?.toLowerCase()]
              } border-0 text-xs capitalize`}
            >
              {item.odooStatus || 'N/A'}
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
            <span>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        </div>

        {/* Description */}
        {item.name && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 line-clamp-2">{item.name}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {item.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewImage(item.url)}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteMaintenance(item.id)}
            disabled={item.odooStatus?.toLowerCase() !== 'done'}
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
const MaintenanceRow = ({
  item,
  onDeleteMaintenance,
  onViewImage,
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
  onDeleteMaintenance: (id: number) => void;
  onViewImage: (url: string) => void;
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
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium">{item.vehicle.name}</div>
            <div className="text-xs text-gray-500">
              {item.vehicle.license_plate}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">PKR</span>
          <span className="font-semibold text-green-600">
            {priceFormatter(item.cost)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <Wrench className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-2">
            {item.name || 'No description'}
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
          <Badge
            className={`${
              statusStyles[item.status?.toLowerCase()]
            } border-0 w-fit capitalize`}
          >
            {item.status || 'N/A'}
          </Badge>
          <Badge
            className={`${
              statusStyles[item.odooStatus?.toLowerCase()]
            } border-0 w-fit capitalize`}
          >
            {item.odooStatus || 'N/A'}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {item.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewImage(item.url)}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteMaintenance(item.id)}
            disabled={item.odooStatus?.toLowerCase() !== 'done'}
          >
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const Maintenance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toDeleteId, setToDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      toast.error('Failed to fetch maintenance records');
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
    if (toDeleteId === null) return;
    const findRecord = serviceData.find((item) => item.id === toDeleteId);

    if (!findRecord) {
      toast.error('Maintenance record not found');
      return;
    }

    const data: {
      fleet_id: number;
      company_id: number;
      service_type_id: number;
    } = {
      fleet_id: toDeleteId,
      company_id: findRecord.company_id,
      service_type_id: findRecord.service_type_id,
    };

    const onSuccess = () => {
      callApi(
        'PATCH',
        '/fleet/service/cancel',
        {
          id: toDeleteId,
          service_type_id: findRecord.service_type_id,
          company_id: findRecord.company_id,
        },
        () => {
          toast.success('Maintenance record cancelled successfully');
          fetchServiceData();
          setDeleteDialogOpen(false);
          setToDeleteId(null);
          setLoadingDelete(false);
        },
        () => {
          toast.error('Failed to cancel maintenance record. Please try again.');
          setLoadingDelete(false);
        }
      );
    };

    const onError = (error) => {
      setDeleteDialogOpen(false);
      setToDeleteId(null);
      setLoadingDelete(false);
      toast.error(
        error?.message || 'Failed to cancel maintenance record. Please try again.'
      );
    };

    setLoadingDelete(true);
    callServerAPI('POST', '/delete/fleet', { data }, onSuccess, onError);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold">
                Maintenance Records
              </CardTitle>
              <Button onClick={() => navigate('/add-maintenance')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Maintenance
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, vehicle, or cost..."
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
            ) : filteredServiceData.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? 'No maintenance records found matching your search.'
                    : 'No maintenance records found.'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {!searchQuery && 'Add your first maintenance record to get started.'}
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
                        <TableHead className="font-semibold">Vehicle</TableHead>
                        <TableHead className="font-semibold">Cost</TableHead>
                        <TableHead className="font-semibold">Service</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServiceData.map((item) => (
                        <MaintenanceRow
                          key={item.id}
                          item={item}
                          onDeleteMaintenance={(id) => {
                            setToDeleteId(id);
                            setDeleteDialogOpen(true);
                          }}
                          onViewImage={setSelectedImage}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredServiceData.map((item) => (
                    <MaintenanceCard
                      key={item.id}
                      item={item}
                      onDeleteMaintenance={(id) => {
                        setToDeleteId(id);
                        setDeleteDialogOpen(true);
                      }}
                      onViewImage={setSelectedImage}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Maintenance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel maintenance record #{toDeleteId}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setToDeleteId(null);
              }}
              disabled={loadingDelete}
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={loadingDelete}
            >
              {loadingDelete ? (
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

      {/* Image View Dialog */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Maintenance receipt"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                onError={() => {
                  toast.error('Failed to load image');
                  setSelectedImage(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Maintenance;
