import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { callApi } from '@/api';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/utils';
import dayjs from 'dayjs';
import { months } from '@/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Eye, FileText } from 'lucide-react';
import { saveAs } from 'file-saver';

const stylesByStatus = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  quotation: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  draft: 'bg-red-100 text-red-800',
  confirmed: 'bg-green-100 text-green-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  approval: 'bg-yellow-100 text-yellow-800',
  submit: 'bg-blue-100 text-blue-800',
  'to report': 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  success: 'bg-green-100 text-green-800',
};

const ExpenseReportRow = ({ item, handleOpenRemarks }) => {
  return (
    <TableRow>
      <TableCell>
        {months.find((m) => m.value === item.selectedMonth)?.label}{' '}
        {item.selectedYear}
      </TableCell>
      {/* <TableCell>
        {item.territory_details.map((t) => t.name).join(', ')}
      </TableCell> */}
      <TableCell>
        #{item._id} - {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
      </TableCell>
      <TableCell>
        {item.receiver_details.name} ({item.receiver_details.work_email})
      </TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            stylesByStatus[item.status?.toLowerCase()]
          }`}
        >
          {item.status}
        </span>
      </TableCell>
      <TableCell className="flex gap-2">
        {item.reportURL && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(item.reportURL, '_blank')}
            aria-label="View report"
          >
            <FileText className="h-4 w-4 mr-1" /> Report
          </Button>
        )}
        {item.remarks && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenRemarks(item)}
            aria-label="View remarks"
          >
            <Eye className="h-4 w-4 mr-1" /> Remarks
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

const GenerateExpenseReportModal = ({ onClose, onReportSubmitted }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [fileName, setFileName] = useState('');
  const user = useSelector(selectUser);

  const fetchReportData = async (month) => {
    const year = new Date().getFullYear();
    const date = new Date().getDate();

    setLoading(true);
    callApi(
      'GET',
      `/reports?month=${month}&year=${year}&day=${date}`,
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
      }
    );
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (month) {
      fetchReportData(month);
    }
  };

  const downloadReport = () => {
    if (!pdfBase64) {
      toast.error('No PDF found to download', { description: 'Error' });
      return;
    }
    try {
      const base64WithoutPrefix = pdfBase64.replace(
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

  const onSubmitReport = async () => {
    setLoading(true);
    const month = months.find((month) => month.value === selectedMonth)?.label;

    if (!pdfBase64) {
      setLoading(false);
      toast.error('No PDF available to submit', { description: 'Error' });
      return;
    }

    try {
      const base64WithoutPrefix = pdfBase64.replace(
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
      const file = new File(
        [blob],
        `Expense-Report_${
          user.name
        }_${month}-${new Date().getFullYear()}-${dayjs().format(
          'HH_mm'
        )}`.replace(/ /g, '_'),
        { type: 'application/pdf' }
      );

      const uploadImage = await uploadToCloudinary(
        file,
        `Expense-Report_${
          user.name
        }-${month}-${new Date().getFullYear()}`.replace(/ /g, '_'),
        file.name
      );

      if (!uploadImage) {
        setLoading(false);
        toast.error('Failed to upload the report', { description: 'Error' });
        return;
      }

      const data = {
        receiverId: user.manager.id,
        selectedMonth: selectedMonth,
        selectedYear: new Date().getFullYear(),
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
        }
      );
    } catch (error) {
      setLoading(false);
      toast.error('Failed to process the report', {
        description: error.message,
      });
    }
  };

  return (
    <DialogContent className="w-full sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Generate Expense Report</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {!pdfBase64 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {pdfBase64 && (
          <div className="flex justify-center">
            <iframe
              src={`data:application/pdf;base64,${pdfBase64}`}
              title="Expense Report Preview"
              className="w-full h-[400px] border border-gray-200 rounded-lg"
            />
          </div>
        )}
        <div className="flex flex-col gap-2 md:flex-row ">
          {pdfBase64 && (
            <>
              <Button onClick={onSubmitReport} disabled={loading || !pdfBase64}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Report
              </Button>
              <Button onClick={downloadReport} disabled={loading || !pdfBase64}>
                Download Report
              </Button>
              <Button
                variant="outline"
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
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
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          );
          setFuelData(response.data);
          setLoading(false);
        },
        () => {
          setLoading(false);
          toast.error('Failed to fetch expense reports', {
            description: 'Error',
          });
        }
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
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        );
        setFuelData(response.data);
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Failed to refresh expense reports', {
          description: 'Error',
        });
      }
    );
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-5xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Reports</CardTitle>
            <Dialog
              open={generateModalOpen}
              onOpenChange={setGenerateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>Create Expense Report</Button>
              </DialogTrigger>
              <GenerateExpenseReportModal
                onClose={() => setGenerateModalOpen(false)}
                onReportSubmitted={handleReportSubmitted}
              />
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : fuelData.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                No expense reports found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month/Year</TableHead>
                    {/* <TableHead>Territory</TableHead> */}
                    <TableHead>ID & Date</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelData.map((item) => (
                    <ExpenseReportRow
                      key={item._id}
                      item={item}
                      handleOpenRemarks={handleOpenRemarks}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={remarksVisible} onOpenChange={setRemarksVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Receiver's Remarks</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">{selectedItem?.remarks}</p>
          <Button onClick={() => setRemarksVisible(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseReports;
