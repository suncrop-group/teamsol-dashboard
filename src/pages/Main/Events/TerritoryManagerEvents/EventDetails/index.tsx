import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCheck, Eye, MoreVertical, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { priceFormatter, parseCustomDate, uploadToCloudinary } from '@/utils';
import { Loader2 } from 'lucide-react';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';

const statusStyles = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  quotation: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  draft: 'bg-red-100 text-red-800',
  confirmed: 'bg-green-100 text-green-800',
  approval: 'bg-yellow-100 text-yellow-800',
  approve: 'bg-green-100 text-green-800',
  submit: 'bg-green-100 text-green-800',
  'to report': 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  refuse: 'bg-red-100 text-red-800',
  refused: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ExpensesCard = ({
  item,
  toggleExpenseImages,
  setToggleExpenseImages,
}: {
  item: {
    id: string;
    name: string;
    description?: string;
    amount?: number;
    createdAt?: string;
    odooStatus?: string;
    status?: string;
    url?: string;
    urls?: string[];
  };
  toggleExpenseImages: string[];
  setToggleExpenseImages: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleImages = () => {
    setToggleExpenseImages((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      } else {
        return [...prev, item.id];
      }
    });
  };

  return (
    <>
      <Card
        className={`w-full ${item.odooStatus !== 'draft' ? 'opacity-50' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex-1">{item?.name}</span>
            <span className="text-sm">{priceFormatter(item?.amount)} PKR</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm text-gray-600">#{item?.id}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex flex-col gap-2 flex-1">
              <span className="text-sm text-gray-600">
                {dayjs(item?.createdAt).format('MM-DD-YYYY')} -{' '}
                {dayjs(item?.createdAt).format('hh:mm A')} 🕒
              </span>
              {item?.description && (
                <span className="text-sm text-gray-600 line-clamp-2">
                  {item?.description}
                </span>
              )}
              <div className="flex items-center gap-2">
                {item?.url && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open(item?.url, '_blank')}
                    className="p-0 h-auto"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                )}
                {item?.urls && item.urls.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleImages}
                    className="text-blue-500 hover:text-blue-700 p-0 h-auto"
                  >
                    {toggleExpenseImages.includes(item.id)
                      ? `Hide Image${item.urls.length > 1 ? 's' : ''}`
                      : `Show Image${item.urls.length > 1 ? 's' : ''}`}{' '}
                    ({item.urls.length})
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  statusStyles[item.status.toLowerCase()]
                }`}
              >
                {item.status}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  statusStyles[item.odooStatus.toLowerCase()]
                }`}
              >
                {item.odooStatus}
              </span>
            </div>
          </div>

          {/* Image Gallery for Expenses */}
          {item?.urls &&
            item.urls.length > 0 &&
            toggleExpenseImages.includes(item.id) && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {item.urls.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Expense image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(imageUrl)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div
                        className="absolute bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center"
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <Eye
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          size={16}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Image Modal for Expenses */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Expense Image"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const TMCreatedEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [addAttendeeLoading, setAddAttendeeLoading] = useState(false);
  const [eventExpenses, setEventExpenses] = useState([]);

  const [updateStatusFetching, setUpdateStatusFetching] = useState(false);
  const [eventStageList, setEventStageList] = useState([]);
  const [updatingEventStageId, setUpdatingEventStageId] = useState(null);
  const [attendeesSearchResult, setAttendeesSearchResult] = useState([]);
  const [toggleExpenseImages, setToggleExpenseImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [eventImagesRemoving, setEventImagesRemoving] = useState<string[]>([]);
  const [selectedEventImage, setSelectedEventImage] = useState<string | null>(
    null
  );
  const [attendee, setAttendee] = useState({
    name: '',
    phone_no: '',
    land_area: '',
    farmer_verify: false,
  });
  const [attendeeList, setAttendeeList] = useState([]);
  const [event, setEvent] = useState({
    id: '',
    order_sequence: '',
    date_begin: '',
    date_end: '',
    region: { name: '' },
    territory: { name: '' },
    event_type: { name: '' },
    crops: [],
    demo_products: [],
    attendees: [],
    name: '',
    event_stage_id: 0,
    verified: false,
    event_stage: { name: '' },
    images: [],
  });
  const [isAttendeeDialogOpen, setIsAttendeeDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);

  const fetchAttendees = () => {
    const onSuccessfulFetch = (data) => {
      setAttendeeList(
        data.data.sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        )
      );
      setAttendeeLoading(false);
    };
    const onError = () => {
      toast.error('Failed to fetch attendees', { description: 'Error' });
      setAttendeeLoading(false);
    };
    setAttendeeLoading(true);
    callApi(
      'GET',
      `/events/attendee?event_id=${eventId}`,
      null,
      onSuccessfulFetch,
      onError
    );
  };

  const fetchEventDetails = (loading = true) => {
    if (loading) setLoading(true);
    callApi(
      'GET',
      `/events/single?event_id=${eventId}`,
      null,
      (response) => {
        setLoading(false);
        setEvent(response.data.event);
        setEventExpenses(
          response.data.expenses.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          )
        );
      },
      () => {
        setLoading(false);
        toast.error('Failed to fetch event details', { description: 'Error' });
      }
    );
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchAttendees();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const onStageChange = (stageId) => {
    if (event?.event_stage_id === stageId) {
      toast.error('Event stage is already updated', { description: 'Error' });
      return;
    }
    setUpdatingEventStageId(stageId);
    const onSuccess = () => {
      toast.success('Event Stage Updated successfully', {
        description: 'Success',
      });
      fetchEventDetails(false);
      setIsStageDialogOpen(false);
      setUpdateStatusFetching(false);
      setUpdatingEventStageId(null);
    };
    const onError = () => {
      toast.error('Failed to update event stage', { description: 'Error' });
      setUpdateStatusFetching(false);
      setUpdatingEventStageId(null);
    };
    const onServerSuccess = () => {
      callApi(
        'PATCH',
        '/events/stage',
        { event_id: event.id, stage_id: stageId },
        onSuccess,
        onError
      );
    };
    const onServerError = () => {
      toast.error('Failed to update event stage', { description: 'Error' });
      setUpdatingEventStageId(null);
      setUpdateStatusFetching(false);
    };
    callServerAPI(
      'POST',
      `/event/stage/change`,
      { data: { event_id: event.id, stage_id: stageId } },
      onServerSuccess,
      onServerError
    );
  };

  const handleAddAttendee = () => {
    if (!attendee.name || !attendee.phone_no || !attendee.land_area) {
      toast.error('Please fill all fields', { description: 'Error' });
      return;
    }
    const data: {
      event_id: string;
      name: string;
      phone_no: string;
      land_area: string;
      farmer_verify: string;
      id?: string;
    } = {
      event_id: event.id,
      name: attendee.name,
      phone_no: attendee.phone_no,
      land_area: attendee.land_area,
      farmer_verify: attendee.farmer_verify ? 'True' : 'False',
    };
    const onSuccess = () => {
      setAddAttendeeLoading(false);
      toast.success('Attendee added successfully', { description: 'Success' });
      fetchAttendees();
      setIsAttendeeDialogOpen(false);
      setAttendee({
        name: '',
        phone_no: '',
        land_area: '',
        farmer_verify: false,
      });
      setAttendeesSearchResult([]);
    };
    const onError = () => {
      setAddAttendeeLoading(false);
      toast.error('Failed to add attendee', { description: 'Error' });
    };
    const onServerSuccess = (response) => {
      if (response.data.id) {
        data.id = response.data.id;
        callApi(
          'POST',
          '/events/attendee',
          {
            ...data,
            farmer_verify: attendee.farmer_verify,
          },
          onSuccess,
          onError
        );
      }
    };
    const onServerError = () => {
      setAddAttendeeLoading(false);
      toast.error('Failed to add attendee', { description: 'Error' });
    };
    setAddAttendeeLoading(true);
    callServerAPI(
      'POST',
      `/post/event/attendees`,
      { data: { ...data } },
      onServerSuccess,
      onServerError
    );
  };

  //   eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearchAttendee = React.useCallback(
    debounce((phone_no) => {
      if (!phone_no) {
        toast.error('Please enter phone number', { description: 'Error' });
        return;
      }
      if (phone_no.length < 10) return;
      const onSuccess = (response) => {
        setAttendeesSearchResult(response.data);
      };
      const onError = () => {
        toast.error('Failed to search attendee', { description: 'Error' });
      };
      callApi(
        'GET',
        `/events/attendee/search?phone_no=${phone_no}`,
        null,
        onSuccess,
        onError
      );
    }, 500),
    []
  );

  const handlePhoneNumberChange = (text) => {
    setAttendee((prevState) => ({ ...prevState, phone_no: text }));
    debouncedSearchAttendee(text);
  };

  const fetchEventStagesList = () => {
    const onSuccess = (response) => {
      setIsActionsDialogOpen(false);
      setUpdateStatusFetching(false);
      setIsStageDialogOpen(true);
      setEventStageList(response.data);
    };
    const onError = () => {
      setUpdateStatusFetching(false);
      toast.error('Failed to fetch event stage', { description: 'Error' });
    };
    setUpdateStatusFetching(true);
    callApi('GET', `/events/stages`, null, onSuccess, onError);
  };

  const endDate = parseCustomDate(event?.date_end);
  const canMakeAction = dayjs().isBefore(dayjs(endDate).add(4, 'day'));

  // Image management functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > 5) {
      toast.error('You can only upload up to 5 files at a time');
      return;
    }

    const validFiles: File[] = [];
    let hasError = false;

    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 5MB limit`);
        hasError = true;
        break;
      }

      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`File "${file.name}" is not a valid image or PDF`);
        hasError = true;
        break;
      }

      validFiles.push(file);
    }

    if (!hasError) {
      setFiles(validFiles);
    } else {
      // Clear the input
      e.target.value = '';
    }
  };

  const uploadFilesToEvent = async () => {
    if (files.length === 0) return;

    setUploadLoading(true);

    try {
      const uploadPromises = files.map((file, index) => {
        const renamedFile = new File([file], `${index + 1}-${file.name}`, {
          type: file.type,
        });
        return uploadToCloudinary(
          renamedFile,
          `/events/tm/${event.id}`,
          `${index + 1}-${file.name.split('.')[0]}`
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // First upload to server
      await new Promise((resolve, reject) => {
        callServerAPI(
          'POST',
          '/post/images',
          {
            data: {
              urls: uploadedUrls,
              company_id: user.company.id,
              event_id: event.id,
            },
          },
          resolve,
          reject
        );
      });

      // Then update local database
      await new Promise((resolve, reject) => {
        callApi(
          'PATCH',
          `/events/update?event_id=${event.id}`,
          {
            images: uploadedUrls,
          },
          resolve,
          reject
        );
      });

      toast.success('Files uploaded successfully');
      setFiles([]);
      fetchEventDetails(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploadLoading(false);
    }
  };

  const deleteEventImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    if (eventImagesRemoving.includes(imageUrl)) {
      toast.error('Image is already being removed');
      return;
    }

    setEventImagesRemoving((prev) => [...prev, imageUrl]);

    try {
      // First delete from server
      await new Promise((resolve, reject) => {
        callServerAPI(
          'POST',
          '/delete/event/images',
          {
            data: {
              urls: [imageUrl],
              event_id: event.id,
              company_id: user.company.id,
            },
          },
          resolve,
          reject
        );
      });

      // Then update local database
      await new Promise((resolve, reject) => {
        callApi(
          'PATCH',
          `/events/update?event_id=${event.id}`,
          {
            images: event?.images
              ? event.images.filter((img: string) => img !== imageUrl)
              : [],
          },
          resolve,
          reject
        );
      });

      toast.success('Image removed successfully');
      fetchEventDetails(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove image');
    } finally {
      setEventImagesRemoving((prev) => prev.filter((img) => img !== imageUrl));
    }
  };

  return (
    <div className="">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Event Detail #{event?.id}</CardTitle>
                <Dialog
                  open={isActionsDialogOpen}
                  onOpenChange={setIsActionsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Actions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 flex flex-col">
                      {!event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') && (
                        <>
                          <Button
                            disabled={
                              !canMakeAction ||
                              event?.event_stage?.name
                                ?.toLowerCase()
                                ?.includes('cancel') ||
                              event?.event_stage?.name
                                ?.toLowerCase()
                                ?.includes('complete') ||
                              event?.verified
                            }
                            onClick={() => {
                              setIsActionsDialogOpen(false);
                              setIsAttendeeDialogOpen(true);
                            }}
                          >
                            Add Attendees
                          </Button>
                          <Button
                            disabled={
                              !canMakeAction ||
                              event?.event_stage?.name
                                ?.toLowerCase()
                                ?.includes('cancel') ||
                              event?.event_stage?.name
                                ?.toLowerCase()
                                ?.includes('complete') ||
                              event?.verified
                            }
                            onClick={() => {
                              setIsActionsDialogOpen(false);
                              navigate('/expenses/add', {
                                state: {
                                  event_id: event.id,
                                  event_title: event.name,
                                  event_description: event.event_type.name,
                                },
                              });
                            }}
                          >
                            Add Expense
                          </Button>
                        </>
                      )}
                      <Button
                        disabled={
                          updateStatusFetching ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes('cancel') ||
                          event?.verified ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes('complete') ||
                          !canMakeAction
                        }
                        onClick={fetchEventStagesList}
                      >
                        {event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel')
                          ? 'Cancelled'
                          : event?.verified
                          ? 'Verified'
                          : updateStatusFetching
                          ? 'Getting Event Stages...'
                          : 'Update Event Stage'}
                      </Button>
                      <p className="text-sm text-gray-500 text-center">
                        Actions can only be performed at least four days after
                        the event's end date, and the event has not been
                        cancelled.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="font-semibold">Event Address</Label>
                  <p className="text-sm">{event?.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Event Time</Label>
                  <p className="text-sm">
                    From {event?.date_begin} <br />
                    To {event?.date_end} 🕒
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Location</Label>
                  <p className="text-sm">
                    {event?.region?.name} - {event?.territory?.name}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Event Type</Label>
                  <p className="text-sm">{event?.event_type?.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Crops</Label>
                  <p className="text-sm">
                    {event?.crops?.map((item) => item.name).join(', ')}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold text-lg">Products</Label>
                  <p className="text-sm">
                    {event?.demo_products?.map((item) => item.name).join(', ')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event Images Section */}
            {event?.images && event.images.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Event Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {event.images.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedEventImage(imageUrl)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center">
                          <Eye
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            size={20}
                          />
                        </div>
                        {/* Delete button */}
                        {canMakeAction &&
                          !event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes('cancel') &&
                          !event?.verified && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEventImage(imageUrl);
                              }}
                              disabled={eventImagesRemoving.includes(imageUrl)}
                            >
                              {eventImagesRemoving.includes(imageUrl) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Upload Section */}
            {canMakeAction &&
              !event?.event_stage?.name?.toLowerCase()?.includes('cancel') &&
              !event?.verified && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Upload Event Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="flex-1"
                          disabled={uploadLoading}
                        />
                        <Button
                          onClick={uploadFilesToEvent}
                          disabled={files.length === 0 || uploadLoading}
                          className="whitespace-nowrap"
                        >
                          {uploadLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload ({files.length})
                            </>
                          )}
                        </Button>
                      </div>
                      {files.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Selected: {files.map((f) => f.name).join(', ')}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        You can upload up to 5 images at once. Maximum file
                        size: 5MB per image.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

            <Card className="mt-6">
              <CardContent>
                <div>
                  <Label className="font-semibold text-lg">Attendees</Label>
                  <div className="space-y-4 mt-2">
                    {attendeeList.map((item) => {
                      // Check farmer_verify instead of attended_event_ids for "Farmer Host" tag
                      const isFarmerHost = item.farmer_verify;
                      return (
                        <Card key={item.id} className={`w-full`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold flex-1">
                                {item.name}
                              </span>
                              {isFarmerHost && (
                                <span
                                  className={`text-xs px-2 py-1 rounded ${statusStyles.sent}`}
                                >
                                  Farmer Host
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Phone No: {item.phone_no}
                            </p>
                            <p className="text-sm text-gray-600">
                              Land Area: {item.land_area} Acre
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {attendeeList.length === 0 && (
                      <div className="text-center text-gray-500">
                        {attendeeLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                          'No attendees found'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent>
                <div>
                  <Label className="font-semibold text-lg">Expenses</Label>
                  <div className="space-y-4 mt-2">
                    {eventExpenses.map((item, index) => (
                      <ExpensesCard
                        key={index}
                        item={item}
                        toggleExpenseImages={toggleExpenseImages}
                        setToggleExpenseImages={setToggleExpenseImages}
                      />
                    ))}
                    {eventExpenses.length === 0 && (
                      <div className="text-center text-gray-500">
                        {attendeeLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        ) : (
                          'No Expense found'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog
            open={isAttendeeDialogOpen}
            onOpenChange={setIsAttendeeDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Attendees</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone_no">Phone No</Label>
                  <Input
                    id="phone_no"
                    placeholder="Enter phone no"
                    value={attendee.phone_no}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  />
                  {attendeesSearchResult.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {attendeesSearchResult.map((item, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer"
                          onClick={() => {
                            setAttendee({
                              name: item.name,
                              phone_no: item.phone_no,
                              land_area: item.land_area.toString(),
                              farmer_verify: false,
                            });
                            setAttendeesSearchResult([]);
                          }}
                        >
                          <CardContent className="p-2">
                            <span className="text-sm">
                              {item.name.length > 20
                                ? `${item.name.slice(0, 20)}...`
                                : item.name}
                            </span>
                            <p className="text-sm text-gray-600">
                              {item.phone_no}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    value={attendee.name}
                    onChange={(e) =>
                      setAttendee({ ...attendee, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="land_area">Land Area</Label>
                  <Input
                    id="land_area"
                    placeholder="Enter land area"
                    type="text"
                    value={attendee.land_area}
                    onChange={(e) =>
                      setAttendee({
                        ...attendee,
                        land_area: e.target.value.replace(/[^0-9.]/g, ''),
                      })
                    }
                  />
                </div>

                {/* Host Farmer Checkbox */}
                <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                  <input
                    id="farmer_verify"
                    type="checkbox"
                    checked={attendee.farmer_verify}
                    onChange={(e) =>
                      setAttendee((prev) => ({
                        ...prev,
                        farmer_verify: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label
                    htmlFor="farmer_verify"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Host Farmer
                  </Label>
                </div>
                <Button
                  onClick={handleAddAttendee}
                  disabled={addAttendeeLoading}
                >
                  {addAttendeeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Attendee
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Event Stage</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {eventStageList.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => onStageChange(item.id)}
                  >
                    <CardContent className="p-2 flex justify-between items-center">
                      <span>{item.name}</span>
                      {updatingEventStageId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : item.id === event.event_stage_id ? (
                        <CheckCheck className="h-4 w-4 text-blue-600" />
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Event Image Modal */}
          {selectedEventImage && (
            <Dialog
              open={!!selectedEventImage}
              onOpenChange={() => setSelectedEventImage(null)}
            >
              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <div className="relative">
                  <img
                    src={selectedEventImage}
                    alt="Event Image"
                    className="w-full h-auto max-h-[85vh] object-contain"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setSelectedEventImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
};

export default TMCreatedEventDetails;
