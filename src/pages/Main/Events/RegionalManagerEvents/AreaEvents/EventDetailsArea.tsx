import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Grid,
  Group,
  Image,
  Loader,
  Menu,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { Eye, MoreVertical } from 'lucide-react';
import { toast } from '@/lib/toast';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import {
  errorMessage,
  isQueued,
  isUnsynced,
  recordRef,
  useQueuedRefresh,
} from '@/api/v2';
import { priceFormatter } from '@/utils';
import { ConfirmModal, PageHeader, StatusBadge } from '@/components/app';

const ImagePreviewModal = ({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) => (
  <Modal opened onClose={onClose} size="xl" padding="xs">
    <Image src={src} alt={alt} mah="85vh" fit="contain" radius="md" />
  </Modal>
);

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
    <Text fw={500} mt={4} component="div">
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
}: {
  item: {
    _id: string;
    // Odoo id; empty until the expense has been sent.
    id?: number;
    jobId?: string;
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
      if (prev.includes(item._id)) {
        return prev.filter((id) => id !== item._id);
      } else {
        return [...prev, item._id];
      }
    });
  };

  return (
    <>
      <Card
        withBorder
        padding="md"
        opacity={item.odooStatus !== 'draft' ? 0.5 : 1}
      >
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
                    onClick={toggleImages}
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
                {item.urls.map((imageUrl: string, index: number) => (
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
        <ImagePreviewModal
          src={selectedImage}
          alt="Expense Image"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

const EventDetailsArea = () => {
  // The event's `_id` (the route still calls it `eventId`).
  const { eventId } = useParams();
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(true);
  const [updateCheckListLoading, setUpdateCheckListLoading] = useState(false);
  const [verifyEventLoading, setVerifyEventLoading] = useState(false);
  const [rsmAttendedLoading, setRsmAttendedLoading] = useState(false);
  const [eventExpenses, setEventExpenses] = useState([]);
  const [selectedCheckList, setSelectedCheckList] = useState([]);
  const [attendeeList, setAttendeeList] = useState([]);
  const [failedActions, setFailedActions] = useState([]);
  const [toggleExpenseImages, setToggleExpenseImages] = useState<string[]>([]);
  const [selectedEventImage, setSelectedEventImage] = useState<string | null>(
    null,
  );
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
    createdAt: null,
  });
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isAttendedDialogOpen, setIsAttendedDialogOpen] = useState(false);

  // The event with its attendees and expenses. `quiet` reloads in place.
  const fetchEventDetails = (quiet = false) => {
    if (!quiet) setLoading(true);
    callApi(
      'GET',
      `/v2/events/${eventId}`,
      null,
      (response) => {
        setLoading(false);
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
      },
      () => {
        setLoading(false);
        if (!quiet) {
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

  const onConfirmEvent = () => {
    setVerifyEventLoading(true);
    callApi(
      'POST',
      `/v2/events/${event._id}/verify`,
      { rsm_comments: '' },
      () => {
        setVerifyEventLoading(false);
        setIsVerifyDialogOpen(false);
        toast.success('Event confirmed and queued for Odoo', {
          description: 'Success',
        });
        refreshAfterAction();
      },
      (error) => {
        setVerifyEventLoading(false);
        setIsVerifyDialogOpen(false);
        toast.error(errorMessage(error, 'Failed to confirm event'), {
          description: 'Error',
        });
      },
    );
  };

  const onCheckListUpdate = () => {
    if (selectedCheckList.length === 0) {
      toast.error('Please select at least one checklist item', {
        description: 'Error',
      });
      return;
    }
    setUpdateCheckListLoading(true);
    callApi(
      'POST',
      `/v2/events/${event._id}/checklist`,
      {
        check_list_ids: selectedCheckList.map((item) => ({
          id: item.id,
          name: item.name,
        })),
      },
      () => {
        setUpdateCheckListLoading(false);
        toast.success('Event checklist updated and queued for Odoo', {
          description: 'Success',
        });
        setIsChecklistDialogOpen(false);
        refreshAfterAction();
      },
      (error) => {
        setUpdateCheckListLoading(false);
        toast.error(errorMessage(error, 'Failed to update event checklist'), {
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
        setIsAttendedDialogOpen(false);
        toast.success('Event marked as attended and queued for Odoo', {
          description: 'Success',
        });
        refreshAfterAction();
      },
      (error) => {
        setRsmAttendedLoading(false);
        setIsAttendedDialogOpen(false);
        toast.error(errorMessage(error, 'Failed to confirm event'), {
          description: 'Error',
        });
      },
    );
  };

  const canVerifyEvent = dayjs().isBefore(
    dayjs(event?.createdAt).add(5, 'day'),
  );

  return (
    <Container size="xl" px={0}>
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <>
          <PageHeader
            title={<>Event Detail {recordRef(event)}</>}
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
                  <Menu.Item
                    disabled={
                      unsynced ||
                      !canVerifyEvent ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes('cancel') ||
                      event?.verified
                    }
                    onClick={() => {
                      if (!canVerifyEvent) {
                        toast.error(
                          "Actions can only be performed at least four days after the event's end date, and the event has not been cancelled.",
                          {
                            description: 'Error',
                          },
                        );
                        return;
                      }
                      setIsVerifyDialogOpen(true);
                    }}
                  >
                    {event?.event_stage?.name?.toLowerCase()?.includes('cancel')
                      ? 'Cancelled'
                      : event?.verified
                        ? 'Verified'
                        : 'Verify Event'}
                  </Menu.Item>
                  <Menu.Item
                    disabled={
                      unsynced ||
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
                  </Menu.Item>
                  {!event?.event_stage?.name
                    ?.toLowerCase()
                    ?.includes('cancel') && (
                    <Menu.Item
                      disabled={unsynced}
                      onClick={() => {
                        setSelectedCheckList(event?.check_list_ids || []);
                        setIsChecklistDialogOpen(true);
                      }}
                    >
                      Update Checklist
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            }
          />

          <Stack gap="lg">
            {unsynced ? (
              <Alert color={isQueued(event) ? 'blue' : 'red'} variant="light">
                {isQueued(event)
                  ? 'Being sent to Odoo… Actions are available once it is there.'
                  : `This event could not be sent to Odoo${
                      event?.syncError ? `: ${event.syncError}` : '.'
                    } Its organiser can fix and resend it.`}
              </Alert>
            ) : (
              <RefusedChanges
                eventId={event._id}
                actions={failedActions}
                onChanged={refreshAfterAction}
              />
            )}
            <Paper withBorder shadow="sm" p="lg">
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Field label="Event Address">{event?.name}</Field>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Field label="Event Time">
                    {event?.date_begin} - {event?.date_end}
                  </Field>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Field label="Location">
                    {event?.region?.name} - {event?.territory?.name}
                  </Field>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Field label="Event Type">{event?.event_type?.name}</Field>
                </Grid.Col>
                {event?.crops?.length > 0 && (
                  <Grid.Col span={12}>
                    <Field label="Crops">
                      <Group gap="xs" mt={4}>
                        {event?.crops?.map((item, idx) => (
                          <Badge
                            key={idx}
                            variant="light"
                            color="green"
                            tt="none"
                          >
                            {item.name}
                          </Badge>
                        ))}
                      </Group>
                    </Field>
                  </Grid.Col>
                )}
                {event?.demo_products?.length > 0 && (
                  <Grid.Col span={12}>
                    <Field label="Products">
                      <Group gap="xs" mt={4}>
                        {event?.demo_products?.map((item, idx) => (
                          <Badge
                            key={idx}
                            variant="light"
                            color="blue"
                            tt="none"
                          >
                            {item.name}
                          </Badge>
                        ))}
                      </Group>
                    </Field>
                  </Grid.Col>
                )}
              </Grid>
            </Paper>

            {/* Event Images Section */}
            {event?.images && event.images.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Title order={4} mb="md">
                  Event Images
                </Title>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                  {event.images.map((imageUrl: string, index: number) => (
                    <AspectRatio key={index} ratio={1}>
                      <Image
                        src={imageUrl}
                        alt={`Event image ${index + 1}`}
                        fit="cover"
                        radius="md"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventImage(imageUrl);
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </AspectRatio>
                  ))}
                </SimpleGrid>
              </Paper>
            )}

            {attendeeList.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Title order={4} mb="md">
                  Attendees ({attendeeList.length})
                </Title>
                {attendeeList.length === 0 ? (
                  <Text ta="center" size="sm" c="dimmed" py="xl">
                    No attendees found
                  </Text>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {attendeeList.map((item) => {
                      const isFarmerHost = item.farmer_verify;
                      // Queued, failed or being removed: not settled in Odoo.
                      const pending =
                        isUnsynced(item) || item.status === 'removing';
                      return (
                        <Card key={item._id} withBorder padding="md">
                          <Group
                            justify="space-between"
                            align="flex-start"
                            wrap="nowrap"
                            mb="xs"
                          >
                            <Text fw={600}>{item.name}</Text>
                            <Group gap="xs" wrap="nowrap">
                              {pending && (
                                <StatusBadge status={item.status} size="sm" />
                              )}
                              {isFarmerHost && (
                                <Badge
                                  color="green"
                                  variant="light"
                                  size="sm"
                                  tt="capitalize"
                                >
                                  Host
                                </Badge>
                              )}
                            </Group>
                          </Group>
                          <Stack gap={4}>
                            <Group gap="xs">
                              <Text size="xs" c="dimmed" tt="uppercase">
                                Phone
                              </Text>
                              <Text size="sm">{item.phone_no}</Text>
                            </Group>
                            <Group gap="xs">
                              <Text size="xs" c="dimmed" tt="uppercase">
                                Area
                              </Text>
                              <Text size="sm">{item.land_area} Acre</Text>
                            </Group>
                          </Stack>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                )}
              </Paper>
            )}

            {eventExpenses.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Title order={4} mb="md">
                  Expenses ({eventExpenses.length})
                </Title>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {eventExpenses.map((item) => (
                    <ExpensesCard
                      key={item._id}
                      item={item}
                      toggleExpenseImages={toggleExpenseImages}
                      setToggleExpenseImages={setToggleExpenseImages}
                    />
                  ))}
                </SimpleGrid>
              </Paper>
            )}
          </Stack>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            Actions can only be performed at least four days after the event's
            end date, and the event has not been cancelled.
          </Text>

          <ConfirmModal
            opened={isVerifyDialogOpen}
            onClose={() => setIsVerifyDialogOpen(false)}
            onConfirm={onConfirmEvent}
            title="Confirm Event"
            confirmLabel="Yes"
            cancelLabel="No"
            loading={verifyEventLoading}
            color={theme.primaryColor}
          >
            Are you sure you want to confirm the event ({recordRef(event)})?
          </ConfirmModal>

          <Modal
            opened={isChecklistDialogOpen}
            onClose={() => setIsChecklistDialogOpen(false)}
            title={<Text fw={600}>Event Template Check List</Text>}
          >
            <Stack gap="xs">
              {event?.event_type?.check_list_ids.length > 0 ? (
                event?.event_type?.check_list_ids.map((item) => (
                  <Card key={item.id} withBorder padding="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm">{item.name}</Text>
                      <Checkbox
                        aria-label={item.name}
                        checked={selectedCheckList.some(
                          (check) => check.id === item.id,
                        )}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          setSelectedCheckList((prev) => {
                            if (checked) {
                              return [...prev, item];
                            } else {
                              return prev.filter(
                                (check) => check.id !== item.id,
                              );
                            }
                          });
                        }}
                      />
                    </Group>
                  </Card>
                ))
              ) : (
                <Text ta="center" c="dimmed">
                  No check list found
                </Text>
              )}
              <Button
                onClick={onCheckListUpdate}
                loading={updateCheckListLoading}
                fullWidth
                mt="md"
              >
                Update
              </Button>
            </Stack>
          </Modal>

          <ConfirmModal
            opened={isAttendedDialogOpen}
            onClose={() => setIsAttendedDialogOpen(false)}
            onConfirm={onConfirmEventAttended}
            title="Mark as Attended"
            confirmLabel="Yes"
            cancelLabel="No"
            loading={rsmAttendedLoading}
            color={theme.primaryColor}
          >
            Are you sure you want to mark this event as attended?
          </ConfirmModal>

          {/* Event Image Modal */}
          {selectedEventImage && (
            <ImagePreviewModal
              src={selectedEventImage}
              alt="Event Image"
              onClose={() => setSelectedEventImage(null)}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default EventDetailsArea;
