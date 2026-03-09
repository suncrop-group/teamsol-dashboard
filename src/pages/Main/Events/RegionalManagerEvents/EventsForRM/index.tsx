import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Filter,
  ChevronLeft,
  Loader2,
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Hash,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
import { DateFilter } from '@/components/DateFilter';
import type { DateRange } from 'react-day-picker';

const statusStyles = {
  sent: 'bg-green-100 text-green-800 hover:bg-green-200',
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  canceled: 'bg-red-100 text-red-800 hover:bg-red-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
  quotation: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  draft: 'bg-red-100 text-red-800 hover:bg-red-200',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-200',
  approval: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  approve: 'bg-green-100 text-green-800 hover:bg-green-200',
  submit: 'bg-green-100 text-green-800 hover:bg-green-200',
  'to report': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  submitted: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  done: 'bg-green-100 text-green-800 hover:bg-green-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
  refuse: 'bg-red-100 text-red-800 hover:bg-red-200',
  refused: 'bg-red-100 text-red-800 hover:bg-red-200',
  announced: 'bg-green-100 text-green-800 hover:bg-green-200',
  new: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  completed: 'bg-green-100 text-green-800 hover:bg-green-200',
  closed: 'bg-red-100 text-red-800 hover:bg-red-200',
  'in progress': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'in review': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'in process': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'in preparation': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'in transit': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
};

