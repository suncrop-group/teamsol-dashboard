import { isEntryDateDisabled } from '@/utils/dates';
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
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { selectUser } from '@/redux/slices/AuthSlice';
import { uploadToCloudinary } from '@/utils';
import { toast } from '@/lib/toast';
import SelectBox from '@/components/Select';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/fleet/services';

// Fields with their own input; any other error is shown in an alert.
const FORM_FIELDS = [
  'date',
  'service_type_id',
  'odometer_value',
  'cost',
  'name',
  'url',
];

// Same rule the calendar had before: no future dates, nothing older than
// five days, and not today's day of the month.
// Today and the four days before, in Pakistan time (see utils/dates).
const isDateDisabled = isEntryDateDisabled;

const AddMaintenance = () => {
  const navigate = useNavigate();
  // A failed maintenance record opened from the list to be fixed and sent
  // again.
  const record = useLocation().state?.record;
  const { user, vehicle } = useSelector(selectUser);
  const [amount, setAmount] = useState(String(record?.cost ?? ''));
  const [date, setDate] = useState<Date>(
    record?.date ? dayjs(record.date.slice(0, 10)).toDate() : new Date(),
  );
  const [remarks, setRemarks] = useState<string>(record?.name || '');
  const [loading, setLoading] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      is_attachment?: boolean;
    }>
  >([]);
  const [serviceType, setServiceType] = useState(
    String(record?.service_type_id ?? ''),
  );
  const [lastReading, setLastReading] = useState('');
  const [odometer, setOdometer] = useState(
    String(record?.odometer_value ?? ''),
  );
  const [file, setFile] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [attachmentAllowed, setAttachmentAllowed] = useState(false);
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

  const getPreviousReading = async () => {
    const onSuccess = (response: {
      status: string;
      data: {
        expense: Array<{ odometer: number }>;
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
      `/v2/lookups/previous-odometer?service_type_id=${Number(serviceType)}&vehicle_id=${Number(vehicle.vehicle_id)}`,
      null,
      onSuccess,
      onError,
    );
  };

  useEffect(() => {
    if (serviceType) {
      const selectedServiceType = serviceTypes.find(
        (item) => Number(item.id) === Number(serviceType),
      );
      if (selectedServiceType) {
        setAttachmentAllowed(selectedServiceType?.is_attachment ?? false);
      } else {
        setAttachmentAllowed(false);
        setFile(null);
      }
    }
  }, [serviceType, serviceTypes]);

  useEffect(() => {
    if (serviceType && vehicle.vehicle_id) {
      getPreviousReading();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, vehicle.vehicle_id]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      const onSuccess = (response: {
        status: string;
        data: Array<{
          id: string;
          name: string;
          category: string;
          is_attachment?: boolean;
        }>;
      }) => {
        setLoading(false);
        setServiceTypes(
          response.data.filter(
            (item: {
              id: string;
              name: string;
              category: string;
              is_attachment?: boolean;
            }) => item.category === 'service',
          ),
        );
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch service types');
        setServiceTypes([]);
      };

      setLoading(true);
      callApi('GET', '/fleet/service-types', null, onSuccess, onError);
    };

    fetchServiceTypes();
  }, []);

  // Handle Add Maintenance Action
  const handleAddMaintenance = async () => {
    if (!amount || !serviceType || !remarks || !date) {
      toast.error('Please fill all the fields');
      return;
    }

    if (!file && !existingUrl && attachmentAllowed) {
      toast.error('Please upload a receipt image');
      return;
    }

    if (Number(lastReading) > Number(odometer)) {
      toast.error('Odometer reading should be greater than last reading');
      return;
    }

    if (Number(amount) <= 0) {
      toast.error('Amount should be greater than 0');
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
          `maintenance-${user.name}/${dayjs().format('MMMM-YYYY')}`,
          `maintenance-${user.name}-${dayjs().format('DD-MM-YYYY')}-${dayjs().format('HH-mm-ss')}`,
        );
      } catch {
        setLoading(false);
        setButtonLoading(false);
        toast.error('Failed to upload image');
        return;
      }
    }

    const body = {
      category: 'service',
      name: remarks,
      service_type_id: Number(serviceType),
      date: dayjs(date).format('YYYY-MM-DD'),
      cost: Number(amount),
      odometer_value: Number(odometer),
      url: uploadImage || existingUrl,
    };

    const onSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success(
        record
          ? 'Maintenance record updated and queued'
          : 'Maintenance record saved and queued',
      );
      navigate('/maintenance');
    };

    const onError = (error) => {
      setLoading(false);
      setButtonLoading(false);
      const message = errorMessage(error, 'Failed to add maintenance record');
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

  const serviceTypesData =
    serviceTypes.map((item: { id: string; name: string }) => ({
      label: item.name,
      value: item.id,
    })) || [];

  return (
    <Container size="sm" px={0}>
      <PageHeader
        title={record ? 'Edit Maintenance' : 'Add Maintenance'}
        back
      />
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
              {/* SelectBox hands back the id as it came from the API. */}
              <SelectBox
                label="Service Type"
                placeholder="Select service type"
                data={serviceTypesData}
                selectedValue={serviceType}
                onValueChange={setServiceType}
                error={errorFor('service_type_id')}
              />
              <TextInput
                label="Last Meter Reading"
                placeholder="Last meter reading"
                value={lastReading}
                disabled
              />
              <TextInput
                label="Odometer"
                type="number"
                placeholder="Enter odometer reading"
                value={odometer}
                onChange={(e) => setOdometer(e.currentTarget.value)}
                error={errorFor('odometer_value')}
              />
              <TextInput
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
                error={errorFor('cost')}
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

            <Textarea
              label="Remarks"
              placeholder="Enter remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.currentTarget.value)}
              error={errorFor('name')}
              rows={4}
            />

            <Button
              onClick={handleAddMaintenance}
              loading={buttonLoading}
              fullWidth
              mt="xs"
            >
              {record ? 'Save & Resend' : 'Submit'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default AddMaintenance;
