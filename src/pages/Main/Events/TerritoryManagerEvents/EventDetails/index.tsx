import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Divider,
  FileInput,
  Group,
  Image,
  Loader,
  Menu,
  Modal,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  CheckCheck,
  Clock,
  Eye,
  Image as ImageIcon,
  MoreVertical,
  Pencil,
  RotateCw,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import dayjs from "dayjs";
import { callApi } from "@/api";
import {
  errorMessage,
  isFailed,
  isQueued,
  isUnsynced,
  newRequestId,
  recordRef,
  useQueuedRefresh,
} from "@/api/v2";
import { priceFormatter, parseCustomDate, uploadToCloudinary } from "@/utils";
import { debounce } from "lodash";
import { toast } from "@/lib/toast";
import {
  ConfirmModal,
  FailedActions,
  PageHeader,
  StatusBadge,
} from "@/components/app";

const RESOURCE = "/v2/events";
const SENDING_HINT = "Being sent to Odoo…";

const EMPTY_ATTENDEE = {
  name: "",
  phone_no: "",
  land_area: "",
  farmer_verify: false,
};
// Attendee form fields a server error can be shown under.
const ATTENDEE_FIELDS = ["name", "phone_no", "land_area"];

// An expense still waiting in the queue can be cancelled; once it is in
// Odoo, only while Odoo has it as a draft.
const canCancelExpense = (item) =>
  isQueued(item) || (!isUnsynced(item) && item.odooStatus === "draft");

