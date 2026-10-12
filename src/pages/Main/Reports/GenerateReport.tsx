import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Group,
  MultiSelect,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { selectUser } from '@/redux/slices/AuthSlice';
import { accountTiles, collectionTiles, saleReports } from '@/data';
import { callApi } from '@/api';
import { errorMessage } from '@/api/v2';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/app';
import { CalendarIcon, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import LazyReportViewer from './LazyReportViewer';
import { canSharePdf, needsPdfViewer, savePdf, sharePdf } from '@/lib/pdfFile';

interface Option {
  label: string;
  // Ids keep whatever type the API gave them (numbers in most lists).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

// Mantine selects need unique string values; the form state keeps the
// original ids, so options are converted here and mapped back on change.
const toOptions = (items: Option[]) => {
  const options: { value: string; label: string }[] = [];
  (items || []).forEach((item) => {
    const value = String(item.value);
    if (!options.some((option) => option.value === value)) {
      options.push({ value, label: String(item.label ?? '') });
    }
  });
  return options;
};

const toSelectValue = (value) =>
  value === undefined || value === null || value === '' ? null : String(value);

const originalValue = (items: Option[], value: string) =>
  (items || []).find((item) => String(item.value) === value)?.value;

// Multi-select values back to the ids held in state: an id that is already
// selected is kept as it is, a newly picked one comes from the options.
const originalValues = (items: Option[], current, values: string[]) =>
  values.map((value) => {
    const kept = (current || []).find((id) => String(id) === value);
    return kept !== undefined ? kept : originalValue(items, value);
  });

// Date fields are kept in state as 'DD-MM-YYYY' strings.
const toPickerDate = (value: string) => {
  const [day, month, year] = value.split('-');
  return `${year}-${month}-${day}`;
};

const SectionTitle = ({ children }) => (
  <Text size="sm" fw={500} c="dimmed" tt="uppercase" mb="md">
    {children}
  </Text>
);

const OptionSwitch = ({ label, checked, onChange }) => (
  <Paper withBorder p="sm">
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-label={label}
      />
    </Group>
  </Paper>
);

const allReports = [...accountTiles, ...collectionTiles, ...saleReports];

const GenerateReport = () => {
  const { state } = useLocation();
  // The browser keeps the navigation state across reloads, so the form is
  // read from the current definition; the state only says which report.
  const { title, fields, optionalFields, code, regionOrTerritory } =
    allReports.find((tile) => tile.code === state?.code) || state || {};
  const [loading, setLoading] = useState(false);
  const [dynamicFields, setDynamicFields] = useState(null);
  const { territories, region } = useSelector(selectUser);
  const [customers, setCustomers] = useState([]);
  const [report, setReport] = useState('');
  const [fileName, setFileName] = useState('');
  // On a small screen, and on any phone or tablet (which cannot show a PDF
  // inside the page), the report opens in the app-style viewer.
  const narrow = useMediaQuery('(max-width: 47.99em)', false, {
    getInitialValueInEffect: false,
  });
  const phone = narrow || needsPdfViewer();
  const [viewing, setViewing] = useState(false);
  const [policy, setPolicy] = useState([]);
  const [sortColumn, setSortColumn] = useState('');
  const [productsData, setProductsData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isRegionalManager = user?.is_region_manager;
  const [yearMonthData, setYearMonthData] = useState({
    months: [],
    years: [],
  });

  console.log({ yearMonthData });

  useEffect(() => {
    if (!fields) return;
    const dynFields = fields
      .map((field) => ({
        [field]: ['territory_ids', 'month_ids', 'policy_ids', 'region_ids', 'brand_ids', 'category_ids'].includes(field) ? [] : '',
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

  useEffect(() => {
    if (fields?.includes('month_ids') || fields?.includes('year_id')) {
      callApi(
        'GET',
        '/others/month-and-year',
        {},
        (res) => {
          const months = res?.data?.months || [];
          const rawYears = res?.data?.years || [];

          // Filter duplicate years by name, keeping the last occurrence
          const uniqueYearsMap = new Map();
          rawYears.forEach((y: { _id: string; id: number; name: string }) => {
            uniqueYearsMap.set(y.name, y);
          });
          const years = Array.from(uniqueYearsMap.values());
          
          setYearMonthData({
            months,
            years,
          });

          const currentMonth = dayjs().month() + 1;
          const currentYearStr = dayjs().year().toString();

          let defaultMonthIds: number[] = [];
          if (fields.includes('month_ids') && months.length > 0) {
            defaultMonthIds = months
              .filter((m: { _id: string; id: number; name: string }) => m.id <= currentMonth)
              .map((m: { _id: string; id: number; name: string }) => m.id);
          }

          let defaultYearId: number | '' = '';
          if (fields.includes('year_id') && years.length > 0) {
            const matchedYears = years.filter((y: { _id: string; id: number; name: string }) => y.name === currentYearStr);
            if (matchedYears.length > 0) {
              defaultYearId = matchedYears[matchedYears.length - 1].id;
            } else {
              defaultYearId = years[years.length - 1].id;
            }
          }

          setDynamicFields((prev: Record<string, unknown>) => ({
            ...prev,
            ...(fields.includes('month_ids') && { month_ids: defaultMonthIds }),
            ...(fields.includes('year_id') && { year_id: defaultYearId }),
          }));
        },
        () => {},
      );
    }
  }, [fields]);

  useEffect(() => {
    if (fields?.includes('brand_ids')) {
      callApi(
        'GET',
        '/brands',
        {},
        (res) => {
          setBrands(
            (res?.data?.brands || []).map(
              (brand: { id: number; name: string }) => ({
                label: brand.name,
                value: brand.id,
              }),
            ),
          );
        },
        () => {
          setBrands([]);
          toast.error('Error fetching brands', {
            description: 'Please try again',
          });
        },
      );
    }
  }, [fields]);

  // Level one product categories, for the category wise report.
  useEffect(() => {
    if (fields?.includes('category_ids')) {
      callApi(
        'GET',
        '/level-one-category',
        {},
        (res) => {
          setCategories(
            (res?.data?.level_one_category || []).map(
              (category: { id: number; name: string }) => ({
                label: category.name,
                value: category.id,
              }),
            ),
          );
        },
        () => {
          setCategories([]);
          toast.error('Error fetching categories', {
            description: 'Please try again',
          });
        },
      );
    }
  }, [fields]);

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
          code === 'target_vs_achievement_report' ||
          code === 'target_vs_achievement_brand_report' ||
          code === 'target_vs_achievement_category_report' ||
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

    // ── region + territory coexistence check ──────────────────────────────
    // When the form has both region and territory fields, we need at least
    // one side to have a value before calling the API.
    const hasRegionField =
      fields.includes('region_id') || fields.includes('region_ids');
    const hasTerritoryField =
      fields.includes('territory_id') || fields.includes('territory_ids');

    if (hasRegionField && hasTerritoryField) {
      const territorySelected =
        (dynamicFields?.territory_ids &&
          dynamicFields.territory_ids.length > 0) ||
        (dynamicFields?.territory_id && dynamicFields.territory_id !== '');
      const regionAvailable = !!region?.id;

      if (!territorySelected && !regionAvailable) {
        toast.error('Territory required', {
          description: 'Please select a territory to generate this report.',
        });
        setLoading(false);
        return;
      }
    }

    const onSuccess = async (res) => {
      const pdfBase64 = `data:application/pdf;base64,${res.data}`;
      setReport(pdfBase64);
      const name = `${title.replace(/\s/g, '_')}-${dayjs().format(
        'DD_MM_YYYY',
      )}-${dayjs().format('HH_mm_ss')}.pdf`;
      setFileName(name || 'report.pdf');
      // Straight into the viewer; closing it leaves the report's card.
      setViewing(true);
      toast.success('PDF Generated', {
        description: 'PDF generated successfully!',
      });
      setLoading(false);
    };

    // e.g. 403 when the employee lacks the report permission.
    const onError = (error) => {
      toast.error(errorMessage(error, 'Failed to generate report'), {
        description: 'Error',
      });
      setLoading(false);
    };

    // The company is sent with every report; the server still checks it
    // against the signed-in account and sets the Odoo user itself.
    const data = {
      ...dynamicFields,
      with_party: 'with_party',
      company_id: user?.company?.id ?? user?.company_id,
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
      code === 'target_vs_achievement_report' ||
      code === 'target_vs_achievement_brand_report' ||
      code === 'target_vs_achievement_category_report' ||
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
    if (regionOrTerritory && isRegionalManager) {
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
    callApi('POST', '/v2/reports/generate', { code, data }, onSuccess, onError);
  };

  // The phone's own share sheet, where the browser can share a file.
  const canShare = canSharePdf();

  const shareReport = async () => {
    try {
      await sharePdf(report, fileName, title);
    } catch {
      toast.error('Could not share the report', { description: 'Error' });
    }
  };

  const downloadReport = async () => {
    if (!report) {
      toast.error('No PDF found to download', { description: 'Error' });
      return;
    }

    try {
      const how = await savePdf(report, fileName);
      if (how === 'downloaded') {
        toast.success('Download Complete', {
          description: 'PDF saved to Downloads folder',
        });
      }
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

  const resetReport = () => {
    setReport('');
    setFileName('');
    setLoading(false);
    setViewing(false);
  };

  /* ─── REPORT VIEWER ─────────────────────────────────────────────────── */
  if (report && phone) {
    return (
      <Container size="lg" px={0}>
        <PageHeader title={title} back={resetReport} />
        <Paper withBorder shadow="sm" p="lg">
          <Stack align="center" gap="xs">
            <FileText size={44} color="var(--mantine-color-dimmed)" />
            <Text fw={600} ta="center" style={{ wordBreak: 'break-word' }}>
              {fileName}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              The report is ready.
            </Text>
            <Stack gap="xs" w="100%" pt="xs">
              <Button onClick={() => setViewing(true)}>View Report</Button>
              {canShare && (
                <Button variant="default" onClick={shareReport}>
                  Share
                </Button>
              )}
              <Button variant="default" onClick={downloadReport}>
                Download
              </Button>
              <Button variant="subtle" onClick={resetReport}>
                Generate new report
              </Button>
            </Stack>
          </Stack>
        </Paper>
        {viewing && (
          <LazyReportViewer
            report={report}
            name={fileName}
            onClose={() => setViewing(false)}
            onDownload={downloadReport}
            onShare={canShare ? shareReport : undefined}
          />
        )}
      </Container>
    );
  }

  if (report) {
    return (
      <Stack
        gap={0}
        h="calc(100dvh - var(--app-shell-header-height, 56px) - var(--mantine-spacing-md) * 2)"
      >
        <PageHeader
          title={title}
          back={resetReport}
          actions={
            <>
              <Button variant="default" size="sm" onClick={resetReport}>
                New Report
              </Button>
              <Button size="sm" onClick={downloadReport} loading={loading}>
                Download PDF
              </Button>
            </>
          }
        />

        {/* PDF viewer — fills remaining height */}
        <Box
          component="iframe"
          src={report}
          title="Generated Report"
          flex={1}
          w="100%"
          mih={0}
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        />
      </Stack>
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

  const monthsData = yearMonthData.months.map(
    (month: { _id: string; id: number; name: string }) => ({
      label: month.name,
      value: month.id,
    }),
  );
  const yearsData = yearMonthData.years.map(
    (year: { _id: string; id: number; name: string }) => ({
      label: year.name,
      value: year.id,
    }),
  );

  return (
    <Container size="lg" px={0}>
      <PageHeader
        title={title}
        description="Fill in the parameters below to generate your report."
        back={() => navigate(-1)}
      />

      <Stack gap="lg">
        {/* ── Date range ── */}
        {(fields?.includes('date_from') || fields.includes('date_to')) && (
          <Paper withBorder shadow="sm" p="lg">
            <SectionTitle>Date Range</SectionTitle>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {fields?.includes('date_from') && dynamicFields?.date_from && (
                <DatePickerInput
                  label="From Date"
                  withAsterisk
                  valueFormat="DD-MM-YYYY"
                  leftSection={<CalendarIcon size={16} />}
                  value={toPickerDate(dynamicFields.date_from)}
                  onChange={(date) =>
                    setDynamicFields({
                      ...dynamicFields,
                      date_from: (date ? dayjs(date) : dayjs()).format(
                        'DD-MM-YYYY',
                      ),
                    })
                  }
                />
              )}

              {fields.includes('date_to') && dynamicFields?.date_to && (
                <DatePickerInput
                  label="To Date"
                  withAsterisk
                  valueFormat="DD-MM-YYYY"
                  leftSection={<CalendarIcon size={16} />}
                  value={toPickerDate(dynamicFields.date_to)}
                  onChange={(date) =>
                    setDynamicFields({
                      ...dynamicFields,
                      date_to: (date ? dayjs(date) : dayjs()).format(
                        'DD-MM-YYYY',
                      ),
                    })
                  }
                />
              )}
            </SimpleGrid>
          </Paper>
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
          fields.includes('brand_ids') ||
          fields.includes('category_ids') ||
          fields.includes('month_ids') ||
          fields.includes('year_id') ||
          fields.includes('is_summary')) && (
          <Paper withBorder shadow="sm" p="lg">
            <SectionTitle>Filters</SectionTitle>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {fields.includes('region_id') && (
                <TextInput
                  label="Region"
                  value={user.region?.name || ''}
                  readOnly
                  disabled
                />
              )}

              {fields.includes('region_ids') && (
                <TextInput
                  label="Region"
                  value={user.region?.name || ''}
                  readOnly
                  disabled
                />
              )}

              {fields.includes('territory_id') && (
                <Select
                  label="Territory"
                  withAsterisk
                  placeholder="Select territory"
                  data={toOptions(territoriesData)}
                  value={toSelectValue(dynamicFields?.territory_id)}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      territory_id: originalValue(territoriesData, value),
                    })
                  }
                  allowDeselect={false}
                  searchable
                />
              )}

              {fields.includes('territory_ids') && (
                <MultiSelect
                  label="Territories"
                  withAsterisk
                  placeholder={
                    dynamicFields?.territory_ids?.length > 0
                      ? undefined
                      : 'Select territories'
                  }
                  data={toOptions(territoriesData)}
                  value={(dynamicFields?.territory_ids || []).map(String)}
                  onChange={(values) =>
                    setDynamicFields({
                      ...dynamicFields,
                      territory_ids: originalValues(
                        territoriesData,
                        dynamicFields?.territory_ids,
                        values,
                      ),
                    })
                  }
                  searchable
                  clearable
                />
              )}

              {fields.includes('policy_ids') && (
                <MultiSelect
                  label="Policies"
                  withAsterisk
                  placeholder={
                    dynamicFields?.policy_ids?.length > 0
                      ? undefined
                      : 'Select policies'
                  }
                  data={toOptions(policy)}
                  value={(dynamicFields?.policy_ids || []).map(String)}
                  onChange={(values) =>
                    setDynamicFields({
                      ...dynamicFields,
                      policy_ids: originalValues(
                        policy,
                        dynamicFields?.policy_ids,
                        values,
                      ),
                    })
                  }
                  searchable
                  clearable
                />
              )}

              {fields.includes('partner_id') && (
                <Select
                  label="Customer"
                  withAsterisk
                  placeholder="Select customer"
                  data={toOptions(customers)}
                  value={toSelectValue(dynamicFields?.partner_id)}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      partner_id: originalValue(customers, value),
                    })
                  }
                  allowDeselect={false}
                  searchable
                />
              )}

              {fields.includes('policy_id') && (
                <Select
                  label="Policy"
                  placeholder="Select policy"
                  data={toOptions(policy)}
                  value={toSelectValue(dynamicFields?.policy_id)}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      policy_id: originalValue(policy, value),
                    })
                  }
                  allowDeselect={false}
                  searchable
                />
              )}

              {fields.includes('product_id') && (
                <Select
                  label="Product"
                  placeholder="Select product"
                  data={toOptions(productsData)}
                  value={toSelectValue(dynamicFields?.product_id)}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      product_id: originalValue(productsData, value),
                    })
                  }
                  allowDeselect={false}
                  searchable
                />
              )}

              {fields.includes('sort_column') && (
                <Select
                  label="Sort Column"
                  placeholder="Select sort column"
                  data={['Sale', 'Collection', 'Debtors', 'Creditors']}
                  value={dynamicFields?.sort_column || sortColumn || null}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      sort_column: value,
                    })
                  }
                  allowDeselect={false}
                />
              )}

              {fields.includes('is_summary') && (
                <Select
                  label="View Mode"
                  placeholder="Select view mode"
                  data={[
                    { value: 'true', label: 'Summary' },
                    { value: 'false', label: 'Detailed' },
                  ]}
                  value={dynamicFields?.is_summary || 'false'}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      is_summary: value,
                    })
                  }
                  allowDeselect={false}
                />
              )}

              {fields.includes('brand_ids') && (
                <MultiSelect
                  label="Brands"
                  withAsterisk={!optionalFields?.includes('brand_ids')}
                  placeholder={
                    dynamicFields?.brand_ids?.length > 0
                      ? undefined
                      : 'Select brands'
                  }
                  data={toOptions(brands)}
                  value={(dynamicFields?.brand_ids || []).map(String)}
                  onChange={(values) =>
                    setDynamicFields({
                      ...dynamicFields,
                      brand_ids: values.map(Number),
                    })
                  }
                  searchable
                  clearable
                />
              )}

              {fields.includes('category_ids') && (
                <MultiSelect
                  label="Categories"
                  withAsterisk={!optionalFields?.includes('category_ids')}
                  placeholder={
                    dynamicFields?.category_ids?.length > 0
                      ? undefined
                      : 'Select categories'
                  }
                  data={toOptions(categories)}
                  value={(dynamicFields?.category_ids || []).map(String)}
                  onChange={(values) =>
                    setDynamicFields({
                      ...dynamicFields,
                      category_ids: values.map(Number),
                    })
                  }
                  searchable
                  clearable
                />
              )}

              {fields.includes('month_ids') && (
                <MultiSelect
                  label="Months"
                  withAsterisk
                  placeholder={
                    dynamicFields?.month_ids?.length > 0
                      ? undefined
                      : 'Select months'
                  }
                  data={toOptions(monthsData)}
                  value={(dynamicFields?.month_ids || []).map(String)}
                  onChange={(values) =>
                    setDynamicFields({
                      ...dynamicFields,
                      month_ids: values.map(Number),
                    })
                  }
                  searchable
                  clearable
                />
              )}

              {fields.includes('year_id') && (
                <Select
                  label="Year"
                  withAsterisk
                  placeholder="Select year"
                  data={toOptions(yearsData)}
                  value={dynamicFields?.year_id?.toString() || null}
                  onChange={(value) =>
                    value !== null &&
                    setDynamicFields({
                      ...dynamicFields,
                      year_id: Number(value),
                    })
                  }
                  allowDeselect={false}
                />
              )}
            </SimpleGrid>
          </Paper>
        )}

        {/* ── Report Options (checkboxes) ── */}
        {checkboxFields && (
          <Paper withBorder shadow="sm" p="lg">
            <SectionTitle>Report Options</SectionTitle>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {fields.includes('width_category') &&
                fields.includes('top_bottom') && (
                  <>
                    <OptionSwitch
                      label="With Category"
                      checked={dynamicFields?.width_category || false}
                      onChange={(checked) =>
                        setDynamicFields({
                          ...dynamicFields,
                          width_category: checked,
                          top_bottom: false,
                        })
                      }
                    />
                    <OptionSwitch
                      label="Top Bottom"
                      checked={dynamicFields?.top_bottom || false}
                      onChange={(checked) =>
                        setDynamicFields({
                          ...dynamicFields,
                          width_category: false,
                          top_bottom: checked,
                        })
                      }
                    />
                  </>
                )}

              {fields.includes('is_top_bottom') && (
                <OptionSwitch
                  label="Top Bottom"
                  checked={dynamicFields?.is_top_bottom || false}
                  onChange={(checked) =>
                    setDynamicFields({
                      ...dynamicFields,
                      is_top_bottom: checked,
                      top_bottom: checked,
                    })
                  }
                />
              )}

              {fields.includes('with_category') && (
                <OptionSwitch
                  label="With Category"
                  checked={dynamicFields?.with_category || false}
                  onChange={(checked) =>
                    setDynamicFields({
                      ...dynamicFields,
                      with_category: checked,
                    })
                  }
                />
              )}

              {fields.includes('is_yoy') && (
                <OptionSwitch
                  label="Last Year Comparison"
                  checked={dynamicFields?.is_yoy || false}
                  onChange={(checked) =>
                    setDynamicFields({
                      ...dynamicFields,
                      is_yoy: checked,
                    })
                  }
                />
              )}
              {fields.includes('is_all_policy') && (
                <OptionSwitch
                  label="Is All Policy"
                  checked={dynamicFields?.is_all_policy || false}
                  onChange={(checked) =>
                    setDynamicFields({
                      ...dynamicFields,
                      is_all_policy: checked,
                      all_policy: checked,
                    })
                  }
                />
              )}
            </SimpleGrid>
          </Paper>
        )}

        {/* ── Generate button ── On a phone it stays in view above the
            bottom tabs, like the app's footer button. */}
        <Box
          pos={{ base: 'sticky', sm: 'static' }}
          bottom="calc(var(--app-shell-footer-offset, 0px) + var(--app-shell-padding, 0px))"
          style={{ zIndex: 5 }}
        >
          <Button
            onClick={handleGenerateReport}
            loading={loading}
            fullWidth
            size="md"
            style={{ boxShadow: 'var(--mantine-shadow-md)' }}
          >
            Generate Report
          </Button>
        </Box>
      </Stack>
    </Container>
  );
};

export default GenerateReport;
