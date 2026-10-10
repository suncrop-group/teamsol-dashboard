import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Alert,
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  FileButton,
  Group,
  Image,
  Loader,
  Menu,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { toast } from '@/lib/toast';
import dayjs from 'dayjs';
import { parseCustomDate, priceFormatter, uploadToCloudinary } from '@/utils';
import { callApi } from '@/api';
import {
  errorMessage,
  isFailed,
  isQueued,
  isUnsynced,
  newRequestId,
  recordRef,
  useQueuedRefresh,
} from '@/api/v2';
import {
  CheckCheck,
  Eye,
  MoreVertical,
  Pencil,
  RotateCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ConfirmModal,
  EmptyState,
  FailedActions,
  PageHeader,
  StatusBadge,
} from '@/components/app';

const EMPTY_ATTENDEE = {
  name: '',
  phone_no: '',
  land_area: '',
  farmer_verify: false,
};
// Attendee form fields a server error can be shown under.
const ATTENDEE_FIELDS = ['name', 'phone_no', 'land_area'];

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Box>
    <Text size="sm" c="dimmed">
      {label}
    </Text>
    <Text fw={500} mt={4}>
      {children}
    </Text>
  </Box>
);

// Changes to a synced event or its attendees that Odoo refused. The event
// went back to how it was; each change can be sent again or dismissed.
const RefusedChanges = ({
  eventId,
  actions,
  onChanged,
}: {
  eventId: string;
  actions: { jobId: string; label: string; error: string }[];
  onChanged: () => void;
}) => {
  // `<jobId>:retry` or `<jobId>:dismiss` while that call is in flight.
  const [busy, setBusy] = useState('');

  if (!actions?.length) return null;

  const run = (jobId: string, kind: 'retry' | 'dismiss') => {
    setBusy(`${jobId}:${kind}`);
    callApi(
      kind === 'retry' ? 'POST' : 'DELETE',
      kind === 'retry'
        ? `/v2/events/${eventId}/actions/${jobId}/retry`
        : `/v2/events/${eventId}/actions/${jobId}`,
      kind === 'retry' ? {} : null,
      () => {
        setBusy('');
        toast.success(kind === 'retry' ? 'Queued again' : 'Dismissed');
        onChanged();
      },
      (error) => {
        setBusy('');
        toast.error(
          errorMessage(
            error,
            kind === 'retry'
              ? 'Could not send it again. Please try again.'
              : 'Could not dismiss. Please try again.',
          ),
        );
        // It may already be gone or resent: show what is there now.
        onChanged();
      },
    );
  };

  return (
    <Stack gap='xs'>
      {actions.map((action) => (
        <Alert key={action.jobId} color='red' variant='light' p='xs'>
          <Group justify='space-between' align='center' gap='sm'>
            <Text size='sm' flex={1} miw={200}>
              Could not send: {action.label} — {action.error}
            </Text>
            <Group gap={6} wrap='nowrap'>
              <Button
                size='compact-xs'
                variant='default'
                onClick={() => run(action.jobId, 'retry')}
                loading={busy === `${action.jobId}:retry`}
                disabled={!!busy}
              >
                Try again
              </Button>
              <Button
                size='compact-xs'
                variant='subtle'
                color='red'
                onClick={() => run(action.jobId, 'dismiss')}
                loading={busy === `${action.jobId}:dismiss`}
                disabled={!!busy}
              >
                Dismiss
              </Button>
            </Group>
          </Group>
        </Alert>
      ))}
    </Stack>
  );
};

