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
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Loader from '@/components/Loader';

const AddRMEvent = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { territories, region: userRegion } = user;
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState('');
  const [dateBegin, setDateBegin] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());
  const [crops, setCrops] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [cpoName, setCpoName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventTemId, setEventTemId] = useState('');
  const [eventTemplates, setEventTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [templateCategoryId, setTemplateCategoryId] = useState('');
  const [rating, setRating] = useState(1);

  useEffect(() => {
    if (!userRegion) return;
    const onSuccess = (response) => {
      setCrops(response.data);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch crops', { description: 'Error' });
      setLoading(false);
    };
    setLoading(true);
    callApi('GET', `/events/crops`, null, onSuccess, onError);
  }, [userRegion]);

  useEffect(() => {
    const onSuccess = (response) => {
      setProducts(response.data);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch products', { description: 'Error' });
      setLoading(false);
    };
    setLoading(true);
    callApi('GET', `/events/products`, null, onSuccess, onError);
  }, []);

  useEffect(() => {
    if (!territory) return;
    const onSuccess = (response) => {
      setEventTemplates(response.data);
      setLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch event templates', { description: 'Error' });
      setLoading(false);
    };
    setLoading(true);
    callApi('GET', `/events/templates`, null, onSuccess, onError);
  }, [territory]);

  useEffect(() => {
    if (territory) {
      callApi(
        'GET',
        `/customers/territory?territory_id=${territory}`,
        {},
        (res) => setCustomers(res.data),
        () =>
          toast.error('Error fetching customers', {
            description: 'Please try again',
          })
      );
    }
  }, [territory]);

  const handleAddEvent = () => {
    if (
      territory === '' ||
      eventName === '' ||
      eventTemId === '' ||
      !dateBegin ||
      !dateEnd
    ) {
      toast.error('Please fill all the fields', { description: 'Error' });
      return;
    }

    const data: {
      name: string;
      crop_id: string[];
      demo_product_id: string[];
      date_begin: string;
      date_end: string;
      region_id: number;
      territory_id: string;
      organizer_id: number;
      cpo_name: string;
      rsm_id: number;
      event_type_id: string;
      company_id: number;
      dealer_ids: string[];
      event_temp_type_id: string;
      id?: number;
      event_stage_id?: number;
    } = {
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
      dealer_ids: selectedCustomers.map((item) => item.value),
      event_temp_type_id: templateCategoryId,
    };

    const onCreatedSuccess = () => {
      toast.success('Event added successfully', { description: 'Success' });
      setLoading(false);
      navigate(-1);
    };
    const onCreatedError = () => {
      toast.error('Failed to add event', { description: 'Error' });
      setLoading(false);
    };
    const onSuccess = (response) => {
      data.id = response.data.id;
      data.event_stage_id = response.data.stage_id;
      callServerAPI(
        'POST',
        '/rate/event',
        {
          data: { event_id: data.id, rating: (Number(rating) + 1).toString() },
        },
        () => {
          toast.success('Event added successfully and rated', {
            description: 'Success',
          });
          callApi(
            'POST',
            '/events/create',
            data,
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

  const customersData =
    customers.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const templateCategoryData =
    eventTemplates
      .find((item) => item.id === eventTemId)
      ?.event_temp_type_ids.map((item) => ({
        label: item.name,
        value: item.id,
      })) || [];

  const handleMultiSelect = (setState, currentState, value) => {
    const selected = currentState.find((item) => item.value === value);
    if (selected) {
      setState(currentState.filter((item) => item.value !== value));
    } else {
      const item =
        customersData.find((d) => d.value === value) ||
        cropsData.find((d) => d.value === value) ||
        productsData.find((d) => d.value === value);
      if (item) setState([...currentState, item]);
    }
  };

  return (
    <div className="w-full md:w-3/4 mx-auto p-4">
      <Loader loading={loading} />
      <Card className="shadow-lg bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Add Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <Label htmlFor="eventName" className="text-sm font-medium">
                Event Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="eventName"
                placeholder="Enter the event address"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label htmlFor="region" className="text-sm font-medium">
                Region
              </Label>
              <Input
                id="region"
                placeholder="Region"
                value={userRegion?.name || 'N/A'}
                disabled
                className="mt-1 w-full"
              />
            </div>

            <div>
              <Label htmlFor="territory" className="text-sm font-medium">
                Territory <span className="text-red-500">*</span>
              </Label>
              <Select value={territory} onValueChange={setTerritory}>
                <SelectTrigger className="mt-1 w-full">
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
              <Label htmlFor="dealer" className="text-sm font-medium">
                Dealer
              </Label>
              <Select
                onValueChange={(value) =>
                  handleMultiSelect(
                    setSelectedCustomers,
                    selectedCustomers,
                    value
                  )
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select the dealer" />
                </SelectTrigger>
                <SelectContent>
                  {customersData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.some(
                            (c) => c.value === item.value
                          )}
                          readOnly
                          className="mr-2"
                        />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCustomers.map((item) => (
                  <span
                    key={item.value}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="eventCategory" className="text-sm font-medium">
                Event Category <span className="text-red-500">*</span>
              </Label>
              <Select value={eventTemId} onValueChange={setEventTemId}>
                <SelectTrigger className="mt-1 w-full">
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
              <Label htmlFor="categoryType" className="text-sm font-medium">
                Category Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={templateCategoryId}
                onValueChange={setTemplateCategoryId}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select the event category type" />
                </SelectTrigger>
                <SelectContent>
                  {templateCategoryData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="crop" className="text-sm font-medium">
                Crop
              </Label>
              <Select
                onValueChange={(value) =>
                  handleMultiSelect(setSelectedCrops, selectedCrops, value)
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select the crop" />
                </SelectTrigger>
                <SelectContent>
                  {cropsData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCrops.some(
                            (c) => c.value === item.value
                          )}
                          readOnly
                          className="mr-2"
                        />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCrops.map((item) => (
                  <span
                    key={item.value}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="product" className="text-sm font-medium">
                Product
              </Label>
              <Select
                onValueChange={(value) =>
                  handleMultiSelect(
                    setSelectedProducts,
                    selectedProducts,
                    value
                  )
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select the product" />
                </SelectTrigger>
                <SelectContent>
                  {productsData.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.some(
                            (p) => p.value === item.value
                          )}
                          readOnly
                          className="mr-2"
                        />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProducts.map((item) => (
                  <span
                    key={item.value}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="cpoName" className="text-sm font-medium">
                CPO Name
              </Label>
              <Input
                id="cpoName"
                placeholder="Enter the CPO name"
                value={cpoName}
                onChange={(e) => setCpoName(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Date Begin <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 text-left">
                    {dayjs(dateBegin).format('DD/MM/YYYY HH:mm')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateBegin}
                    onSelect={setDateBegin}
                    initialFocus
                    defaultMonth={dateBegin}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Date End <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 text-left">
                    {dayjs(dateEnd).format('DD/MM/YYYY HH:mm')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateEnd}
                    onSelect={setDateEnd}
                    initialFocus
                    defaultMonth={dateEnd}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium">Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={handleAddEvent} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRMEvent;
