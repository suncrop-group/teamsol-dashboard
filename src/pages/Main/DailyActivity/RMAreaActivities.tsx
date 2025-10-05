import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Grid3X3 } from 'lucide-react';
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
      className="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
      onClick={onClick}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            {item?.employee?.name || 'Unknown Employee'}
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Sent
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <div className="flex justify-between text-sm">
          <span>
            <span className="font-medium">ID:</span> {item.id}
          </span>
          <span className="text-gray-600">
            {dayjs(item.date).format('DD/MM/YYYY')}
          </span>
        </div>
        <p className="text-sm">
          <span className="font-medium">Location:</span>{' '}
          {item?.region?.name || 'N/A'} •{' '}
          {item?.territory?.map((t) => t.name).join(', ') || 'N/A'}
        </p>
        <p className="text-sm">
          <span className="font-medium">Area:</span> {item.area_visited}
        </p>
        <div className="flex justify-between text-sm">
          <span>
            <span className="font-medium">Meter:</span> {item.closing_meter}
          </span>
          <span>
            <span className="font-medium">KM:</span> {item.km_traveled}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const RMAreaActivities: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [activities, setActivities] = useState<AreaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);

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
    const activitiesToGroup = activities;

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

  if (loading && activities.length === 0) {
    return <Loader loading={loading} />;
  }

  const groupedActivities = createGroupedActivities();

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6">
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
              <h1 className="text-2xl font-bold">Area Activities</h1>
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
        </div>

        {/* Active Grouping Summary */}
        {Object.values(groupBy).some(Boolean) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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

        {/* Activities List */}
        <div className="space-y-4">
          {groupedActivities.length > 0 ? (
            groupedActivities.map((group) => (
              <div key={group.title || 'all-activities'} className="space-y-2">
                {group.title && (
                  <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                    {group.title}
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.data.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      item={activity}
                      onClick={() => handleActivityClick(activity)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg mb-2">No activities found</p>
                <p>Try adjusting your filters or grouping</p>
              </div>
            </div>
          )}
        </div>

        {/* Loading overlay for refresh */}
        {loading && activities.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <Loader loading={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RMAreaActivities;
