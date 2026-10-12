import { accountTiles } from '@/data';
import { ReportList } from './parts';

const AccountingReports = () => (
  <ReportList title="Accounting Reports" tiles={accountTiles} tone="blue" />
);

export default AccountingReports;
