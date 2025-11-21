import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const { user, vehicle, company } = useSelector(selectUser);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<
    Array<{ id: string; name: string; category: string; is_attachment?: boolean }>
  >([]);
  const [serviceType, setServiceType] = useState('');
  const [lastReading, setLastReading] = useState('');
  const [odometer, setOdometer] = useState('');
  const [file, setFile] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [attachmentAllowed, setAttachmentAllowed] = useState(false);

  const getPreviousReading = async () => {
    const onSuccess = (response: {
      status: string;
      data: {
        expense: Array<{ odometer: number }>;
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
          service_type_id: serviceType,
          vehicle_id: vehicle.vehicle_id,
        },
      },
      onSuccess,
      onError
    );
  };

  useEffect(() => {
    if (serviceType) {
      const selectedServiceType = serviceTypes.find(
        (item) => Number(item.id) === Number(serviceType)
      );
      if (selectedServiceType) {
        setAttachmentAllowed(selectedServiceType?.is_attachment ?? false);
      } else {
        setAttachmentAllowed(false);
        setFile(null);
      }
    }
  }, [serviceType, serviceTypes]);

  useEffect(() => {
    if (serviceType && vehicle.vehicle_id) {
      getPreviousReading();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, vehicle.vehicle_id]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      const onSuccess = (response: {
        status: string;
        data: Array<{
          id: string;
          name: string;
          category: string;
          is_attachment?: boolean;
        }>;
      }) => {
        setLoading(false);
        setServiceTypes(
          response.data.filter(
            (item: {
              id: string;
              name: string;
              category: string;
              is_attachment?: boolean;
            }) => item.category === 'service'
          )
        );
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch service types');
        setServiceTypes([]);
      };

      setLoading(true);
      callApi('GET', '/fleet/service-types', null, onSuccess, onError);
    };

    fetchServiceTypes();
  }, []);

  // Handle Add Maintenance Action
  const handleAddMaintenance = async () => {
    if (!amount || !serviceType || !remarks || !date) {
      toast.error('Please fill all the fields');
      return;
    }

    if (!file && attachmentAllowed) {
      toast.error('Please upload a receipt image');
      return;
    }

    if (Number(lastReading) > Number(odometer)) {
      toast.error('Odometer reading should be greater than last reading');
      return;
    }

    if (Number(amount) <= 0) {
      toast.error('Amount should be greater than 0');
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
          `maintenance-${user.name}/${dayjs().format('MMMM-YYYY')}`,
          `maintenance-${user.name}-${dayjs().format('DD-MM-YYYY')}-${dayjs().format('HH-mm-ss')}`
        );
      } catch (error) {
        setLoading(false);
        setButtonLoading(false);
        toast.error('Failed to upload image');
        return;
      }
    }

    const data = {
      name: remarks,
      service_type_id: Number(serviceType),
      vehicle_id: Number(vehicle.vehicle_id),
      date: dayjs(date).format('DD-MM-YYYY'),
      cost: Number(amount),
      employee_id: Number(user.employee_id),
      id: 0,
      odometer_value: odometer,
      payment_method: 'paid_by_cash',
      liters: 0,
      url: uploadImage || '',
      company_id: Number(company.id),
    };

    const onCreateSuccess = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.success('Maintenance record added successfully');
      navigate('/maintenance');
    };

    const onCreateError = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.error('Failed to add maintenance record');
    };

    // Call API
    const onSuccess = (response: {
      status: string;
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
          liters: -1,
          odooStatus: response.data.expense[0].state,
          category: 'service',
          date: date,
          url: uploadImage || '',
        },
        onCreateSuccess,
        onCreateError
      );
    };

    const onError = () => {
      setLoading(false);
      setButtonLoading(false);
      toast.error('Failed to add maintenance record');
    };

    callServerAPI('POST', '/post/fleet', { data }, onSuccess, onError);
  };

  const serviceTypesData =
    serviceTypes.map((item: { id: string; name: string }) => ({
      label: item.name,
      value: item.id,
    })) || [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Add Maintenance</CardTitle>
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
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate);
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
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger id="serviceType" className="w-full">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypesData.map((item, index) => (
                      <SelectItem key={index} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastReading">Last Meter Reading</Label>
                <Input
                  id="lastReading"
                  placeholder="Last meter reading"
                  value={lastReading}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="Enter odometer reading"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {attachmentAllowed && (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Receipt</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
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
                    }}
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
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAddMaintenance}
                disabled={buttonLoading}
                className="w-full"
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

export default AddMaintenance;
