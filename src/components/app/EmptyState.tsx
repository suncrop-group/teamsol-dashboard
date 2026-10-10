import type { ReactNode } from 'react';
import { Stack, Text, ThemeIcon } from '@mantine/core';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <Stack align="center" gap="xs" py={48}>
    {icon && (
      <ThemeIcon variant="light" color="gray" size={64} radius="xl">
        {icon}
      </ThemeIcon>
    )}
    <Text fw={500} size="lg" ta="center">
      {title}
    </Text>
    {description && (
      <Text c="dimmed" size="sm" ta="center">
        {description}
      </Text>
    )}
    {action}
  </Stack>
);

export default EmptyState;
