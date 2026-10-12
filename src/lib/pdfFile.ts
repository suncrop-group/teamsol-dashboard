// Saving and sharing a generated PDF, in every place the dashboard runs:
// a desktop browser, a phone browser, and the app installed on a phone.
import { saveAs } from 'file-saver';

const PREFIX = 'data:application/pdf;base64,';

/** The bytes of a PDF held as base64, with or without the `data:` prefix. */
export const pdfBytes = (base64: string) => {
  const text = atob(base64.startsWith(PREFIX) ? base64.slice(PREFIX.length) : base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
};

export const pdfBlob = (base64: string) =>
  new Blob([pdfBytes(base64)], { type: 'application/pdf' });

const pdfName = (name: string) =>
  (name || 'report').toLowerCase().endsWith('.pdf') ? name : `${name || 'report'}.pdf`;

const asFile = (base64: string, name: string) =>
  new File([pdfBlob(base64)], pdfName(name), { type: 'application/pdf' });

/** Whether this browser can hand a file to the phone's share sheet. */
export const canSharePdf = () => {
  try {
    return (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({
        files: [new File([''], 'report.pdf', { type: 'application/pdf' })],
      })
    );
  } catch {
    return false;
  }
};

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // An iPad reports itself as a Mac, but a Mac has no touch screen.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Running as the installed app, not in a browser tab. */
const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true;

/** A PDF cannot be shown inside the page here; the built-in viewer is used. */
export const needsPdfViewer = () =>
  isIos() ||
  /Android/.test(navigator.userAgent) ||
  window.matchMedia?.('(pointer: coarse)').matches === true;

/**
 * Open the share sheet with the PDF. Resolves false when the person closed
 * the sheet, true when it was shared; throws if sharing is not possible.
 */
export const sharePdf = async (base64: string, name: string, title?: string) => {
  try {
    await navigator.share({ files: [asFile(base64, name)], title });
    return true;
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return false;
    throw error;
  }
};

/**
 * Save the PDF to the device. Returns how it was done, for the message shown.
 *
 * The installed app on an iPhone has no downloads: a normal download there
 * replaces the app's screen with the file and leaves no way back. So it
 * goes through the share sheet, which offers "Save to Files".
 */
export const savePdf = async (
  base64: string,
  name: string,
): Promise<'downloaded' | 'shared' | 'cancelled'> => {
  if (isIos() && isInstalled() && canSharePdf()) {
    return (await sharePdf(base64, name)) ? 'shared' : 'cancelled';
  }
  saveAs(pdfBlob(base64), pdfName(name));
  return 'downloaded';
};
