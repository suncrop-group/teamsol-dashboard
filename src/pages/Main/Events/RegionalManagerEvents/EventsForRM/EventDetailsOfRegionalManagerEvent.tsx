import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { parseCustomDate, priceFormatter, uploadToCloudinary } from '@/utils';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import {
  Loader2,
  CheckCheck,
  Eye,
  MoreVertical,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

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
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

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
        className={`w-full ${
          item.odooStatus === 'draft' ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={() => item.odooStatus !== 'draft' && null}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">{item?.name}</p>
            <p className="text-sm">{priceFormatter(item?.amount)} PKR</p>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-sm text-gray-600">#{item?.id}</p>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-gray-600">
                {dayjs(item?.createdAt).format('MM-DD-YYYY')} -{' '}
                {dayjs(item?.createdAt).format('hh:mm A')} 🕒
              </p>
              {item?.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item?.description}
                </p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleImages();
                    }}
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
                  statusStyles[item.status?.toLowerCase()]
                }`}
              >
                {item.status}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  statusStyles[item.odooStatus?.toLowerCase()]
                }`}
              >
                {item.odooStatus}
              </span>
            </div>
          </div>

          {/* Expense Image Gallery */}
          {item?.urls &&
            item.urls.length > 0 &&
            toggleExpenseImages.includes(item.id) && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {item.urls.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(imageUrl);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Expense image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(imageUrl);
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Image Modal */}
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

const EventDetailsOfRegionalManagerEvent = () => {
  const { eventId } = useParams();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [eventExpenses, setEventExpenses] = useState([]);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [addAttendeeLoading, setAddAttendeeLoading] = useState(false);
  const [updateStatusFetching, setUpdateStatusFetching] = useState(false);
  const [verifyEventLoading, setVerifyEventLoading] = useState(false);
  const [rsmAttendedLoading, setRsmAttendedLoading] = useState(false);
  const [eventStageList, setEventStageList] = useState([]);
  const [updatingEventStageId, setUpdatingEventStageId] = useState(null);
  const [attendeesSearchResult, setAttendeesSearchResult] = useState([]);
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
    dealers: [],
    verified: false,
    event_stage: { name: '' },
    rsmAttended: false,
    images: [],
  });

  const [isAddAttendeeOpen, setIsAddAttendeeOpen] = useState(false);
  const [isUpdateStageOpen, setIsUpdateStageOpen] = useState(false);
  const [isVerifyEventOpen, setIsVerifyEventOpen] = useState(false);
  const [isMarkAttendedOpen, setIsMarkAttendedOpen] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [toggleExpenseImages, setToggleExpenseImages] = useState([]);
  const [eventImagesRemoving, setEventImagesRemoving] = useState([]);
  const [selectedEventImage, setSelectedEventImage] = useState(null);

  const fetchAttendees = () => {
    setAttendeeLoading(true);
    callApi(
      'GET',
      `/events/attendee?event_id=${eventId}`,
      null,
      (data) => {
        setAttendeeList(
          data.data.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          )
        );
        setAttendeeLoading(false);
      },
      () => {
        toast.error('Failed to fetch attendees', { description: 'Error' });
        setAttendeeLoading(false);
      }
    );
  };

  const fetchEventDetails = (loading = true) => {
    if (loading) setLoading(true);
    callApi(
      'GET',
      `/events/single?event_id=${eventId}`,
      null,
      (response) => {
        setEvent(response.data.event);
        setEventExpenses(
          response.data.expenses.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          )
        );
        setLoading(false);
      },
      () => {
        toast.error('Failed to fetch event details', { description: 'Error' });
        setLoading(false);
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

  useEffect(() => {
    if (event?.id) {
      document.title = `Event Detail #${event?.id}`;
    }
  }, [event]);

  const onStageChange = (stageId) => {
    if (event?.event_stage_id === stageId) {
      toast.error('Event stage is already updated', { description: 'Error' });
      return;
    }
    setUpdatingEventStageId(stageId);
    callServerAPI(
      'POST',
      `/event/stage/change`,
      { data: { event_id: event.id, stage_id: stageId } },
      () => {
        callApi(
          'PATCH',
          '/events/stage',
          { event_id: event.id, stage_id: stageId },
          () => {
            toast.success('Event Stage Updated successfully', {
              description: 'Success',
            });
            fetchEventDetails(false);
            setIsUpdateStageOpen(false);
            setUpdateStatusFetching(false);
            setUpdatingEventStageId(null);
          },
          () => {
            toast.error('Failed to update event stage', {
              description: 'Error',
            });
            setUpdateStatusFetching(false);
            setUpdatingEventStageId(null);
          }
        );
      },
      () => {
        toast.error('Failed to update event stage', { description: 'Error' });
        setUpdateStatusFetching(false);
        setUpdatingEventStageId(null);
      }
    );
  };

  const onConfirmEvent = () => {
    const payload = { verified: true, verified_by: user?.id };
    const onSuccess = () => {
      setVerifyEventLoading(false);
      setIsVerifyEventOpen(false);
      toast.success('Event confirmed successfully', { description: 'Success' });
      fetchEventDetails();
    };

    const onError = (error) => {
      setVerifyEventLoading(false);
      setIsVerifyEventOpen(false);
      toast.error(error?.message || 'Failed to confirm event', {
        description: 'Error',
      });
    };

    // First approach: Try direct main API update (matching mobile logic)
    const onConfirmEventSuccess = () => {
      callApi(
        'PATCH',
        `/events/update?event_id=${event.id}`,
        payload,
        () => {
          onSuccess();
        },
        (error) => {
          onError(error);
        }
      );
    };

    const onConfirmEventError = () => {
      setVerifyEventLoading(false);
      setIsVerifyEventOpen(false);
      toast.error('Failed to confirm event via server API', {
        description: 'Error',
      });
    };

    setVerifyEventLoading(true);

    const data = {
      event_id: event.id,
      rsm_id: user?.id,
      user_id: user?.id,
      is_verify: 'True',
      is_verified: true,
      verified_by: user?.id,
    };

    callServerAPI(
      'POST',
      `/verify/event`,
      { data },
      onConfirmEventSuccess,
      onConfirmEventError
    );
  };

  const onConfirmEventAttended = () => {
    setRsmAttendedLoading(true);
    callServerAPI(
      'POST',
      `/rsm/attended`,
      { data: { event_id: event.id } },
      () => {
        callApi(
          'PATCH',
          `/events/update?event_id=${event.id}`,
          { rsmAttended: true },
          () => {
            setRsmAttendedLoading(false);
            setIsMarkAttendedOpen(false);
            toast.success('Event marked as attended successfully', {
              description: 'Success',
            });
            fetchEventDetails();
          },
          (error) => {
            setRsmAttendedLoading(false);
            setIsMarkAttendedOpen(false);
            toast.error(error?.message || 'Failed to confirm event', {
              description: 'Error',
            });
          }
        );
      },
      () => {
        setRsmAttendedLoading(false);
        setIsMarkAttendedOpen(false);
        toast.error('Failed to confirm event', { description: 'Error' });
      }
    );
  };

  const handleAddAttendee = () => {
    if (!attendee.name || !attendee.phone_no || !attendee.land_area) {
      toast.error('Please fill all fields', { description: 'Error' });
      return;
    }
    if (attendee.phone_no.length < 10) return;

    setAddAttendeeLoading(true);
    const data: {
      event_id: string;
      name: string;
      phone_no: string;
      land_area: string;
      farmer_verify: string;
      id?: number;
    } = {
      event_id: event.id,
      name: attendee.name,
      phone_no: attendee.phone_no,
      land_area: attendee.land_area,
      farmer_verify: attendee.farmer_verify ? 'True' : 'False',
    };
    callServerAPI(
      'POST',
      `/post/event/attendees`,
      { data },
      (response: { data: { id?: number } }) => {
        if (response.data.id) {
          data.id = response.data.id;
          callApi(
            'POST',
            '/events/attendee',
            {
              ...data,
              farmer_verify: attendee.farmer_verify,
            },
            () => {
              setAddAttendeeLoading(false);
              toast.success('Attendee added successfully', {
                description: 'Success',
              });
              fetchAttendees();
              setIsAddAttendeeOpen(false);
              setAttendee({
                name: '',
                phone_no: '',
                land_area: '',
                farmer_verify: false,
              });
              setAttendeesSearchResult([]);
            },
            () => {
              setAddAttendeeLoading(false);
              toast.error('Failed to add attendee', { description: 'Error' });
            }
          );
        }
      },
      () => {
        setAddAttendeeLoading(false);
        toast.error('Failed to add attendee', { description: 'Error' });
      }
    );
  };

  const handlePhoneNumberChange = (text) => {
    setAttendee((prev) => ({ ...prev, phone_no: text }));
    // Search functionality can be added here if needed
  };

  const fetchEventStagesList = () => {
    setUpdateStatusFetching(true);
    callApi(
      'GET',
      `/events/stages`,
      null,
      (response) => {
        setEventStageList(response.data);
        setUpdateStatusFetching(false);
        setIsUpdateStageOpen(true);
      },
      () => {
        setUpdateStatusFetching(false);
        toast.error('Failed to fetch event stage', { description: 'Error' });
      }
    );
  };

  const uploadFilesToEvent = async () => {
    if (files.length === 0) return;

    setRemoveLoading(true);

    try {
      const uploadPromises = files.map((file, index) => {
        const renamedFile = new File([file], `${index + 1}-${file.name}`, {
          type: file.type,
        });
        return uploadToCloudinary(
          renamedFile,
          `/events/rm/${event.id}`,
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
              company_id: user.company_id,
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
      setRemoveLoading(false);
    }
  };

  const deleteEventImage = async (imageUrl) => {
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
              company_id: user.company_id,
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
              ? event.images.filter((img) => img !== imageUrl)
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

      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" is not a valid image`);
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

  const endDate = parseCustomDate(event?.date_end);
  const canMakeAction = dayjs().isBefore(dayjs(endDate).add(4, 'day'));

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Event Details #{event?.id}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {!event?.event_stage?.name
                    ?.toLowerCase()
                    ?.includes('cancel') && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (!canMakeAction) return;
                        setIsAddAttendeeOpen(true);
                      }}
                      disabled={
                        !canMakeAction ||
                        addAttendeeLoading ||
                        attendeeLoading ||
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel') ||
                        event?.verified ||
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('complete')
                      }
                    >
                      Add Attendees
                    </DropdownMenuItem>
                  )}
                  {!event?.event_stage?.name
                    ?.toLowerCase()
                    ?.includes('cancel') && (
                    <DropdownMenuItem
                      onClick={fetchEventStagesList}
                      disabled={
                        updateStatusFetching ||
                        !canMakeAction ||
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel') ||
                        event?.verified ||
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('complete')
                      }
                    >
                      {updateStatusFetching
                        ? 'Getting Event Stages...'
                        : 'Update Event Stage'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      if (event?.rsmAttended) {
                        toast.error('Event is already marked as attended', {
                          description: 'Error',
                        });
                        return;
                      }
                      if (
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel')
                      ) {
                        toast.error('Event is already cancelled', {
                          description: 'Error',
                        });
                        return;
                      }
                      if (!canMakeAction) return;
                      setIsMarkAttendedOpen(true);
                    }}
                    disabled={
                      event?.rsmAttended ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.verified ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('complete') ||
                      !canMakeAction
                    }
                  >
                    {event?.rsmAttended ? 'Attended' : 'Mark as Attended'} Event
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (event?.verified) {
                        toast.error('Event is already verified', {
                          description: 'Error',
                        });
                        return;
                      }
                      if (
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel')
                      ) {
                        toast.error('Event is already cancelled', {
                          description: 'Error',
                        });
                        return;
                      }
                      if (!canMakeAction) return;
                      setIsVerifyEventOpen(true);
                    }}
                    disabled={
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.verified ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.verified ||
                      event?.event_stage?.name?.includes('complete') ||
                      !canMakeAction
                    }
                  >
                    {event?.event_stage?.name?.toLowerCase()?.includes('cancel')
                      ? 'Cancelled'
                      : event?.verified
                      ? 'Verified'
                      : 'Verify'}{' '}
                    Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Event Address</p>
                <p className="text-sm">{event?.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Event Time</p>
                <p className="text-sm">
                  From {event?.date_begin} <br /> To {event?.date_end} 🕒
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Location</p>
                <p className="text-sm">
                  {event?.region?.name} - {event?.territory?.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Event Type</p>
                <p className="text-sm">{event?.event_type?.name}</p>
              </div>
              {event?.crops?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Crops</p>
                  <p className="text-sm">
                    {event?.crops?.map((item) => item.name).join(', ')}
                  </p>
                </div>
              )}
              {event?.dealers?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Dealers</p>
                  <p className="text-sm">
                    {event?.dealers?.map((item) => item.name).join(', ')}
                  </p>
                </div>
              )}
              {event?.demo_products?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Products</p>
                  <p className="text-sm">
                    {event?.demo_products?.map((item) => item.name).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Images Section - Enhanced */}
          {event?.images && event.images.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Event Images
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {event.images.length} image
                      {event.images.length !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {event.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                        <img
                          src={imageUrl}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => setSelectedEventImage(imageUrl)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      {/* View overlay */}
                      <div
                        className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 g"
                        onClick={() => setSelectedEventImage(imageUrl)}
                      >
                        <div className="bg-white rounded-full p-2 shadow-md">
                          <Eye className="text-blue-600 h-5 w-5" />
                        </div>
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
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Click on any image to view it in full size
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Upload Card - Enhanced to match mobile UX */}
          {canMakeAction &&
            !event?.event_stage?.name?.toLowerCase()?.includes('cancel') &&
            !event?.verified && (
              <Card className="border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors">
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-blue-700">
                    Upload Event Images
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Add photos to document your event
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="relative">
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          disabled={removeLoading}
                        />
                      </div>

                      {files.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Selected Files ({files.length}/5):
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-600 truncate flex-1 mr-2">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {(file.size / 1024 / 1024).toFixed(1)}MB
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 h-6 w-6 p-0"
                                  onClick={() => {
                                    setFiles((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={uploadFilesToEvent}
                        disabled={files.length === 0 || removeLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        {removeLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading {files.length} image
                            {files.length !== 1 ? 's' : ''}...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload {files.length > 0 ? `${files.length} ` : ''}
                            Image{files.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        📸 You can upload up to 5 images at once
                      </p>
                      <p className="text-xs text-gray-500">
                        💾 Maximum file size: 5MB per image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supported formats: JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Empty State for Event Images */}
          {(!event?.images || event.images.length === 0) &&
            canMakeAction &&
            !event?.event_stage?.name?.toLowerCase()?.includes('cancel') &&
            !event?.verified && (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No event images yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm">
                    📸 Document your event by uploading photos below. Images
                    help tell the story of your event!
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>💡 Tip: Upload images as the event progresses</span>
                  </div>
                </CardContent>
              </Card>
            )}

          {attendeeList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Attendees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendeeLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : attendeeList.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    No attendees found
                  </p>
                ) : (
                  attendeeList.map((item, index) => {
                    // Check farmer_verify instead of attended_event_ids for "Farmer Host" tag
                    const isFarmerHost = item.farmer_verify;
                    return (
                      <Card key={index} className="w-full">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold flex-1">
                              {item.name}
                            </p>
                            {isFarmerHost && (
                              <span
                                className={`text-xs px-2 py-1 rounded ${statusStyles.sent}`}
                              >
                                Farmer Host
                              </span>
                            )}
                          </div>
                          <p className="text-sm">Phone No: {item.phone_no}</p>
                          <p className="text-sm">
                            Land Area: {item.land_area} Acre
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {eventExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventExpenses.map((item, index) => (
                  <ExpensesCard
                    key={index}
                    item={item}
                    toggleExpenseImages={toggleExpenseImages}
                    setToggleExpenseImages={setToggleExpenseImages}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            Actions can only be performed at least four days after the event's
            end date, and the event has not been cancelled.
          </p>
        </div>
      )}

      <Dialog open={isAddAttendeeOpen} onOpenChange={setIsAddAttendeeOpen}>
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
                value={attendee?.phone_no}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                type="tel"
              />
              {attendeesSearchResult.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  {attendeesSearchResult.map((item, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
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
                      <p className="text-sm">
                        {item.name.length > 20
                          ? item.name.slice(0, 20) + '...'
                          : item.name}
                      </p>
                      <p className="text-sm text-gray-500">{item.phone_no}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={attendee?.name}
                onChange={(e) =>
                  setAttendee((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="land_area">Land Area</Label>
              <Input
                id="land_area"
                placeholder="Enter land area"
                value={attendee?.land_area}
                onChange={(e) =>
                  setAttendee((prev) => ({
                    ...prev,
                    land_area: e.target.value.replace(/[^0-9.]/g, ''),
                  }))
                }
                type="text"
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
            <Button onClick={handleAddAttendee} disabled={addAttendeeLoading}>
              {addAttendeeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Attendee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateStageOpen} onOpenChange={setIsUpdateStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Event Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {eventStageList.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border rounded-md cursor-pointer"
                onClick={() => {
                  if (
                    event?.verified &&
                    item.name.toLowerCase().includes('cancel')
                  ) {
                    toast.error('You cannot cancel a verified event', {
                      description: 'Error',
                    });
                    return;
                  }
                  onStageChange(item.id);
                }}
              >
                <p className="text-sm">{item.name}</p>
                {updatingEventStageId === item.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : item.id === event.event_stage_id ? (
                  <CheckCheck className="h-5 w-5 text-blue-600" />
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVerifyEventOpen} onOpenChange={setIsVerifyEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              Are you sure you want to mark this event as verified?
            </p>
            <div className="flex gap-2">
              <Button onClick={onConfirmEvent} disabled={verifyEventLoading}>
                {verifyEventLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Yes
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsVerifyEventOpen(false)}
                disabled={verifyEventLoading}
              >
                No
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMarkAttendedOpen} onOpenChange={setIsMarkAttendedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Event as Attended</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              Are you sure you want to mark this event as attended?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={onConfirmEventAttended}
                disabled={rsmAttendedLoading}
              >
                {rsmAttendedLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Yes
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsMarkAttendedOpen(false)}
                disabled={rsmAttendedLoading}
              >
                No
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Event Image Modal */}
      {selectedEventImage && (
        <Dialog
          open={!!selectedEventImage}
          onOpenChange={() => setSelectedEventImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-2 bg-black bg-opacity-90">
            <div className="relative flex items-center justify-center min-h-[400px]">
              <img
                src={selectedEventImage}
                alt="Event Image"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onError={() => {
                  toast.error('Failed to load image');
                  setSelectedEventImage(null);
                }}
              />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 bg-white hover:bg-gray-100"
                onClick={() => setSelectedEventImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white bg-opacity-80 rounded-full px-4 py-2">
                <p className="text-sm text-gray-800">
                  Event Image ({event?.images?.indexOf(selectedEventImage) + 1}{' '}
                  of {event?.images?.length})
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventDetailsOfRegionalManagerEvent;
