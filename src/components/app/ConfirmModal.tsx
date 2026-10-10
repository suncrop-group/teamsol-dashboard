import type { ReactNode } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Colour of the confirm button. Red for destructive actions. */
  color?: string;
}

const ConfirmModal = ({
  opened,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  color = 'red',
}: ConfirmModalProps) => (
  <Modal
    opened={opened}
    onClose={loading ? () => {} : onClose}
    title={<Text fw={600}>{title}</Text>}
  >
    {children && (
      <Text size="sm" c="dimmed">
        {children}
      </Text>
    )}
    <Group justify="flex-end" mt="lg">
      <Button variant="default" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button color={color} onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </Group>
  </Modal>
);

export default ConfirmModal;
