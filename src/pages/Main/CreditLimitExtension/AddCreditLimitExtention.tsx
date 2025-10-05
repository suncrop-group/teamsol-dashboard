import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Loader2 } from 'lucide-react';
import Loader from '@/components/Loader';

const AddCreditLimitExtention = () => {
  const [policy, setPolicy] = useState('');
  const [amount, setAmount] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState('');
  const [customer, setCustomer] = useState('');
  const { territories, user, company } = useSelector(selectUser);
  const [allowedAmount, setAllowedAmount] = useState('');
  const [usedLimit, setUsedLimit] = useState('');
  const [remainingLimit, setRemainingLimit] = useState('');
  const [customers, setCustomers] = useState([]);
  const [buttonLoading, setButtonLoading] = useState(false);
  const navigate = useNavigate();

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
        setAllowedAmount(
          response.data.expense[0].current_allowed_limit.toString()
        );
        setUsedLimit(response.data.expense[0].used_limit.toString());
        setRemainingLimit(response.data.expense[0].remaining_limit.toString());
      };

      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch credit limit extension details', {
          description: 'Error',
        });
      };

      setLoading(true);
      callServerAPI(
        'POST',
        '/get/creditlimit/extension',
        {
          data: {
            company_id: 1,
            partner_id: customer,
            policy_id: policy,
          },
        },
        onSuccess,
        onError
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

    const data = {
      partner_id: Number(customer),
      policy_id: Number(policy),
      company_id: Number(company.id),
      amount: Number(amount),
      allowed_limit: Number(allowedAmount),
      used_limit: Number(usedLimit),
      remaining_limit: Number(remainingLimit),
      requested_by_id: Number(user.employee_id),
    };

    const onCreatedSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success('Credit Limit Extension Added Successfully', {
        description: 'Success',
      });
      navigate('/credit-limit-extension');
    };

    const onCreatedError = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.error('Failed to add credit limit extension', {
        description: 'Error',
      });
    };

    const onSuccess = (response) => {
      const mergedData = {
        ...data,
        id: response.data.expense[0].id,
        sequence: response.data.expense[0].sequence,
      };

      callApi(
        'POST',
        '/credit-limit/extension',
        mergedData,
        onCreatedSuccess,
        onCreatedError
      );
    };

    const onError = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.error('Failed to add credit limit extension', {
        description: 'Error',
      });
    };

    setButtonLoading(true);
    callServerAPI(
      'POST',
      '/post/creditlimit/extension',
      { data },
      onSuccess,
      onError
    );
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

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Loader loading={loading} />
      <Card className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle>Add Credit Limit Extension</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? dayjs(date).format('DD-MM-YYYY') : 'Select a Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setDatePickerOpen(false);
                    }}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="territory">Territory</Label>
              <Select value={territory} onValueChange={setTerritory}>
                <SelectTrigger id="territory" className="w-full">
                  <SelectValue placeholder="Select the territory" />
                </SelectTrigger>
                <SelectContent>
                  {territoriesData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={customer}
                onValueChange={setCustomer}
                disabled={!territory}
              >
                <SelectTrigger id="customer" className="w-full">
                  <SelectValue placeholder="Select the customer" />
                </SelectTrigger>
                <SelectContent>
                  {customersData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="policy">Policy</Label>
              <Select
                value={policy}
                onValueChange={setPolicy}
                disabled={!territory || !customer}
              >
                <SelectTrigger id="policy" className="w-full">
                  <SelectValue placeholder="Select the policy" />
                </SelectTrigger>
                <SelectContent>
                  {policiesData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allowedAmount">Allowed Amount</Label>
              <Input
                id="allowedAmount"
                type="number"
                value={allowedAmount}
                onChange={(e) => setAllowedAmount(e.target.value)}
                placeholder="Allowed amount"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="usedLimit">Used Limit</Label>
              <Input
                id="usedLimit"
                type="number"
                value={usedLimit}
                onChange={(e) => setUsedLimit(e.target.value)}
                placeholder="Used limit"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="remainingLimit">Remaining Limit</Label>
              <Input
                id="remainingLimit"
                type="number"
                value={remainingLimit}
                onChange={(e) => setRemainingLimit(e.target.value)}
                placeholder="Remaining limit"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="amount">Limit Extension</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter the limit extension"
              />
            </div>
            <Button
              onClick={handleAddCreditLimitExtension}
              disabled={buttonLoading}
              className="w-full"
            >
              {buttonLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Credit Limit Extension
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCreditLimitExtention;
