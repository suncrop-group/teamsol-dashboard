import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  ArrowLeft,
  Grid3X3,
  Search,
  Calendar,
  MapPin,
  User,
  Hash,
  Gauge,
  Navigation,
  FileText,
} from 'lucide-react';
import Loader from '@/components/Loader';

interface AreaActivity {
  id: number;
  date: string;
  area_visited: string;
  employee: {
    name: string;
  };
  region: {
    name: string;
  };
  territory: Array<{
    name: string;
  }>;
  closing_meter: number;
  km_traveled: number;
}

// Removed FilterOptions interface - only using grouping

interface GroupingOptions {
  territories: boolean;
  date: boolean;
  employees: boolean;
}

interface GroupedActivity {
  title: string;
  data: AreaActivity[];
}

const ActivityCard: React.FC<{ item: AreaActivity; onClick: () => void }> = ({
  item,
  onClick,
}) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with Employee Name and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              {item?.employee?.name || 'Unknown Employee'}
            </h3>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Sent
          </Badge>
        </div>

        {/* ID and Date */}
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>#{item.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{dayjs(item.date).format('DD/MM/YYYY')}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            {item?.region?.name || 'N/A'} •{' '}
            {item?.territory?.map((t) => t.name).join(', ') || 'N/A'}
          </span>
        </div>

        {/* Area */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>Area: {item.area_visited}</span>
        </div>

        {/* Meter and KM */}
        <div className="flex justify-between text-sm pt-2 border-t mt-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Gauge className="h-4 w-4" />
            <span>Meter: {item.closing_meter}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Navigation className="h-4 w-4" />
            <span>KM: {item.km_traveled}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityRow: React.FC<{ item: AreaActivity; onClick: () => void }> = ({
  item,
  onClick,
}) => {
  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <span className="font-medium">#{item.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            {item?.employee?.name || 'Unknown'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{dayjs(item.date).format('DD/MM/YYYY')}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>
            {item?.region?.name} -{' '}
            {item?.territory?.map((t) => t.name).join(', ')}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-gray-600">{item.area_visited}</div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Gauge className="h-3 w-3" />
            {item.closing_meter}
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-3 w-3" />
            {item.km_traveled} km
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Sent
        </Badge>
      </TableCell>
    </TableRow>
  );
};

const RMAreaActivities: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [activities, setActivities] = useState<AreaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);

  const [search, setSearch] = useState('');
  const [filteredActivities, setFilteredActivities] = useState<AreaActivity[]>(
    []
  );

  const [groupBy, setGroupBy] = useState<GroupingOptions>({
    territories: false,
    date: false,
    employees: false,
  });

  const [tempGroupBy, setTempGroupBy] = useState<GroupingOptions>({
    territories: false,
    date: false,
    employees: false,
  });

  // Fetch area activities for Regional Manager
  const fetchAreaActivities = () => {
    setLoading(true);
    const onSuccess = (response) => {
      setLoading(false);
      response.data.sort((a, b) => {
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      });
      setActivities(response.data);
    };
    callApi(
      'GET',
      `/daily-activities/region/${user?.region_id || 200}`,
      null,
      onSuccess,
      (error) => {
        console.error('Error fetching area activities:', error);
        toast.error('Failed to fetch area activities', {
          description: 'Please try again',
        });
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchAreaActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter activities based on search
  useEffect(() => {
    if (search === '') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter(
          (item) =>
            item.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.region?.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.territory?.some((t) =>
              t.name.toLowerCase().includes(search.toLowerCase())
            )
        )
      );
    }
  }, [search, activities]);

  // Sync temp grouping state when modal opens
  useEffect(() => {
    if (showGrouping) {
      setTempGroupBy(groupBy);
    }
  }, [showGrouping, groupBy]);

  // Create section title for multiple grouping criteria
  const createSectionTitle = (activity: AreaActivity) => {
    const parts = [];

    if (groupBy.employees) {
      parts.push(`${activity?.employee?.name || 'Unknown Employee'}`);
    }

    if (groupBy.territories) {
      const territoryNames =
        activity.territory?.map((t) => t.name).join(', ') ||
        'Unknown Territory';
      parts.push(`${territoryNames}`);
    }

    if (groupBy.date) {
      parts.push(`${dayjs(activity.date).format('DD-MM-YYYY')}`);
    }

    return parts.join(' - ');
  };

  // Create grouping based on selected filters
  const createGroupedActivities = (): GroupedActivity[] => {
    const activitiesToGroup = filteredActivities;

    // If multiple filters are selected, group by the combination
    if (Object.values(groupBy).some(Boolean)) {
      const grouped = activitiesToGroup.reduce(
        (acc: Record<string, AreaActivity[]>, activity: AreaActivity) => {
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

  // Handle grouping toggle for temporary state
  const toggleTempGrouping = (
    filterType: 'territories' | 'date' | 'employees'
  ) => {
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

  const handleActivityClick = (activity: AreaActivity) => {
    // Navigate to activity details
    console.log('Activity clicked:', activity);
  };

  const groupedActivities = createGroupedActivities();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-2xl font-bold">
                  Area Activities
                </CardTitle>
              </div>
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
                        <DialogTitle>Group Area Activities</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600 text-center">
                          Select multiple grouping options
                        </p>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="group-by-territories"
                            checked={tempGroupBy.territories}
                            onCheckedChange={() =>
                              toggleTempGrouping('territories')
                            }
                          />
                          <label
                            htmlFor="group-by-territories"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Group by Territories
                          </label>
                        </div>
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
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="group-by-employees"
                            checked={tempGroupBy.employees}
                            onCheckedChange={() =>
                              toggleTempGrouping('employees')
                            }
                          />
                          <label
                            htmlFor="group-by-employees"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Group by Employees
                          </label>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button onClick={applyGrouping} className="flex-1">
                            Apply Grouping
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setTempGroupBy({
                                territories: false,
                                date: false,
                                employees: false,
                              });
                              setGroupBy({
                                territories: false,
                                date: false,
                                employees: false,
                              });
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee, region, or territory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Active Grouping Summary */}
            {Object.values(groupBy).some(Boolean) && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-wrap items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">Active:</span>
                  {groupBy.territories && (
                    <Badge variant="secondary">Grouped by Territories</Badge>
                  )}
                  {groupBy.date && (
                    <Badge variant="secondary">Grouped by Date</Badge>
                  )}
                  {groupBy.employees && (
                    <Badge variant="secondary">Grouped by Employees</Badge>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader loading={true} className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {search
                    ? 'No activities found matching your search.'
                    : 'No activities found.'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters or grouping.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedActivities.map((group) => (
                  <div
                    key={group.title || 'all-activities'}
                    className="space-y-4"
                  >
                    {group.title && (
                      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                        {group.title}
                      </h2>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">
                              Employee
                            </TableHead>
                            <TableHead className="font-semibold">
                              Date
                            </TableHead>
                            <TableHead className="font-semibold">
                              Location
                            </TableHead>
                            <TableHead className="font-semibold">
                              Area
                            </TableHead>
                            <TableHead className="font-semibold">
                              Meter/KM
                            </TableHead>
                            <TableHead className="font-semibold">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.data.map((activity) => (
                            <ActivityRow
                              key={activity.id}
                              item={activity}
                              onClick={() => handleActivityClick(activity)}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {group.data.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          item={activity}
                          onClick={() => handleActivityClick(activity)}
                        />
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

export default RMAreaActivities;