const ExpensesCard = ({
  item,
  toggleExpenseImages,
  setToggleExpenseImages,
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const toggleImages = () => {
    setToggleExpenseImages((prev) => {
      if (prev.includes(item._id)) {
        return prev.filter((id) => id !== item._id);
      } else {
        return [...prev, item._id];
      }
    });
  };

  return (
    <>
      <Card withBorder padding="md">
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Text size="sm" fw={500} flex={1}>
              {item?.name}
            </Text>
            <Text size="sm">{priceFormatter(item?.amount)} PKR</Text>
          </Group>
          <Text size="sm" c="dimmed">
            {recordRef(item)}
          </Text>
          <Group justify="space-between" wrap="nowrap" align="center">
            <Stack gap="xs" flex={1}>
              <Text size="sm" c="dimmed">
                {dayjs(item?.createdAt).format('MM-DD-YYYY')} -{' '}
                {dayjs(item?.createdAt).format('hh:mm A')} 🕒
              </Text>
              {item?.description && (
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {item?.description}
                </Text>
              )}
              <Group gap="xs">
                {item?.url && (
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    aria-label="View attachment"
                    onClick={() => window.open(item?.url, '_blank')}
                  >
                    <Eye size={16} />
                  </ActionIcon>
                )}
                {item?.urls && item.urls.length > 0 && (
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleImages();
                    }}
                  >
                    {toggleExpenseImages.includes(item._id)
                      ? `Hide Image${item.urls.length > 1 ? 's' : ''}`
                      : `Show Image${item.urls.length > 1 ? 's' : ''}`}{' '}
                    ({item.urls.length})
                  </Button>
                )}
              </Group>
            </Stack>
            <Stack gap={4} align="flex-end">
              <StatusBadge status={item.status} size="sm" />
              {!isUnsynced(item) && (
                <StatusBadge status={item.odooStatus} size="sm" />
              )}
            </Stack>
          </Group>

          {/* Expense Image Gallery */}
          {item?.urls &&
            item.urls.length > 0 &&
            toggleExpenseImages.includes(item._id) && (
              <Group gap="xs" mt="xs">
                {item.urls.map((imageUrl, index) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Expense image ${index + 1}`}
                    w={96}
                    h={96}
                    fit="cover"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(imageUrl);
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </Group>
            )}
        </Stack>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <Modal
          opened
          onClose={() => setSelectedImage(null)}
          size="xl"
          padding="xs"
        >
          <Image
            src={selectedImage}
            alt="Expense Image"
            mah="85vh"
            fit="contain"
            radius="md"
          />
        </Modal>
      )}
    </>
  );
};

const EventDetailsOfRegionalManagerEvent = () => {
  // The event's `_id` (the route still calls it `eventId`).
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eventExpenses, setEventExpenses] = useState([]);
  const [addAttendeeLoading, setAddAttendeeLoading] = useState(false);
  const [updateStatusFetching, setUpdateStatusFetching] = useState(false);
  const [verifyEventLoading, setVerifyEventLoading] = useState(false);
  const [rsmAttendedLoading, setRsmAttendedLoading] = useState(false);
  const [eventStageList, setEventStageList] = useState([]);
  const [updatingEventStageId, setUpdatingEventStageId] = useState(null);
  const [attendeesSearchResult, setAttendeesSearchResult] = useState([]);
  const [attendee, setAttendee] = useState(EMPTY_ATTENDEE);
  // The failed attendee being fixed in the attendee form, if any.
  const [editingAttendee, setEditingAttendee] = useState(null);
  // Field the server blamed for a refused attendee, and its message.
  const [attendeeError, setAttendeeError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [failedActions, setFailedActions] = useState([]);
  // One key per attendee form, so a double submit cannot add them twice.
  const attendeeRequestId = useRef(newRequestId());
  const [attendeeList, setAttendeeList] = useState([]);
  const [event, setEvent] = useState({
    _id: '',
    id: '',
    status: '',
    syncError: '',
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
    createdAt: null,
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
  // Attendee `_id`s with a remove or resend call in flight.
  const [attendeesRemoving, setAttendeesRemoving] = useState([]);
  const [attendeesResending, setAttendeesResending] = useState([]);
  const [removingAttendee, setRemovingAttendee] = useState(null);
  const [isAttendeeRemoveDialogOpen, setIsAttendeeRemoveDialogOpen] =
    useState(false);

  // The event with its attendees and expenses. `quiet` reloads in place;
  // `onMissing` runs instead of the error toast when the event is gone.
  const fetchEventDetails = (quiet = false, onMissing?: () => void) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `/v2/events/${eventId}`,
      null,
      (response) => {
        setEvent(response.data.event);
        setSyncPending(!!response.data.pending);
        setFailedActions(response.data.failedActions || []);
        setAttendeeList(
          [...(response.data.attendees || [])].sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
          ),
        );
        setEventExpenses(
          [...(response.data.expenses || [])].sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
          ),
        );
        setLoading(false);
      },
      () => {
        setLoading(false);
        if (onMissing) {
          onMissing();
        } else if (!quiet) {
          toast.error('Failed to fetch event details', {
            description: 'Error',
          });
        }
      },
    );
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (event?.id) {
      document.title = `Event Detail #${event?.id}`;
    }
  }, [event]);

  // `syncPending` covers changes to a synced event (stage, photos, verify…),
  // which leave every record's own status untouched while they are sent.
  const [syncPending, setSyncPending] = useState(false);
  useQueuedRefresh(
    [event, ...attendeeList, ...eventExpenses, { status: syncPending ? 'queued' : '' }],
    () =>
    fetchEventDetails(true),
  );

  // An action shows its effect at once and is then sent to Odoo. Reload now,
  // and once more shortly after: if Odoo refuses, the old value is back and
  // the event carries the reason.
  const followUp = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(followUp.current), []);
  const refreshAfterAction = () => {
    fetchEventDetails(true);
    clearTimeout(followUp.current);
    followUp.current = setTimeout(() => fetchEventDetails(true), 5000);
  };

  // Actions need the event in Odoo.
  const unsynced = isUnsynced(event);
  const unsyncedHint = isQueued(event)
    ? 'Being sent to Odoo…'
    : 'Not in Odoo yet';

  const onStageChange = (stageId) => {
    if (event?.event_stage_id === stageId) {
      toast.error('Event stage is already updated', { description: 'Error' });
      return;
    }
    setUpdatingEventStageId(stageId);
    callApi(
      'PATCH',
      `/v2/events/${event._id}/stage`,
      { stage_id: stageId },
      () => {
        toast.success('Event stage updated and queued for Odoo', {
          description: 'Success',
        });
        refreshAfterAction();
        setIsUpdateStageOpen(false);
        setUpdateStatusFetching(false);
        setUpdatingEventStageId(null);
      },
      (error) => {
        toast.error(errorMessage(error, 'Failed to update event stage'), {
          description: 'Error',
        });
        setUpdateStatusFetching(false);
        setUpdatingEventStageId(null);
      },
    );
  };

  const onConfirmEvent = () => {
    setVerifyEventLoading(true);
    callApi(
      'POST',
      `/v2/events/${event._id}/verify`,
      { rsm_comments: '' },
      () => {
        setVerifyEventLoading(false);
        setIsVerifyEventOpen(false);
        toast.success('Event confirmed and queued for Odoo', {
          description: 'Success',
        });
        refreshAfterAction();
      },
      (error) => {
        setVerifyEventLoading(false);
        setIsVerifyEventOpen(false);
        toast.error(errorMessage(error, 'Failed to confirm event'), {
          description: 'Error',
        });
      },
    );
  };

  const onConfirmEventAttended = () => {
    setRsmAttendedLoading(true);
    callApi(
      'POST',
      `/v2/events/${event._id}/attended`,
      {},
      () => {
        setRsmAttendedLoading(false);
        setIsMarkAttendedOpen(false);
        toast.success('Event marked as attended and queued for Odoo', {
          description: 'Success',
        });
        refreshAfterAction();
      },
      (error) => {
        setRsmAttendedLoading(false);
        setIsMarkAttendedOpen(false);
        toast.error(errorMessage(error, 'Failed to confirm event'), {
          description: 'Error',
        });
      },
    );
  };

  const handleAddAttendee = () => {
    if (!attendee.name || !attendee.phone_no || !attendee.land_area) {
      toast.error('Please fill all fields', { description: 'Error' });
      return;
    }
    if (attendee.phone_no.length < 10) return;

    const editing = editingAttendee;
    const onSuccess = () => {
      setAddAttendeeLoading(false);
      if (editing) {
        toast.success('Attendee updated and queued');
      } else {
        toast.success('Attendee saved and queued', {
          description: 'Success',
        });
        attendeeRequestId.current = newRequestId();
      }
      fetchEventDetails(true);
      setIsAddAttendeeOpen(false);
      setEditingAttendee(null);
      setAttendee(EMPTY_ATTENDEE);
      setAttendeesSearchResult([]);
    };
    const onError = (error) => {
      setAddAttendeeLoading(false);
      const message = errorMessage(
        error,
        editing ? 'Failed to update attendee' : 'Failed to add attendee',
      );
      // Under the field the server names; anything else as a toast.
      if (ATTENDEE_FIELDS.includes(error?.field)) {
        setAttendeeError({ field: error.field, message });
      } else {
        toast.error(message, { description: 'Error' });
      }
    };
    const body = {
      name: attendee.name,
      phone_no: attendee.phone_no,
      land_area: attendee.land_area,
      farmer_verify: attendee.farmer_verify,
    };

    setAttendeeError(null);
    setAddAttendeeLoading(true);
    if (editing) {
      // Same attendee, fixed and queued again.
      callApi(
        'PUT',
        `/v2/events/${event._id}/attendees/${editing._id}`,
        body,
        onSuccess,
        onError,
      );
    } else {
      callApi(
        'POST',
        `/v2/events/${event._id}/attendees`,
        { ...body, clientRequestId: attendeeRequestId.current },
        onSuccess,
        onError,
      );
    }
  };

  // Open the attendee form with a failed attendee, to fix and resend it.
  const openAttendeeEdit = (item) => {
    setEditingAttendee(item);
    setAttendee({
      name: item.name || '',
      phone_no: item.phone_no || '',
      land_area: String(item.land_area ?? ''),
      farmer_verify: !!item.farmer_verify,
    });
    setAttendeeError(null);
    setAttendeesSearchResult([]);
    setIsAddAttendeeOpen(true);
  };

  const closeAttendeeDialog = () => {
    setIsAddAttendeeOpen(false);
    setAttendeeError(null);
    // Leave nothing of the edited attendee in the add form.
    if (editingAttendee) {
      setEditingAttendee(null);
      setAttendee(EMPTY_ATTENDEE);
      setAttendeesSearchResult([]);
    }
  };

  const attendeeFieldError = (field: string) =>
    attendeeError?.field === field ? attendeeError.message : undefined;

  // Send a failed attendee to Odoo again, unchanged.
  const resendAttendee = (item) => {
    if (attendeesResending.includes(item._id)) return;
    setAttendeesResending((prev) => [...prev, item._id]);
    const done = () =>
      setAttendeesResending((prev) => prev.filter((id) => id !== item._id));
    callApi(
      'POST',
      `/v2/events/${event._id}/attendees/${item._id}/retry`,
      {},
      () => {
        done();
        toast.success('Queued again');
        fetchEventDetails(true);
      },
      (error) => {
        done();
        toast.error(errorMessage(error, 'Could not resend. Please try again.'));
      },
    );
  };

  // Look up attendees already known by phone, half a second after typing
  // stops, so an existing farmer can be picked instead of retyped.
  const debouncedSearchAttendee = useRef(
    debounce((phone_no: string) => {
      if (!phone_no || phone_no.length < 3) {
        setAttendeesSearchResult([]);
        return;
      }
      callApi(
        'GET',
        `/events/attendee/search?phone_no=${encodeURIComponent(phone_no)}`,
        null,
        (response) => setAttendeesSearchResult(response.data || []),
        () => setAttendeesSearchResult([]),
      );
    }, 500),
  ).current;

  const handlePhoneNumberChange = (text) => {
    setAttendee((prev) => ({ ...prev, phone_no: text }));
    setAttendeeError(null);
    debouncedSearchAttendee(text);
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
      },
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
          `${index + 1}-${file.name.split('.')[0]}`,
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      await new Promise((resolve, reject) => {
        callApi(
          'POST',
          `/v2/events/${event._id}/images`,
          { urls: uploadedUrls },
          resolve,
          reject,
        );
      });

      toast.success('Files uploaded and queued for Odoo');
      setFiles([]);
      refreshAfterAction();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(errorMessage(error, 'Failed to upload files'));
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
      // The URL goes in the query string: a DELETE carries no body.
      await new Promise((resolve, reject) => {
        callApi(
          'DELETE',
          `/v2/events/${event._id}/images?url=${encodeURIComponent(imageUrl)}`,
          null,
          resolve,
          reject,
        );
      });

      toast.success('Image removed and queued for Odoo');
      refreshAfterAction();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(errorMessage(error, 'Failed to remove image'));
    } finally {
      setEventImagesRemoving((prev) => prev.filter((img) => img !== imageUrl));
    }
  };

  const theme = useMantineTheme();
  const resetFileInput = useRef<() => void>(null);

  const handleFileChange = (selectedFiles: File[]) => {
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
      resetFileInput.current?.();
    }
  };

  const removeAttendee = async () => {
    if (!canMakeAction) return;
    if (!removingAttendee) return;
    const attendeeId = removingAttendee._id;
    if (attendeesRemoving.includes(attendeeId)) {
      toast.error('Attendee is already being removed');
      return;
    }

    setAttendeesRemoving((prev) => [...prev, attendeeId]);

    try {
      // Not in Odoo yet: gone at once. In Odoo: listed as "removing" until
      // Odoo confirms.
      const response: { message?: string } = await new Promise(
        (resolve, reject) => {
          callApi(
            'DELETE',
            `/v2/events/${event._id}/attendees/${attendeeId}`,
            null,
            resolve,
            reject,
          );
        },
      );

      toast.success(response?.message || 'Attendee removed');
      fetchEventDetails(true);
      setIsAttendeeRemoveDialogOpen(false);
      setRemovingAttendee(null);
    } catch (error) {
      console.error('Remove attendee error:', error);
      toast.error(errorMessage(error, 'Failed to remove attendee'));
    } finally {
      setAttendeesRemoving((prev) => prev.filter((id) => id !== attendeeId));
    }
  };

  const endDate = parseCustomDate(event?.date_end);
  const canMakeAction = dayjs().isBefore(dayjs(endDate).add(4, 'day'));
  const canVerifyEvent = dayjs().isBefore(
    dayjs(event?.createdAt).add(5, 'day'),
  );

  return (
    <Container size="sm" px={0}>
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <>
          <PageHeader
            title={<>Event Details {recordRef(event)}</>}
            actions={
              <Menu position="bottom-end" width={224} shadow="md">
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    aria-label="Event actions"
                  >
                    <MoreVertical size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {unsynced && <Menu.Label>{unsyncedHint}</Menu.Label>}
                  {!event?.event_stage?.name
                    ?.toLowerCase()
                    ?.includes('cancel') && (
                    <Menu.Item
                      onClick={() => {
                        if (!canMakeAction) return;
                        setIsAddAttendeeOpen(true);
                      }}
                      disabled={
                        unsynced ||
                        !canMakeAction ||
                        addAttendeeLoading ||
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
                    </Menu.Item>
                  )}
                  {!event?.event_stage?.name
                    ?.toLowerCase()
                    ?.includes('cancel') && (
                    <Menu.Item
                      onClick={fetchEventStagesList}
                      disabled={
                        unsynced ||
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
                    </Menu.Item>
                  )}
                  <Menu.Item
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
                      unsynced ||
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
                  </Menu.Item>
                  <Menu.Item
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
                      if (!canVerifyEvent) return;
                      setIsVerifyEventOpen(true);
                    }}
                    disabled={
                      unsynced ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.verified ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.verified ||
                      event?.event_stage?.name?.includes('complete') ||
                      !canVerifyEvent
                    }
                  >
                    {event?.event_stage?.name?.toLowerCase()?.includes('cancel')
                      ? 'Cancelled'
                      : event?.verified
                        ? 'Verified'
                        : 'Verify'}{' '}
                    Event
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            }
          />

          <Stack gap="lg">
            {isFailed(event) ? (
              <Alert color="red" variant="light" title="Not sent to Odoo">
                <FailedActions
                  item={event}
                  resource="/v2/events"
                  onEdit={() =>
                    navigate('/add-rm-event', { state: { record: event } })
                  }
                  // Resent: show it queued. Discarded: it is gone, go back.
                  onChanged={() => fetchEventDetails(true, () => navigate(-1))}
                />
              </Alert>
            ) : unsynced ? (
              <Alert color="blue" variant="light">
                Being sent to Odoo… Actions are available once it is there.
              </Alert>
            ) : (
              <RefusedChanges
                eventId={event._id}
                actions={failedActions}
                onChanged={refreshAfterAction}
              />
            )}
            <Paper withBorder shadow="sm" p="lg">
              <Stack gap="md">
                <Field label="Event Address">{event?.name}</Field>
                <Field label="Event Time">
                  From {event?.date_begin} <br /> To {event?.date_end} 🕒
                </Field>
                <Field label="Location">
                  {event?.region?.name} - {event?.territory?.name}
                </Field>
                <Field label="Event Type">{event?.event_type?.name}</Field>
                {event?.crops?.length > 0 && (
                  <Field label="Crops">
                    {event?.crops?.map((item) => item.name).join(', ')}
                  </Field>
                )}
                {event?.dealers?.length > 0 && (
                  <Field label="Dealers">
                    {event?.dealers?.map((item) => item.name).join(', ')}
                  </Field>
                )}
                {event?.demo_products?.length > 0 && (
                  <Field label="Products">
                    {event?.demo_products?.map((item) => item.name).join(', ')}
                  </Field>
                )}
              </Stack>
            </Paper>

            {/* Event Images Section */}
            {event?.images && event.images.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Group gap="sm" mb="md" wrap="nowrap">
                  <ThemeIcon
                    variant="light"
                    color="green"
                    radius="xl"
                    size="lg"
                  >
                    <Eye size={16} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4}>Event Images</Title>
                    <Text size="sm" c="dimmed">
                      {event.images.length} image
                      {event.images.length !== 1 ? 's' : ''} uploaded
                    </Text>
                  </Box>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                  {event.images.map((imageUrl, index) => (
                    <Box key={index} pos="relative">
                      <AspectRatio ratio={1}>
                        <Image
                          src={imageUrl}
                          alt={`Event image ${index + 1}`}
                          fit="cover"
                          radius="md"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedEventImage(imageUrl)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </AspectRatio>

                      {/* Delete button */}
                      {canMakeAction &&
                        !event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes('cancel') &&
                        !event?.verified && (
                          <ActionIcon
                            color="red"
                            variant="filled"
                            size="md"
                            pos="absolute"
                            top={8}
                            right={8}
                            aria-label="Remove image"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEventImage(imageUrl);
                            }}
                            loading={eventImagesRemoving.includes(imageUrl)}
                          >
                            <Trash2 size={14} />
                          </ActionIcon>
                        )}
                    </Box>
                  ))}
                </SimpleGrid>
                <Text size="xs" c="dimmed" ta="center" mt="md">
                  💡 Click on any image to view it in full size
                </Text>
              </Paper>
            )}

            {/* Image Upload Card */}
            {canMakeAction &&
              !event?.event_stage?.name?.toLowerCase()?.includes('cancel') &&
              !event?.verified && (
                <Paper
                  withBorder
                  shadow="sm"
                  p="lg"
                  style={{ borderStyle: 'dashed' }}
                >
                  <Stack gap="md">
                    <Stack align="center" gap={4}>
                      <ThemeIcon
                        variant="light"
                        color="blue"
                        radius="xl"
                        size={48}
                        mb="xs"
                      >
                        <Upload size={24} />
                      </ThemeIcon>
                      <Title order={4} ta="center">
                        Upload Event Images
                      </Title>
                      <Text size="sm" c="dimmed" ta="center">
                        Add photos to document your event
                      </Text>
                    </Stack>

                    <FileButton
                      resetRef={resetFileInput}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      disabled={removeLoading || unsynced}
                    >
                      {(props) => (
                        <Button
                          {...props}
                          variant="default"
                          fullWidth
                          disabled={removeLoading || unsynced}
                        >
                          Choose Files
                        </Button>
                      )}
                    </FileButton>

                    {files.length > 0 && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">
                          Selected Files ({files.length}/5):
                        </Text>
                        <Stack gap={4} mah={128} style={{ overflowY: 'auto' }}>
                          {files.map((file, index) => (
                            <Group key={index} gap="xs" wrap="nowrap">
                              <Text size="sm" c="dimmed" truncate flex={1}>
                                {file.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {(file.size / 1024 / 1024).toFixed(1)}MB
                              </Text>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label="Remove file"
                                onClick={() => {
                                  setFiles((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  );
                                }}
                              >
                                <X size={12} />
                              </ActionIcon>
                            </Group>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Button
                      onClick={uploadFilesToEvent}
                      disabled={files.length === 0 || removeLoading || unsynced}
                      fullWidth
                      size="md"
                      leftSection={
                        removeLoading ? (
                          <Loader size={16} color="gray" />
                        ) : (
                          <Upload size={16} />
                        )
                      }
                    >
                      {removeLoading ? (
                        <>
                          Uploading {files.length} image
                          {files.length !== 1 ? 's' : ''}...
                        </>
                      ) : (
                        <>
                          Upload {files.length > 0 ? `${files.length} ` : ''}
                          Image{files.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>

                    <Box>
                      {unsynced && (
                        <Text size="xs" c="dimmed" ta="center" mb={4}>
                          {unsyncedHint}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed" ta="center">
                        📸 You can upload up to 5 images at once
                      </Text>
                      <Text size="xs" c="dimmed" ta="center">
                        💾 Maximum file size: 5MB per image
                      </Text>
                      <Text size="xs" c="dimmed" ta="center" mt={4}>
                        Supported formats: JPG, PNG, GIF, WebP
                      </Text>
                    </Box>
                  </Stack>
                </Paper>
              )}

            {/* Empty State for Event Images */}
            {(!event?.images || event.images.length === 0) &&
              canMakeAction &&
              !event?.event_stage?.name?.toLowerCase()?.includes('cancel') &&
              !event?.verified && (
                <Paper withBorder p="lg" style={{ borderStyle: 'dashed' }}>
                  <EmptyState
                    icon={<Eye size={32} />}
                    title="No event images yet"
                    description="📸 Document your event by uploading photos below. Images help tell the story of your event!"
                    action={
                      <Text size="xs" c="dimmed" ta="center">
                        💡 Tip: Upload images as the event progresses
                      </Text>
                    }
                  />
                </Paper>
              )}

            {attendeeList.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Title order={4} mb="md">
                  Attendees
                </Title>
                <Stack gap="md">
                  {attendeeList.map((item, index) => {
                    // Check farmer_verify instead of attended_event_ids for "Farmer Host" tag
                    const isFarmerHost = item.farmer_verify;
                    const isRemoving = attendeesRemoving.includes(item._id);
                    // Odoo is still removing this attendee.
                    const beingRemoved = item.status === 'removing';
                    return (
                      <Card key={item._id} withBorder padding="md">
                        <Group
                          justify="space-between"
                          wrap="nowrap"
                          align="center"
                        >
                          <Text size="sm" fw={600} flex={1}>
                            {index + 1}. {item.name}
                          </Text>
                          <Group gap="xs" wrap="nowrap">
                            {(isUnsynced(item) || beingRemoved) && (
                              <StatusBadge status={item.status} size="sm" />
                            )}
                            {isFarmerHost && (
                              <Badge
                                color="green"
                                variant="light"
                                size="sm"
                                tt="capitalize"
                              >
                                Farmer Host
                              </Badge>
                            )}
                            {canMakeAction && (
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                aria-label="Remove attendee"
                                onClick={() => {
                                  setRemovingAttendee(item);
                                  setIsAttendeeRemoveDialogOpen(true);
                                }}
                                loading={isRemoving}
                                disabled={beingRemoved || unsynced}
                              >
                                <Trash2 size={16} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>
                        <Text size="sm" mt="xs">
                          Phone No: {item.phone_no}
                        </Text>
                        <Text size="sm">Land Area: {item.land_area} Acre</Text>
                        {isFailed(item) && (
                          <Group gap="xs" mt="xs" wrap="nowrap">
                            <Text size="xs" c="red" flex={1}>
                              {item.syncError || 'Could not be sent to Odoo.'}
                            </Text>
                            <Button
                              size="compact-xs"
                              variant="default"
                              leftSection={<RotateCw size={12} />}
                              onClick={() => resendAttendee(item)}
                              loading={attendeesResending.includes(item._id)}
                              disabled={unsynced}
                            >
                              Resend
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="light"
                              leftSection={<Pencil size={12} />}
                              onClick={() => openAttendeeEdit(item)}
                              disabled={
                                unsynced ||
                                attendeesResending.includes(item._id)
                              }
                            >
                              Edit
                            </Button>
                          </Group>
                        )}
                      </Card>
                    );
                  })}
                </Stack>
              </Paper>
            )}

            {eventExpenses.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Title order={4} mb="md">
                  Expenses
                </Title>
                <Stack gap="md">
                  {eventExpenses.map((item) => (
                    <ExpensesCard
                      key={item._id}
                      item={item}
                      toggleExpenseImages={toggleExpenseImages}
                      setToggleExpenseImages={setToggleExpenseImages}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

            <Text size="xs" c="dimmed" ta="center">
              Actions can only be performed at least four days after the event's
              end date, and the event has not been cancelled.
            </Text>
          </Stack>
        </>
      )}

      <Modal
        opened={isAddAttendeeOpen}
        onClose={closeAttendeeDialog}
        title={
          <Text fw={600}>
            {editingAttendee ? 'Edit Attendee' : 'Add Attendees'}
          </Text>
        }
      >
        <Stack gap="md">
          <Box>
            <TextInput
              label="Phone No"
              placeholder="Enter phone no"
              value={attendee?.phone_no}
              onChange={(e) => handlePhoneNumberChange(e.currentTarget.value)}
              type="tel"
              error={attendeeFieldError('phone_no')}
            />
            {attendeesSearchResult.length > 0 && (
              <Paper
                withBorder
                radius="md"
                mt="xs"
                mah={160}
                style={{ overflowY: 'auto' }}
              >
                {attendeesSearchResult.map((item, index) => (
                  <UnstyledButton
                    key={index}
                    w="100%"
                    p="xs"
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
                    <Text size="sm">
                      {item.name.length > 20
                        ? item.name.slice(0, 20) + '...'
                        : item.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {item.phone_no}
                    </Text>
                  </UnstyledButton>
                ))}
              </Paper>
            )}
          </Box>
          <TextInput
            label="Name"
            placeholder="Enter name"
            value={attendee?.name}
            error={attendeeFieldError('name')}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setAttendee((prev) => ({ ...prev, name: value }));
            }}
          />
          <TextInput
            label="Land Area"
            placeholder="Enter land area"
            value={attendee?.land_area}
            error={attendeeFieldError('land_area')}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setAttendee((prev) => ({
                ...prev,
                land_area: value.replace(/[^0-9.]/g, ''),
              }));
            }}
            type="text"
          />

          {/* Host Farmer Checkbox */}
          <Checkbox
            label="Host Farmer"
            checked={attendee.farmer_verify}
            onChange={(e) => {
              const checked = e.currentTarget.checked;
              setAttendee((prev) => ({
                ...prev,
                farmer_verify: checked,
              }));
            }}
          />
          <Button onClick={handleAddAttendee} loading={addAttendeeLoading}>
            {editingAttendee ? 'Save & Resend' : 'Add Attendee'}
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={isUpdateStageOpen}
        onClose={() => setIsUpdateStageOpen(false)}
        title={<Text fw={600}>Update Event Stage</Text>}
      >
        <Stack gap="xs">
          {eventStageList.map((item, index) => (
            <UnstyledButton
              key={index}
              w="100%"
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
              <Paper withBorder radius="md" p="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm">{item.name}</Text>
                  {updatingEventStageId === item.id ? (
                    <Loader size={20} />
                  ) : item.id === event.event_stage_id ? (
                    <CheckCheck size={20} color="var(--mantine-color-blue-6)" />
                  ) : null}
                </Group>
              </Paper>
            </UnstyledButton>
          ))}
        </Stack>
      </Modal>

      <ConfirmModal
        opened={isVerifyEventOpen}
        onClose={() => setIsVerifyEventOpen(false)}
        onConfirm={onConfirmEvent}
        title="Verify Event"
        confirmLabel="Yes"
        cancelLabel="No"
        loading={verifyEventLoading}
        color={theme.primaryColor}
      >
        Are you sure you want to mark this event as verified?
      </ConfirmModal>

      <ConfirmModal
        opened={isMarkAttendedOpen}
        onClose={() => setIsMarkAttendedOpen(false)}
        onConfirm={onConfirmEventAttended}
        title="Mark Event as Attended"
        confirmLabel="Yes"
        cancelLabel="No"
        loading={rsmAttendedLoading}
        color={theme.primaryColor}
      >
        Are you sure you want to mark this event as attended?
      </ConfirmModal>

      {/* Event Image Modal */}
      {selectedEventImage && (
        <Modal
          opened
          onClose={() => setSelectedEventImage(null)}
          size="xl"
          padding="xs"
        >
          <Image
            src={selectedEventImage}
            alt="Event Image"
            mah="85vh"
            fit="contain"
            radius="md"
            onError={() => {
              toast.error('Failed to load image');
              setSelectedEventImage(null);
            }}
          />
          <Text size="sm" c="dimmed" ta="center" mt="xs">
            Event Image ({event?.images?.indexOf(selectedEventImage) + 1} of{' '}
            {event?.images?.length})
          </Text>
        </Modal>
      )}

      {/* Attendee Remove Confirmation Dialog */}
      <ConfirmModal
        opened={isAttendeeRemoveDialogOpen}
        onClose={() => {
          setIsAttendeeRemoveDialogOpen(false);
          setRemovingAttendee(null);
        }}
        onConfirm={removeAttendee}
        title="Remove Attendee"
        confirmLabel="Yes"
        cancelLabel="No"
        loading={
          removingAttendee
            ? attendeesRemoving.includes(removingAttendee._id)
            : false
        }
      >
        Are you sure you want to remove this attendee{' '}
        {removingAttendee ? recordRef(removingAttendee) : ''}?
      </ConfirmModal>
    </Container>
  );
};

export default EventDetailsOfRegionalManagerEvent;
