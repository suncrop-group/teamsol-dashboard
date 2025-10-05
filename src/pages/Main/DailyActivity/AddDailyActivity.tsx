import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi, callServerAPI } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, CalendarIcon } from 'lucide-react';

interface ExistingActivityDate {
  date: string; // formatted as YYYY-MM-DD (passed from previous screen)
  id: string | number;
}

interface ActivityFormData {
  date: Date;
  area_visited: string;
  description: string;
  closing_meter: string;
  km_traveled: string;
  fuel_consumed: string;
  remarks: string;
}

const AddDailyActivity: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prevMeterReading, setPrevMeterReading] = useState('');
  // Dates & ids of existing activities passed from previous screen
  const location = useLocation();
  // If user came via proper navigation we get dates in location.state; otherwise empty (direct URL access)
  const initialPassedDates: ExistingActivityDate[] =
    (location.state as { dates?: ExistingActivityDate[] })?.dates || [];
  const [existingActivities, setExistingActivities] =
    useState<ExistingActivityDate[]>(initialPassedDates);
  const [existingDatesLoading, setExistingDatesLoading] = useState(false);

  const [formData, setFormData] = useState<ActivityFormData>({
    date: new Date(),
    area_visited: '',
    description: '',
    closing_meter: '',
    km_traveled: '',
    fuel_consumed: '',
    remarks: '',
  });

  const handleInputChange = (
    field: keyof ActivityFormData,
    value: string | Date
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fallback: If user directly loads this page (no passed dates), fetch recent activities to block duplicates
  useEffect(() => {
    if (initialPassedDates.length === 0 && user?.id) {
      setExistingDatesLoading(true);
      callApi(
        'GET',
        `/daily-activities/employee/${user.id}`,
        null,
        (resp) => {
          // Map to date list (assuming resp.data is an array with a 'date' field)
          interface RawActivity {
            id: string | number;
            date: string | Date;
          }
          const mapped: ExistingActivityDate[] = Array.isArray(resp.data)
            ? resp.data.map((a: RawActivity) => ({
                date: dayjs(a.date).format('YYYY-MM-DD'),
                id: a.id,
              }))
            : [];
          setExistingActivities(mapped);
          setExistingDatesLoading(false);
        },
        () => {
          setExistingDatesLoading(false);
        }
      );
    }
  }, [initialPassedDates.length, user?.id]);

  // Fetch previous meter reading from backend ONLY (duplicate validation relies on passed or fetched state)
  useEffect(() => {
    if (!user?.id || !user?.company_id) return;

    callServerAPI(
      'POST',
      '/get/last/reading',
      { data: { employee_id: user.id, company_id: user.company_id } },
      (response: { data: string }) => {
        if (response.data) {
          setPrevMeterReading(response.data);
        } else {
          setPrevMeterReading('0');
          setFormData((prev) => ({
            ...prev,
            closing_meter: '0',
            km_traveled: '0',
          }));
        }
      },
      () => {
        setPrevMeterReading('0');
        setFormData((prev) => ({
          ...prev,
          closing_meter: '0',
          km_traveled: '0',
        }));
      }
    );
  }, [user?.id, user?.company_id]);

  // Auto-calculate KM traveled when closing meter changes
  useEffect(() => {
    if (prevMeterReading && formData.closing_meter) {
      const kmTraveled = (
        parseInt(formData.closing_meter) - parseInt(prevMeterReading)
      ).toString();
      setFormData((prev) => ({
        ...prev,
        km_traveled: kmTraveled,
      }));
    }
  }, [prevMeterReading, formData.closing_meter]);

  // Validate KM traveled
  useEffect(() => {
    if (formData.km_traveled) {
      const km = parseInt(formData.km_traveled);
      if (isNaN(km)) {
        setFormData((prev) => ({
          ...prev,
          km_traveled: '0',
        }));
      } else if (km < 0) {
        setFormData((prev) => ({
          ...prev,
          km_traveled: '0',
        }));
      }
    }
  }, [formData.km_traveled]);

  const validateForm = () => {
    const requiredFields = ['area_visited', 'description', 'closing_meter'];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof ActivityFormData]
    );

    if (missingFields.length > 0) {
      toast.error('Please fill all required fields');
      return false;
    }

    if (!formData.closing_meter || isNaN(parseInt(formData.closing_meter))) {
      toast.error('Please enter a valid meter reading');
      return false;
    }

    if (parseInt(formData.closing_meter) < parseInt(prevMeterReading)) {
      toast.error('Current meter reading cannot be less than previous reading');
      return false;
    }

    if (parseInt(formData.km_traveled) < 0) {
      toast.error('KM traveled cannot be negative');
      return false;
    }

    // Validate duplicate only against passed-in list
    const selectedDateString = dayjs(formData.date).format('YYYY-MM-DD');
    if (
      existingActivities.some(
        (activity: ExistingActivityDate) => activity.date === selectedDateString
      )
    ) {
      toast.error('Daily activity already exists for this date');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const data = {
        employee_id: user?.id || 200,
        area_visited: formData.area_visited,
        description: formData.description,
        closing_meter: parseInt(formData.closing_meter) || 0,
        km_traveled: parseInt(formData.km_traveled) || 0,
        date: dayjs(formData.date).format('DD/MM/YYYY'),
        company_id: user?.company_id || 1,
      };

      // Final pre-submit duplicate guard (race condition handling)
      const selectedDateString = dayjs(formData.date).format('YYYY-MM-DD');
      if (existingActivities.some((a) => a.date === selectedDateString)) {
        toast.error('Daily activity already exists for this date');
        setLoading(false);
        return;
      }

      // First, save to server API (ODoo layer)
      callServerAPI(
        'POST',
        '/post/daily/activities',
        { data },
        (response: { data: { id: string | number } }) => {
          // Then save to local API with additional fields
          const localData = {
            ...data,
            date: formData.date,
            employee_id: user?.id || 200,
            region_id: user?.region?.id || 1,
            territory_ids:
              user?.territories?.map((t: { id: string | number }) => t.id) ||
              [],
            id: response.data.id,
            fuel_consumed: formData.fuel_consumed
              ? parseFloat(formData.fuel_consumed)
              : null,
            remarks: formData.remarks,
          };

          callApi(
            'POST',
            '/daily-activities',
            localData,
            () => {
              toast.success('Daily activity added successfully!');
              // Update local duplicate list so user cannot immediately add same date again if they stay
              setExistingActivities((prev) => [
                ...prev,
                { date: selectedDateString, id: response.data.id },
              ]);
              navigate('/daily-activities');
            },
            (error) => {
              console.error('Error saving to local API:', error);
              toast.error('Failed to save activity locally', {
                description: 'Please try again',
              });
              setLoading(false);
            }
          );
        },
        (error) => {
          console.error('Error saving to server API:', error);
          type ServerError = { message?: string } | undefined;
          const serverErr = error as ServerError;
          const msg = serverErr?.message?.toLowerCase().includes('duplicate')
            ? 'Daily activity already exists for this date'
            : 'Failed to save daily activity';
          toast.error(msg, { description: 'Please try again' });
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to save daily activity', {
        description: 'Please try again',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle>Add Daily Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dayjs(formData.date).format('DD/MM/YYYY')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('date', date);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(date) => {
                      // Disable future dates
                      if (date > new Date()) return true;

                      // Disable dates older than 5 days
                      if (
                        date <
                        new Date(new Date().setDate(new Date().getDate() - 5))
                      )
                        return true;

                      // Disable today's date
                      if (date.getDate() === new Date().getDate()) return true;

                      // Disable dates that already have activities
                      const dateString = dayjs(date).format('YYYY-MM-DD');
                      const hasExistingActivity = existingActivities.some(
                        (activity) => activity.date === dateString
                      );

                      return hasExistingActivity;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {existingDatesLoading && (
                <p className="text-xs text-black ml-2">
                  Loading existing dates…
                </p>
              )}
              <p className="text-xs text-gray-500">
                Note: You can only create one activity per date. Dates with
                existing activities are disabled.
              </p>
            </div>

            {/* Area Visited */}
            <div className="space-y-2">
              <Label htmlFor="area_visited">
                Area Visited <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area_visited"
                placeholder="Enter area visited"
                value={formData.area_visited}
                onChange={(e) =>
                  handleInputChange('area_visited', e.target.value)
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                rows={3}
              />
            </div>

            {/* Previous Meter Reading */}
            <div className="space-y-2">
              <Label htmlFor="prev_meter_reading">Previous Meter Reading</Label>
              <Input
                id="prev_meter_reading"
                type="number"
                placeholder="Previous meter reading"
                value={prevMeterReading}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Current Meter Reading */}
            <div className="space-y-2">
              <Label htmlFor="closing_meter">
                Current Meter Reading <span className="text-red-500">*</span>
              </Label>
              <Input
                id="closing_meter"
                type="number"
                placeholder="Enter current meter reading"
                value={formData.closing_meter}
                onChange={(e) =>
                  handleInputChange('closing_meter', e.target.value)
                }
              />
            </div>

            {/* KM Traveled (Auto-calculated) */}
            <div className="space-y-2">
              <Label htmlFor="km_traveled">KM Traveled</Label>
              <Input
                id="km_traveled"
                type="number"
                placeholder="Calculated automatically"
                value={formData.km_traveled}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Fuel Consumed */}
            <div className="space-y-2">
              <Label htmlFor="fuel_consumed">Fuel Consumed (Liters)</Label>
              <Input
                id="fuel_consumed"
                type="number"
                step="0.1"
                placeholder="Enter fuel consumed"
                value={formData.fuel_consumed}
                onChange={(e) =>
                  handleInputChange('fuel_consumed', e.target.value)
                }
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Additional remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Daily Activity'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddDailyActivity;
