import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Container,
  NumberInput,
  Paper,
  Stack,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/fleet/tolls';

const AddToll = () => {
  const navigate = useNavigate();
  // A failed toll opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    record ? dayjs(record.date.slice(0, 10)).toDate() : new Date(),
  );
  const [tollAmount, setTollAmount] = useState<number | string>(
    record?.toll_amount ?? '',
  );
  const [loading, setLoading] = useState(false);
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two tolls.
  const requestId = useRef(newRequestId());

  const handleSubmit = () => {
    if (!selectedDate || !tollAmount) {
      toast.error('Please fill all the fields');
      return;
    }

    const body = {
      date: dayjs(selectedDate).format('YYYY-MM-DD'),
      amount: Number(tollAmount),
    };

    const onSuccess = () => {
      setLoading(false);
      toast.success(
        record ? 'Toll updated and queued' : 'Toll saved and queued',
      );
      navigate('/toll');
    };

    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, 'Failed to save toll record');
      setFieldError({ field: error?.field, message });
      toast.error(message);
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

  // Only the four days before today can be picked; today itself cannot.
  const today = dayjs().startOf('day');
  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : undefined;

  return (
    <Container size="xs" px={0}>
      <PageHeader title={record ? 'Edit Toll' : 'Add Toll'} back />
      <Paper withBorder shadow="sm" p="lg">
        <Stack gap="md">
          {fieldError && !['date', 'amount'].includes(fieldError.field) && (
            <Alert color="red" variant="light">
              {fieldError.message}
            </Alert>
          )}
          <DatePickerInput
            label="Date"
            placeholder="Select a Date"
            valueFormat="DD-MM-YYYY"
            leftSection={<CalendarIcon size={16} />}
            value={selectedDate}
            onChange={(value) =>
              setSelectedDate(value ? dayjs(value).toDate() : null)
            }
            minDate={today.subtract(4, 'day').toDate()}
            maxDate={today.toDate()}
            excludeDate={(date) => dayjs(date).date() === today.date()}
            disabled={loading}
            error={errorFor('date')}
            withAsterisk
          />
          <NumberInput
            label="Toll Amount"
            placeholder="Enter Toll Amount"
            value={tollAmount}
            onChange={setTollAmount}
            min={0}
            hideControls
            disabled={loading}
            error={errorFor('amount')}
            withAsterisk
          />
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            {record ? 'Save & Resend' : 'Submit'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AddToll;
