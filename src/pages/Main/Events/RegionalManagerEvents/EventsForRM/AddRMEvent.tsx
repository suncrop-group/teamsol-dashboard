import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Alert,
  Button,
  Container,
  Group,
  Input,
  Paper,
  Rating,
  SimpleGrid,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon } from 'lucide-react';
import { toast } from '@/lib/toast';
import dayjs from 'dayjs';
import { parseCustomDate } from '@/utils';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { selectUser } from '@/redux/slices/AuthSlice';
import Loader from '@/components/Loader';
import SelectBox from '@/components/Select';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/events';

// Fields that show the server's (or Odoo's) message under themselves.
const FORM_FIELDS = [
  'name',
  'territory_id',
  'dealer_ids',
  'event_type_id',
  'event_temp_type_id',
  'crop_id',
  'demo_product_id',
  'cpo_id',
  'cpo_name',
  'date_begin',
  'date_end',
  'rating',
];

// Stored ids → the options a multi-select holds (matched by value).
const asOptions = (ids) =>
  (ids || []).map((id) => ({ label: String(id), value: id }));

const AddRMEvent = () => {
  const navigate = useNavigate();
  // A failed event opened to be fixed and sent again.
  const record = useLocation().state?.record;
  const user = useSelector(selectUser);
  const { territories, region: userRegion } = user;
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState(record?.territory_id ?? '');
  const [dateBegin, setDateBegin] = useState(
    (record && parseCustomDate(record.date_begin)) || new Date(),
  );
  const [dateEnd, setDateEnd] = useState(
    (record && parseCustomDate(record.date_end)) || new Date(),
  );
  const [crops, setCrops] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState(
    asOptions(record?.crop_id),
  );
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(
    asOptions(record?.demo_product_id),
  );
  const [eventName, setEventName] = useState(record?.name ?? '');
  const [eventTemId, setEventTemId] = useState(record?.event_type_id ?? '');
  const [eventTemplates, setEventTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState(
    asOptions(record?.dealer_ids),
  );
  const [templateCategoryId, setTemplateCategoryId] = useState(
    record?.event_temp_type_id ?? '',
  );
  const [rating, setRating] = useState(record?.rating ?? 1);
  const [cpoName, setCpoName] = useState(record?.cpo_name ?? '');
  const [cpoId, setCpoId] = useState(record?.copId ?? null);
  const [cpos, setCpos] = useState([]);
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two events.
  const requestId = useRef(newRequestId());

  useEffect(() => {
    if (!userRegion) return;
    const onSuccess = (response) => {
      setCrops(response.data);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch crops', { description: 'Error' });
      setLoading(false);
    };
    setLoading(true);
    callApi('GET', `/events/crops`, null, onSuccess, onError);
  }, [userRegion]);

  useEffect(() => {
    const onSuccess = (response) => {
      setProducts(response.data);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch products', { description: 'Error' });
      setLoading(false);
    };
    setLoading(true);
    callApi('GET', `/events/products`, null, onSuccess, onError);
  }, []);

  useEffect(() => {
    if (!territory) return;
    const onSuccess = (response) => {
      setEventTemplates(response.data);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch event templates', { description: 'Error' });
      setLoading(false);
    };
    setLoading(true);
    callApi('GET', `/events/templates`, null, onSuccess, onError);
  }, [territory]);

  useEffect(() => {
    if (territory) {
      callApi(
        'GET',
        `/customers/territory?territory_id=${territory}`,
        {},
        (res) => setCustomers(res.data),
        () =>
          toast.error('Error fetching customers', {
            description: 'Please try again',
          }),
      );

      const fetchCpos = async () => {
        const onSuccess = (response) => {
          setLoading(false);
          setCpos(response.data);
        };
        const onError = () => {
          setLoading(false);
          toast.error('Failed to fetch CPOs', {
            description: 'Error',
          });
        };

        setLoading(true);
        callApi(
          'GET',
          `/events/cpos?territory_id=${territory}`,
          null,
          onSuccess,
          onError,
        );
      };

      fetchCpos();
    }
  }, [territory]);

  // Date Begin: today or one of the four days before it.
  const earliest = dayjs().subtract(4, 'day').startOf('day').toDate();
  const latest = dayjs().endOf('day').toDate();

  const handleAddEvent = () => {
    if (
      territory === '' ||
      eventName === '' ||
      eventTemId === '' ||
      !dateBegin ||
      !dateEnd
    ) {
      toast.error('Please fill all the fields', { description: 'Error' });
      return;
    }

    // A record being corrected keeps the date it was created with.
    if (
      !record &&
      (dayjs(dateBegin).isBefore(earliest) || dayjs(dateBegin).isAfter(latest))
    ) {
      toast.error('Date Begin must be today or within the last 4 days', {
        description: 'Error',
      });
      return;
    }

    // The region, organiser, manager and company are set by the server, which
    // also queues the rating once the event is in Odoo.
    const body = {
      name: eventName,
      crop_id: selectedCrops.map((item) => item.value),
      demo_product_id: selectedProducts.map((item) => item.value),
      date_begin: dayjs(dateBegin).format('YYYY-MM-DD HH:mm'),
      date_end: dayjs(dateEnd).format('YYYY-MM-DD HH:mm'),
      territory_id: territory,
      event_type_id: eventTemId,
      cpo_name: cpoName,
      ...(cpoId && { cpo_id: cpoId }),
      dealer_ids: selectedCustomers.map((item) => item.value),
      ...(templateCategoryId && { event_temp_type_id: templateCategoryId }),
      rating: Number(rating),
    };

    const onSuccess = () => {
      setLoading(false);
      toast.success(
        record ? 'Event updated and queued' : 'Event saved and queued',
        { description: 'Success' },
      );
      navigate(-1);
    };
    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, 'Failed to add event');
      setFieldError({ field: error?.field, message });
      toast.error(message, { description: 'Error' });
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

  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : undefined;

  const territoriesData =
    territories.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const cropsData = userRegion
    ? crops.map((item) => ({
        label: item.name,
        value: item.id,
      }))
    : [];

  const productsData =
    products.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const eventTemplatesData =
    eventTemplates.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const customersData =
    customers.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const templateCategoryData =
    eventTemplates
      .find((item) => item.id === eventTemId)
      ?.event_temp_type_ids.map((item) => ({
        label: item.name,
        value: item.id,
      })) || [];

  const cposData =
    cpos.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  return (
    <Container size="md" px={0}>
      <PageHeader title={record ? 'Edit Event' : 'Add Event'} />
      <Paper withBorder shadow="sm" p="lg" pos="relative">
        <Loader loading={loading} />
        {fieldError && !FORM_FIELDS.includes(fieldError.field) && (
          <Alert color="red" variant="light" mb="md">
            {fieldError.message}
          </Alert>
        )}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <TextInput
            label="Event Address"
            placeholder="Enter the event address"
            value={eventName}
            onChange={(e) => setEventName(e.currentTarget.value)}
            error={errorFor('name')}
            withAsterisk
          />
          <TextInput
            label="Region"
            placeholder="Region"
            value={userRegion?.name || 'N/A'}
            disabled
            readOnly
          />

          <SelectBox
            label="Territory"
            placeholder="Select the territory"
            data={territoriesData}
            selectedValue={territory}
            onValueChange={setTerritory}
            error={errorFor('territory_id')}
            required
          />
          <SelectBox
            label="Dealer"
            placeholder="Select the dealer"
            data={customersData}
            selectedValue={selectedCustomers}
            onValueChange={setSelectedCustomers}
            error={errorFor('dealer_ids')}
            isMultiple
          />

          <SelectBox
            label="Event Category"
            placeholder="Select the event category"
            data={eventTemplatesData}
            selectedValue={eventTemId}
            onValueChange={setEventTemId}
            error={errorFor('event_type_id')}
            required
          />
          <SelectBox
            label="Category Type"
            placeholder="Select the event category type"
            data={templateCategoryData}
            selectedValue={templateCategoryId}
            onValueChange={setTemplateCategoryId}
            error={errorFor('event_temp_type_id')}
            required
          />

          <SelectBox
            label="Crop"
            placeholder="Select the crop"
            data={cropsData}
            selectedValue={selectedCrops}
            onValueChange={setSelectedCrops}
            error={errorFor('crop_id')}
            isMultiple
          />
          <SelectBox
            label="Product"
            placeholder="Select the product"
            data={productsData}
            selectedValue={selectedProducts}
            onValueChange={setSelectedProducts}
            error={errorFor('demo_product_id')}
            isMultiple
          />

          <SelectBox
            label="CPO for Allowance"
            placeholder="Select the CPO"
            data={cposData}
            selectedValue={cpoId}
            onValueChange={(value) => {
              const cpo = cposData.find((item) => item.value === value);
              setCpoName(cpo?.label || '');
              setCpoId(cpo?.value || '');
            }}
            error={errorFor('cpo_id') || errorFor('cpo_name')}
          />
          <DatePickerInput
            label="Date Begin"
            valueFormat="DD/MM/YYYY HH:mm"
            leftSection={<CalendarIcon size={16} />}
            value={dateBegin}
            minDate={earliest}
            maxDate={latest}
            onChange={(value) =>
              setDateBegin(value ? dayjs(value).toDate() : null)
            }
            error={errorFor('date_begin')}
            withAsterisk
          />

          <DatePickerInput
            label="Date End"
            valueFormat="DD/MM/YYYY HH:mm"
            leftSection={<CalendarIcon size={16} />}
            value={dateEnd}
            minDate={earliest}
            onChange={(value) =>
              setDateEnd(value ? dayjs(value).toDate() : null)
            }
            error={errorFor('date_end')}
            withAsterisk
          />

          <Input.Wrapper label="Rating" error={errorFor('rating')}>
            <Rating value={rating} onChange={setRating} size="lg" mt={4} />
          </Input.Wrapper>
        </SimpleGrid>

        <Group gap="sm" mt="xl">
          <Button onClick={handleAddEvent} loading={loading}>
            {record ? 'Save & Resend' : 'Submit'}
          </Button>
          <Button variant="default" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Group>
      </Paper>
    </Container>
  );
};

export default AddRMEvent;
