import { isEntryDateDisabled } from '@/utils/dates';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ActionIcon,
  Alert,
  Button,
  Container,
  FileInput,
  Group,
  Loader,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { CalendarIcon, X } from 'lucide-react';
import dayjs from 'dayjs';
import SelectBox from '@/components/Select';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { selectUser } from '@/redux/slices/AuthSlice';
import { uploadToCloudinary } from '@/utils';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';

const RESOURCE = '/v2/expenses';

// Fields with their own input; any other error is shown in an alert.
const FORM_FIELDS = [
  'date',
  'name',
  'category_id',
  'amount',
  'description',
  'urls',
];

// The backend stores an expense's day as `DD-MM-YYYY` text; older records
// hold an ISO date.
const parseExpenseDate = (value?: string) => {
  const parts = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value || '');
  if (parts) {
    return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : new Date();
};

// Same rule the calendar had before: no future dates, nothing older than
// five days, and not today's day of the month.
// Today and the four days before, in Pakistan time (see utils/dates).
const isDateDisabled = isEntryDateDisabled;

const AddExpenseReporting = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { state } = useLocation(); // state is any or unknown
  // A failed expense opened from a list to be fixed and sent again.
  const record = state?.record;
  // The event's Odoo id, when the expense belongs to an event.
  const eventId = state?.event_id ?? record?.event_id;
  const [expenseCategory, setExpenseCategory] = useState(
    record?.category_id ?? '',
  );
  const [amount, setAmount] = useState(String(record?.amount ?? ''));
  const [date, setDate] = useState<Date>(
    record ? parseExpenseDate(record.date) : new Date(),
  );
  const [expensesCategory, setExpensesCategory] = useState([]);
  const [description, setDescription] = useState<string>(
    record?.description || '',
  );
  const [loading, setLoading] = useState(false);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isAttachmentAllowed, setIsAttachmentAllowed] = useState(false);
  // Attachments already uploaded for the expense being edited.
  const existingUrls: string[] = record?.urls || [];
  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two expenses.
  const requestId = useRef(newRequestId());

  useEffect(() => {
    const fetchExpensesCategory = async () => {
      const onSuccess = (response: {
        status: string;
        data: Array<{ id: string; name: string; is_attachment?: boolean }>;
      }) => {
        setLoading(false);
        setExpensesCategory(response.data);
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch expense categories. Please try again.', {
          id: 'error',
        });
        setExpensesCategory([]);
      };

      setLoading(true);
      callApi(
        'GET',
        `/expense/categories?type=${eventId ? 'events' : ''}`,
        null,
        onSuccess,
        onError,
      );
    };

    fetchExpensesCategory();
  }, [eventId]);

  const expenseCategoriesData = expensesCategory.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  useEffect(() => {
    if (expenseCategory) {
      const selectedCategory = expensesCategory.find(
        (item: { id: string; is_attachment?: boolean }) =>
          String(item.id) === String(expenseCategory),
      );
      if (selectedCategory) {
        setIsAttachmentAllowed(selectedCategory?.is_attachment ?? false);
      } else {
        setIsAttachmentAllowed(false);
        setFiles([]);
      }
    }
  }, [expenseCategory, expensesCategory]);

  useEffect(() => {
    if (!isAttachmentAllowed) {
      setFiles([]);
    }
  }, [isAttachmentAllowed]);

  useEffect(() => {
    const { event_id, event_title, event_description } = state || {};
    if (!record && event_id && event_title && event_description) {
      setDescription(`${event_title} - ${event_description}`);
    }
  }, [state, record]);

  useEffect(() => {
    if (record) {
      document.title = 'Edit Expense';
    } else if (state?.event_id) {
      document.title = `Add Expense For Event #${state.event_id}`;
    } else {
      document.title = 'Add Expense';
    }
  }, [record, state?.event_id]);

  const handleAddExpense = async () => {
    if (
      amount === '' ||
      expenseCategory === '' ||
      description === '' ||
      !date
    ) {
      toast.error('Please fill all the fields');
      return;
    }

    if (
      (!files || files.length === 0) &&
      existingUrls.length === 0 &&
      isAttachmentAllowed
    ) {
      toast.error('Please select at least one file');
      return;
    }

    if (files.length > 5) {
      toast.error('You can only upload up to 5 files');
      return;
    }

    // Show loader immediately
    setLoading(true);
    setAddExpenseLoading(true);

    let uploadImages: string[] = [];

    if (files.length > 0 && isAttachmentAllowed) {
      const uploadPromises = files.map(async (file, i) => {
        const fileName = `expenses-${user.name}-${dayjs().format(
          'DD-MM-YYYY',
        )}-${dayjs().format('HH-mm-ss')}-${i}`;
        return await uploadToCloudinary(
          file,
          `expenses-${user.name}/${dayjs().format('MMMM-YYYY')}`,
          fileName,
        );
      });

      try {
        uploadImages = await Promise.all(uploadPromises);
      } catch (error) {
        setLoading(false);
        setAddExpenseLoading(false);
        toast.error(`Failed to upload files: ${error.message}`, {
          id: 'upload-error',
        });
        return;
      }
    }

    const body: Record<string, unknown> = {
      // Category label, shown in lists.
      name: expenseCategoriesData.find(
        (item) => String(item.value) === String(expenseCategory),
      )?.label,
      category_id: Number(expenseCategory),
      amount: Number(amount),
      description: description,
      date: dayjs(date).format('YYYY-MM-DD'),
      // New uploads replace the attachments an edited expense already had.
      urls: !isAttachmentAllowed
        ? []
        : uploadImages.length > 0
          ? uploadImages
          : existingUrls,
    };

    const onSuccess = () => {
      setLoading(false);
      setAddExpenseLoading(false);
      toast.success(
        record ? 'Expense updated and queued' : 'Expense saved and queued',
      );
      // Event expenses are added from the event's page; go back to it.
      if (eventId) navigate(-1);
      else navigate('/expenses');
    };

    const onError = (error) => {
      setLoading(false);
      setAddExpenseLoading(false);
      const message = errorMessage(
        error,
        'Failed to add expense. Please try again.',
      );
      setFieldError({ field: error?.field, message });
      toast.error(message);
    };

    setFieldError(null);
    if (record) {
      callApi('PUT', `${RESOURCE}/${record._id}`, body, onSuccess, onError);
    } else {
      callApi(
        'POST',
        RESOURCE,
        {
          ...body,
          // The event's Odoo id.
          ...(state?.event_id && { event_id: state.event_id }),
          clientRequestId: requestId.current,
        },
        onSuccess,
        onError,
      );
    }
  };

  const errorFor = (...fields: string[]) =>
    fields.includes(fieldError?.field) ? fieldError.message : undefined;

  // The picker shows `files`, so a rejected selection needs no manual reset.
  const handleFileChange = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > 5) {
      toast.error('You can only upload up to 5 files', { id: 'count-error' });
      return;
    }

    const validFiles: File[] = [];
    let hasError = false;

    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 5MB limit`, {
          id: 'size-error',
        });
        hasError = true;
        break;
      }

      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`File "${file.name}" is not a valid image or PDF`, {
          id: 'type-error',
        });
        hasError = true;
        break;
      }

      validFiles.push(file);
    }

    if (!hasError) {
      setFiles(validFiles);
    }
  };

  return (
    <Container size="sm" px={0}>
      <PageHeader
        title={
          record
            ? 'Edit Expense'
            : state?.event_id
              ? `Add Expense For Event #${state.event_id}`
              : 'Add Expense'
        }
        back
      />
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : (
        <Paper withBorder shadow="sm" p="lg">
          <Stack gap="md">
            {fieldError && !FORM_FIELDS.includes(fieldError.field) && (
              <Alert color="red" variant="light">
                {fieldError.message}
              </Alert>
            )}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <DatePickerInput
                label="Date"
                placeholder="Pick a date"
                valueFormat="DD-MM-YYYY"
                leftSection={<CalendarIcon size={16} />}
                value={date}
                onChange={(value) => {
                  if (value) {
                    setDate(dayjs(value).toDate());
                  }
                }}
                excludeDate={isDateDisabled}
                error={errorFor('date')}
              />
              <SelectBox
                label="Expense Category"
                selectedValue={expenseCategory}
                onValueChange={setExpenseCategory}
                data={expenseCategoriesData}
                placeholder="Select the category"
                error={errorFor('category_id', 'name')}
              />
              <TextInput
                label="Amount"
                type="number"
                placeholder="Enter the amount"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
                error={errorFor('amount')}
              />
              {isAttachmentAllowed && (
                <Stack gap="xs">
                  <FileInput
                    label="Upload Files (Max 5)"
                    placeholder="Choose files"
                    accept="image/*,application/pdf"
                    multiple
                    value={files}
                    onChange={handleFileChange}
                    error={errorFor('urls')}
                  />
                  {files.length === 0 && existingUrls.length > 0 && (
                    <Text size="sm" c="dimmed">
                      {existingUrls.length} file(s) already attached. Choose
                      files to replace them.
                    </Text>
                  )}
                  {files.length > 0 && (
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Selected files ({files.length}/5):
                      </Text>
                      <ScrollArea.Autosize mah={128}>
                        <Stack gap={4}>
                          {files.map((file, index) => (
                            <Group
                              key={index}
                              justify="space-between"
                              wrap="nowrap"
                              gap="xs"
                              p={6}
                            >
                              <Text size="sm" truncate flex={1} miw={0}>
                                {file.name}
                              </Text>
                              <Group gap="xs" wrap="nowrap">
                                <Text size="xs" c="dimmed">
                                  {(file.size / 1024 / 1024).toFixed(2)}MB
                                </Text>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="sm"
                                  aria-label="Remove file"
                                  onClick={() => {
                                    setFiles((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    );
                                  }}
                                >
                                  <X size={14} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          ))}
                        </Stack>
                      </ScrollArea.Autosize>
                    </Stack>
                  )}
                </Stack>
              )}
            </SimpleGrid>

            <Textarea
              label="Expense Description"
              placeholder="Enter the description"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              error={errorFor('description')}
              rows={4}
            />

            <Group justify="flex-end" mt="xs">
              <Button
                onClick={handleAddExpense}
                loading={addExpenseLoading}
                w={{ base: '100%', md: 'auto' }}
              >
                {record ? 'Save & Resend' : 'Add Expense'}
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default AddExpenseReporting;
