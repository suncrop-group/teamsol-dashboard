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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { resetProducts } from '@/redux/slices/OrderCreationSlice';
import { Loader2 } from 'lucide-react';

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

interface EventItem {
  id: number;
  name: string;
  region: { name: string };
  territory: { name: string };
  event_type: { name: string };
  event_stage: { name: string };
  crops: Array<{ name: string }>;
  demo_products: Array<{ name: string }>;
  date_begin: string;
  date_end: string;
  verified: boolean;
  rsmAttended?: boolean;
  images?: string[];
}

const EventsCard = ({
  item,
  toggleEventImages,
  setToggleEventImages,
}: {
  item: EventItem;
  toggleEventImages: number[];
  setToggleEventImages: React.Dispatch<React.SetStateAction<number[]>>;
}) => {
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
        className="w-full cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/event-details-area/${item.id}`)}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold flex-1">
              #{item?.id} - {item?.name}
            </CardTitle>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
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
              {item?.rsmAttended && (
                <span
                  className={`text-xs px-2 py-1 rounded ${statusStyles.sent}`}
                >
                  Attended
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {item?.region?.name} - {item?.territory?.name}
            </p>
            <p className="text-sm">
              <span className="font-medium">Products: </span>
              {item?.demo_products?.map((product) => product.name).join(', ')}
            </p>
            <p className="text-sm">
              <span className="font-medium">Crop: </span>
              {item?.crops?.map((crop) => crop.name).join(', ')}
            </p>
            <p className="text-sm">
              <span className="font-medium">Event Type: </span>
              {item?.event_type?.name}
            </p>
            <p className="text-sm text-gray-600">
              {item?.date_begin} - {item?.date_end} 🕒
            </p>
          </div>
        </CardContent>

        {/* Image Toggle Button */}
        {item?.images && item.images.length > 0 && (
          <CardContent className="pt-0">
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
          </CardContent>
        )}

        {/* Image Gallery */}
        {item?.images &&
          item.images.length > 0 &&
          toggleEventImages.includes(item.id) && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {item.images.map((imageUrl: string, index: number) => (
                  <div key={index} className="relative">
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
                alt="Event Image"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const AreaEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState({ territory: false, stages: false });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toggleEventImages, setToggleEventImages] = useState<number[]>([]);
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
      toast.error('Failed to fetch events', { description: 'Error' });
    };
    setLoading(true);
    callApi('GET', '/events/region', null, onSuccess, onError);
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
      : groupedEvents.map((section) => ({
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
        }));

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Search by event name, region, territory, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {flattenedSections.map((section, index) => (
            <div key={index}>
              {section.title && (
                <h2 className="text-xl font-semibold bg-gray-100 p-2 rounded mb-4">
                  {section.title}
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {flattenedSections.every((section) => section.data.length === 0) && (
            <div className="text-center text-gray-500 mt-8">
              No event found under your region.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AreaEvents;
