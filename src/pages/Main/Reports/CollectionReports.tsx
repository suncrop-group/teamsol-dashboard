import { collectionTiles } from '@/data';
import { ReportList } from './parts';

const CollectionReports = () => (
  <ReportList title="Collection Reports" tiles={collectionTiles} tone="green" />
);

export default CollectionReports;
