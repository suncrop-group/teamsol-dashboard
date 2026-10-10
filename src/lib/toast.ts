import { notifications } from '@mantine/notifications';

interface ToastOptions {
  description?: string;
  id?: string;
  duration?: number;
}

const show = (
  color: string | undefined,
  text: string,
  options: ToastOptions = {},
  loading = false,
) =>
  notifications.show({
    id: options.id,
    color,
    loading,
    // With a description the text is the heading; alone it is the message.
    title: options.description ? text : undefined,
    message: options.description || text,
    autoClose: loading ? false : (options.duration ?? 4000),
    withCloseButton: !loading,
  });

/** Notifications with the call shape the pages already use. */
export const toast = Object.assign(
  (text: string, options?: ToastOptions) => show(undefined, text, options),
  {
    success: (text: string, options?: ToastOptions) =>
      show('green', text, options),
    error: (text: string, options?: ToastOptions) => show('red', text, options),
    info: (text: string, options?: ToastOptions) => show('blue', text, options),
    warning: (text: string, options?: ToastOptions) =>
      show('yellow', text, options),
    loading: (text: string, options?: ToastOptions) =>
      show(undefined, text, options, true),
    dismiss: (id?: string) =>
      id ? notifications.hide(id) : notifications.clean(),
  },
);
