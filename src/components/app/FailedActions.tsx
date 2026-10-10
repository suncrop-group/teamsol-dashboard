import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { Pencil, RotateCw, Trash2 } from 'lucide-react';
import { callApi } from '@/api';
import { errorMessage } from '@/api/v2';
import { toast } from '@/lib/toast';
import ConfirmModal from './ConfirmModal';

interface FailedActionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  /** v2 collection path, e.g. `/v2/fleet/tolls`. */
  resource: string;
  /** Open the form with this record to fix it and send it again. */
  onEdit?: () => void;
  /** Called after a resend or discard so the list can reload. */
  onChanged: () => void;
}

/**
 * Shown on a record Odoo refused: the reason, and the ways out — fix it and
 * resend, resend as it is, or discard it.
 */
const FailedActions = ({ item, resource, onEdit, onChanged }: FailedActionsProps) => {
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const resend = () => {
    setBusy(true);
    callApi(
      'POST',
      `${resource}/${item._id}/retry`,
      {},
      () => {
        setBusy(false);
        toast.success('Queued again');
        onChanged();
      },
      (error) => {
        setBusy(false);
        toast.error(errorMessage(error, 'Could not resend. Please try again.'));
      },
    );
  };

  const discard = () => {
    setBusy(true);
    callApi(
      'DELETE',
      `${resource}/${item._id}`,
      null,
      () => {
        setBusy(false);
        setConfirmDiscard(false);
        toast.success('Discarded');
        onChanged();
      },
      (error) => {
        setBusy(false);
        setConfirmDiscard(false);
        toast.error(errorMessage(error, 'Could not discard. Please try again.'));
      },
    );
  };

  return (
    <Stack gap={6}>
      <Text size="xs" c="red">
        {item.syncError || 'Could not be sent to Odoo.'}
      </Text>
      <Group gap={6}>
        {onEdit && (
          <Button
            size="compact-xs"
            variant="light"
            leftSection={<Pencil size={12} />}
            onClick={onEdit}
            disabled={busy}
          >
            Edit & resend
          </Button>
        )}
        <Button
          size="compact-xs"
          variant="default"
          leftSection={<RotateCw size={12} />}
          onClick={resend}
          loading={busy && !confirmDiscard}
        >
          Resend
        </Button>
        <Button
          size="compact-xs"
          variant="subtle"
          color="red"
          leftSection={<Trash2 size={12} />}
          onClick={() => setConfirmDiscard(true)}
          disabled={busy}
        >
          Discard
        </Button>
      </Group>

      <ConfirmModal
        opened={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discard}
        title="Discard this record?"
        confirmLabel="Discard"
        cancelLabel="Keep it"
        loading={busy}
      >
        It was never sent to Odoo. Discarding removes it for good.
      </ConfirmModal>
    </Stack>
  );
};

export default FailedActions;
