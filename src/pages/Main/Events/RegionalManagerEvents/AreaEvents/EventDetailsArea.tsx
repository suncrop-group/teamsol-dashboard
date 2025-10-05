import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Eye, MoreVertical, X } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi, callServerAPI } from '@/api';
import { priceFormatter } from '@/utils';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
                  {item.urls.map((imageUrl: string, index: number) => (
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

const EventDetailsArea = () => {
  const { eventId } = useParams();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [attendeeLoading, setAttendeeLoading] = useState(false);
  const [updateCheckListLoading, setUpdateCheckListLoading] = useState(false);
  const [verifyEventLoading, setVerifyEventLoading] = useState(false);
  const [rsmAttendedLoading, setRsmAttendedLoading] = useState(false);
  const [eventExpenses, setEventExpenses] = useState([]);
  const [selectedCheckList, setSelectedCheckList] = useState([]);
  const [attendeeList, setAttendeeList] = useState([]);
  const [toggleExpenseImages, setToggleExpenseImages] = useState<string[]>([]);
  const [selectedEventImage, setSelectedEventImage] = useState<string | null>(
    null
  );
  const [event, setEvent] = useState({
    id: '',
    order_sequence: '',
    date_begin: '',
    date_end: '',
    region: { name: '' },
    territory: { name: '' },
    event_type: { name: '', check_list_ids: [] },
    crops: [],
    demo_products: [],
    attendees: [],
    name: '',
    event_stage_id: 0,
    check_list_ids: [],
    verified: false,
    attended_event_ids: [],
    event_stage: { name: '' },
    rsmAttended: false,
    images: [],
  });
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isAttendedDialogOpen, setIsAttendedDialogOpen] = useState(false);

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

  const fetchEventDetails = () => {
    setLoading(true);
    callApi(
      'GET',
      `/events/single?event_id=${eventId}`,
      null,
      (response) => {
        setLoading(false);
        setEvent(response.data.event);
        setSelectedCheckList(response.data.event.check_list_ids);
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

  const onConfirmEvent = () => {
    const onSuccess = () => {
      setVerifyEventLoading(false);
      setIsVerifyDialogOpen(false);
      toast.success('Event confirmed successfully', { description: 'Success' });
      fetchEventDetails();
    };
    const onError = (error) => {
      setVerifyEventLoading(false);
      setIsVerifyDialogOpen(false);
      toast.error(error?.message || 'Failed to confirm event', {
        description: 'Error',
      });
    };

    const onConfirmEventSuccess = () => {
      const payload = { verified: true, verified_by: user?.id };

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
      setIsVerifyDialogOpen(false);
      toast.error('Failed to confirm event via server API', {
        description: 'Error',
      });
    };

    // Enhanced data payload with more comprehensive user info
    const data = {
      event_id: event.id,
      rsm_id: user?.id,
      user_id: user?.id,
      is_verify: 'True',
      is_verified: true,
      verified_by: user?.id,
    };

    setVerifyEventLoading(true);
    callServerAPI(
      'POST',
      `/verify/event`,
      { data },
      onConfirmEventSuccess,
      onConfirmEventError
    );
  };

  const onCheckListUpdate = () => {
    if (selectedCheckList.length === 0) {
      toast.error('Please select at least one checklist item', {
        description: 'Error',
      });
      return;
    }
    const data = {
      event_id: event.id,
      checkist_ids: selectedCheckList.map((item) => item.id),
    };
    const onSuccess = () => {
      setUpdateCheckListLoading(false);
      toast.success('Event checklist updated successfully', {
        description: 'Success',
      });
      setIsChecklistDialogOpen(false);
    };
    const onError = () => {
      setUpdateCheckListLoading(false);
      toast.error('Failed to update event checklist', { description: 'Error' });
    };
    const onServerSuccess = () => {
      callApi(
        'PATCH',
        `/events/update?event_id=${event.id}`,
        { check_list_ids: selectedCheckList },
        onSuccess,
        onError
      );
    };
    const onServerError = () => {
      setUpdateCheckListLoading(false);
      toast.error('Failed to update event checklist', { description: 'Error' });
    };
    setUpdateCheckListLoading(true);
    callServerAPI(
      'POST',
      `/post/check/checklist`,
      { data },
      onServerSuccess,
      onServerError
    );
  };

  const onConfirmEventAttended = () => {
    const onSuccess = () => {
      setRsmAttendedLoading(false);
      setIsAttendedDialogOpen(false);
      toast.success('Event marked as attended successfully', {
        description: 'Success',
      });
      fetchEventDetails();
    };
    const onError = (error) => {
      setRsmAttendedLoading(false);
      setIsAttendedDialogOpen(false);
      toast.error(error?.message || 'Failed to confirm event', {
        description: 'Error',
      });
    };
    const onConfirmEventSuccess = () => {
      callApi(
        'PATCH',
        `/events/update?event_id=${event.id}`,
        { rsmAttended: true },
        onSuccess,
        onError
      );
    };
    const onConfirmEventError = () => {
      setRsmAttendedLoading(false);
      setIsAttendedDialogOpen(false);
      toast.error('Failed to confirm event', { description: 'Error' });
    };
    const data = { event_id: event.id };
    setRsmAttendedLoading(true);
    callServerAPI(
      'POST',
      `/rsm/attended`,
      { data },
      onConfirmEventSuccess,
      onConfirmEventError
    );
  };

  return (
    <div className="container">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Event Detail #{event?.id}</CardTitle>

                {/* <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Actions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 flex flex-col gap-2">
                      <Button
                        disabled={
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes('cancel') || event?.verified
                        }
                        onClick={() => {
                          setIsActionsDialogOpen(false);
                          setIsVerifyDialogOpen(true);
                        }}
                      >
                        {event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel')
                          ? 'Cancelled'
                          : event?.verified
                          ? 'Verified'
                          : 'Verify Event'}
                      </Button>
                      <Button
                        disabled={
                          event?.rsmAttended ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes('cancel')
                        }
                        onClick={() => {
                          setIsActionsDialogOpen(false);
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
                          setIsAttendedDialogOpen(true);
                        }}
                      >
                        {event?.rsmAttended ? 'Attended' : 'Mark as Attended'}
                      </Button>
                      {!event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') && (
                        <Button
                          onClick={() => {
                            setIsActionsDialogOpen(false);
                            setIsChecklistDialogOpen(true);
                          }}
                        >
                          Update Checklist
                        </Button>
                      )}
                    </div>
                  </DialogContent> */}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem
                      disabled={
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel') || event?.verified
                      }
                      onClick={() => {
                        setIsVerifyDialogOpen(true);
                      }}
                    >
                      {event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel')
                        ? 'Cancelled'
                        : event?.verified
                        ? 'Verified'
                        : 'Verify Event'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={
                        event?.rsmAttended ||
                        event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel')
                      }
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
                        setIsAttendedDialogOpen(true);
                      }}
                    >
                      {event?.rsmAttended ? 'Attended' : 'Mark as Attended'}
                    </DropdownMenuItem>
                    {!event?.event_stage?.name
                      ?.toLowerCase()
                      ?.includes('cancel') && (
                      <DropdownMenuItem
                        onClick={() => {
                          setIsChecklistDialogOpen(true);
                        }}
                      >
                        Update Checklist
                      </DropdownMenuItem>
                    )}
                    {/* <DropdownMenuItem
                      onClick={() => {
                        setIsActionsDialogOpen(false);
                        toast.error('This feature is not available yet', {
                          description: 'Error',
                        });
                      }}
                    >
                      Add Expense
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                {event?.crops?.length > 0 && (
                  <div>
                    <Label className="font-semibold">Crops</Label>
                    <p className="text-sm">
                      {event?.crops?.map((item) => item.name).join(', ')}
                    </p>
                  </div>
                )}
                {event?.demo_products?.length > 0 && (
                  <div>
                    <Label className="font-semibold text-lg">Products</Label>
                    <p className="text-sm">
                      {event?.demo_products
                        ?.map((item) => item.name)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {/* <div>
                <Label className="font-semibold text-lg">Attendees</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {attendeeList.map((item, index) => {
                    const isAttended = item.attended_event_ids.includes(
                      Number(event.id)
                    );
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold flex-1">
                              {item.name}
                            </span>
                            {isAttended ? (
                              <CheckCheck className="h-5 w-5 text-blue-600" />
                            ) : (
                              <span
                                className={`text-xs px-2 py-1 rounded ${statusStyles.pending}`}
                              >
                                Pending
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
                    <div className="text-center text-gray-500 col-span-2">
                      {attendeeLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        'No attendees found'
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="font-semibold text-lg">Expenses</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {eventExpenses.map((item, index) => (
                    <ExpensesCard key={index} item={item} />
                  ))}
                  {eventExpenses.length === 0 && (
                    <div className="text-center text-gray-500 col-span-2">
                      {attendeeLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        'No Expense found'
                      )}
                    </div>
                  )}
                </div>
              </div> */}
              </CardContent>
            </Card>

            {/* Event Images Section */}
            {event?.images && event.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Event Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {event.images.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventImage(imageUrl);
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-md flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventImage(imageUrl);
                          }}
                        >
                          <Eye
                            className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            size={20}
                          />
                        </div>
                      </div>
                    ))}
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
                        <Card key={index} className={`w-full`}>
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
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Actions can only be performed at least four days after the event's
            end date, and the event has not been cancelled.
          </p>

          <Dialog
            open={isVerifyDialogOpen}
            onOpenChange={setIsVerifyDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Event</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to confirm the event (#{event.id})?</p>
              <div className="flex gap-2">
                <Button onClick={onConfirmEvent} disabled={verifyEventLoading}>
                  {verifyEventLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Yes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsVerifyDialogOpen(false)}
                  disabled={verifyEventLoading}
                >
                  No
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isChecklistDialogOpen}
            onOpenChange={setIsChecklistDialogOpen}
          >
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Event Template Check List</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {event?.event_type?.check_list_ids.length > 0 ? (
                  event?.event_type?.check_list_ids.map((item) => (
                    <Card
                      key={item.id}
                      className="flex flex-row items-center justify-between p-4 bg-gray-50"
                    >
                      <span className="text-sm">{item.name}</span>
                      <Checkbox
                        checked={selectedCheckList.some(
                          (check) => check.id === item.id
                        )}
                        onCheckedChange={(checked) => {
                          setSelectedCheckList((prev) => {
                            if (checked) {
                              return [...prev, item];
                            } else {
                              return prev.filter(
                                (check) => check.id !== item.id
                              );
                            }
                          });
                        }}
                      />
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    No check list found
                  </p>
                )}
                <Button
                  onClick={onCheckListUpdate}
                  disabled={updateCheckListLoading}
                  className="w-full mt-4"
                >
                  {updateCheckListLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Update
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAttendedDialogOpen}
            onOpenChange={setIsAttendedDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark as Attended</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to mark this event as attended?</p>
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
                  variant="outline"
                  onClick={() => setIsAttendedDialogOpen(false)}
                  disabled={rsmAttendedLoading}
                >
                  No
                </Button>
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

export default EventDetailsArea;
