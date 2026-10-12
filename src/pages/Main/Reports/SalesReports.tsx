import { saleReports } from '@/data';
import { ReportList } from './parts';

const SalesReports = () => (
  <ReportList title="Sale Reports" tiles={saleReports} tone="red" />
);

export default SalesReports;
