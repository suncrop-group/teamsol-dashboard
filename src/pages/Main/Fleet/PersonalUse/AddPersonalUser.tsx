import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/fleet/personal-use';

// Same rule the calendar had before: no future dates, nothing older than
// five days, and not today's day of the month.
const isDateDisabled = (value: string) => {
  const date = dayjs(value).toDate();
  return (
    date > new Date() ||
    date < new Date(new Date().setDate(new Date().getDate() - 5)) ||
    date.getDate() === new Date().getDate()
  );
};

const AddPersonalUse = () => {
  const navigate = useNavigate();
  // A failed entry opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;

  const [selectedDate, setSelectedDate] = useState<Date>(
    record?.date ? dayjs(record.date.slice(0, 10)).toDate() : new Date(),
  );
  const [personalUse, setPersonalUseData] = useState({
    personalTravelKm: String(record?.personal_travel ?? ''),
    personalTravelAmount: String(record?.personal_travel_amount ?? ''),
  });
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two entries.
  const requestId = useRef(newRequestId());

  const handleSubmit = () => {
    if (
      !selectedDate ||
      !personalUse.personalTravelKm ||
      !personalUse.personalTravelAmount
    ) {
      toast.error('Please fill all the fields');
      return;
    }

    const body = {
      date: dayjs(selectedDate).format('YYYY-MM-DD'),
      km: Number(personalUse.personalTravelKm),
      amount: Number(personalUse.personalTravelAmount),
    };

    const onSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success(
        record
          ? 'Personal use record updated and queued'
          : 'Personal use record saved and queued',
      );
      navigate('/personal-use');
    };

    const onError = (error) => {
      setLoading(false);
      setButtonLoading(false);
      const message = errorMessage(error, 'Failed to add personal use record');
      setFieldError({ field: error?.field, message });
      toast.error(message);
    };

    setLoading(true);
    setButtonLoading(true);
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

  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : undefined;

  return (
    <Container size="sm" px={0}>
      <PageHeader
        title={record ? 'Edit Personal Use' : 'Add Personal Use'}
        back
      />
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <Paper withBorder shadow="sm" p="lg">
          <Stack gap="md">
            {fieldError &&
              !['date', 'km', 'amount'].includes(fieldError.field) && (
                <Alert color="red" variant="light">
                  {fieldError.message}
                </Alert>
              )}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <DatePickerInput
                label="Date"
                placeholder="Pick a date"
                valueFormat="DD-MM-YYYY"
                leftSection={<CalendarIcon size={16} />}
                value={selectedDate}
                onChange={(value) => {
                  if (value) {
                    setSelectedDate(dayjs(value).toDate());
                  }
                }}
                excludeDate={isDateDisabled}
                error={errorFor('date')}
              />
              <TextInput
                label="Personal Travel (Km)"
                type="number"
                placeholder="Enter personal travel in KM"
                value={personalUse.personalTravelKm}
                onChange={(e) =>
                  setPersonalUseData({
                    ...personalUse,
                    personalTravelKm: e.currentTarget.value,
                  })
                }
                error={errorFor('km')}
              />
              <TextInput
                label="Personal Travel Amount"
                type="number"
                placeholder="Enter personal travel amount"
                value={personalUse.personalTravelAmount}
                onChange={(e) =>
                  setPersonalUseData({
                    ...personalUse,
                    personalTravelAmount: e.currentTarget.value,
                  })
                }
                error={errorFor('amount')}
              />
            </SimpleGrid>

            <Group justify="flex-end" mt="xs">
              <Button
                onClick={handleSubmit}
                loading={buttonLoading}
                w={{ base: '100%', md: 'auto' }}
              >
                {record ? 'Save & Resend' : 'Submit'}
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default AddPersonalUse;
