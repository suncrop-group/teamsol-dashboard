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

const AddTemporaryCredit = () => {
  const [policy, setPolicy] = useState('');
  const [amount, setAmount] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState('');
  const [date, setDate] = useState(new Date());
  const [validUpto, setValidUpto] = useState(new Date());
  const [promiseDate, setPromiseDate] = useState(new Date());
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState('');
  const [customer, setCustomer] = useState('');
  const { territories, company, user } = useSelector(selectUser);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

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

    const data = {
      partner_id: Number(customer),
      policy_id: Number(policy),
      company_id: Number(company.id),
      date: dayjs(date).format('DD-MM-YYYY'),
      requested_by_id: Number(user.employee_id),
      allowed_limit: Number(amount),
      valid_up_date: dayjs(validUpto).format('DD-MM-YYYY'),
      promise_date: dayjs(promiseDate).format('DD-MM-YYYY'),
    };

    const onCreatedSuccess = () => {
      setLoading(false);
      toast.success('Temporary credit added successfully', {
        description: 'Success',
      });
      navigate('/temporary-credit');
    };

    const onCreatedError = () => {
      setLoading(false);
      toast.error('Failed to add temporary credit', {
        description: 'Error',
      });
    };

    const onSuccess = (response) => {
      const mergedData = {
        ...data,
        id: response.data.expense.id,
        name: response.data.expense.name,
        odooStatus: response.data.expense.state,
        sequence: response.data.expense.sequence,
      };

      callApi(
        'POST',
        '/credit-limit/temporary',
        mergedData,
        onCreatedSuccess,
        onCreatedError
      );
    };

    const onError = () => {
      setLoading(false);
      toast.error('Failed to add temporary credit', {
        description: 'Error',
      });
    };

    setLoading(true);
    callServerAPI(
      'POST',
      '/post/temporary/credit',
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
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <Card className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle>Add Temporary Credit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover
                open={isDatePickerOpen === 'date'}
                onOpenChange={(open) => setDatePickerOpen(open ? 'date' : '')}
              >
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
                      setDatePickerOpen('');
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
            <div>
              <Label htmlFor="validUpto">Valid Up To</Label>
              <Popover
                open={isDatePickerOpen === 'validUpto'}
                onOpenChange={(open) =>
                  setDatePickerOpen(open ? 'validUpto' : '')
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUpto
                      ? dayjs(validUpto).format('DD-MM-YYYY')
                      : 'Select a Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validUpto}
                    onSelect={(selectedDate) => {
                      setValidUpto(selectedDate);
                      setDatePickerOpen('');
                    }}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="promiseDate">Promise Date</Label>
              <Popover
                open={isDatePickerOpen === 'promiseDate'}
                onOpenChange={(open) =>
                  setDatePickerOpen(open ? 'promiseDate' : '')
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {promiseDate
                      ? dayjs(promiseDate).format('DD-MM-YYYY')
                      : 'Select a Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={promiseDate}
                    onSelect={(selectedDate) => {
                      setPromiseDate(selectedDate);
                      setDatePickerOpen('');
                    }}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleAddExpense}
              disabled={loading}
              className="w-full"
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

export default AddTemporaryCredit;
