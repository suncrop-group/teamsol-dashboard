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

const RESOURCE = '/v2/credit-limit/apply';

const AddCreditLimitApply = () => {
  // A failed request opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;
  const [policy, setPolicy] = useState(record?.policy_id ?? '');
  const [amount, setAmount] = useState<number | string>(record?.amount ?? '');
  const [date, setDate] = useState(
    record?.date ? dayjs(record.date).toDate() : new Date(),
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
    const fetchAddCreditLimitApplyCategory = async () => {
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
      callApi('GET', '/policy?type=is_credit', null, onSuccess, onError);
    };

    fetchAddCreditLimitApplyCategory();
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
      !date
    ) {
      toast.error('Please fill all the fields');
      return;
    }

    const body = {
      partner_id: Number(customer),
      policy_id: Number(policy),
      amount: +amount,
      date: dayjs(date).format('YYYY-MM-DD'),
    };

    const onSuccess = () => {
      setLoading(false);
      toast.success(
        record ? 'Credit limit request updated and queued' : 'Credit limit request saved and queued',
      );
      navigate('/credit-limit-apply');
    };

    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, 'Failed to add credit limit');
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
        title={record ? 'Edit Credit Limit' : 'Add Credit Limit'}
        back
      />
      <Paper withBorder shadow="sm" p="lg" pos="relative">
        <Loader loading={loading} />
        <Stack gap="md">
          {fieldError && !['partner_id', 'policy_id', 'amount'].includes(fieldError.field) && (
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
            error={errorFor('amount')}
          />
          <Button onClick={handleAddExpense} loading={loading} fullWidth>
            {record ? 'Save & Resend' : 'Submit'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AddCreditLimitApply;
