import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi } from '@/api';
import { toast } from '@/lib/toast';
import { uploadToCloudinary } from '@/utils';
import dayjs from 'dayjs';
import { months } from '@/data';
import { EmptyState, PageHeader, StatusBadge } from '@/components/app';
import { Eye, FileText } from 'lucide-react';
import LazyReportViewer from './LazyReportViewer';
import { canSharePdf, needsPdfViewer, savePdf, sharePdf } from '@/lib/pdfFile';

const ExpenseReportRow = ({ item, handleOpenRemarks }) => {
  return (
    <Table.Tr>
      <Table.Td>
        {months.find((m) => m.value === item.selectedMonth)?.label}{' '}
        {item.selectedYear}
      </Table.Td>
      <Table.Td>
        #{item._id} - {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
      </Table.Td>
      <Table.Td>
        {item.receiver_details.name} ({item.receiver_details.work_email})
      </Table.Td>
      <Table.Td>
        <StatusBadge status={item.status} />
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {item.reportURL && (
            <Button
              variant="default"
              size="xs"
              leftSection={<FileText size={16} />}
              onClick={() => window.open(item.reportURL, '_blank')}
              aria-label="View report"
            >
              Report
            </Button>
          )}
          {item.remarks && (
            <Button
              variant="default"
              size="xs"
              leftSection={<Eye size={16} />}
              onClick={() => handleOpenRemarks(item)}
              aria-label="View remarks"
            >
              Remarks
            </Button>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};

// Rendered inside the modal, so its state resets each time the modal opens.
const GenerateExpenseReportModal = ({ onClose, onReportSubmitted }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [fileName, setFileName] = useState('');
  // A phone or tablet cannot show a PDF inside the page; it gets the viewer.
  const useViewer = needsPdfViewer();
  const [viewing, setViewing] = useState(false);
  const canShare = canSharePdf();
  const user = useSelector(selectUser);

  const fetchReportData = async (month) => {
    const currentMonth = new Date().getMonth() + 1; // 1-indexed
    const currentYear = new Date().getFullYear();
    const selectedMonthNum = parseInt(month, 10);

    // If selected month is greater than current month, it's from the previous year
    const year =
      selectedMonthNum > currentMonth ? currentYear - 1 : currentYear;

    // If past month, use last day of month. If current month, use today.
    const day =
      selectedMonthNum === currentMonth && year === currentYear
        ? new Date().getDate()
        : dayjs(`${year}-${month}-01`).endOf('month').date();

    setLoading(true);
    callApi(
      'GET',
      `/reports?month=${month}&year=${year}&day=${day}`,
      null,
      (response) => {
        setLoading(false);
        if (!response.pdf) {
          toast.error('No PDF found in the response', { description: 'Error' });
          return;
        }
        const pdfBase64 = response.pdf;
        setPdfBase64(pdfBase64);
        setFileName(response.filename || 'report.pdf');
        toast.success('PDF generated successfully', { description: 'Success' });
      },
      () => {
        setLoading(false);
        toast.error('Failed to fetch report data', { description: 'Error' });
      },
    );
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (month) {
      fetchReportData(month);
    }
  };

  const downloadReport = async () => {
    if (!pdfBase64) {
      toast.error('No PDF found to download', { description: 'Error' });
      return;
    }
    try {
      const how = await savePdf(pdfBase64, fileName);
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

  const shareReport = async () => {
    try {
      await sharePdf(pdfBase64, fileName, 'Expense Report');
    } catch {
      toast.error('Could not share the report', { description: 'Error' });
    }
  };

  const onSubmitReport = async () => {
    setLoading(true);
    const month = months.find((month) => month.value === selectedMonth)?.label;
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const selectedMonthNum = parseInt(selectedMonth, 10);
    const selectedYear =
      selectedMonthNum > currentMonthNum ? currentYear - 1 : currentYear;

    if (!pdfBase64) {
      setLoading(false);
      toast.error('No PDF available to submit', { description: 'Error' });
      return;
    }

    try {
      const base64WithoutPrefix = pdfBase64.replace(
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
      const file = new File(
        [blob],
        `Expense-Report_${user.name}_${month}-${selectedYear}-${dayjs().format(
          'HH_mm',
        )}`.replace(/ /g, '_'),
        { type: 'application/pdf' },
      );

      const uploadImage = await uploadToCloudinary(
        file,
        // Expense Reports / <employee> / <month-year>
        `Expense Reports/${user.name || 'Unknown'}/${month}-${selectedYear}`,
        file.name,
      );

      if (!uploadImage) {
        setLoading(false);
        toast.error('Failed to upload the report', { description: 'Error' });
        return;
      }

      const data = {
        receiverId: user.manager.id,
        selectedMonth: selectedMonth,
        selectedYear: selectedYear,
        reportURL: uploadImage,
        projectId: user.project.id,
      };

      callApi(
        'POST',
        '/expense/send-report-to-receiver',
        { ...data },
        () => {
          setLoading(false);
          toast.success('Report submitted successfully', {
            description: 'Success',
          });
          onReportSubmitted();
          onClose();
        },
        () => {
          setLoading(false);
          toast.error('Failed to submit the report', { description: 'Error' });
        },
      );
    } catch (error) {
      setLoading(false);
      toast.error('Failed to process the report', {
        description: error.message,
      });
    }
  };

  return (
    <Stack gap="md">
      {loading && (
        <Group justify="center" h={200}>
          <Loader size="lg" />
        </Group>
      )}
      {!pdfBase64 && !loading && (
        <Select
          label="Select Month"
          placeholder="Select a Month"
          data={months}
          value={selectedMonth || null}
          onChange={(value) => handleMonthChange(value || '')}
          allowDeselect={false}
        />
      )}
      {pdfBase64 && !loading && useViewer && (
        <Paper withBorder p="md">
          <Stack align="center" gap="xs">
            <FileText size={36} color="var(--mantine-color-dimmed)" />
            <Text fw={600} ta="center" style={{ wordBreak: 'break-word' }}>
              {fileName}
            </Text>
            <Button fullWidth onClick={() => setViewing(true)}>
              View Report
            </Button>
          </Stack>
        </Paper>
      )}
      {pdfBase64 && viewing && (
        <LazyReportViewer
          report={pdfBase64}
          name={fileName}
          onClose={() => setViewing(false)}
          onDownload={downloadReport}
          onShare={canShare ? shareReport : undefined}
        />
      )}
      {pdfBase64 && !loading && !useViewer && (
        <Box
          component="iframe"
          src={`data:application/pdf;base64,${pdfBase64}`}
          title="Expense Report Preview"
          w="100%"
          h={400}
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        />
      )}
      <Group gap="xs">
        {pdfBase64 && (
          <>
            <Button
              onClick={onSubmitReport}
              loading={loading}
              disabled={!pdfBase64}
            >
              Submit Report
            </Button>
            <Button onClick={downloadReport} disabled={loading || !pdfBase64}>
              Download Report
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setPdfBase64(null);
                setFileName('');
                setSelectedMonth('');
              }}
              disabled={loading}
            >
              Generate New
            </Button>
          </>
        )}
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
      </Group>
    </Stack>
  );
};

const ExpenseReports = () => {
  const [loading, setLoading] = useState(true);
  const [fuelData, setFuelData] = useState([]);
  const [remarksVisible, setRemarksVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  useEffect(() => {
    const fetchFuelData = async () => {
      callApi(
        'GET',
        `/expense/sender-reports`,
        null,
        (response) => {
          response.data.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
          );
          setFuelData(response.data);
          setLoading(false);
        },
        () => {
          setLoading(false);
          toast.error('Failed to fetch expense reports', {
            description: 'Error',
          });
        },
      );
    };
    fetchFuelData();
  }, []);

  const handleOpenRemarks = (item) => {
    setSelectedItem(item);
    setRemarksVisible(true);
  };

  const handleReportSubmitted = () => {
    setLoading(true);
    callApi(
      'GET',
      `/expense/sender-reports`,
      null,
      (response) => {
        response.data.sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
        );
        setFuelData(response.data);
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Failed to refresh expense reports', {
          description: 'Error',
        });
      },
    );
  };

  return (
    <Container size="lg" px={0}>
      <PageHeader
        title="Expense Reports"
        actions={
          <Button onClick={() => setGenerateModalOpen(true)}>
            Create Expense Report
          </Button>
        }
      />

      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        {loading ? (
          <Group justify="center" h={256}>
            <Loader />
          </Group>
        ) : fuelData.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title="No expense reports found."
          />
        ) : (
          <Table.ScrollContainer minWidth={720}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Month/Year</Table.Th>
                  <Table.Th>ID & Date</Table.Th>
                  <Table.Th>Receiver</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {fuelData.map((item) => (
                  <ExpenseReportRow
                    key={item._id}
                    item={item}
                    handleOpenRemarks={handleOpenRemarks}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      <Modal
        opened={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title={<Text fw={600}>Generate Expense Report</Text>}
        size={600}
      >
        <GenerateExpenseReportModal
          onClose={() => setGenerateModalOpen(false)}
          onReportSubmitted={handleReportSubmitted}
        />
      </Modal>

      <Modal
        opened={remarksVisible}
        onClose={() => setRemarksVisible(false)}
        title={<Text fw={600}>Receiver's Remarks</Text>}
      >
        <Text size="sm">{selectedItem?.remarks}</Text>
        <Group justify="flex-end" mt="lg">
          <Button onClick={() => setRemarksVisible(false)}>Close</Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default ExpenseReports;
