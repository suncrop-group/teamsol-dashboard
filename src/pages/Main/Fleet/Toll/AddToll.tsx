import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AddToll = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tollAmount, setTollAmount] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, company } = useSelector(selectUser);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!selectedDate || !tollAmount) {
      toast.error('Please fill all the fields');
      return;
    }

    const data = {
      date: dayjs(selectedDate).format('DD-MM-YYYY'),
      km: 0.0,
      amount: Number(tollAmount),
      employee_id: Number(user.employee_id),
      company_id: Number(company.id),
    };

    const onCreatedSuccess = () => {
      setLoading(false);
      toast.success('Toll record added successfully');
      navigate('/toll');
    };

    const onCreatedError = () => {
      setLoading(false);
      toast.success('Failed to add toll record');
    };

    const onSuccess = (response) => {
      callApi(
        'POST',
        '/fleet/toll',
        {
          ...data,
          id: response.data.message[0].id,
          name: response.data.message[0].name,
          odooStatus: response.data.message[0].state,
          date: selectedDate,
        },
        onCreatedSuccess,
        onCreatedError
      );
    };

    const onError = () => {
      setLoading(false);
      toast.error('Failed to add toll record');
    };

    setLoading(true);
    callServerAPI('POST', '/post/personal/toll', { data }, onSuccess, onError);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <h1 className="text-2xl font-bold mb-6">Add Toll</h1>
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
                  {selectedDate
                    ? dayjs(selectedDate).format('DD-MM-YYYY')
                    : 'Select a Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) =>
                    date > new Date() ||
                    date <
                      new Date(new Date().setDate(new Date().getDate() - 5)) ||
                    date.getDate() === new Date().getDate()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="tollAmount">Toll Amount</Label>
            <Input
              id="tollAmount"
              type="number"
              value={tollAmount}
              onChange={(e) => setTollAmount(e.target.value)}
              placeholder="Enter Toll Amount"
            />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddToll;
