// Full-screen report viewer for phones, as in the mobile app: the pages,
// which page is showing, and buttons to save or share the report. A phone
// browser does not show a PDF inside a frame, so the pages are drawn here.
import { useMemo, useRef, useState } from 'react';
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
import { useElementSize } from '@mantine/hooks';
import { Download, Share2, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface ReportViewerProps {
  opened: boolean;
  /** The report as a `data:application/pdf;base64,` link. */
  report: string;
  name: string;
  onClose: () => void;
  onDownload: () => void;
  /** Left out where the browser cannot share files. */
  onShare?: () => void;
}

const ReportViewer = ({
  opened,
  report,
  name,
  onClose,
  onDownload,
  onShare,
}: ReportViewerProps) => {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState(false);
  // Bumped by "Try again" so the document loads afresh.
  const [attempt, setAttempt] = useState(0);
  const { ref: widthRef, width } = useElementSize();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const file = useMemo(() => report, [report]);

  // The page showing is the last one whose top has passed the upper third.
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const box = event.currentTarget;
    const line = box.scrollTop + box.clientHeight / 3;
    let current = 1;
    pageRefs.current.forEach((element, index) => {
      if (element && element.offsetTop <= line) current = index + 1;
    });
    setPage(current);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'slide-up' }}
    >
      <Stack gap={0} h="100dvh">
        <Group
          h={54}
          px="sm"
          gap="sm"
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
            <Badge variant="light" color="gray" radius="xl">
              {page} / {pages}
            </Badge>
          )}
        </Group>

        <Box
          ref={widthRef}
          flex={1}
          mih={0}
          pos="relative"
          bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-8))"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
          onScroll={onScroll}
        >
          {failed ? (
            <Stack align="center" gap="sm" py={48} px="md">
              <Text ta="center">The report could not be shown.</Text>
              <Button
                variant="default"
                onClick={() => {
                  setFailed(false);
                  setAttempt((count) => count + 1);
                }}
              >
                Try again
              </Button>
            </Stack>
          ) : (
            <Document
              key={attempt}
              file={file}
              loading={
                <Center py={48}>
                  <Loader />
                </Center>
              }
              onLoadSuccess={(document) => {
                setPages(document.numPages);
                setPage(1);
              }}
              onLoadError={() => setFailed(true)}
            >
              {width > 0 &&
                Array.from({ length: pages }, (_, index) => (
                  <Box
                    key={index}
                    ref={(element: HTMLDivElement | null) => {
                      pageRefs.current[index] = element;
                    }}
                    mb={8}
                  >
                    <Page
                      pageNumber={index + 1}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Box>
                ))}
            </Document>
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
