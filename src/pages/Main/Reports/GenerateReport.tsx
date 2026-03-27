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
import { Switch } from '@/components/ui/switch';
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
import { Loader2, ArrowLeft, X } from 'lucide-react';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

const GenerateReport = () => {
  const { state } = useLocation();
  const { title, fields, api_url, optionalFields, code, regionOrTerritory } =
    state || {};
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
  const isRegionalManager = user?.is_region_manager;

  console.log({ regionOrTerritory });

  useEffect(() => {
    if (!fields) return;
    const dynFields = fields
      .map((field) => ({
        [field]: field === 'territory_ids' ? [] : '',
        date_from: dayjs(new Date()).format('DD-MM-YYYY'),
        date_to: dayjs(new Date()).format('DD-MM-YYYY'),
        is_yoy: false,
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

    if (fields?.includes('is_summary')) {
      setDynamicFields((prev) => ({
        ...prev,
        is_summary: 'false',
      }));
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
            })),
          );
        },
        () => {
          setProductsData([]);
          toast.error('Error fetching products', {
            description: 'Please try again',
          });
        },
      );
    }
  }, [fields, dynamicFields?.policy_id]);

  useEffect(() => {
    if (fields?.includes('product_id') && !dynamicFields?.policy_id) {
      callApi(
        'GET',
        `/products/get/without-policy`,
        {},
        (res) => {
          setProductsData(
            res.products.map((product: { name: string; id: string }) => ({
              label: product.name,
              value: product.id,
            })),
          );
        },
        () => {
          setProductsData([]);
          toast.error('Error fetching products', {
            description: 'Please try again',
          });
        },
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
            })),
          );
        },
        () => {
          setCustomers([]);
          toast.error('Error fetching customers', {
            description: 'Please try again',
          });
        },
      );
    }

    if (dynamicFields?.policy_id === '' || !dynamicFields?.policy_ids) {
      callApi(
        'GET',
        `/policy`,
        {},
        (res) => {
          setPolicy(
            res.data.map((policy) => ({
              label: policy.code,
              value: policy.id,
            })),
          );
        },
        () => {
          setPolicy([]);
          toast.error('Error fetching policies', {
            description: 'Please try again',
          });
        },
      );
    }
  }, [
    dynamicFields?.territory_id,
    dynamicFields?.policy_id,
    dynamicFields?.policy_ids,
  ]);

  const handleGenerateReport = () => {
    const missingFields = Object.keys(dynamicFields || {})?.filter((key) => {
      const value = dynamicFields[key];
      const isOptional = optionalFields?.includes(key);

      // Special case for category_wise_sale_analysis_report: territory_ids is optional for Regional Manager
      if (
        (code === 'category_wise_sale_analysis_report' ||
          code === 'collection_commission_report' ||
          code === 'bm_product_sale_report' ||
          code === 'bm_product_ledger_summary_report' ||
          code === 'fpl_sale_report' ||
          code === 'sale_analysis_report' ||
          code === 'credit_limit_report' ||
          code === 'tcl_status_report' ||
          code === 'account_status_policy_report' ||
          code === 'bm_account_status_area_wise_report' ||
          code === 'bm_account_status_policy_wise_report') &&
        isRegionalManager &&
        key === 'territory_ids'
      ) {
        return false;
      }

      // When regionOrTerritory is true, RSM can skip territory (they use region instead)
      if (
        isRegionalManager &&
        (key === 'territory_id' || key === 'territory_ids')
      ) {
        return false;
      }

      if (isOptional) return false;

      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === '';
    });

    // console.log(missingFields);
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
        'DD_MM_YYYY',
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

    if (fields.includes('is_summary')) {
      data.is_summary = dynamicFields.is_summary === 'true';
    }

    if (
      code === 'category_wise_sale_analysis_report' ||
      code === 'collection_commission_report' ||
      code === 'bm_product_sale_report' ||
      code === 'bm_product_ledger_summary_report' ||
      code === 'fpl_sale_report' ||
      code === 'sale_analysis_report' ||
      code === 'credit_limit_report' ||
      code === 'tcl_status_report' ||
      code === 'account_status_policy_report' ||
      code === 'bm_account_status_area_wise_report' ||
      code === 'bm_account_status_policy_wise_report'
    ) {
      delete data.region_id;
      if (isRegionalManager) {
        // If territories are selected, send empty region_ids
        if (
          dynamicFields.territory_ids &&
          dynamicFields.territory_ids.length > 0
        ) {
          data.region_ids = [];
        } else {
          // If no territories selected, send region_ids
          if (region?.id) {
            // data.region_id = region.id; // Removed as per request
            data.region_ids = [region.id];
            data.region_id = region.id;
          }
        }
      } else {
        // Territory Manager: Always empty region_ids
        data.region_ids = [];
      }
    } else {
      // Default behavior for other reports
      if (region?.id) {
        data.region_id = region.id;
        data.region_ids = [region.id];
      }
    }

    // ── regionOrTerritory: send only the chosen side ─────────────────────
    if (regionOrTerritory) {
      const hasTerritory =
        (data.territory_ids && data.territory_ids.length > 0) ||
        (data.territory_id && data.territory_id !== '');

      if (hasTerritory) {
        // Territories are chosen → strip all region fields
        delete data.region_id;
        delete data.region_ids;
      } else {
        // No territory chosen → strip all territory fields
        delete data.territory_id;
        delete data.territory_ids;
      }
    }

    setLoading(true);
    callServerAPI(
      'POST',
      `${api_url}`,
      { data },
      onSuccess,
      onError,
      false,
      true,
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
        '',
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

    if (fields?.includes('region_ids')) {
      setDynamicFields((prev) => ({
        ...prev,
        region_ids: [user.region.id],
      }));
    }
  }, [user?.region?.id, fields]);

  const territoriesData =
    territories.length > 0
      ? territories.map((territory) => ({
          label: territory.name,
          value: territory.id,
        }))
      : [];

  /* ─── REPORT VIEWER ─────────────────────────────────────────────────── */
  if (report) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b shadow-sm shrink-0">
          <div className="flex items-center gap-3">
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
            <h1 className="text-base font-semibold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReport('');
                setFileName('');
                setLoading(false);
              }}
            >
              New Report
            </Button>
            <Button size="sm" onClick={downloadReport} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Download PDF
            </Button>
          </div>
        </div>

        {/* PDF viewer — fills remaining height */}
        <iframe
          src={report}
          title="Generated Report"
          className="flex-1 w-full border-0"
        />
      </div>
    );
  }

  /* ─── FORM VIEW ──────────────────────────────────────────────────────── */

  // Collect which checkbox fields exist so we can group them
  const checkboxFields = [
    fields.includes('width_category') && fields.includes('top_bottom'),
    fields.includes('is_top_bottom'),
    fields.includes('with_category'),
    fields.includes('is_yoy'),
    fields.includes('is_all_policy'),
  ].some(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Fill in the parameters below to generate your report.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Date range ── */}
          {(fields?.includes('date_from') || fields.includes('date_to')) && (
            <Card>
              <CardHeader className="">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields?.includes('date_from') &&
                    dynamicFields?.date_from && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          From Date <span className="text-red-500">*</span>
                        </label>
                        <Popover
                          open={showFromDate}
                          onOpenChange={setShowFromDate}
                        >
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
                                'DD-MM-YYYY',
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                              'DD-MM-YYYY',
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Filters ── */}
          {(fields.includes('region_id') ||
            fields.includes('region_ids') ||
            fields.includes('territory_id') ||
            fields.includes('territory_ids') ||
            fields.includes('policy_ids') ||
            fields.includes('partner_id') ||
            fields.includes('policy_id') ||
            fields.includes('product_id') ||
            fields.includes('sort_column') ||
            fields.includes('is_summary')) && (
            <Card>
              <CardHeader className="">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.includes('region_id') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Region
                      </label>
                      <Input
                        value={user.region?.name || ''}
                        disabled
                        className="w-full"
                      />
                    </div>
                  )}

                  {fields.includes('region_ids') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Territory <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={dynamicFields?.territory_id}
                        onValueChange={(value) =>
                          setDynamicFields({
                            ...dynamicFields,
                            territory_id: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select territory" />
                        </SelectTrigger>
                        <SelectContent>
                          {territoriesData.map((territory) => (
                            <SelectItem
                              key={territory.value}
                              value={territory.value}
                            >
                              {territory.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {fields.includes('territory_ids') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Territories <span className="text-red-500">*</span>
                      </label>
                      <Select
                        onValueChange={(value) => {
                          const current = dynamicFields?.territory_ids || [];
                          const exists = current.includes(value);
                          const newValue = exists
                            ? current.filter((id) => id !== value)
                            : [...current, value];
                          setDynamicFields({
                            ...dynamicFields,
                            territory_ids: newValue,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              dynamicFields?.territory_ids?.length > 0
                                ? `${dynamicFields.territory_ids.length} territories selected`
                                : 'Select territories'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {territoriesData.map((territory) => (
                            <SelectItem
                              key={territory.value}
                              value={territory.value}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={dynamicFields?.territory_ids?.includes(
                                    territory.value,
                                  )}
                                  className="pointer-events-none"
                                />
                                {territory.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {dynamicFields?.territory_ids?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {dynamicFields.territory_ids.map((id) => {
                            const territory = territoriesData.find(
                              (t) => t.value === id,
                            );
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
                              >
                                {territory?.label}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDynamicFields({
                                      ...dynamicFields,
                                      territory_ids:
                                        dynamicFields.territory_ids.filter(
                                          (i) => i !== id,
                                        ),
                                    })
                                  }
                                  className="hover:bg-blue-200 rounded-full p-0.5"
                                  aria-label={`Remove ${territory?.label}`}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {fields.includes('policy_ids') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Policies <span className="text-red-500">*</span>
                      </label>
                      <Select
                        onValueChange={(value) => {
                          const current = dynamicFields?.policy_ids || [];
                          const exists = current.includes(value);
                          const newValue = exists
                            ? current.filter((id) => id !== value)
                            : [...current, value];
                          setDynamicFields({
                            ...dynamicFields,
                            policy_ids: newValue,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              dynamicFields?.policy_ids?.length > 0
                                ? `${dynamicFields.policy_ids.length} policies selected`
                                : 'Select policies'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {policy.map((pol) => (
                            <SelectItem key={pol.value} value={pol.value}>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={dynamicFields?.policy_ids?.includes(
                                    pol.value,
                                  )}
                                  className="pointer-events-none"
                                />
                                {pol.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {dynamicFields?.policy_ids?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {dynamicFields.policy_ids.map((id) => {
                            const pol = policy.find((t) => t.value === id);
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
                              >
                                {pol?.label}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDynamicFields({
                                      ...dynamicFields,
                                      policy_ids:
                                        dynamicFields.policy_ids.filter(
                                          (i) => i !== id,
                                        ),
                                    })
                                  }
                                  className="hover:bg-blue-200 rounded-full p-0.5"
                                  aria-label={`Remove ${pol?.label}`}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {fields.includes('partner_id') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={dynamicFields?.partner_id}
                        onValueChange={(value) =>
                          setDynamicFields({
                            ...dynamicFields,
                            partner_id: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.value}
                              value={customer.value}
                            >
                              {customer.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {fields.includes('policy_id') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Policy
                      </label>
                      <Select
                        value={dynamicFields?.policy_id}
                        onValueChange={(value) =>
                          setDynamicFields({
                            ...dynamicFields,
                            policy_id: value,
                          })
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Product
                      </label>
                      <Select
                        value={dynamicFields?.product_id}
                        onValueChange={(value) =>
                          setDynamicFields({
                            ...dynamicFields,
                            product_id: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productsData.map((product) => (
                            <SelectItem
                              key={product.value}
                              value={product.value}
                            >
                              {product.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {fields.includes('sort_column') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Sort Column
                      </label>
                      <Select
                        value={dynamicFields?.sort_column || sortColumn}
                        onValueChange={(value) =>
                          setDynamicFields({
                            ...dynamicFields,
                            sort_column: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sort column" />
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

                  {fields.includes('is_summary') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        View Mode
                      </label>
                      <Select
                        value={dynamicFields?.is_summary || 'false'}
                        onValueChange={(value) =>
                          setDynamicFields({
                            ...dynamicFields,
                            is_summary: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select view mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Summary</SelectItem>
                          <SelectItem value="false">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Report Options (checkboxes) ── */}
          {checkboxFields && (
            <Card>
              <CardHeader className="">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Report Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields.includes('width_category') &&
                    fields.includes('top_bottom') && (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">
                            With Category
                          </span>
                          <Switch
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
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">
                            Top Bottom
                          </span>
                          <Switch
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
                        </div>
                      </>
                    )}

                  {fields.includes('is_top_bottom') && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        Top Bottom
                      </span>
                      <Switch
                        id="is_top_bottom"
                        checked={dynamicFields?.is_top_bottom || false}
                        onCheckedChange={(checked) =>
                          setDynamicFields({
                            ...dynamicFields,
                            is_top_bottom: checked,
                            top_bottom: checked,
                          })
                        }
                      />
                    </div>
                  )}

                  {fields.includes('with_category') && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        With Category
                      </span>
                      <Switch
                        id="with_category"
                        checked={dynamicFields?.with_category || false}
                        onCheckedChange={(checked) =>
                          setDynamicFields({
                            ...dynamicFields,
                            with_category: checked,
                          })
                        }
                      />
                    </div>
                  )}

                  {fields.includes('is_yoy') && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        Last Year Comparison
                      </span>
                      <Switch
                        id="is_yoy"
                        checked={dynamicFields?.is_yoy || false}
                        onCheckedChange={(checked) =>
                          setDynamicFields({
                            ...dynamicFields,
                            is_yoy: checked,
                          })
                        }
                      />
                    </div>
                  )}
                  {fields.includes('is_all_policy') && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        Is All Policy
                      </span>
                      <Switch
                        id="is_all_policy"
                        checked={dynamicFields?.is_all_policy || false}
                        onCheckedChange={(checked) =>
                          setDynamicFields({
                            ...dynamicFields,
                            is_all_policy: checked,
                            all_policy: checked,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Generate button ── */}
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full h-11 text-sm font-medium"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReport;
