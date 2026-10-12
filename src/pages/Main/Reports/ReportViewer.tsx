// Full-screen report viewer, as in the mobile app: the pages, which page is
// showing, zoom, and buttons to save or share. Phones and tablets do not
// show a PDF inside a page, so the pages are drawn here.
//
// A phone has little memory for drawing, and a report can run to dozens of
// pages. Only the pages around the one in view are drawn; the rest are
// blank boxes of the right size.
import {
  Component,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { useElementSize, useMergedRef } from '@mantine/hooks';
import { Download, Minus, Plus, Share2, X } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import './pdfSetup';
import { pdfBytes } from '@/lib/pdfFile';

interface ReportViewerProps {
  /** The report as base64, with or without the `data:` prefix. */
  report: string;
  name: string;
  onClose: () => void;
  onDownload: () => void;
  /** Left out where the browser cannot share files. */
  onShare?: () => void;
}

const GAP = 8;
// Pages drawn on each side of the one in view.
const AROUND = 1;
// The widest a page is drawn, in real pixels, however far it is zoomed.
const MAX_PIXELS = 1800;
const ZOOMS = [1, 1.5, 2, 3];
// A4 portrait, until the report's own page size is known.
const A4 = 842 / 595;

/** A problem drawing the report must not take the whole app down. */
class Guard extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const Failed = ({ onRetry }: { onRetry?: () => void }) => (
  <Stack align="center" gap="sm" py={48} px="md">
    <Text ta="center" fw={600}>
      The report could not be shown here.
    </Text>
    <Text ta="center" size="sm" c="dimmed">
      You can still save it with Download and open it from your files.
    </Text>
    {onRetry && (
      <Button variant="default" onClick={onRetry}>
        Try again
      </Button>
    )}
  </Stack>
);

const ReportViewer = ({
  report,
  name,
  onClose,
  onDownload,
  onShare,
}: ReportViewerProps) => {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [ratio, setRatio] = useState(A4);
  const [zoom, setZoom] = useState(0);
  const [failed, setFailed] = useState(false);
  // Bumped by "Try again" so the document loads afresh.
  const [attempt, setAttempt] = useState(0);
  const { ref: sizeRef, width: boxWidth } = useElementSize();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useMergedRef(sizeRef, scrollRef);
  // How far down the report the reader is (0 to 1), kept across a zoom.
  const place = useRef(0);

  // The renderer takes the bytes for itself, so each load gets its own copy.
  const file = useMemo(
    () => ({ data: pdfBytes(report) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report, attempt],
  );

  const width = Math.floor(boxWidth * ZOOMS[zoom]);
  const pageHeight = Math.round(width * ratio);
  const pixelRatio =
    width > 0
      ? Math.min(window.devicePixelRatio || 1, 2, MAX_PIXELS / width)
      : 1;

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!pages || !pageHeight) return;
    const box = event.currentTarget;
    place.current = box.scrollHeight ? box.scrollTop / box.scrollHeight : 0;
    const line = box.scrollTop + box.clientHeight / 3;
    const current = Math.floor(line / (pageHeight + GAP)) + 1;
    setPage(Math.min(pages, Math.max(1, current)));
  };

  // Zooming changes every page's height; stay on the same part of the report.
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = place.current * box.scrollHeight;
  }, [zoom]);

  const retry = () => {
    setFailed(false);
    setPages(0);
    setPage(1);
    setAttempt((count) => count + 1);
  };

  return (
    <Modal
      opened
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'slide-up' }}
    >
      <Stack gap={0} h="100dvh">
        <Group
          mih={54}
          px="sm"
          pt="env(safe-area-inset-top)"
          gap="xs"
          wrap="nowrap"
          style={{
            borderBottom: '1px solid var(--mantine-color-default-border)',
            flexShrink: 0,
          }}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Close report"
            onClick={onClose}
          >
            <X size={22} />
          </ActionIcon>
          <Text fw={600} flex={1} truncate>
            {name}
          </Text>
          {pages > 0 && (
            <>
              <ActionIcon
                variant="default"
                aria-label="Zoom out"
                disabled={zoom === 0}
                onClick={() => setZoom((level) => Math.max(0, level - 1))}
              >
                <Minus size={16} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                aria-label="Zoom in"
                disabled={zoom === ZOOMS.length - 1}
                onClick={() =>
                  setZoom((level) => Math.min(ZOOMS.length - 1, level + 1))
                }
              >
                <Plus size={16} />
              </ActionIcon>
              <Badge variant="light" color="gray" radius="xl">
                {page} / {pages}
              </Badge>
            </>
          )}
        </Group>

        <Box
          ref={boxRef}
          flex={1}
          mih={0}
          bg="var(--app-viewer)"
          style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
          onScroll={onScroll}
        >
          {failed ? (
            <Failed onRetry={retry} />
          ) : (
            <Guard key={attempt} fallback={<Failed onRetry={retry} />}>
              <Document
                file={file}
                loading={
                  <Center py={48}>
                    <Loader />
                  </Center>
                }
                error={<Failed onRetry={retry} />}
                onLoadSuccess={async (document) => {
                  setPages(document.numPages);
                  setPage(1);
                  try {
                    const first = await document.getPage(1);
                    const view = first.getViewport({ scale: 1 });
                    if (view.width > 0) setRatio(view.height / view.width);
                  } catch {
                    // The A4 guess stands.
                  }
                }}
                onLoadError={() => setFailed(true)}
              >
                {width > 0 &&
                  Array.from({ length: pages }, (_, index) => {
                    const near = Math.abs(index + 1 - page) <= AROUND;
                    return (
                      <Box
                        key={index}
                        w={width}
                        h={pageHeight}
                        mb={GAP}
                        bg="white"
                        style={{ overflow: 'hidden' }}
                      >
                        {near && (
                          <Page
                            pageNumber={index + 1}
                            width={width}
                            devicePixelRatio={pixelRatio}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={null}
                            error={null}
                          />
                        )}
                      </Box>
                    );
                  })}
              </Document>
            </Guard>
          )}
        </Box>

        <Group
          gap="sm"
          px="md"
          pt="sm"
          pb="calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom))"
          grow
          wrap="nowrap"
          style={{
            borderTop: '1px solid var(--mantine-color-default-border)',
            flexShrink: 0,
          }}
        >
          <Button leftSection={<Download size={18} />} onClick={onDownload}>
            Download
          </Button>
          {onShare && (
            <Button
              variant="default"
              leftSection={<Share2 size={18} />}
              onClick={onShare}
            >
              Share
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};

export default ReportViewer;
