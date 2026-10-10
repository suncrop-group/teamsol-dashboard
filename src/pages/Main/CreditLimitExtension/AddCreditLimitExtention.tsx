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

const RESOURCE = '/v2/credit-limit/extension';

const AddCreditLimitExtention = () => {
  // A failed request opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;
  const [policy, setPolicy] = useState(record?.policy_id ?? '');
  const [amount, setAmount] = useState<number | string>(record?.amount ?? '');
  const [date, setDate] = useState(new Date());
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState(
    record?.customer?.territory_id ?? '',
  );
  const [customer, setCustomer] = useState(record?.partner_id ?? '');
  const { territories } = useSelector(selectUser);
  const [allowedAmount, setAllowedAmount] = useState<number | string>(
    record?.allowed_limit ?? '',
  );
  const [usedLimit, setUsedLimit] = useState<number | string>(
    record?.used_limit ?? '',
  );
  const [remainingLimit, setRemainingLimit] = useState<number | string>(
    record?.remaining_limit ?? '',
  );
  const [customers, setCustomers] = useState([]);
  const [buttonLoading, setButtonLoading] = useState(false);
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

  useEffect(() => {
    if (!territory || !customer || !policy || !date) return;

    const fetchCreditLimitDetails = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        const figures = response?.data?.expense?.[0];
        if (!figures) {
          onError();
          return;
        }
        setAllowedAmount(figures.current_allowed_limit.toString());
        setUsedLimit(figures.used_limit.toString());
        setRemainingLimit(figures.remaining_limit.toString());
      };

      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch credit limit extension details', {
          description: 'Error',
        });
      };

      setLoading(true);
      callApi(
        'GET',
        `/v2/lookups/credit-limit-extension?partner_id=${customer}&policy_id=${policy}`,
        null,
        onSuccess,
        onError,
      );
    };

    fetchCreditLimitDetails();
  }, [territory, customer, policy, date]);

  const handleAddCreditLimitExtension = () => {
    if (
      amount === '' ||
      policy === '' ||
      territory === '' ||
      customer === '' ||
      !date
    ) {
      toast.error('Please fill all the fields', {
        description: 'Error',
      });
      return;
    }

    const body = {
      partner_id: Number(customer),
      policy_id: Number(policy),
      amount: Number(amount),
      allowed_limit: Number(allowedAmount),
      used_limit: Number(usedLimit),
      remaining_limit: Number(remainingLimit),
    };

    const onSuccess = () => {
      setButtonLoading(false);
      toast.success(
        record ? 'Credit limit extension updated and queued' : 'Credit limit extension saved and queued',
      );
      navigate('/credit-limit-extension');
    };

    const onError = (error) => {
      setButtonLoading(false);
      const message = errorMessage(error, 'Failed to add credit limit extension');
      setFieldError({ field: error?.field, message });
      toast.error(message);
    };

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
        title={
          record ? 'Edit Credit Limit Extension' : 'Add Credit Limit Extension'
        }
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
            label="Allowed Amount"
            placeholder="Allowed amount"
            value={allowedAmount}
            onChange={setAllowedAmount}
            hideControls
            disabled
          />
          <NumberInput
            label="Used Limit"
            placeholder="Used limit"
            value={usedLimit}
            onChange={setUsedLimit}
            hideControls
            disabled
          />
          <NumberInput
            label="Remaining Limit"
            placeholder="Remaining limit"
            value={remainingLimit}
            onChange={setRemainingLimit}
            hideControls
            disabled
          />
          <NumberInput
            label="Limit Extension"
            placeholder="Enter the limit extension"
            value={amount}
            onChange={setAmount}
            hideControls
            error={errorFor('amount')}
          />
          <Button
            onClick={handleAddCreditLimitExtension}
            loading={buttonLoading}
            fullWidth
          >
            {record ? 'Save & Resend' : 'Add Credit Limit Extension'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AddCreditLimitExtention;
