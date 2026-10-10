import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import dayjs from 'dayjs';
import {
  Alert,
  Button,
  Container,
  NumberInput,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/daily-activities';

interface ExistingActivityDate {
  date: string; // formatted as YYYY-MM-DD (passed from previous screen)
  id: string | number; // the activity's _id
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
  const [loading, setLoading] = useState(false);

  const [prevMeterReading, setPrevMeterReading] = useState('');
  // Dates & ids of existing activities passed from previous screen
  const location = useLocation();
  // If user came via proper navigation we get dates in location.state; otherwise empty (direct URL access)
  // A failed activity opened from the list to be fixed and sent again.
  const record = location.state?.record;
  // The activity being edited does not block its own date.
  const withoutRecord = (list: ExistingActivityDate[]) =>
    list.filter((activity) => activity.id !== record?._id);
  const initialPassedDates: ExistingActivityDate[] =
    (location.state as { dates?: ExistingActivityDate[] })?.dates || [];
  const [existingActivities, setExistingActivities] = useState<
    ExistingActivityDate[]
  >(withoutRecord(initialPassedDates));
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two activities.
  const requestId = useRef(newRequestId());
  const [existingDatesLoading, setExistingDatesLoading] = useState(false);

  const [formData, setFormData] = useState<ActivityFormData>({
    date: record ? dayjs(record.date).toDate() : new Date(),
    area_visited: record?.area_visited ?? '',
    description: record?.description ?? '',
    closing_meter: record ? String(record.closing_meter ?? '') : '',
    km_traveled: record ? String(record.km_traveled ?? '') : '',
    fuel_consumed: '',
    remarks: '',
  });

  const handleInputChange = (
    field: keyof ActivityFormData,
    value: string | Date,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fallback: If user directly loads this page (no passed dates), fetch recent activities to block duplicates
  useEffect(() => {
    if (initialPassedDates.length === 0) {
      setExistingDatesLoading(true);
      callApi(
        'GET',
        `${RESOURCE}?limit=200`,
        null,
        (resp) => {
          interface RawActivity {
            _id: string;
            date: string | Date;
          }
          const mapped: ExistingActivityDate[] = Array.isArray(resp.data)
            ? resp.data.map((a: RawActivity) => ({
                date: dayjs(a.date).format('YYYY-MM-DD'),
                id: a._id,
              }))
            : [];
          setExistingActivities(withoutRecord(mapped));
          setExistingDatesLoading(false);
        },
        () => {
          setExistingDatesLoading(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPassedDates.length]);

  // Previous meter reading, read from Odoo by the backend.
  useEffect(() => {
    // No previous reading: start from zero. An activity being edited keeps
    // the closing meter it was saved with.
    const noReading = () => {
      setPrevMeterReading('0');
      if (record) return;
      setFormData((prev) => ({
        ...prev,
        closing_meter: '0',
        km_traveled: '0',
      }));
    };

    callApi(
      'GET',
      '/v2/lookups/last-reading',
      null,
      (response) => {
        if (response.data) {
          setPrevMeterReading(response.data);
        } else {
          noReading();
        }
      },
      noReading,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      (field) => !formData[field as keyof ActivityFormData],
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
        (activity: ExistingActivityDate) =>
          activity.date === selectedDateString,
      )
    ) {
      toast.error('Daily activity already exists for this date');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const body = {
      area_visited: formData.area_visited,
      description: formData.description,
      closing_meter: parseInt(formData.closing_meter) || 0,
      km_traveled: parseInt(formData.km_traveled) || 0,
      date: dayjs(formData.date).format('YYYY-MM-DD'),
    };

    const onSuccess = () => {
      toast.success(
        record
          ? 'Daily activity updated and queued'
          : 'Daily activity saved and queued',
      );
      navigate('/daily-activities');
    };

    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, 'Failed to save daily activity');
      setFieldError({ field: error?.field, message });
      toast.error(message, { description: 'Please try again' });
    };

    setLoading(true);
    setFieldError(null);
    if (record) {
      callApi('PUT', `${RESOURCE}/${record._id}`, body, onSuccess, onError);
    } else {
      callApi(
        'POST',
        RESOURCE,
        { ...body, clientRequestId: requestId.current },
        onSuccess,
        onError,
      );
    }
  };

  const FIELDS = ['date', 'area_visited', 'description', 'closing_meter'];
  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : undefined;

  const isDateDisabled = (date: Date) => {
    // Disable future dates
    if (date > new Date()) return true;

    // Disable dates older than 5 days
    if (date < new Date(new Date().setDate(new Date().getDate() - 5)))
      return true;

    // Disable today's date
    if (date.getDate() === new Date().getDate()) return true;

    // Disable dates that already have activities
    const dateString = dayjs(date).format('YYYY-MM-DD');
    const hasExistingActivity = existingActivities.some(
      (activity) => activity.date === dateString,
    );

    return hasExistingActivity;
  };

  return (
    <Container size="sm" px={0}>
      <PageHeader
        title={record ? 'Edit Daily Activity' : 'Add Daily Activity'}
        back
      />
      <Paper withBorder shadow="sm" p="lg">
        <Stack gap="md">
          {fieldError && !FIELDS.includes(fieldError.field) && (
            <Alert color="red" variant="light">
              {fieldError.message}
            </Alert>
          )}
          {/* Date */}
          <DatePickerInput
            label="Date"
            withAsterisk
            valueFormat="DD/MM/YYYY"
            leftSection={<CalendarIcon size={16} />}
            value={formData.date}
            onChange={(value) => {
              if (value) {
                handleInputChange('date', dayjs(value).toDate());
              }
            }}
            excludeDate={(date) => isDateDisabled(dayjs(date).toDate())}
            inputWrapperOrder={['label', 'input', 'description', 'error']}
            error={errorFor('date')}
            description={
              <>
                {existingDatesLoading && (
                  <Text span size="xs" c="var(--mantine-color-text)" display="block">
                    Loading existing dates…
                  </Text>
                )}
                Note: You can only create one activity per date. Dates with
                existing activities are disabled.
              </>
            }
          />

          {/* Area Visited */}
          <TextInput
            label="Area Visited"
            withAsterisk
            placeholder="Enter area visited"
            value={formData.area_visited}
            onChange={(e) =>
              handleInputChange('area_visited', e.currentTarget.value)
            }
            error={errorFor('area_visited')}
          />

          {/* Description */}
          <Textarea
            label="Description"
            withAsterisk
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) =>
              handleInputChange('description', e.currentTarget.value)
            }
            error={errorFor('description')}
            rows={3}
          />

          {/* Previous Meter Reading */}
          <NumberInput
            label="Previous Meter Reading"
            placeholder="Previous meter reading"
            value={prevMeterReading}
            hideControls
            readOnly
          />

          {/* Current Meter Reading */}
          <NumberInput
            label="Current Meter Reading"
            withAsterisk
            placeholder="Enter current meter reading"
            value={formData.closing_meter}
            onChange={(value) =>
              handleInputChange('closing_meter', String(value))
            }
            hideControls
            error={errorFor('closing_meter')}
          />

          {/* KM Traveled (Auto-calculated) */}
          <NumberInput
            label="KM Traveled"
            placeholder="Calculated automatically"
            value={formData.km_traveled}
            hideControls
            readOnly
          />

          {/* Remarks */}
          <Textarea
            label="Remarks"
            placeholder="Additional remarks"
            value={formData.remarks}
            onChange={(e) => handleInputChange('remarks', e.currentTarget.value)}
            rows={3}
          />

          {/* Check if activity already exists for selected date */}
          {existingActivities.some(
            (activity) =>
              activity.date === dayjs(formData.date).format('YYYY-MM-DD'),
          ) ? (
            <Alert color="yellow" variant="light">
              <Text size="sm" fw={500}>
                Daily activity already exists for this date. Please select a
                different date.
              </Text>
            </Alert>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} fullWidth>
              {loading
                ? record
                  ? 'Saving...'
                  : 'Adding...'
                : record
                  ? 'Save & Resend'
                  : 'Add Daily Activity'}
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default AddDailyActivity;
