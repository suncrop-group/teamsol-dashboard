// The report viewer, loaded only when a report is opened (it brings the PDF
// renderer with it). If it cannot be loaded or fails, the screen underneath
// stays usable: the report can still be downloaded or shared from there.
import { Component, lazy, Suspense, type ReactNode } from 'react';
import { toast } from '@/lib/toast';

const ReportViewer = lazy(() => import('./ReportViewer'));

interface Props {
  report: string;
  name: string;
  onClose: () => void;
  onDownload: () => void;
  onShare?: () => void;
}

class Guard extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    toast.error('The report could not be opened here', {
      description: 'Use Download to save it instead.',
    });
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const LazyReportViewer = (props: Props) => (
  <Guard onFail={props.onClose}>
    <Suspense fallback={null}>
      <ReportViewer {...props} />
    </Suspense>
  </Guard>
);

export default LazyReportViewer;
