import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  TextInput,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import { callApi } from "@/api";
import { errorMessage, newRequestId } from "@/api/v2";
import { parseCustomDate } from "@/utils";
import { selectUser } from "@/redux/slices/AuthSlice";
import { toast } from "@/lib/toast";
import Loader from "@/components/Loader";
import SelectBox from "@/components/Select";
import { PageHeader } from "@/components/app";

const RESOURCE = "/v2/events";

// Form fields the server (or Odoo) can blame; anything else goes in the alert.
const FIELDS = [
  "name",
  "territory_id",
  "event_type_id",
  "crop_id",
  "demo_product_id",
  "cpo_id",
  "cpo_name",
  "date_begin",
  "date_end",
];

const AddEvent = () => {
  // A failed event opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;
  // Stored as `DD/MM/YYYY HH:mm:00`.
  const recordBegin = record ? parseCustomDate(record.date_begin) : null;
  const recordEnd = record ? parseCustomDate(record.date_end) : null;

  const [dateBegin, setDateBegin] = useState(recordBegin || new Date());
  const [dateEnd, setDateEnd] = useState(recordEnd || new Date());
  const [beginTime, setBeginTime] = useState(
    dayjs(recordBegin || undefined).format("HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    dayjs(recordEnd || undefined).format("HH:mm"),
  );
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState(record?.territory_id ?? "");
  const { territories } = useSelector(selectUser);
  const userRegion = useSelector(selectUser)?.region;
  const [crops, setCrops] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState(
    (record?.crops || []).map((item) => ({ label: item.name, value: item.id })),
  );
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(
    (record?.demo_products || []).map((item) => ({
      label: item.name,
      value: item.id,
    })),
  );
  const [eventName, setEventName] = useState(record?.name || "");
  const [eventTemId, setEventTemId] = useState(record?.event_type_id ?? "");
  const [eventTemplates, setEventTemplates] = useState([]);
  const [cpoName, setCpoName] = useState(record?.cpo_name || "");
  const [cpoId, setCpoId] = useState(record?.copId ?? "");
  const [cpos, setCpos] = useState([]);
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two events.
  const requestId = useRef(newRequestId());
  const navigate = useNavigate();

  useEffect(() => {
    if (!userRegion) return;

    const fetchCrops = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        setCrops(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error("Failed to fetch crops", {
          description: "Error",
        });
      };

      setLoading(true);
      callApi("GET", `/events/crops`, null, onSuccess, onError);
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
        toast.error("Failed to fetch products", {
          description: "Error",
        });
      };

      setLoading(true);
      callApi("GET", `/events/products`, null, onSuccess, onError);
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
        toast.error("Failed to fetch event templates", {
          description: "Error",
        });
      };

      setLoading(true);
      callApi("GET", `/events/templates`, null, onSuccess, onError);
    };

    const fetchCpos = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        setCpos(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error("Failed to fetch CPOs", {
          description: "Error",
        });
      };

      setLoading(true);
      callApi(
        "GET",
        `/events/cpos?territory_id=${territory}`,
        null,
        onSuccess,
        onError,
      );
    };

    fetchCpos();
    fetchEventTemplates();
  }, [territory]);

  // Date Begin: today or one of the four days before it.
  const earliest = dayjs().subtract(4, "day").startOf("day").toDate();
  const latest = dayjs().endOf("day").toDate();

  const handleAddEvent = () => {
    if (
      territory === "" ||
      eventName === "" ||
      selectedCrops.length === 0 ||
      selectedProducts.length === 0 ||
      // cpoName === '' ||
      eventTemId === ""
    ) {
      toast.error("Please fill all the fields", {
        description: "Error",
      });
      return;
    }

    // A record being corrected keeps the date it was created with.
    if (
      !record &&
      (dayjs(dateBegin).isBefore(earliest) || dayjs(dateBegin).isAfter(latest))
    ) {
      toast.error("Date Begin must be today or within the last 4 days", {
        description: "Error",
      });
      return;
    }

    // The region, organiser and manager are set by the server, which also
    // queues the category's checklist once the event is in Odoo.
    const body = {
      name: eventName,
      crop_id: selectedCrops.map((item) => item.value),
      demo_product_id: selectedProducts.map((item) => item.value),
      date_begin: `${dayjs(dateBegin).format("YYYY-MM-DD")} ${beginTime || "00:00"}`,
      date_end: `${dayjs(dateEnd).format("YYYY-MM-DD")} ${endTime || "00:00"}`,
      territory_id: territory,
      event_type_id: eventTemId,
      cpo_name: cpoName,
      ...(cpoId && { cpo_id: cpoId }),
    };

    const onSuccess = () => {
      setLoading(false);
      toast.success(
        record ? "Event updated and queued" : "Event saved and queued",
        { description: "Success" },
      );
      navigate("/events");
    };

    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, "Failed to add event");
      setFieldError({ field: error?.field, message });
      toast.error(message, {
        description: "Error",
      });
    };

    setLoading(true);
    setFieldError(null);
    if (record) {
      callApi("PUT", `${RESOURCE}/${record._id}`, body, onSuccess, onError);
    } else {
      callApi(
        "POST",
        RESOURCE,
        { ...body, clientRequestId: requestId.current },
        onSuccess,
        onError,
      );
    }
  };

  const errorFor = (...fields: string[]) =>
    fields.includes(fieldError?.field) ? fieldError.message : undefined;

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

  const cposData =
    cpos.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  return (
    <Container size="sm" px={0}>
      <PageHeader title={record ? "Edit Event" : "Add Event"} back />
      <Paper withBorder shadow="sm" p="lg" pos="relative">
        <Loader loading={loading} />
        <Stack gap="md">
          {fieldError && !FIELDS.includes(fieldError.field) && (
            <Alert color="red" variant="light">
              {fieldError.message}
            </Alert>
          )}
          <TextInput
            label="Event Address"
            value={eventName}
            onChange={(e) => setEventName(e.currentTarget.value)}
            placeholder="Enter the event address"
            error={errorFor("name")}
            required
          />
          <TextInput
            label="Region"
            value={userRegion?.name || "N/A"}
            disabled
            placeholder="Region"
          />
          <SelectBox
            label="Territory"
            placeholder="Select the territory"
            data={territoriesData}
            selectedValue={territory}
            onValueChange={setTerritory}
            error={errorFor("territory_id")}
          />
          <SelectBox
            label="Event Category"
            placeholder="Select the event category"
            data={eventTemplatesData}
            selectedValue={eventTemId}
            onValueChange={setEventTemId}
            error={errorFor("event_type_id")}
          />
          <SelectBox
            label="Crop"
            placeholder="Select the crop"
            data={cropsData}
            selectedValue={selectedCrops}
            onValueChange={setSelectedCrops}
            error={errorFor("crop_id")}
            isMultiple
          />
          <SelectBox
            label="Product"
            placeholder="Select the product"
            data={productsData}
            selectedValue={selectedProducts}
            onValueChange={setSelectedProducts}
            error={errorFor("demo_product_id")}
            isMultiple
          />
          <SelectBox
            label="CPO for Allowance"
            placeholder="Select the CPO"
            data={cposData}
            selectedValue={cpoId}
            onValueChange={(value) => {
              const cpo = cposData.find((item) => item.value === value);
              setCpoName(cpo?.label || "");
              setCpoId(cpo?.value || "");
            }}
            error={errorFor("cpo_id", "cpo_name")}
          />
          <Group gap="sm" align="flex-end" wrap="nowrap">
            <DatePickerInput
              flex={1}
              label="Date Begin"
              placeholder="Select a Date"
              valueFormat="DD-MM-YYYY"
              leftSection={<CalendarIcon size={16} />}
              value={dateBegin}
              onChange={(value) => value && setDateBegin(dayjs(value).toDate())}
              minDate={earliest}
              maxDate={latest}
              error={errorFor("date_begin")}
            />
            <TimeInput
              w={130}
              aria-label="Begin time"
              value={beginTime}
              onChange={(e) => setBeginTime(e.currentTarget.value)}
            />
          </Group>
          <Group gap="sm" align="flex-end" wrap="nowrap">
            <DatePickerInput
              flex={1}
              label="Date End"
              placeholder="Select a Date"
              valueFormat="DD-MM-YYYY"
              leftSection={<CalendarIcon size={16} />}
              value={dateEnd}
              onChange={(value) => value && setDateEnd(dayjs(value).toDate())}
              minDate={earliest}
              error={errorFor("date_end")}
            />
            <TimeInput
              w={130}
              aria-label="End time"
              value={endTime}
              onChange={(e) => setEndTime(e.currentTarget.value)}
            />
          </Group>
          <Button onClick={handleAddEvent} loading={loading} fullWidth>
            {record ? "Save & Resend" : "Submit"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AddEvent;
