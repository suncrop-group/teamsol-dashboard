import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Filter,
  ChevronLeft,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
import { Loader2 } from 'lucide-react';
import { DateFilter } from '@/components/DateFilter';
import type { DateRange } from 'react-day-picker';

const statusStyles = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  quotation: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  draft: 'bg-red-100 text-red-800',
  confirmed: 'bg-green-100 text-green-800',
  approval: 'bg-yellow-100 text-yellow-800',
  approve: 'bg-green-100 text-green-800',
  submit: 'bg-green-100 text-green-800',
  'to report': 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  refuse: 'bg-red-100 text-red-800',
  refused: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  announced: 'bg-green-100 text-green-800',
  new: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  'in progress': 'bg-yellow-100 text-yellow-800',
  'in review': 'bg-yellow-100 text-yellow-800',
  'in process': 'bg-yellow-100 text-yellow-800',
  'in preparation': 'bg-yellow-100 text-yellow-800',
  'in transit': 'bg-yellow-100 text-yellow-800',
};

const EventsCard = ({ item, toggleEventImages, setToggleEventImages }) => {
  const navigate = useNavigate();
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
      <Card
        className="w-full cursor-pointer hover:shadow-md transition-shadow md:hidden"
        onClick={() => navigate(`/event-details/${item.id}`)}
      >
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            #{item?.id} - {item?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {item?.region?.name} - {item?.territory?.name}
            </span>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  statusStyles[item?.event_stage?.name.toLowerCase()]
                }`}
              >
                {item?.event_stage?.name}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  statusStyles[item?.verified ? 'sent' : 'cancelled']
                }`}
              >
                {item?.verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Products: </span>
              <span className="text-sm">
                {item?.demo_products?.map((product) => product.name).join(', ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Crop: </span>
              <span className="text-sm">
                {item?.crops?.map((crop) => crop.name).join(', ')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Event Type: </span>
              <span className="text-sm">{item?.event_type?.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              {item?.date_begin} - {item?.date_end} 🕒
            </div>
          </div>

          {/* Image Toggle Button */}
          {item?.images && item.images.length > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImages();
                }}
                className="text-blue-500 hover:text-blue-700 p-0 h-auto"
              >
                {toggleEventImages.includes(item.id)
                  ? `Hide Image${item.images.length > 1 ? 's' : ''}`
                  : `Show Image${item.images.length > 1 ? 's' : ''}`}{' '}
                ({item.images.length})
              </Button>
            </div>
          )}

          {/* Image Gallery */}
          {item?.images &&
            item.images.length > 0 &&
            toggleEventImages.includes(item.id) && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {item.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Event image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(imageUrl);
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div
                        className="absolute  bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(imageUrl);
                        }}
                      >
                        <Eye
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          size={16}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
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
                alt="Event Image"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const EventsTableRow = ({
  item,
  toggleEventImages,
  setToggleEventImages,
  setSelectedImage,
}) => {
  const navigate = useNavigate();

  const toggleImages = (e) => {
    e.stopPropagation();
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
      <TableRow
        className="hover: transition-colors cursor-pointer"
        onClick={() => navigate(`/event-details/${item.id}`)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium">#{item?.id}</div>
              <div
                className="text-xs text-gray-500 max-w-[150px] truncate"
                title={item?.name}
              >
                {item?.name}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium">{item?.region?.name}</div>
              <div className="text-xs text-gray-500">
                {item?.territory?.name}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1 text-sm">
            {item?.demo_products?.length > 0 && (
              <div className="flex items-start gap-1">
                <span className="font-medium text-xs text-gray-500">
                  Products:
                </span>
                <span
                  className="text-xs truncate max-w-[150px]"
                  title={item?.demo_products?.map((p) => p.name).join(', ')}
                >
                  {item?.demo_products?.map((p) => p.name).join(', ')}
                </span>
              </div>
            )}
            {item?.crops?.length > 0 && (
              <div className="flex items-start gap-1">
                <span className="font-medium text-xs text-gray-500">Crop:</span>
                <span
                  className="text-xs truncate max-w-[150px]"
                  title={item?.crops?.map((c) => c.name).join(', ')}
                >
                  {item?.crops?.map((c) => c.name).join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-start gap-1">
              <span className="font-medium text-xs text-gray-500">Type:</span>
              <span className="text-xs">{item?.event_type?.name}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <div>
              <div>{item?.date_begin}</div>
              <div className="text-xs text-gray-400">to {item?.date_end}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 items-start">
            <Badge
              className={`${
                statusStyles[item?.event_stage?.name.toLowerCase()]
              } border-0 text-[10px] capitalize`}
            >
              {item?.event_stage?.name}
            </Badge>
            <Badge
              className={`${
                statusStyles[item?.verified ? 'sent' : 'cancelled']
              } border-0 text-[10px] flex items-center gap-1`}
            >
              {item?.verified ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Unverified
                </>
              )}
            </Badge>
            {item?.rsmAttended && (
              <Badge
                className={`${statusStyles.sent} border-0 text-[10px] flex items-center gap-1`}
              >
                <Users className="h-3 w-3" />
                Attended
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {item?.images && item.images.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleImages}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              {toggleEventImages.includes(item.id) ? 'Hide' : 'Show'} (
              {item.images.length})
            </Button>
          ) : (
            <span className="text-xs text-gray-400">No images</span>
          )}
        </TableCell>
      </TableRow>

      {/* Image Gallery Row (conditionally rendered) */}
      {item?.images &&
        item.images.length > 0 &&
        toggleEventImages.includes(item.id) && (
          <TableRow>
            <TableCell colSpan={6} className="p-4 border-b">
              <div className="flex flex-wrap gap-2">
                {item.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Event image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity border bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(imageUrl);
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(imageUrl);
                      }}
                    >
                      <Eye
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        size={16}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TableCell>
          </TableRow>
        )}
    </>
  );
};

const TerritoryManagerEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState({ stages: false });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toggleEventImages, setToggleEventImages] = useState<number[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchSalesOrders = () => {
    dispatch(resetProducts());
    const onSuccess = (response) => {
      setLoading(false);
      response.data.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      );
      setEvents(response.data);
    };
    const onError = () => {
      setLoading(false);
      toast.error('Failed to fetch events', {
        description: 'Error',
      });
    };
    setLoading(true);
    callApi('GET', '/events/employee', null, onSuccess, onError);
  };

  useEffect(() => {
    fetchSalesOrders();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupByStages = () => {
    const grouped = events.reduce((acc, event) => {
      const stageName = event.event_stage?.name || 'Unknown';
      if (!acc[stageName]) {
        acc[stageName] = [];
      }
      acc[stageName].push(event);
      return acc;
    }, {});

    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));
  };

  const isFilterMatch = (item) => {
    const matchesSearch =
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.region?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.territory?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.event_type?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.id.toString().includes(searchQuery);

    const matchesDate =
      !(selectedDateRange?.from && selectedDateRange?.to) ||
      (dayjs(item?.date).valueOf() >=
        dayjs(selectedDateRange.from).startOf('day').valueOf() &&
        dayjs(item?.date).valueOf() <=
          dayjs(selectedDateRange.to).endOf('day').valueOf());
    return matchesSearch && matchesDate;
  };

  const filteredEvents = events.filter(isFilterMatch);

  const groupedEvents = filterBy.stages
    ? groupByStages()
        .map((section) => ({
          ...section,
          data: section.data.filter(isFilterMatch),
        }))
        .filter((section) => section.data.length > 0)
    : filteredEvents.length > 0
      ? [{ title: '', data: filteredEvents }]
      : [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Search by event name, region, territory, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <Dialog
              open={filterModalVisible}
              onOpenChange={setFilterModalVisible}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Events</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <DateFilter
                    selectedRange={selectedDateRange}
                    onSelect={setSelectedDateRange}
                    triggerMode="input"
                    className="w-full"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="groupByStages"
                      checked={selectedFilter === 'stages'}
                      onCheckedChange={(checked) =>
                        setSelectedFilter(checked ? 'stages' : '')
                      }
                    />
                    <Label htmlFor="groupByStages">Group by Event Stages</Label>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setFilterBy({ stages: selectedFilter === 'stages' });
                    setFilterModalVisible(false);
                  }}
                >
                  Apply Filter
                </Button>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={() => navigate('/add-event')} disabled={loading}>
            Add Event
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((section, index) => (
            <div key={index}>
              {section.title && (
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
              )}
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">ID / Name</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Details</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Images</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.data.map((item, idx) => (
                      <EventsTableRow
                        key={`desktop-${item.id}-${idx}`}
                        item={item}
                        toggleEventImages={toggleEventImages}
                        setToggleEventImages={setToggleEventImages}
                        setSelectedImage={setSelectedImage}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 md:hidden gap-4 mt-4 md:mt-0">
                {section.data.map((item, idx) => (
                  <EventsCard
                    key={`mobile-${item.id}-${idx}`}
                    item={item}
                    toggleEventImages={toggleEventImages}
                    setToggleEventImages={setToggleEventImages}
                  />
                ))}
              </div>
            </div>
          ))}
          {groupedEvents.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              No events found.
              <Button
                onClick={() => navigate('/add-event')}
                className="mt-4 block mx-auto"
              >
                Add Event
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Image Modal for Desktop Table */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Event Image"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TerritoryManagerEvents;
