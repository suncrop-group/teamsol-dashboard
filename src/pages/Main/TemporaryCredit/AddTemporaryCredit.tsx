import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { selectUser } from '@/redux/slices/AuthSlice';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';
import SelectBox from '@/components/Select';
import Loader from '@/components/Loader';

const RESOURCE = '/v2/credit-limit/temporary';

// A stored date is 'DD-MM-YYYY' text; anything else falls back to today.
const fromStoredDate = (value?: string) => {
  const [day, month, year] = String(value || '').split('-').map(Number);
  return day && month && year ? new Date(year, month - 1, day) : new Date();
};

const AddTemporaryCredit = () => {
  // A failed request opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;
  const [policy, setPolicy] = useState(record?.policy_id ?? '');
  const [amount, setAmount] = useState<number | string>(
    record?.allowed_limit ?? '',
  );
  const [date, setDate] = useState(fromStoredDate(record?.date));
  const [validUpto, setValidUpto] = useState(
    fromStoredDate(record?.valid_up_date),
  );
  const [promiseDate, setPromiseDate] = useState(
    fromStoredDate(record?.promise_date),
  );
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState(
    record?.customer?.territory_id ?? '',
  );
  const [customer, setCustomer] = useState(record?.partner_id ?? '');
  const { territories } = useSelector(selectUser);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two requests.
  const requestId = useRef(newRequestId());

  useEffect(() => {
    const fetchAddTemporaryCreditCategory = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        setPolicies(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch policies', {
          description: 'Error',
        });
        setPolicies([]);
      };

      setLoading(true);
      callApi(
        'GET',
        `/policy?type=is_advance&is_temp_credit_limit=true`,
        null,
        onSuccess,
        onError
      );
    };

    fetchAddTemporaryCreditCategory();
  }, []);

  useEffect(() => {
    if (!territory || territory === '') return;

    const fetchCustomers = async () => {
      const onSuccess = (res) => {
        setLoading(false);
        setCustomers(res.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Error fetching customers', {
          description: 'Please try again',
        });
      };

      setLoading(true);
      callApi(
        'GET',
        `/customers/territory?territory_id=${territory}`,
        {},
        onSuccess,
        onError
      );
    };

    fetchCustomers();
  }, [territory]);

  const handleAddExpense = () => {
    if (
      amount === '' ||
      policy === '' ||
      territory === '' ||
      customer === '' ||
      !date ||
      !validUpto ||
      !promiseDate
    ) {
      toast.error('Please fill all the fields', {
        description: 'Error',
      });
      return;
    }

    const body = {
      partner_id: Number(customer),
      policy_id: Number(policy),
      allowed_limit: Number(amount),
      date: dayjs(date).format('YYYY-MM-DD'),
      valid_up_date: dayjs(validUpto).format('YYYY-MM-DD'),
      promise_date: dayjs(promiseDate).format('YYYY-MM-DD'),
    };

    const onSuccess = () => {
      setLoading(false);
      toast.success(
        record ? 'Temporary credit updated and queued' : 'Temporary credit saved and queued',
      );
      navigate('/temporary-credit');
    };

    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, 'Failed to add temporary credit');
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

  const territoriesData =
    territories.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const customersData = territory
    ? customers.map((item) => ({
        label: item.name,
        value: item.id,
      }))
    : [];

  const policiesData =
    territory && customer
      ? policies.map((item) => ({
          label: item.code,
          value: item.id,
        }))
      : [];

  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : undefined;

  // Only dates after today can be picked.
  const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

  return (
    <Container size="xs" px={0}>
      <PageHeader
        title={record ? 'Edit Temporary Credit' : 'Add Temporary Credit'}
        back
      />
      <Paper withBorder shadow="sm" p="lg" pos="relative">
        <Loader loading={loading} />
        <Stack gap="md">
          {fieldError && ![
            'date',
            'partner_id',
            'policy_id',
            'allowed_limit',
            'valid_up_date',
            'promise_date',
          ].includes(fieldError.field) && (
            <Alert color="red" variant="light">
              {fieldError.message}
            </Alert>
          )}
          <DatePickerInput
            label="Date"
            placeholder="Select a Date"
            valueFormat="DD-MM-YYYY"
            leftSection={<CalendarIcon size={16} />}
            value={date}
            onChange={(value) => setDate(value ? dayjs(value).toDate() : null)}
            minDate={tomorrow}
            error={errorFor('date')}
          />
          <SelectBox
            label="Territory"
            placeholder="Select the territory"
            data={territoriesData}
            selectedValue={territory}
            onValueChange={setTerritory}
          />
          <SelectBox
            label="Customer"
            placeholder="Select the customer"
            data={customersData}
            selectedValue={customer}
            onValueChange={setCustomer}
            disabled={!territory}
            error={errorFor('partner_id')}
          />
          <SelectBox
            label="Policy"
            placeholder="Select the policy"
            data={policiesData}
            selectedValue={policy}
            onValueChange={setPolicy}
            disabled={!territory || !customer}
            error={errorFor('policy_id')}
          />
          <NumberInput
            label="Credit Amount"
            placeholder="Enter the credit amount"
            value={amount}
            onChange={setAmount}
            hideControls
            error={errorFor('allowed_limit')}
          />
          <DatePickerInput
            label="Valid Up To"
            placeholder="Select a Date"
            valueFormat="DD-MM-YYYY"
            leftSection={<CalendarIcon size={16} />}
            value={validUpto}
            onChange={(value) => setValidUpto(value ? dayjs(value).toDate() : null)}
            minDate={tomorrow}
            error={errorFor('valid_up_date')}
          />
          <DatePickerInput
            label="Promise Date"
            placeholder="Select a Date"
            valueFormat="DD-MM-YYYY"
            leftSection={<CalendarIcon size={16} />}
            value={promiseDate}
            onChange={(value) => setPromiseDate(value ? dayjs(value).toDate() : null)}
            minDate={tomorrow}
            error={errorFor('promise_date')}
          />
          <Button onClick={handleAddExpense} loading={loading} fullWidth>
            {record ? 'Save & Resend' : 'Submit'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AddTemporaryCredit;
