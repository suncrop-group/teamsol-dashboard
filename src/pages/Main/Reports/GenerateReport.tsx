import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi, callServerAPI } from '@/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, ArrowLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

const GenerateReport = () => {
  const { state } = useLocation();
  const { title, fields, api_url, optionalFields } = state || {};
  const [loading, setLoading] = useState(false);
  const [dynamicFields, setDynamicFields] = useState(null);
  const { territories, company, region } = useSelector(selectUser);
  const [customers, setCustomers] = useState([]);
  const [report, setReport] = useState('');
  const [fileName, setFileName] = useState('');
  const [showFromDate, setShowFromDate] = useState(false);
  const [showToDate, setShowToDate] = useState(false);
  const [policy, setPolicy] = useState([]);
  const [sortColumn, setSortColumn] = useState('');
  const [productsData, setProductsData] = useState([]);
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!fields) return;
    const dynFields = fields
      .map((field) => ({
        [field]: '',
        date_from: dayjs(new Date()).format('DD-MM-YYYY'),
        date_to: dayjs(new Date()).format('DD-MM-YYYY'),
      }))
      .reduce((acc, val) => Object.assign(acc, val), {});
    setDynamicFields(dynFields);
  }, [fields]);

  useEffect(() => {
    if (fields?.includes('sort_column')) {
      setDynamicFields((prev) => ({
        ...prev,
        sort_column: 'Sale',
      }));
      setSortColumn('Sale');
    }
  }, [fields]);

  useEffect(() => {
    if (fields?.includes('product_id') && dynamicFields?.policy_id) {
      callApi(
        'GET',
        `/products/get?policy=${dynamicFields.policy_id}`,
        {},
        (res) => {
          setProductsData(
            res.products.map((product: { name: string; id: string }) => ({
              label: product.name,
              value: product.id,
            }))
          );
        },
        () => {
          setProductsData([]);
          toast.error('Error fetching products', {
            description: 'Please try again',
          });
        }
      );
    }
  }, [fields, dynamicFields?.policy_id]);

  useEffect(() => {
    if (dynamicFields?.territory_id) {
      callApi(
        'GET',
        `/customers/territory?territory_id=${dynamicFields.territory_id}`,
        {},
        (res) => {
          setCustomers(
            res.data.map((customer) => ({
              label: customer.name,
              value: customer.id,
            }))
          );
        },
        () => {
          setCustomers([]);
          toast.error('Error fetching customers', {
            description: 'Please try again',
          });
        }
      );
    }

    if (dynamicFields?.policy_id === '') {
      callApi(
        'GET',
        `/policy`,
        {},
        (res) => {
          setPolicy(
            res.data.map((policy) => ({
              label: policy.code,
              value: policy.id,
            }))
          );
        },
        () => {
          setPolicy([]);
          toast.error('Error fetching policies', {
            description: 'Please try again',
          });
        }
      );
    }
  }, [dynamicFields?.territory_id, dynamicFields?.policy_id]);

  const handleGenerateReport = () => {
    const missingFields = Object.keys(dynamicFields)?.filter(
      (key) => dynamicFields[key] === '' && !optionalFields?.includes(key)
    );
    if (missingFields.length > 0) {
      toast.error('All fields are required', {
        description: `Please fill all the required fields.`,
      });
      setLoading(false);
      return;
    }

    const onSuccess = async (res) => {
      const pdfBase64 = `data:application/pdf;base64,${res.data}`;
      setReport(pdfBase64);
      const name = `${title.replace(/\s/g, '_')}-${dayjs().format(
        'DD_MM_YYYY'
      )}-${dayjs().format('HH_mm_ss')}.pdf`;
      setFileName(name || 'report.pdf');
      toast.success('PDF Generated', {
        description: 'PDF generated successfully!',
      });
      setLoading(false);
    };

    const onError = () => {
      toast.error('Failed to generate report', { description: 'Error' });
      setLoading(false);
    };

    const data = {
      ...dynamicFields,
      with_party: 'with_party',
      company_id: company.id,
    };

    if (region?.id) {
      data.region_id = region.id;
    }

    setLoading(true);
    callServerAPI(
      'POST',
      `/${api_url}`,
      { data },
      onSuccess,
      onError,
      false,
      true
    );
  };

  const downloadReport = () => {
    if (!report) {
      toast.error('No PDF found to download', { description: 'Error' });
      return;
    }

    try {
      const base64WithoutPrefix = report.replace(
        'data:application/pdf;base64,',
        ''
      );
      const byteCharacters = atob(base64WithoutPrefix);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      saveAs(blob, fileName);
      toast.success('Download Complete', {
        description: 'PDF saved to Downloads folder',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to save the PDF file', { description: 'Error' });
    }
  };

  useEffect(() => {
    if (user?.region?.id) {
      setDynamicFields((prev) => ({
        ...prev,
        region_id: user.region.id,
      }));
    }
  }, [user?.region?.id]);

  const territoriesData =
    territories.length > 0
      ? territories.map((territory) => ({
          label: territory.name,
          value: territory.id,
        }))
      : [];

  if (report) {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setReport('');
                  setFileName('');
                  setLoading(false);
                }}
                aria-label="Generate new report"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <iframe
                  src={report}
                  title="Generated Report"
                  className="w-full max-w-2xl h-[60vh] border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={downloadReport} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Download Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReport('');
                    setFileName('');
                    setLoading(false);
                  }}
                >
                  Generate New Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields?.includes('date_from') && dynamicFields?.date_from && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date <span className="text-red-500">*</span>
                </label>
                <Popover open={showFromDate} onOpenChange={setShowFromDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {dynamicFields.date_from}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dayjs(
                        dynamicFields.date_from,
                        'DD-MM-YYYY'
                      ).toDate()}
                      onSelect={(date) => {
                        setDynamicFields({
                          ...dynamicFields,
                          date_from: dayjs(date).format('DD-MM-YYYY'),
                        });
                        setShowFromDate(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {fields.includes('date_to') && dynamicFields?.date_to && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date <span className="text-red-500">*</span>
                </label>
                <Popover open={showToDate} onOpenChange={setShowToDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {dynamicFields.date_to}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dayjs(
                        dynamicFields.date_to,
                        'DD-MM-YYYY'
                      ).toDate()}
                      onSelect={(date) => {
                        setDynamicFields({
                          ...dynamicFields,
                          date_to: dayjs(date).format('DD-MM-YYYY'),
                        });
                        setShowToDate(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {fields.includes('region_id') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <Input
                  value={user.region?.name || ''}
                  disabled
                  className="w-full"
                />
              </div>
            )}

            {fields.includes('territory_id') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Territory <span className="text-red-500">*</span>
                </label>
                <Select
                  value={dynamicFields?.territory_id}
                  onValueChange={(value) =>
                    setDynamicFields({ ...dynamicFields, territory_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select territory" />
                  </SelectTrigger>
                  <SelectContent>
                    {territoriesData.map((territory) => (
                      <SelectItem key={territory.value} value={territory.value}>
                        {territory.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {fields.includes('partner_id') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <Select
                  value={dynamicFields?.partner_id}
                  onValueChange={(value) =>
                    setDynamicFields({ ...dynamicFields, partner_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.value} value={customer.value}>
                        {customer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {fields.includes('policy_id') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy
                </label>
                <Select
                  value={dynamicFields?.policy_id}
                  onValueChange={(value) =>
                    setDynamicFields({ ...dynamicFields, policy_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>

                  <SelectContent>
                    {policy.map((policy) => (
                      <SelectItem key={policy.value} value={policy.value}>
                        {policy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {fields.includes('product_id') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <Select
                  value={dynamicFields?.product_id}
                  onValueChange={(value) =>
                    setDynamicFields({ ...dynamicFields, product_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData.map((product) => (
                      <SelectItem key={product.value} value={product.value}>
                        {product.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {fields.includes('sort_column') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Column
                </label>
                <Select
                  value={dynamicFields?.sort_column || sortColumn}
                  onValueChange={(value) =>
                    setDynamicFields({ ...dynamicFields, sort_column: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Sort Column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Collection">Collection</SelectItem>
                    <SelectItem value="Debtors">Debtors</SelectItem>
                    <SelectItem value="Creditors">Creditors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {fields.includes('width_category') &&
              fields.includes('top_bottom') && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="width_category"
                      checked={dynamicFields?.width_category || false}
                      onCheckedChange={(checked) =>
                        setDynamicFields({
                          ...dynamicFields,
                          width_category: checked,
                          top_bottom: false,
                        })
                      }
                    />
                    <label
                      htmlFor="width_category"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      With Category
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="top_bottom"
                      checked={dynamicFields?.top_bottom || false}
                      onCheckedChange={(checked) =>
                        setDynamicFields({
                          ...dynamicFields,
                          width_category: false,
                          top_bottom: checked,
                        })
                      }
                    />
                    <label
                      htmlFor="top_bottom"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Top Bottom
                    </label>
                  </div>
                </div>
              )}

            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateReport;