const ImagePreviewModal = ({
  image,
  alt,
  onClose,
}: {
  image: string | null;
  alt: string;
  onClose: () => void;
}) =>
  image ? (
    <Modal opened={!!image} onClose={onClose} size="xl" centered>
      <Image src={image} alt={alt} fit="contain" mah="75vh" />
    </Modal>
  ) : null;

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
  const [busy, setBusy] = useState("");

  if (!actions?.length) return null;

  const run = (jobId: string, kind: "retry" | "dismiss") => {
    setBusy(`${jobId}:${kind}`);
    callApi(
      kind === "retry" ? "POST" : "DELETE",
      kind === "retry"
        ? `/v2/events/${eventId}/actions/${jobId}/retry`
        : `/v2/events/${eventId}/actions/${jobId}`,
      kind === "retry" ? {} : null,
      () => {
        setBusy("");
        toast.success(kind === "retry" ? "Queued again" : "Dismissed");
        onChanged();
      },
      (error) => {
        setBusy("");
        toast.error(
          errorMessage(
            error,
            kind === "retry"
              ? "Could not send it again. Please try again."
              : "Could not dismiss. Please try again.",
          ),
        );
        // It may already be gone or resent: show what is there now.
        onChanged();
      },
    );
  };

  return (
    <Stack gap="xs">
      {actions.map((action) => (
        <Alert key={action.jobId} color="red" variant="light" p="xs">
          <Group justify="space-between" align="center" gap="sm">
            <Text size="sm" flex={1} miw={200}>
              Could not send: {action.label} — {action.error}
            </Text>
            <Group gap={6} wrap="nowrap">
              <Button
                size="compact-xs"
                variant="default"
                onClick={() => run(action.jobId, "retry")}
                loading={busy === `${action.jobId}:retry`}
                disabled={!!busy}
              >
                Try again
              </Button>
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                onClick={() => run(action.jobId, "dismiss")}
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
  cancelOrder,
  canMakeAction,
  onEdit,
  onChanged,
}: {
  item: {
    _id: string;
    id?: number;
    jobId?: string;
    syncError?: string;
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
  cancelOrder?: () => void;
  canMakeAction?: boolean;
  onEdit: () => void;
  onChanged: () => void;
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
        opacity={isUnsynced(item) || item.odooStatus === "draft" ? 1 : 0.5}
      >
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Text size="sm" fw={500} flex={1}>
              {item?.name}
            </Text>
            <Text size="sm" fw={600}>
              {priceFormatter(item?.amount)} PKR
            </Text>
          </Group>
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {recordRef(item)}
            </Text>
            {cancelOrder && (
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label="Cancel expense"
                onClick={() => cancelOrder()}
                disabled={!canMakeAction || !canCancelExpense(item)}
              >
                <Trash2 size={16} />
              </ActionIcon>
            )}
          </Group>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Stack gap="xs" flex={1}>
              <Group gap="xs" c="dimmed" wrap="nowrap">
                <Clock size={16} style={{ flexShrink: 0 }} />
                <Text size="sm">
                  {dayjs(item?.createdAt).format("MM-DD-YYYY")} -{" "}
                  {dayjs(item?.createdAt).format("hh:mm A")}
                </Text>
              </Group>
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
                    onClick={() => window.open(item?.url, "_blank")}
                  >
                    <Eye size={16} />
                  </ActionIcon>
                )}
                {item?.urls && item.urls.length > 0 && (
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<ImageIcon size={16} />}
                    onClick={toggleImages}
                  >
                    {toggleExpenseImages.includes(item._id)
                      ? `Hide Image${item.urls.length > 1 ? "s" : ""}`
                      : `Show Image${item.urls.length > 1 ? "s" : ""}`}{" "}
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

          {isFailed(item) && (
            <FailedActions
              item={item}
              resource="/v2/expenses"
              onEdit={onEdit}
              onChanged={onChanged}
            />
          )}

          {/* Image Gallery for Expenses */}
          {item?.urls &&
            item.urls.length > 0 &&
            toggleExpenseImages.includes(item._id) && (
              <Group gap="xs" mt="xs">
                {item.urls.map((imageUrl: string, index: number) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Expense image ${index + 1}`}
                    w={80}
                    h={80}
                    fit="cover"
                    radius="md"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedImage(imageUrl)}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </Group>
            )}
        </Stack>
      </Card>

      {/* Image Modal for Expenses */}
      <ImagePreviewModal
        image={selectedImage}
        alt="Expense Image"
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

const TMCreatedEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    null,
  );
  // Attendees (by `_id`) with a remove, resend or joined call in flight.
  const [attendeesRemoving, setAttendeesRemoving] = useState<string[]>([]);
  const [attendeesBusy, setAttendeesBusy] = useState<string[]>([]);
  const [removingAttendee, setRemovingAttendee] = useState(null);
  // One key per attendee form, so a double submit cannot add them twice.
  const attendeeRequestId = useRef(newRequestId());
  const [isAttendeeRemoveDialogOpen, setIsAttendeeRemoveDialogOpen] =
    useState(false);
  const [attendee, setAttendee] = useState(EMPTY_ATTENDEE);
  // The failed attendee being fixed in the attendee form, if any.
  const [editingAttendee, setEditingAttendee] = useState(null);
  // Field the server blamed for a refused attendee, and its message.
  const [attendeeError, setAttendeeError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [attendeeList, setAttendeeList] = useState([]);
  const [failedActions, setFailedActions] = useState([]);
  const [event, setEvent] = useState({
    _id: "",
    id: "",
    status: "",
    syncError: "",
    order_sequence: "",
    date_begin: "",
    date_end: "",
    region: { name: "" },
    territory: { name: "" },
    event_type: { name: "" },
    crops: [],
    demo_products: [],
    attendees: [],
    name: "",
    event_stage_id: 0,
    verified: false,
    event_stage: { name: "" },
    images: [],
  });
  const [isAttendeeDialogOpen, setIsAttendeeDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  // The event with its attendees and expenses. `leaveIfGone`: the event may
  // just have been discarded, so a failed reload goes back to the list.
  const fetchEventDetails = (loading = true, leaveIfGone = false) => {
    if (loading) setLoading(true);
    callApi(
      "GET",
      `${RESOURCE}/${eventId}`,
      null,
      (response) => {
        setLoading(false);
        const byNewest = (a, b) =>
          dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
        setEvent(response.data.event);
        setSyncPending(!!response.data.pending);
        setFailedActions(response.data.failedActions || []);
        setAttendeeList((response.data.attendees || []).sort(byNewest));
        setEventExpenses((response.data.expenses || []).sort(byNewest));
      },
      () => {
        setLoading(false);
        if (leaveIfGone) {
          navigate("/events");
          return;
        }
        if (loading) {
          toast.error("Failed to fetch event details", {
            description: "Error",
          });
        }
      },
    );
  };

  // After an action: show its effect now, and look again shortly in case
  // Odoo refused it (the old value comes back with `syncError`).
  const recheck = useRef<ReturnType<typeof setTimeout>[]>([]);
  const refetchQuietly = () => {
    fetchEventDetails(false);
    recheck.current.push(setTimeout(() => fetchEventDetails(false), 4000));
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
    const timers = recheck.current;
    return () => timers.forEach(clearTimeout);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Keep reloading while the event, an attendee or an expense is queued.
  // `syncPending` covers changes to a synced event (stage, photos, verify…),
  // which leave every record's own status untouched while they are sent.
  const [syncPending, setSyncPending] = useState(false);
  useQueuedRefresh(
    [event, ...attendeeList, ...eventExpenses, { status: syncPending ? 'queued' : '' }],
    () =>
    fetchEventDetails(false),
  );

  // Actions need the event to be in Odoo.
  const unsynced = isUnsynced(event);

  const onStageChange = (stageId) => {
    if (event?.event_stage_id === stageId) {
      toast.error("Event stage is already updated", { description: "Error" });
      return;
    }
    setUpdatingEventStageId(stageId);
    const onSuccess = () => {
      toast.success("Event Stage Updated successfully", {
        description: "Success",
      });
      refetchQuietly();
      setIsStageDialogOpen(false);
      setUpdateStatusFetching(false);
      setUpdatingEventStageId(null);
    };
    const onError = (error) => {
      toast.error(errorMessage(error, "Failed to update event stage"), {
        description: "Error",
      });
      setUpdateStatusFetching(false);
      setUpdatingEventStageId(null);
    };
    callApi(
      "PATCH",
      `${RESOURCE}/${event._id}/stage`,
      { stage_id: stageId },
      onSuccess,
      onError,
    );
  };

  const handleAddAttendee = () => {
    if (!attendee.name || !attendee.phone_no || !attendee.land_area) {
      toast.error("Please fill all fields", { description: "Error" });
      return;
    }
    const editing = editingAttendee;
    const onSuccess = () => {
      setAddAttendeeLoading(false);
      if (editing) {
        toast.success("Attendee updated and queued");
      } else {
        toast.success("Attendee added successfully", {
          description: "Success",
        });
        attendeeRequestId.current = newRequestId();
      }
      refetchQuietly();
      setIsAttendeeDialogOpen(false);
      setEditingAttendee(null);
      setAttendee(EMPTY_ATTENDEE);
      setAttendeesSearchResult([]);
    };
    const onError = (error) => {
      setAddAttendeeLoading(false);
      const message = errorMessage(
        error,
        editing ? "Failed to update attendee" : "Failed to add attendee",
      );
      // Under the field the server names; anything else as a toast.
      if (ATTENDEE_FIELDS.includes(error?.field)) {
        setAttendeeError({ field: error.field, message });
      } else {
        toast.error(message, { description: "Error" });
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
        "PUT",
        `${RESOURCE}/${event._id}/attendees/${editing._id}`,
        body,
        onSuccess,
        onError,
      );
    } else {
      callApi(
        "POST",
        `${RESOURCE}/${event._id}/attendees`,
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
      name: item.name || "",
      phone_no: item.phone_no || "",
      land_area: String(item.land_area ?? ""),
      farmer_verify: !!item.farmer_verify,
    });
    setAttendeeError(null);
    setAttendeesSearchResult([]);
    setIsAttendeeDialogOpen(true);
  };

  const closeAttendeeDialog = () => {
    setIsAttendeeDialogOpen(false);
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

  //   eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearchAttendee = React.useCallback(
    debounce((phone_no) => {
      // Clearing the field, or too little to search on, clears the matches.
      if (!phone_no || phone_no.length < 3) {
        setAttendeesSearchResult([]);
        return;
      }
      const onSuccess = (response) => {
        setAttendeesSearchResult(response.data);
      };
      const onError = () => {
        toast.error("Failed to search attendee", { description: "Error" });
      };
      callApi(
        "GET",
        `/events/attendee/search?phone_no=${encodeURIComponent(phone_no)}`,
        null,
        onSuccess,
        onError,
      );
    }, 500),
    [],
  );

  const handlePhoneNumberChange = (text) => {
    setAttendee((prevState) => ({ ...prevState, phone_no: text }));
    setAttendeeError(null);
    debouncedSearchAttendee(text);
  };

  const fetchEventStagesList = () => {
    const onSuccess = (response) => {
      setUpdateStatusFetching(false);
      setIsStageDialogOpen(true);
      setEventStageList(response.data);
    };
    const onError = () => {
      setUpdateStatusFetching(false);
      toast.error("Failed to fetch event stage", { description: "Error" });
    };
    setUpdateStatusFetching(true);
    callApi("GET", `/events/stages`, null, onSuccess, onError);
  };

  const endDate = parseCustomDate(event?.date_end);
  const canMakeAction = dayjs().isBefore(dayjs(endDate).add(4, "day"));

  // Image management functions
  // Receives the files picked in the FileInput (was the native change event).
  const handleFileChange = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > 5) {
      toast.error("You can only upload up to 5 files at a time");
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

      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error(`File "${file.name}" is not a valid image or PDF`);
        hasError = true;
        break;
      }

      validFiles.push(file);
    }

    if (!hasError) {
      setFiles(validFiles);
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
          `${index + 1}-${file.name.split(".")[0]}`,
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // The server saves the photos and queues them for Odoo.
      await new Promise((resolve, reject) => {
        callApi(
          "POST",
          `${RESOURCE}/${event._id}/images`,
          { urls: uploadedUrls },
          resolve,
          reject,
        );
      });

      toast.success("Files uploaded successfully");
      setFiles([]);
      refetchQuietly();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(errorMessage(error, "Failed to upload files"));
    } finally {
      setUploadLoading(false);
    }
  };

  const deleteEventImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    if (eventImagesRemoving.includes(imageUrl)) {
      toast.error("Image is already being removed");
      return;
    }

    setEventImagesRemoving((prev) => [...prev, imageUrl]);

    try {
      // The URL goes in the query string: DELETE carries no body.
      await new Promise((resolve, reject) => {
        callApi(
          "DELETE",
          `${RESOURCE}/${event._id}/images?url=${encodeURIComponent(imageUrl)}`,
          null,
          resolve,
          reject,
        );
      });

      toast.success("Image removed successfully");
      refetchQuietly();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(errorMessage(error, "Failed to remove image"));
    } finally {
      setEventImagesRemoving((prev) => prev.filter((img) => img !== imageUrl));
    }
  };

  const removeAttendee = () => {
    if (!canMakeAction) return;
    if (!removingAttendee) return;
    const attendeeId = removingAttendee._id;
    if (attendeesRemoving.includes(attendeeId)) {
      toast.error("Attendee is already being removed");
      return;
    }

    setAttendeesRemoving((prev) => [...prev, attendeeId]);
    const done = () =>
      setAttendeesRemoving((prev) => prev.filter((id) => id !== attendeeId));

    // Not in Odoo yet: gone at once. In Odoo: listed as "removing" until
    // Odoo confirms.
    callApi(
      "DELETE",
      `${RESOURCE}/${event._id}/attendees/${attendeeId}`,
      null,
      () => {
        done();
        toast.success("Attendee removed successfully");
        refetchQuietly();
        setIsAttendeeRemoveDialogOpen(false);
        setRemovingAttendee(null);
      },
      (error) => {
        done();
        console.error("Remove attendee error:", error);
        toast.error(errorMessage(error, "Failed to remove attendee"));
      },
    );
  };

  // Resend a failed attendee, or mark one as having joined the event.
  const attendeeAction = (
    item,
    action: "retry" | "joined",
    success: string,
    failure: string,
  ) => {
    setAttendeesBusy((prev) => [...prev, item._id]);
    const done = () =>
      setAttendeesBusy((prev) => prev.filter((id) => id !== item._id));
    callApi(
      "POST",
      `${RESOURCE}/${event._id}/attendees/${item._id}/${action}`,
      {},
      () => {
        done();
        toast.success(success);
        refetchQuietly();
      },
      (error) => {
        done();
        toast.error(errorMessage(error, failure));
      },
    );
  };

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseCancelDialogOpen, setIsExpenseCancelDialogOpen] =
    useState(false);
  const [expenseCancelLoading, setExpenseCancelLoading] = useState(false);

  const cancelExpense = () => {
    if (!selectedExpense) return;

    const onSuccess = () => {
      setExpenseCancelLoading(false);
      setSelectedExpense(null);
      setIsExpenseCancelDialogOpen(false);
      refetchQuietly();
      toast.success("Expense cancelled successfully");
    };
    const onError = (error: { message?: string }) => {
      setExpenseCancelLoading(false);
      setSelectedExpense(null);
      setIsExpenseCancelDialogOpen(false);
      toast.error(
        errorMessage(error, "Something went wrong. Please try again."),
      );
    };
    setExpenseCancelLoading(true);
    callApi(
      "POST",
      `/v2/expenses/${selectedExpense._id}/cancel`,
      {},
      onSuccess,
      onError,
    );
  };

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
            back
            actions={
              <Menu position="bottom-end" width={224} shadow="md">
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    aria-label="Event actions"
                  >
                    <MoreVertical size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {unsynced && <Menu.Label>{SENDING_HINT}</Menu.Label>}
                  {!event?.event_stage?.name
                    ?.toLowerCase()
                    ?.includes("cancel") && (
                    <>
                      <Menu.Item
                        disabled={
                          unsynced ||
                          !canMakeAction ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes("cancel") ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes("complete") ||
                          event?.verified
                        }
                        onClick={() => {
                          setIsAttendeeDialogOpen(true);
                        }}
                      >
                        Add Attendees
                      </Menu.Item>
                      <Menu.Item
                        disabled={
                          unsynced ||
                          !canMakeAction ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes("cancel") ||
                          event?.event_stage?.name
                            ?.toLowerCase()
                            ?.includes("complete") ||
                          event?.verified
                        }
                        onClick={() => {
                          navigate("/expenses/add", {
                            state: {
                              event_id: event.id,
                              event_title: event.name,
                              event_description: event.event_type.name,
                            },
                          });
                        }}
                      >
                        Add Expense
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Item
                    disabled={
                      unsynced ||
                      updateStatusFetching ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes("cancel") ||
                      event?.verified ||
                      event?.event_stage?.name
                        ?.toLowerCase()
                        ?.includes("complete") ||
                      !canMakeAction
                    }
                    onClick={fetchEventStagesList}
                  >
                    {event?.event_stage?.name?.toLowerCase()?.includes("cancel")
                      ? "Cancelled"
                      : event?.verified
                        ? "Verified"
                        : updateStatusFetching
                          ? "Getting Event Stages..."
                          : "Update Event Stage"}
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
                  resource={RESOURCE}
                  onEdit={() =>
                    navigate("/add-event", { state: { record: event } })
                  }
                  onChanged={() => fetchEventDetails(false, true)}
                />
              </Alert>
            ) : unsynced ? (
              <Alert color="blue" variant="light">
                {SENDING_HINT} Actions are available once it is there.
              </Alert>
            ) : (
              <RefusedChanges
                eventId={event._id}
                actions={failedActions}
                onChanged={refetchQuietly}
              />
            )}

            <Paper withBorder shadow="sm" p="lg">
              <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <Box>
                    <Text size="sm" c="dimmed">
                      Event Address
                    </Text>
                    <Text fw={500} mt={4}>
                      {event?.name}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Event Time
                    </Text>
                    <Text fw={500} mt={4}>
                      {event?.date_begin} - {event?.date_end}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Location
                    </Text>
                    <Text fw={500} mt={4}>
                      {event?.region?.name} - {event?.territory?.name}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Event Type
                    </Text>
                    <Text fw={500} mt={4}>
                      {event?.event_type?.name}
                    </Text>
                  </Box>
                </SimpleGrid>
                {event?.crops?.length > 0 && (
                  <Box>
                    <Text size="sm" c="dimmed">
                      Crops
                    </Text>
                    <Group gap="xs" mt="xs">
                      {event?.crops?.map((item, idx) => (
                        <Badge key={idx} color="green" variant="light">
                          {item.name}
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )}
                {event?.demo_products?.length > 0 && (
                  <Box>
                    <Text size="sm" c="dimmed">
                      Products
                    </Text>
                    <Group gap="xs" mt="xs">
                      {event?.demo_products?.map((item, idx) => (
                        <Badge key={idx} color="blue" variant="light">
                          {item.name}
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Event Images Section */}
            {event?.images && event.images.length > 0 && (
              <Paper withBorder shadow="sm" p="lg">
                <Title order={4}>Event Images</Title>
                <Divider my="md" />
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                  {event.images.map((imageUrl: string, index: number) => (
                    <Box key={index} pos="relative">
                      <AspectRatio ratio={1}>
                        <Image
                          src={imageUrl}
                          alt={`Event image ${index + 1}`}
                          fit="cover"
                          radius="md"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedEventImage(imageUrl)}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </AspectRatio>
                      {/* Delete button */}
                      {canMakeAction &&
                        !event?.event_stage?.name
                          ?.toLowerCase()
                          ?.includes("cancel") &&
                        !event?.verified && (
                          <ActionIcon
                            color="red"
                            variant="filled"
                            pos="absolute"
                            top={8}
                            right={8}
                            aria-label="Remove image"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEventImage(imageUrl);
                            }}
                            loading={eventImagesRemoving.includes(imageUrl)}
                            disabled={unsynced}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        )}
                    </Box>
                  ))}
                </SimpleGrid>
              </Paper>
            )}

            {/* File Upload Section */}
            {canMakeAction &&
              !event?.event_stage?.name?.toLowerCase()?.includes("cancel") &&
              !event?.verified && (
                <Paper withBorder shadow="sm" p="lg">
                  <Title order={4}>Upload Event Images</Title>
                  <Divider my="md" />
                  <Stack gap="sm">
                    <Group gap="md" align="flex-start">
                      <FileInput
                        flex={1}
                        miw={200}
                        multiple
                        accept="image/*"
                        placeholder="Choose files"
                        aria-label="Event images"
                        value={files}
                        onChange={handleFileChange}
                        disabled={uploadLoading || unsynced}
                      />
                      <Button
                        onClick={uploadFilesToEvent}
                        disabled={files.length === 0 || unsynced}
                        loading={uploadLoading}
                        leftSection={<Upload size={16} />}
                      >
                        Upload ({files.length})
                      </Button>
                    </Group>
                    {files.length > 0 && (
                      <Text size="sm" c="dimmed">
                        Selected: {files.map((f) => f.name).join(", ")}
                      </Text>
                    )}
                    {unsynced && (
                      <Text size="xs" c="dimmed">
                        {SENDING_HINT}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      You can upload up to 5 images at once. Maximum file size:
                      5MB per image.
                    </Text>
                  </Stack>
                </Paper>
              )}

            <Paper withBorder shadow="sm" p="lg">
              <Title order={4}>Attendees ({attendeeList.length})</Title>
              <Divider my="md" />
              {attendeeList.length === 0 ? (
                <Text ta="center" size="sm" c="dimmed" py="xl">
                  No attendees found
                </Text>
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {attendeeList.map((item, index) => {
                    const isFarmerHost = item.farmer_verify;
                    const isRemoving = attendeesRemoving.includes(item._id);
                    const isBusy = attendeesBusy.includes(item._id);
                    // Queued by the server to be removed from Odoo.
                    const beingRemoved = item.status === "removing";
                    const hasJoined =
                      !!event?.id &&
                      (item.attended_event_ids || []).includes(event.id);
                    return (
                      <Card key={item._id} withBorder padding="md">
                        <Group
                          justify="space-between"
                          align="flex-start"
                          wrap="nowrap"
                          mb="xs"
                        >
                          <Text fw={600}>
                            {index + 1}. {item.name}
                          </Text>
                          <Group gap="xs" wrap="nowrap">
                            {isFarmerHost && (
                              <Badge color="green" variant="light" size="sm">
                                Host
                              </Badge>
                            )}
                            {isUnsynced(item) && (
                              <StatusBadge status={item.status} size="sm" />
                            )}
                            {beingRemoved && (
                              <Badge color="yellow" variant="light" size="sm">
                                Removing…
                              </Badge>
                            )}
                            {hasJoined && (
                              <Badge color="green" variant="light" size="sm">
                                Joined
                              </Badge>
                            )}
                            {canMakeAction && (
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                aria-label="Remove attendee"
                                onClick={() => {
                                  setRemovingAttendee(item);
                                  setIsAttendeeRemoveDialogOpen(true);
                                }}
                                loading={isRemoving}
                                disabled={unsynced || beingRemoved}
                              >
                                <Trash2 size={14} />
                              </ActionIcon>
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
                          {(isFailed(item) || item.syncError) && (
                            <Text size="xs" c="red">
                              {item.syncError || "Could not be sent to Odoo."}
                            </Text>
                          )}
                          {canMakeAction && (
                            <Group gap={6} mt={4}>
                              {isFailed(item) && (
                                <Button
                                  size="compact-xs"
                                  variant="default"
                                  leftSection={<RotateCw size={12} />}
                                  onClick={() =>
                                    attendeeAction(
                                      item,
                                      "retry",
                                      "Queued again",
                                      "Could not resend. Please try again.",
                                    )
                                  }
                                  loading={isBusy}
                                  disabled={unsynced}
                                >
                                  Resend
                                </Button>
                              )}
                              {isFailed(item) && (
                                <Button
                                  size="compact-xs"
                                  variant="light"
                                  leftSection={<Pencil size={12} />}
                                  onClick={() => openAttendeeEdit(item)}
                                  disabled={unsynced || isBusy}
                                >
                                  Edit
                                </Button>
                              )}
                              {!isFailed(item) && !hasJoined && (
                                <Button
                                  size="compact-xs"
                                  variant="light"
                                  leftSection={<UserCheck size={12} />}
                                  onClick={() =>
                                    attendeeAction(
                                      item,
                                      "joined",
                                      "Attendee marked as joined",
                                      "Failed to mark attendee as joined",
                                    )
                                  }
                                  loading={isBusy}
                                  // Needs the attendee to be in Odoo.
                                  disabled={
                                    unsynced || !item.id || beingRemoved
                                  }
                                >
                                  Joined
                                </Button>
                              )}
                            </Group>
                          )}
                        </Stack>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </Paper>

            <Paper withBorder shadow="sm" p="lg">
              <Title order={4}>Expenses ({eventExpenses.length})</Title>
              <Divider my="md" />
              {eventExpenses.length === 0 ? (
                <Text ta="center" size="sm" c="dimmed" py="xl">
                  No Expense found
                </Text>
              ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {eventExpenses.map((item) => (
                    <ExpensesCard
                      key={item._id}
                      item={item}
                      // The form saves it again and comes back here.
                      onEdit={() =>
                        navigate("/expenses/add", { state: { record: item } })
                      }
                      onChanged={refetchQuietly}
                      toggleExpenseImages={toggleExpenseImages}
                      setToggleExpenseImages={setToggleExpenseImages}
                      canMakeAction={canMakeAction}
                      cancelOrder={() => {
                        setSelectedExpense(item);
                        setIsExpenseCancelDialogOpen(true);
                      }}
                    />
                  ))}
                </SimpleGrid>
              )}
            </Paper>
          </Stack>

          <Text size="xs" c="dimmed" ta="center" mt="md">
            Actions can only be performed at least four days after the event's
            end date, and the event has not been cancelled.
          </Text>

          <Modal
            opened={isAttendeeDialogOpen}
            onClose={closeAttendeeDialog}
            title={
              <Text fw={600}>
                {editingAttendee ? "Edit Attendee" : "Add Attendees"}
              </Text>
            }
          >
            <Stack gap="md">
              <Box>
                <TextInput
                  label="Phone No"
                  placeholder="Enter phone no"
                  value={attendee.phone_no}
                  onChange={(e) =>
                    handlePhoneNumberChange(e.currentTarget.value)
                  }
                  error={attendeeFieldError("phone_no")}
                />
                {attendeesSearchResult.length > 0 && (
                  <ScrollArea.Autosize mah={160} mt="xs">
                    <Stack gap="xs">
                      {attendeesSearchResult.map((item, index) => (
                        <Card
                          key={index}
                          withBorder
                          padding="xs"
                          style={{ cursor: "pointer" }}
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
                              ? `${item.name.slice(0, 20)}...`
                              : item.name}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {item.phone_no}
                          </Text>
                        </Card>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                )}
              </Box>
              <TextInput
                label="Name"
                placeholder="Enter name"
                value={attendee.name}
                error={attendeeFieldError("name")}
                onChange={(e) =>
                  setAttendee({ ...attendee, name: e.currentTarget.value })
                }
              />
              <TextInput
                label="Land Area"
                placeholder="Enter land area"
                type="text"
                value={attendee.land_area}
                error={attendeeFieldError("land_area")}
                onChange={(e) =>
                  setAttendee({
                    ...attendee,
                    land_area: e.currentTarget.value.replace(/[^0-9.]/g, ""),
                  })
                }
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
                {editingAttendee ? "Save & Resend" : "Add Attendee"}
              </Button>
            </Stack>
          </Modal>

          <Modal
            opened={isStageDialogOpen}
            onClose={() => setIsStageDialogOpen(false)}
            title={<Text fw={600}>Update Event Stage</Text>}
          >
            <Stack gap="xs">
              {eventStageList.map((item) => (
                <Card
                  key={item.id}
                  withBorder
                  padding="sm"
                  style={{ cursor: "pointer" }}
                  onClick={() => onStageChange(item.id)}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Text>{item.name}</Text>
                    {updatingEventStageId === item.id ? (
                      <Loader size="xs" />
                    ) : item.id === event.event_stage_id ? (
                      <CheckCheck
                        size={16}
                        color="var(--mantine-color-blue-6)"
                      />
                    ) : null}
                  </Group>
                </Card>
              ))}
            </Stack>
          </Modal>

          {/* Event Image Modal */}
          <ImagePreviewModal
            image={selectedEventImage}
            alt="Event Image"
            onClose={() => setSelectedEventImage(null)}
          />

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
            Are you sure you want to remove this attendee{" "}
            {removingAttendee
              ? `${recordRef(removingAttendee)} (${removingAttendee.name})`
              : ""}
            ?
          </ConfirmModal>

          {/* Expense Cancel Confirmation Dialog */}
          <ConfirmModal
            opened={isExpenseCancelDialogOpen}
            onClose={() => {
              setIsExpenseCancelDialogOpen(false);
              setSelectedExpense(null);
            }}
            onConfirm={cancelExpense}
            title="Cancel Expense"
            confirmLabel="Yes, Cancel"
            cancelLabel="No"
            loading={expenseCancelLoading}
          >
            Are you sure you want to cancel this expense{" "}
            {selectedExpense ? recordRef(selectedExpense) : ""}? This action
            cannot be undone.
          </ConfirmModal>
        </>
      )}
    </Container>
  );
};

export default TMCreatedEventDetails;
