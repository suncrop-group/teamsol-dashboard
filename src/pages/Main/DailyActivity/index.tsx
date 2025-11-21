import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { callApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  Plus,
  Calendar,
  Hash,
  MapPin,
  Gauge,
  Route,
  Grid3X3,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';

interface Activity {
  id: number;
  date: string;
  area_visited: string;
  closing_meter: number;
  km_traveled: number;
  status?: string;
  region_details?: {
    name: string;
  };
}

interface GroupingOptions {
  regions: boolean;
  date: boolean;
}

interface GroupedActivity {
  title: string;
  data: Activity[];
}

// Mobile Card Component
const ActivityCard = ({ item }: { item: Activity }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header with ID and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base">Activity #{item.id}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {dayjs(item.date).format('DD/MM/YYYY')} - {dayjs(item.date).format('dddd')}
              </span>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 capitalize">
            Sent
          </Badge>
        </div>

        {/* Area Visited */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium text-gray-700">Area:</span>
            <p className="text-gray-600">{item.area_visited}</p>
          </div>
        </div>

        {/* Meter and KM */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Meter</p>
              <p className="font-semibold text-gray-900">{item.closing_meter}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">KM Traveled</p>
              <p className="font-semibold text-gray-900">{item.km_traveled}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Desktop Table Row Component
const ActivityRow = ({ item }: { item: Activity }) => {
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <span className="font-medium">#{item.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <div>
            <div>{dayjs(item.date).format('DD/MM/YYYY')}</div>
            <div className="text-xs text-gray-400">
              {dayjs(item.date).format('dddd')}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{item.area_visited}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{item.closing_meter}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-green-600" />
          <span className="font-medium">{item.km_traveled}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 w-fit capitalize">
          Sent
        </Badge>
      </TableCell>
    </TableRow>
  );
};

const DailyActivity: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGrouping, setShowGrouping] = useState(false);
  const user = useSelector(selectUser);

  const [groupBy, setGroupBy] = useState<GroupingOptions>({
    regions: false,
    date: false,
  });

  const [tempGroupBy, setTempGroupBy] = useState<GroupingOptions>({
    regions: false,
    date: false,
  });

  const fetchDailyActivities = () => {
    const onSuccess = (response) => {
      setLoading(false);
      response.data.sort((a, b) => {
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      });
      setActivities(response.data);
    };

    const onError = () => {
      setLoading(false);
      toast.error('Failed to fetch daily activities');
    };

    setLoading(true);
    callApi(
      'GET',
      `/daily-activities/employee/${user?.id || 200}`,
      null,
      onSuccess,
      onError
    );
  };

  useEffect(() => {
    fetchDailyActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize filtered activities when activities change
  useEffect(() => {
    setFilteredActivities(activities);
  }, [activities]);

  const handleAddActivity = () => {
    navigate('/add-daily-activity', {
      state: {
        dates: activities.map((activity) => ({
          date: dayjs(activity.date).format('YYYY-MM-DD'),
          id: activity.id,
        })),
      },
      replace: true,
    });
  };

  // Filter activities based on search
  const searchFilteredActivities = filteredActivities.filter((item) =>
    `${item?.id} ${item?.area_visited} ${item?.closing_meter} ${item?.km_traveled}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Create section title for multiple grouping criteria
  const createSectionTitle = (activity: Activity) => {
    const parts = [];

    if (groupBy.regions) {
      parts.push(`${activity.region_details?.name || 'Unknown Region'}`);
    }

    if (groupBy.date) {
      parts.push(`${dayjs(activity.date).format('DD-MM-YYYY')}`);
    }

    return parts.join(' - ');
  };

  // Create grouping based on selected filters
  const createGroupedActivities = (): GroupedActivity[] => {
    const activitiesToGroup = searchFilteredActivities;

    // If multiple filters are selected, group by the combination
    if (Object.values(groupBy).some(Boolean)) {
      const grouped = activitiesToGroup.reduce(
        (acc: Record<string, Activity[]>, activity: Activity) => {
          const sectionTitle = createSectionTitle(activity);
          if (!acc[sectionTitle]) {
            acc[sectionTitle] = [];
          }
          acc[sectionTitle].push(activity);
          return acc;
        },
        {}
      );

      return Object.keys(grouped).map((key) => ({
        title: key,
        data: grouped[key],
      }));
    } else {
      return activitiesToGroup?.length > 0
        ? [{ title: '', data: activitiesToGroup }]
        : [];
    }
  };

  // Sync temp grouping state when modal opens
  useEffect(() => {
    if (showGrouping) {
      setTempGroupBy(groupBy);
    }
  }, [showGrouping, groupBy]);

  // Handle grouping toggle for temporary state
  const toggleTempGrouping = (filterType: 'regions' | 'date') => {
    setTempGroupBy((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  // Apply grouping when button is pressed
  const applyGrouping = () => {
    setGroupBy(tempGroupBy);
    setShowGrouping(false);
  };

  const groupedActivities = createGroupedActivities();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold">Daily Activities</CardTitle>
              <div className="flex items-center gap-2">
                {activities.length > 0 && (
                  <Dialog open={showGrouping} onOpenChange={setShowGrouping}>
                    <DialogTrigger asChild>
                      <Button
                        variant={
                          Object.values(groupBy).some(Boolean)
                            ? 'default'
                            : 'outline'
                        }
                        size="icon"
                        className={
                          Object.values(groupBy).some(Boolean)
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : ''
                        }
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Group Daily Activities</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="group-by-date"
                            checked={tempGroupBy.date}
                            onCheckedChange={() => toggleTempGrouping('date')}
                          />
                          <label
                            htmlFor="group-by-date"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Group by Date
                          </label>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button onClick={applyGrouping} className="flex-1">
                            Apply Grouping
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setTempGroupBy({ regions: false, date: false });
                              setGroupBy({ regions: false, date: false });
                              setShowGrouping(false);
                            }}
                            className="flex-1"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button onClick={handleAddActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, area, meter, or km..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Active Filters & Grouping Summary */}
            {Object.values(groupBy).some(Boolean) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-wrap items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">Active:</span>
                  {groupBy.date && (
                    <Badge variant="secondary">Grouped by Date</Badge>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : groupedActivities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? 'No activities found matching your search.'
                    : 'No activities found.'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {!searchQuery && 'Add your first activity to get started.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedActivities.map((group) => (
                  <div key={group.title || 'all-activities'} className="space-y-4">
                    {group.title && (
                      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                        {group.title}
                      </h2>
                    )}
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Area Visited</TableHead>
                            <TableHead className="font-semibold">Closing Meter</TableHead>
                            <TableHead className="font-semibold">KM Traveled</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.data.map((item) => (
                            <ActivityRow key={item.id} item={item} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {group.data.map((item) => (
                        <ActivityCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyActivity;
