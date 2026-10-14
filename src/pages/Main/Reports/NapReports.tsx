import { napReports } from '@/data';
import { ReportList } from './parts';

const NapReports = () => (
  <ReportList title="NAP Reports" tiles={napReports} tone="blue" />
);

export default NapReports;
