import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const AddPersonalUse = () => {
  const navigate = useNavigate();
  const { user, company } = useSelector(selectUser);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personalUse, setPersonalUseData] = useState({
    personalTravelKm: '',
    personalTravelAmount: '',
  });
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleSubmit = () => {
    if (
      !selectedDate ||
      !personalUse.personalTravelKm ||
      !personalUse.personalTravelAmount
    ) {
      toast.error('Please fill all the fields');
      return;
    }

    const onCreatedSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success('Personal use record added successfully');
      navigate(-1);
    };

    const onCreatedError = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.error('Failed to add personal use record');
    };

    const onSuccess = (response) => {
      callApi(
        'POST',
        '/fleet/personal-use',
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
      setButtonLoading(false);
      toast.error('Failed to add personal use record');
    };

    const data = {
      date: dayjs(selectedDate).format('DD-MM-YYYY'),
      km: Number(personalUse.personalTravelKm),
      amount: Number(personalUse.personalTravelAmount),
      employee_id: Number(user.employee_id),
      company_id: Number(company.id),
    };

    setLoading(true);
    setButtonLoading(true);
    callServerAPI('POST', '/post/personal/toll', { data }, onSuccess, onError);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Add Personal Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, 'dd-MM-yyyy')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setOpenDatePicker(false);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() ||
                        date <
                          new Date(
                            new Date().setDate(new Date().getDate() - 5)
                          ) ||
                        date.getDate() === new Date().getDate()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalTravelKm">Personal Travel (Km)</Label>
                <Input
                  id="personalTravelKm"
                  type="number"
                  placeholder="Enter personal travel in KM"
                  value={personalUse.personalTravelKm}
                  onChange={(e) =>
                    setPersonalUseData({
                      ...personalUse,
                      personalTravelKm: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalTravelAmount">
                  Personal Travel Amount
                </Label>
                <Input
                  id="personalTravelAmount"
                  type="number"
                  placeholder="Enter personal travel amount"
                  value={personalUse.personalTravelAmount}
                  onChange={(e) =>
                    setPersonalUseData({
                      ...personalUse,
                      personalTravelAmount: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={buttonLoading}
                className="w-full md:w-auto"
              >
                {buttonLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddPersonalUse;
