import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { uploadToCloudinary } from '@/utils';
import dayjs from 'dayjs';

const AddFuel = () => {
  const navigate = useNavigate();
  const { vehicle, user, company } = useSelector(selectUser);
  const [lastReading, setLastReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [date, setDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [serviceType, setServiceType] = useState<{
    id: string;
    name: string;
    category: string;
    is_attachment?: boolean;
  } | null>(null);
  const [file, setFile] = useState(null);
  const [attachmentAllowed, setAttachmentAllowed] = useState(false);

  const getPreviousReading = async () => {
    const onSuccess = (response: {
      data: {
        expense: Array<{
          odometer: string;
        }>;
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
    callServerAPI(
      'POST',
      `/get/previous/odometer`,
      {
        data: {
          service_type_id: Number(serviceType.id),
          vehicle_id: Number(vehicle?.vehicle_id),
        },
      },
      onSuccess,
      onError
    );
  };

  useEffect(() => {
    if (serviceType?.id && vehicle?.vehicle_id) {
      getPreviousReading();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, vehicle?.vehicle_id]);

  useEffect(() => {
    if (serviceType?.is_attachment) {
      setAttachmentAllowed(true);
    } else {
      setAttachmentAllowed(false);
      setFile(null);
    }
  }, [serviceType]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      const onSuccess = (response: {
        data: Array<{
          id: string;
          name: string;
          category: string;
          is_attachment?: boolean;
        }>;
      }) => {
        const fuelService = response.data.find(
          (item: { category: string; id: string; name: string; is_attachment?: boolean }) =>
            item.category === 'fuel'
        );
        setServiceType(fuelService);
        setLoading(false);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch service types');
      };

      setLoading(true);
      callApi('GET', '/fleet/service-types', null, onSuccess, onError);
    };

    fetchServiceTypes();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
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

  const handleAddFuel = async () => {
    // Validation
    if (
      !lastReading ||
      !currentReading ||
      !fuelAmount ||
      !fuelLitres ||
      !date ||
      !serviceType ||
      !vehicle
    ) {
      toast.error('Please fill all the fields and select a payment method');
      return;
    }

    if (!file && attachmentAllowed) {
      toast.error('Please upload a receipt image');
      return;
    }

    if (Number(currentReading) < Number(lastReading)) {
      toast.error('Current reading should be greater than last reading');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select payment method');
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
          `fuel-${user.name}/${dayjs().format('MMMM-YYYY')}`,
          `fuel-${user.name}-${dayjs().format('DD-MM-YYYY')}-${dayjs().format('HH-mm-ss')}`
        );
      } catch (error) {
        setLoading(false);
        setButtonLoading(false);
        toast.error('Failed to upload image');
        return;
      }
    }

    const data = {
      name: serviceType.name,
      service_type_id: Number(serviceType.id),
      vehicle_id: Number(vehicle?.vehicle_id),
      date: dayjs(date).format('DD-MM-YYYY'),
      cost: Number(fuelAmount),
      liters: Number(fuelLitres),
      employee_id: Number(user.employee_id),
      id: 0,
      odometer_value: currentReading,
      payment_method:
        paymentMethod === 'cash' ? 'paid_by_cash' : 'paid_by_mobility_card',
      url: uploadImage || '',
      company_id: Number(company.id),
    };

    const onCreateSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success('Fuel added successfully');
      navigate(-1);
    };

    const onCreateError = (error: { message?: string; error?: string }) => {
      setLoading(false);
      setButtonLoading(false);
      toast.error(`Failed to add fuel: ${error.message || 'Unknown error'}`);
    };

    // Call API
    const onSuccess = (response: {
      data: {
        expense: Array<{
          id: number;
          state: string;
        }>;
      };
    }) => {
      callApi(
        'POST',
        '/fleet/service',
        {
          ...data,
          id: response.data.expense[0].id,
          odooStatus: response.data.expense[0].state,
          category: 'fuel',
          date: date,
          url: uploadImage || '',
        },
        onCreateSuccess,
        onCreateError
      );
    };

    const onError = (error: { message?: string; error?: string }) => {
      setLoading(false);
      setButtonLoading(false);
      toast.error(`Failed to add fuel: ${error.message || 'Unknown error'}`);
    };

    callServerAPI('POST', '/post/fleet', { data }, onSuccess, onError);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Add Fuel</CardTitle>
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
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd-MM-yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      disabled={(date) =>
                        date > new Date() ||
                        date <
                          new Date(
                            new Date().setDate(new Date().getDate() - 5)
                          ) ||
                        date.getDate() === new Date().getDate()
                      }
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate);
                          setOpenDatePicker(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastReading">Last Reading</Label>
                <Input
                  id="lastReading"
                  placeholder="Last reading"
                  value={lastReading}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentReading">Current Reading</Label>
                <Input
                  id="currentReading"
                  type="number"
                  placeholder="Enter current reading"
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelAmount">Fuel Amount</Label>
                <Input
                  id="fuelAmount"
                  type="number"
                  placeholder="Enter fuel amount"
                  value={fuelAmount}
                  onChange={(e) => setFuelAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelLitres">Fuel Litres</Label>
                <Input
                  id="fuelLitres"
                  type="number"
                  placeholder="Enter fuel litres"
                  value={fuelLitres}
                  onChange={(e) => setFuelLitres(e.target.value)}
                />
              </div>
              {attachmentAllowed && (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Receipt</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {file && (
                    <p className="text-sm text-gray-600">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Paid by Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Paid by Mobility Card</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAddFuel}
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

export default AddFuel;
