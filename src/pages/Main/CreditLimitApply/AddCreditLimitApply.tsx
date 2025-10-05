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

const AddCreditLimitApply = () => {
  const [policy, setPolicy] = useState('');
  const [amount, setAmount] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState('');
  const [customer, setCustomer] = useState('');
  const { territories, company, user } = useSelector(selectUser);
  const [customers, setCustomers] = useState([]);
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

    const data = {
      amount: +amount,
      policy_id: policy,
      partner_id: customer,
      date: dayjs(date).format('YYYY-MM-DD'),
      company_id: company.id,
      requested_by_id: user.employee_id,
    };

    const onCreateSuccess = () => {
      setLoading(false);
      toast.success('Credit Limit Added Successfully');
      navigate('/credit-limit-apply');
    };

    const onCreateError = (error: {
      message?: string;
      data?: { expense?: string[] };
    }) => {
      setLoading(false);
      toast.error(error.message || 'Failed to add credit limit');
    };

    const onSuccess = (response: {
      status: string;
      data: {
        expense: { id: string; state: string; sequence: number }[] | string;
      };
    }) => {
      if (
        response.status.toLowerCase() === 'error' &&
        typeof response.data.expense === 'string'
      ) {
        setLoading(false);
        toast.error(response.data.expense);
        return;
      }

      if (
        Array.isArray(response.data.expense) &&
        response.data.expense.length > 0
      ) {
        callApi(
          'POST',
          '/credit-limit/apply',
          {
            ...data,
            odooStatus: response.data.expense[0].state,
            id: response.data.expense[0].id,
            sequence: response.data.expense[0].sequence,
          },
          onCreateSuccess,
          onCreateError
        );
      } else {
        setLoading(false);
        toast.error('Invalid response format from server');
      }
    };

    const onError = () => {
      setLoading(false);
      toast.error('Failed to add credit limit');
    };

    setLoading(true);
    callServerAPI(
      'POST',
      '/post/creditlimit/approval',
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
          <CardTitle>Add Credit Limit</CardTitle>
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
              <Label htmlFor="amount">Credit Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter the credit amount"
              />
            </div>
            <Button
              onClick={handleAddExpense}
              className="w-full cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCreditLimitApply;
