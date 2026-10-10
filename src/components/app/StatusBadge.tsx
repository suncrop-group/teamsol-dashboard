import { Badge, type BadgeProps } from '@mantine/core';

const GREEN = [
  'sent', 'approved', 'approve', 'confirmed', 'done', 'success', 'completed',
  'announced', 'sale order', 'sale', 'paid', 'invoice', 'submit', 'verified',
];
const YELLOW = [
  'pending', 'approval', 'to report', 'new', 'in transit',
  'in review', 'in progress', 'in process', 'in preparation', 'updated',
  'purchase', 'open', 'submitted', 'unverified', 'to approve', 'to confirm',
];
const RED = [
  'canceled', 'cancelled', 'cancel', 'draft', 'rejected', 'refuse', 'refused',
  'closed', 'failed', 'refused by customer',
];
const BLUE = ['quotation', 'queued', 'processing'];

/** Colour for a record status, shared by every list and detail page. */
export const statusColor = (status?: string | null): string => {
  // Odoo sends some states with underscores (`to_report`).
  const key = (status || '').toLowerCase().replace(/_/g, ' ').trim();
  if (GREEN.includes(key)) return 'green';
  if (YELLOW.includes(key)) return 'yellow';
  if (RED.includes(key)) return 'red';
  if (BLUE.includes(key)) return 'blue';
  return 'gray';
};

interface StatusBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  status?: string | null;
  fallback?: string;
}

const StatusBadge = ({ status, fallback = 'N/A', ...props }: StatusBadgeProps) => (
  <Badge
    color={statusColor(status)}
    variant="light"
    tt="capitalize"
    w="fit-content"
    {...props}
  >
    {status || fallback}
  </Badge>
);

export default StatusBadge;
