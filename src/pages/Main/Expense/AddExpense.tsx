/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import SelectBox from '@/components/Select';
import { callApi, callServerAPI } from '@/api';
import { selectUser } from '@/redux/slices/AuthSlice';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToCloudinary } from '@/utils';
import { toast } from 'sonner';
import dayjs from 'dayjs';

const AddExpenseReporting = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [expensesCategory, setExpensesCategory] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [isAttachmentAllowed, setIsAttachmentAllowed] = useState(false);
  const { state } = useLocation(); // state is any or unknown

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
        `/expense/categories?type=${state?.event_id ? 'events' : ''}`,
        null,
        onSuccess,
        onError
      );
    };

    fetchExpensesCategory();
  }, [state?.event_id]);

  const expenseCategoriesData = expensesCategory.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  useEffect(() => {
    if (expenseCategory) {
      const selectedCategory = expensesCategory.find(
        (item: any) => item.id === expenseCategory
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
    if (event_id && event_title && event_description) {
      setDescription(`${event_title} - ${event_description}`);
    }
  }, [state]);

  useEffect(() => {
    if (state?.event_id) {
      document.title = `Add Expense For Event #${state.event_id}`;
    } else {
      document.title = 'Add Expense';
    }
  }, [state?.event_id]);

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

    if ((!files || files.length === 0) && isAttachmentAllowed) {
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
          'DD-MM-YYYY'
        )}-${dayjs().format('HH-mm-ss')}-${i}`;
        return await uploadToCloudinary(
          file,
          `expenses-${user.name}/${dayjs().format('MMMM-YYYY')}`,
          fileName
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

    setLoading(false);
    setAddExpenseLoading(false);

    const data: {
      name: string;
      category_id: string;
      description: string;
      date: string;
      company_id: number;
      employee_id: number;
      urls?: string[];
      currency_id: number;
      event_id?: string;
      url?: string;

      file_urls?: string[];
    } = {
      name: description,
      category_id: expenseCategory,
      description: description,
      date: dayjs(date).format('DD-MM-YYYY'),
      company_id: user.company.id,
      employee_id: user.id,
      currency_id: 160,
      url: '',
      file_urls: uploadImages || [],
    };

    if (state?.event_id) {
      data.event_id = state.event_id;
    }

    const onSuccessDB = () => {
      setLoading(false);
      toast.success('Expense added successfully');
      setAddExpenseLoading(false);
      navigate(-1);
    };

    const onSuccess = (response: {
      status: string;
      data: {
        message: Array<{ id: number; state: string }>;
      };
    }) => {
      const dbData = {
        amount: amount,
        name: expenseCategoriesData.find(
          (item) => item.value === expenseCategory
        )?.label,
        category_id: expenseCategory,
        description: description,
        date: date,
        company_id: user.company.id,
        employee_id: user.id,
        id: response?.data?.message[0]?.id,
        status: 'sent',
        odooStatus: response?.data?.message[0]?.state || 'draft',
        urls: uploadImages || [],
      };
      if (data?.event_id) {
        // @ts-expect-error
        dbData.event_id = data.event_id;
      }

      //  event_id: data?.event_id ? data?.event_id : null,
      // First upload the images to the server
      callApi('POST', '/expense/create', { ...dbData }, onSuccessDB, onError);
      setLoading(false);
    };

    const onError = () => {
      setLoading(false);
      toast.error('Failed to add expense. Please try again.');
      setAddExpenseLoading(false);
    };

    callServerAPI(
      'POST',
      '/post/expense',
      { data: { ...data, total_amount_currency: Number(amount) } },
      onSuccess,
      onError
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

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
    } else {
      // Clear the input
      e.target.value = '';
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>
              {state?.event_id
                ? `Add Expense For Event #${state.event_id}`
                : 'Add Expense'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'dd-MM-yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate);
                          setOpenDatePicker(false);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() ||
                        date <
                          new Date(
                            new Date().setDate(new Date().getDate() - 5)
                          ) ||
                        date.getDate() === new Date().getDate()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseCategory">Expense Category</Label>
                <SelectBox
                  label=""
                  selectedValue={expenseCategory}
                  onValueChange={setExpenseCategory}
                  data={expenseCategoriesData}
                  placeholder="Select the category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter the amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {isAttachmentAllowed && (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Files (Max 5)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="cursor-pointer"
                    multiple
                  />
                  {files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-gray-600">
                        Selected files ({files.length}/5):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                          >
                            <span className="text-sm truncate flex-1">
                              {file.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)}MB
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Expense Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter the description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAddExpense}
                disabled={addExpenseLoading}
                className="w-full md:w-auto"
              >
                {addExpenseLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddExpenseReporting;
