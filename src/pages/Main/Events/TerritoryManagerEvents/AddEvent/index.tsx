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
import { CalendarIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Loader2 } from 'lucide-react';
import Loader from '@/components/Loader';

const AddEvent = () => {
  const [isDatePickerOpen, setDatePickerOpen] = useState('');
  const [dateBegin, setDateBegin] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());
  const [beginTime, setBeginTime] = useState(dayjs().format('HH:mm'));
  const [endTime, setEndTime] = useState(dayjs().format('HH:mm'));
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState('');
  const { territories } = useSelector(selectUser);
  const userRegion = useSelector(selectUser)?.region;
  const [crops, setCrops] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [cpoName, setCpoName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventTemId, setEventTemId] = useState('');
  const [eventTemplates, setEventTemplates] = useState([]);
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!userRegion) return;

    const fetchCrops = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        setCrops(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch crops', {
          description: 'Error',
        });
      };

      setLoading(true);
      callApi('GET', `/events/crops`, null, onSuccess, onError);
    };

    fetchCrops();
  }, [userRegion]);

  useEffect(() => {
    const fetchProducts = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        setProducts(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch products', {
          description: 'Error',
        });
      };

      setLoading(true);
      callApi('GET', `/events/products`, null, onSuccess, onError);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!territory) return;

    const fetchEventTemplates = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        setEventTemplates(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch event templates', {
          description: 'Error',
        });
      };

      setLoading(true);
      callApi('GET', `/events/templates`, null, onSuccess, onError);
    };

    fetchEventTemplates();
  }, [territory]);

  const handleAddEvent = () => {
    if (
      territory === '' ||
      eventName === '' ||
      selectedCrops.length === 0 ||
      selectedProducts.length === 0 ||
      cpoName === '' ||
      eventTemId === ''
    ) {
      toast.error('Please fill all the fields', {
        description: 'Error',
      });
      return;
    }

    const data = {
      name: eventName,
      crop_id: selectedCrops.map((item) => item.value),
      demo_product_id: selectedProducts.map((item) => item.value),
      date_begin: dayjs(dateBegin).format('DD/MM/YYYY HH:mm:00'),
      date_end: dayjs(dateEnd).format('DD/MM/YYYY HH:mm:00'),
      region_id: userRegion.id,
      territory_id: territory,
      organizer_id: user.id,
      cpo_name: cpoName,
      rsm_id: user.manager.id,
      event_type_id: eventTemId,
      company_id: user.company_id,
    };

    const onCreatedSuccess = () => {
      setLoading(false);
      toast.success('Event added successfully', {
        description: 'Success',
      });
      navigate('/events');
    };

    const onCreatedError = () => {
      setLoading(false);
      toast.error('Failed to add event', {
        description: 'Error',
      });
    };

    const onSuccess = (response) => {
      const mergedData = {
        ...data,
        id: response.data.id,
        event_stage_id: response.data.stage_id,
      };

      const checkListData = {
        event_id: response.data.id,
        checkist_vals: eventTemplates
          ?.find((item) => item.id === eventTemId)
          ?.check_list_ids.map((item) => ({
            check_list_id: item.id,
          })),
      };

      callServerAPI(
        'POST',
        '/post/checklist',
        { data: checkListData },
        () => {
          callApi(
            'POST',
            '/events/create',
            mergedData,
            onCreatedSuccess,
            onCreatedError
          );
        },
        () => {
          setLoading(false);
          toast.error('Failed to add event checklist', {
            description: 'Error',
          });
        }
      );
    };

    const onError = (error) => {
      setLoading(false);
      toast.error(error.message || 'Failed to add event', {
        description: 'Error',
      });
    };

    setLoading(true);
    callServerAPI('POST', '/post/event', { data }, onSuccess, onError);
  };

  const territoriesData =
    territories.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const cropsData = userRegion
    ? crops.map((item) => ({
        label: item.name,
        value: item.id,
      }))
    : [];

  const productsData =
    products.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const eventTemplatesData =
    eventTemplates.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  return (
    <div className="w-full">
      <Loader loading={loading} />
      <Card
        className={
          loading
            ? 'opacity-50 pointer-events-none w-full md:w-1/2 mxto-auto'
            : 'w-full md:w-1/2 mx-auto'
        }
      >
        <CardHeader>
          <CardTitle>Add Event</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 ">
          <div className="w-full">
            <Label htmlFor="eventName">Event Address</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter the event address"
              required
            />
          </div>
          <div className="w-full">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={userRegion?.name || 'N/A'}
              disabled
              placeholder="Region"
            />
          </div>
          <div className="w-full">
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
            <Label htmlFor="eventTemId">Event Category</Label>
            <Select value={eventTemId} onValueChange={setEventTemId}>
              <SelectTrigger id="eventTemId" className="w-full">
                <SelectValue placeholder="Select the event category" />
              </SelectTrigger>
              <SelectContent>
                {eventTemplatesData.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="crops">Crop</Label>
            <Select
              onValueChange={(value) => {
                if (!selectedCrops.find((item) => item.value === value)) {
                  const crop = cropsData.find((item) => item.value === value);
                  setSelectedCrops([...selectedCrops, crop]);
                }
              }}
            >
              <SelectTrigger id="crops" className="w-full">
                <SelectValue placeholder="Select the crop" />
              </SelectTrigger>
              <SelectContent>
                {cropsData.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCrops.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center  px-2 py-1 rounded"
                >
                  <span className="text-sm">{item.label}</span>
                  <X
                    className="h-4 w-4 ml-1 cursor-pointer"
                    onClick={() =>
                      setSelectedCrops(
                        selectedCrops.filter(
                          (crop) => crop.value !== item.value
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="products">Product</Label>
            <Select
              onValueChange={(value) => {
                if (!selectedProducts.find((item) => item.value === value)) {
                  const product = productsData.find(
                    (item) => item.value === value
                  );
                  setSelectedProducts([...selectedProducts, product]);
                }
              }}
            >
              <SelectTrigger id="products" className="w-full">
                <SelectValue placeholder="Select the product" />
              </SelectTrigger>
              <SelectContent>
                {productsData.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedProducts.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center px-2 py-1 rounded"
                >
                  <span className="text-sm">{item.label}</span>
                  <X
                    className="h-4 w-4 ml-1 cursor-pointer"
                    onClick={() =>
                      setSelectedProducts(
                        selectedProducts.filter(
                          (product) => product.value !== item.value
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="cpoName">CPO Name</Label>
            <Input
              id="cpoName"
              value={cpoName}
              onChange={(e) => setCpoName(e.target.value)}
              placeholder="Enter the CPO name"
              required
            />
          </div>
          <div>
            <Label htmlFor="dateBegin">Date Begin</Label>
            <Popover
              open={isDatePickerOpen === 'dateBegin'}
              onOpenChange={(open) =>
                setDatePickerOpen(open ? 'dateBegin' : '')
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateBegin
                    ? dayjs(dateBegin).format('DD-MM-YYYY')
                    : 'Select a Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateBegin}
                  onSelect={(selectedDate) => {
                    setDateBegin(selectedDate);
                    setDatePickerOpen('');
                  }}
                  disabled={(d) => d < new Date()}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Input
                    type="time"
                    value={beginTime}
                    onChange={(e) => setBeginTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="dateEnd">Date End</Label>
            <Popover
              open={isDatePickerOpen === 'dateEnd'}
              onOpenChange={(open) => setDatePickerOpen(open ? 'dateEnd' : '')}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateEnd
                    ? dayjs(dateEnd).format('DD-MM-YYYY')
                    : 'Select a Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateEnd}
                  onSelect={(selectedDate) => {
                    setDateEnd(selectedDate);
                    setDatePickerOpen('');
                  }}
                  disabled={(d) => d < new Date()}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={handleAddEvent}
            disabled={loading}
            className="w-full col-span-2 "
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEvent;
