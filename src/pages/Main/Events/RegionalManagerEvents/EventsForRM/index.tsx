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
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';

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
        className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
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

const EventsForRM = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState({ territory: false, stages: false });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toggleEventImages, setToggleEventImages] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchSalesOrders = () => {
    dispatch(resetProducts());
    const onSuccess = (response) => {
      setLoading(false);
      response.data.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
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

  const filteredEvents = events.filter(
    (item) =>
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.region?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.territory?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.event_type?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.id.toString().includes(searchQuery)
  );

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
            data: stageSection.data.filter(
              (item) =>
                item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.region?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.territory?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.event_type?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.id.toString().includes(searchQuery)
            ),
          }))
        )
      : groupedEvents
          .map((section) => ({
            title: section.title,
            data: section.data.filter(
              (item) =>
                item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item?.region?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.territory?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.event_type?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item?.id.toString().includes(searchQuery)
            ),
          }))
          .filter((item) => item.data.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
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
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Filter Events</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="territory"
                            checked={selectedFilters.includes('territory')}
                            onCheckedChange={(checked) =>
                              setSelectedFilters((prev) =>
                                checked
                                  ? [...prev, 'territory']
                                  : prev.filter((f) => f !== 'territory')
                              )
                            }
                          />
                          <Label htmlFor="territory">Group by Territory</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="stages"
                            checked={selectedFilters.includes('stages')}
                            onCheckedChange={(checked) =>
                              setSelectedFilters((prev) =>
                                checked
                                  ? [...prev, 'stages']
                                  : prev.filter((f) => f !== 'stages')
                              )
                            }
                          />
                          <Label htmlFor="stages">Group by Event Stages</Label>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {section.data.map((item, idx) => (
                        <EventsCard
                          key={`${item.id}-${idx}`}
                          item={item}
                          toggleEventImages={toggleEventImages}
                          setToggleEventImages={setToggleEventImages}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {flattenedSections.every(
                  (section) => section.data.length === 0
                ) && (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      {searchQuery
                        ? 'No events found matching your search.'
                        : 'No events found.'}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      {!searchQuery && 'Create your first event to get started.'}
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
    </div>
  );
};

export default EventsForRM;