const EventsCard = ({ item, toggleEventImages, setToggleEventImages }) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);

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
        className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500 md:hidden"
        onClick={() => navigate(`/event-details-rm/${item.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <CardTitle className="text-base font-semibold flex-1">
              #{item?.id} - {item?.name}
            </CardTitle>
            <div className="flex flex-col gap-1.5 items-end">
              <Badge
                className={`${
                  statusStyles[item?.event_stage?.name.toLowerCase()]
                } border-0 text-xs capitalize`}
              >
                {item?.event_stage?.name}
              </Badge>
              <Badge
                className={`${
                  statusStyles[item?.verified ? 'sent' : 'cancelled']
                } border-0 text-xs flex items-center gap-1`}
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
                  className={`${statusStyles.sent} border-0 text-xs flex items-center gap-1`}
                >
                  <Users className="h-3 w-3" />
                  Attended
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>
              {item?.region?.name} - {item?.territory?.name}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {item?.date_begin} - {item?.date_end}
            </span>
          </div>

          {/* Products */}
          {item?.demo_products?.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Products: </span>
              <span className="text-gray-600">
                {item?.demo_products?.map((product) => product.name).join(', ')}
              </span>
            </div>
          )}

          {/* Crops */}
          {item?.crops?.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Crop: </span>
              <span className="text-gray-600">
                {item?.crops?.map((crop) => crop.name).join(', ')}
              </span>
            </div>
          )}

          {/* Dealers */}
          {item?.dealers?.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Dealers: </span>
              <span className="text-gray-600">
                {item?.dealers?.map((dealer) => dealer.name).join(', ')}
              </span>
            </div>
          )}

          {/* Event Type */}
          <div className="text-sm">
            <span className="font-medium text-gray-700">Event Type: </span>
            <span className="text-gray-600">{item?.event_type?.name}</span>
          </div>

          {/* Image Toggle Button */}
          {item?.images && item.images.length > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImages();
                }}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                {toggleEventImages.includes(item.id)
                  ? `Hide Image${item.images.length > 1 ? 's' : ''}`
                  : `Show Image${item.images.length > 1 ? 's' : ''}`}{' '}
                ({item.images.length})
              </Button>
            </div>
          )}

          {/* Event Image Gallery */}
          {item?.images &&
            item.images.length > 0 &&
            toggleEventImages.includes(item.id) && (
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {item.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(imageUrl);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Event image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
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
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Event Image"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
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
        onClick={() => navigate(`/event-details-rm/${item.id}`)}
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

const EventsForRM = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState({ territory: false, stages: false });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [toggleEventImages, setToggleEventImages] = useState([]);
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
      toast.error('Failed to fetch events');
    };
    setLoading(true);
    callApi('GET', '/events/employee', null, onSuccess, onError);
  };

  useEffect(() => {
    fetchSalesOrders();
    // eslint-disable-next-line
  }, []);

  const groupByTerritory = () => {
    const grouped = events.reduce((acc, event) => {
      const territoryName = event.territory?.name || 'Unknown';
      if (!acc[territoryName]) acc[territoryName] = [];
      acc[territoryName].push(event);
      return acc;
    }, {});
    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));
  };

  const groupByStages = () => {
    const grouped = events.reduce((acc, event) => {
      const stageName = event.event_stage?.name || 'Unknown';
      if (!acc[stageName]) acc[stageName] = [];
      acc[stageName].push(event);
      return acc;
    }, {});
    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    }));
  };

  const groupByTerritoryAndStages = () => {
    const groupedByTerritory = events.reduce((acc, event) => {
      const territoryName = event.territory?.name || 'Unknown';
      if (!acc[territoryName]) acc[territoryName] = [];
      acc[territoryName].push(event);
      return acc;
    }, {});
    return Object.keys(groupedByTerritory).map((territory) => {
      const eventsInTerritory = groupedByTerritory[territory];
      const groupedByStage = eventsInTerritory.reduce((acc, event) => {
        const stageName = event.event_stage?.name || 'Unknown';
        if (!acc[stageName]) acc[stageName] = [];
        acc[stageName].push(event);
        return acc;
      }, {});
      const stageSections = Object.keys(groupedByStage).map((stage) => ({
        title: stage,
        data: groupedByStage[stage],
      }));
      return { title: territory, data: stageSections };
    });
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
      (dayjs(item.date_begin).isAfter(
        dayjs(selectedDateRange.from).subtract(1, 'day'),
      ) &&
        dayjs(item.date_begin).isBefore(
          dayjs(selectedDateRange.to).add(1, 'day'),
        ));

    return matchesSearch && matchesDate;
  };

  const filteredEvents = events.filter(isFilterMatch);

  let groupedEvents = [];
  if (filterBy.territory && filterBy.stages) {
    groupedEvents = groupByTerritoryAndStages();
  } else if (filterBy.territory) {
    groupedEvents = groupByTerritory();
  } else if (filterBy.stages) {
    groupedEvents = groupByStages();
  } else {
    groupedEvents =
      filteredEvents.length > 0 ? [{ title: '', data: filteredEvents }] : [];
  }

  const flattenedSections =
    filterBy.territory && filterBy.stages
      ? groupedEvents.flatMap((territorySection) =>
          territorySection.data.map((stageSection) => ({
            title: `${territorySection.title} - ${stageSection.title}`,
            data: stageSection.data.filter(isFilterMatch),
          })),
        )
      : groupedEvents
          .map((section) => ({
            title: section.title,
            data: section.data.filter(isFilterMatch),
          }))
          .filter((item) => item.data.length > 0);

  return (
    <div className="min-h-screen  p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl font-bold flex-1">
                  Regional Manager Events
                </CardTitle>
                {events.length > 0 && (
                  <Button onClick={() => navigate('/add-rm-event')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by event name, region, territory, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="territory"
                              checked={selectedFilters.includes('territory')}
                              onCheckedChange={(checked) =>
                                setSelectedFilters((prev) =>
                                  checked
                                    ? [...prev, 'territory']
                                    : prev.filter((f) => f !== 'territory'),
                                )
                              }
                            />
                            <Label htmlFor="territory">
                              Group by Territory
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="stages"
                              checked={selectedFilters.includes('stages')}
                              onCheckedChange={(checked) =>
                                setSelectedFilters((prev) =>
                                  checked
                                    ? [...prev, 'stages']
                                    : prev.filter((f) => f !== 'stages'),
                                )
                              }
                            />
                            <Label htmlFor="stages">
                              Group by Event Stages
                            </Label>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setFilterBy({
                              territory: selectedFilters.includes('territory'),
                              stages: selectedFilters.includes('stages'),
                            });
                            setFilterModalVisible(false);
                          }}
                        >
                          Apply Filter
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {flattenedSections.map((section, index) => (
                  <div key={index}>
                    {section.title && (
                      <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                        {section.title}
                      </h2>
                    )}
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">
                              ID / Name
                            </TableHead>
                            <TableHead className="font-semibold">
                              Location
                            </TableHead>
                            <TableHead className="font-semibold">
                              Details
                            </TableHead>
                            <TableHead className="font-semibold">
                              Date
                            </TableHead>
                            <TableHead className="font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold">
                              Images
                            </TableHead>
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
                {flattenedSections.every(
                  (section) => section.data.length === 0,
                ) && (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      {searchQuery
                        ? 'No events found matching your search.'
                        : 'No events found.'}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      {!searchQuery &&
                        'Create your first event to get started.'}
                    </p>
                    <Button onClick={() => navigate('/add-rm-event')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shared Image Modal for Desktop Table */}
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
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventsForRM;
