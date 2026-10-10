import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Alert,
  Button,
  Container,
  FileInput,
  Group,
  Loader,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { selectUser } from '@/redux/slices/AuthSlice';
import { uploadToCloudinary } from '@/utils';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/fleet/services';

// Fields with their own input; any other error is shown in an alert.
const FORM_FIELDS = [
  'date',
  'odometer_value',
  'cost',
  'liters',
  'payment_method',
  'url',
];

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

const AddFuel = () => {
  const navigate = useNavigate();
  // A failed fuel record opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;
  const { vehicle, user } = useSelector(selectUser);
  const [lastReading, setLastReading] = useState('');
  const [currentReading, setCurrentReading] = useState(
    String(record?.odometer_value ?? ''),
  );
  const [fuelAmount, setFuelAmount] = useState(String(record?.cost ?? ''));
  const [fuelLitres, setFuelLitres] = useState(String(record?.liters ?? ''));
  const [date, setDate] = useState<Date>(
    record?.date ? dayjs(record.date.slice(0, 10)).toDate() : new Date(),
  );
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(
    record?.payment_method === 'paid_by_cash'
      ? 'cash'
      : record?.payment_method === 'paid_by_mobility_card'
        ? 'card'
        : '',
  );
  // Receipt already uploaded for the record being edited.
  const existingUrl: string = record?.url || '';
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two records.
  const requestId = useRef(newRequestId());
  const [serviceType, setServiceType] = useState<{
    id: string;
    name: string;
    category: string;
    is_attachment?: boolean;
  } | null>(null);
  const [file, setFile] = useState(null);
  const [attachmentAllowed, setAttachmentAllowed] = useState(false);

  const getPreviousReading = async () => {
    const onSuccess = (response: {
      data: {
        expense: Array<{
          odometer: string;
        }>;
      };
    }) => {
      setLoading(false);
      setLastReading(response.data.expense[0].odometer.toString());
    };
    const onError = () => {
      setLoading(false);
      toast.error('Failed to fetch previous reading');
    };

    setLoading(true);
    callApi(
      'GET',
      `/v2/lookups/previous-odometer?service_type_id=${Number(serviceType.id)}&vehicle_id=${Number(vehicle?.vehicle_id)}`,
      null,
      onSuccess,
      onError,
    );
  };

  useEffect(() => {
    if (serviceType?.id && vehicle?.vehicle_id) {
      getPreviousReading();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, vehicle?.vehicle_id]);

  useEffect(() => {
    if (serviceType?.is_attachment) {
      setAttachmentAllowed(true);
    } else {
      setAttachmentAllowed(false);
      setFile(null);
    }
  }, [serviceType]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      const onSuccess = (response: {
        data: Array<{
          id: string;
          name: string;
          category: string;
          is_attachment?: boolean;
        }>;
      }) => {
        const fuelService = response.data.find(
          (item: {
            category: string;
            id: string;
            name: string;
            is_attachment?: boolean;
          }) => item.category === 'fuel',
        );
        setServiceType(fuelService);
        setLoading(false);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch service types');
      };

      setLoading(true);
      callApi('GET', '/fleet/service-types', null, onSuccess, onError);
    };

    fetchServiceTypes();
  }, []);

  const handleFileChange = (selectedFile: File | null) => {
    if (
      selectedFile &&
      (selectedFile.type.startsWith('image/') ||
        selectedFile.type === 'application/pdf')
    ) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    } else {
      toast.error('Please select a valid image or PDF file');
      setFile(null);
    }
  };

  const handleAddFuel = async () => {
    // Validation
    if (
      !lastReading ||
      !currentReading ||
      !fuelAmount ||
      !fuelLitres ||
      !date ||
      !serviceType ||
      !vehicle
    ) {
      toast.error('Please fill all the fields and select a payment method');
      return;
    }

    if (!file && !existingUrl && attachmentAllowed) {
      toast.error('Please upload a receipt image');
      return;
    }

    if (Number(currentReading) < Number(lastReading)) {
      toast.error('Current reading should be greater than last reading');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select payment method');
      return;
    }

    // Show loader immediately
    setLoading(true);
    setButtonLoading(true);

    let uploadImage = '';

    if (file && attachmentAllowed) {
      try {
        uploadImage = await uploadToCloudinary(
          file,
          `fuel-${user.name}/${dayjs().format('MMMM-YYYY')}`,
          `fuel-${user.name}-${dayjs().format('DD-MM-YYYY')}-${dayjs().format('HH-mm-ss')}`,
        );
      } catch {
        setLoading(false);
        setButtonLoading(false);
        toast.error('Failed to upload image');
        return;
      }
    }

    const body = {
      category: 'fuel',
      name: serviceType.name,
      service_type_id: Number(serviceType.id),
      date: dayjs(date).format('YYYY-MM-DD'),
      cost: Number(fuelAmount),
      liters: Number(fuelLitres),
      odometer_value: Number(currentReading),
      payment_method:
        paymentMethod === 'cash' ? 'paid_by_cash' : 'paid_by_mobility_card',
      url: uploadImage || existingUrl,
    };

    const onSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success(
        record
          ? 'Fuel record updated and queued'
          : 'Fuel record saved and queued',
      );
      navigate('/fuel');
    };

    const onError = (error) => {
      setLoading(false);
      setButtonLoading(false);
      const message = errorMessage(error, 'Failed to add fuel');
      setFieldError({ field: error?.field, message });
      toast.error(message);
    };

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
      <PageHeader title={record ? 'Edit Fuel' : 'Add Fuel'} back />
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <Paper withBorder shadow="sm" p="lg">
          <Stack gap="md">
            {fieldError && !FORM_FIELDS.includes(fieldError.field) && (
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
                value={date}
                onChange={(value) => {
                  if (value) {
                    setDate(dayjs(value).toDate());
                  }
                }}
                excludeDate={isDateDisabled}
                error={errorFor('date')}
              />
              <TextInput
                label="Last Reading"
                placeholder="Last reading"
                value={lastReading}
                disabled
              />
              <TextInput
                label="Current Reading"
                type="number"
                placeholder="Enter current reading"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.currentTarget.value)}
                error={errorFor('odometer_value')}
              />
              <TextInput
                label="Fuel Amount"
                type="number"
                placeholder="Enter fuel amount"
                value={fuelAmount}
                onChange={(e) => setFuelAmount(e.currentTarget.value)}
                error={errorFor('cost')}
              />
              <TextInput
                label="Fuel Litres"
                type="number"
                placeholder="Enter fuel litres"
                value={fuelLitres}
                onChange={(e) => setFuelLitres(e.currentTarget.value)}
                error={errorFor('liters')}
              />
              {attachmentAllowed && (
                <Stack gap={4}>
                  <FileInput
                    label="Upload Receipt"
                    placeholder="Choose file"
                    accept="image/*,application/pdf"
                    value={file}
                    onChange={handleFileChange}
                    error={errorFor('url')}
                  />
                  {file ? (
                    <Text size="sm" c="dimmed">
                      Selected: {file.name}
                    </Text>
                  ) : (
                    existingUrl && (
                      <Text size="sm" c="dimmed">
                        A receipt is already attached. Choose a file to replace
                        it.
                      </Text>
                    )
                  )}
                </Stack>
              )}
            </SimpleGrid>

            <Radio.Group
              label="Payment Method"
              value={paymentMethod}
              onChange={setPaymentMethod}
              error={errorFor('payment_method')}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="cash" label="Paid by Cash" />
                <Radio value="card" label="Paid by Mobility Card" />
              </Stack>
            </Radio.Group>

            <Group justify="flex-end" mt="xs">
              <Button
                onClick={handleAddFuel}
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

export default AddFuel;
